import { describe, expect, it } from "vitest";
import { compareQuotes, evaluateQuote, groupRestaurants } from "./comparison";
import { removeRecord } from "./discovery";
import { branchKey, emptyWorkspace, MAX_MONEY, PROVIDERS } from "./model";
import type {
  DeliveryContext,
  DiscoveryObservation,
  Observation,
  Workspace,
} from "./model";
import {
  exportWorkspace,
  LEGACY_STORAGE_KEY,
  MAX_IMPORT_BYTES,
  parseImport,
  readStoredWorkspace,
  STORAGE_KEY,
  validateWorkspace,
} from "./storage";

const NOW = Date.parse("2026-10-21T09:00:00.000Z");
// Synthetic, fixed data only. No real address, account or platform requests.
function fixture(): Workspace {
  const w = emptyWorkspace();
  w.context = {
    id: "address-a",
    label: "Sentetik adres A",
    latitude: null,
    longitude: null,
  };
  w.basket = {
    id: "basket-a",
    items: [
      {
        name: "Sentetik yemek",
        portion: "150 g",
        options: "İlave yok",
        quantity: 1,
      },
    ],
  };
  w.observations = (["yemeksepeti", "trendyol-go"] as const).map(
    (platform, i) => ({
      id: `quote-${i}`,
      platform,
      source: "MANUAL",
      restaurant: "Sentetik Mutfak",
      branch: "Merkez · sentetik",
      context: { ...w.context },
      basketId: w.basket.id,
      items: [{ ...w.basket.items[0], unitPrice: 10_000 - i * 1_000 }],
      deliveryFee: 0,
      serviceFee: 0,
      discounts: [],
      minimumOrder: 0,
      minimumBasis: "before-discount",
      observedTotal: null,
      deliveryConfirmed: true,
      eta: "",
      sourceUrl: PROVIDERS[platform].url,
      observedAt: new Date(NOW).toISOString(),
    }),
  );
  w.matches = [
    { left: branchKey(w.observations[0]), right: branchKey(w.observations[1]) },
  ];
  return w;
}
function compare(w: Workspace, quotes = w.observations) {
  return compareQuotes(quotes, w.context, w.basket, w.matches, NOW);
}
function copyAt(w: Workspace, context: DeliveryContext) {
  return w.observations.slice(0, 2).map((o) => ({
    ...structuredClone(o),
    id: `${o.id}-${context.id}`,
    context: { ...context },
  }));
}
function asDiscovery(o: Observation, id = "discovery"): DiscoveryObservation {
  return {
    id,
    platform: o.platform,
    source: "MANUAL",
    restaurant: o.restaurant,
    branch: o.branch,
    context: { ...o.context },
    sourceUrl: o.sourceUrl,
    observedAt: o.observedAt,
    deliveryStatus: "listed",
    deliveryEvidence: "",
  };
}
// Actual pre-1E persisted keys, deliberately independent of today's branchKey().
function legacyKeys() {
  return [
    {
      left: '["MANUAL","yemeksepeti","sentetik mutfak","merkez · sentetik"]',
      right: '["MANUAL","trendyol-go","sentetik mutfak","merkez · sentetik"]',
    },
  ];
}

describe("Adres kapsamlı şube onayları", () => {
  it("A onayı B'deki aynı adlarla kaydedilen şubeleri birleştirmez ve kazanan üretmez", () => {
    const w = fixture(),
      before = structuredClone(w);
    const b = { ...w.context, id: "address-b", label: "Sentetik adres B" };
    const records = copyAt(w, b);
    w.context = b;
    w.observations.push(...records);
    expect(groupRestaurants(records, w.matches)).toHaveLength(2);
    expect(compare(w, records).winnerIds).toEqual([]);
    expect(w.observations.slice(0, 2)).toEqual(before.observations);
    expect(w.matches).toEqual(before.matches);
  });
  it.each(["label", "latitude", "longitude"] as const)(
    "aynı adres id'sinde farklı %s eski şube onayını taşımaz",
    (field) => {
      const w = fixture();
      const context = {
        ...w.context,
        [field]: field === "label" ? "Sentetik başka adres" : 0,
      };
      expect(groupRestaurants(copyAt(w, context), w.matches)).toHaveLength(2);
    },
  );
  it("aynı isimli farklı fiziksel şubeler aynı platformda da ayrı kalır", () => {
    const w = fixture();
    const other = {
      ...w.observations[0],
      id: "other",
      branch: "Kuzey · sentetik",
    };
    expect(
      groupRestaurants([...w.observations, other], w.matches).map(
        (g) => g.length,
      ),
    ).toEqual([2, 1]);
  });
  it("adresin biçim farkı mevcut şube ve fiyat/keşif birlikteliğini bozmaz", () => {
    const w = fixture();
    const d = asDiscovery(w.observations[0]);
    d.context.label = "  SENTETİK   ADRES A  ";
    expect(groupRestaurants([...w.observations, d], w.matches)).toHaveLength(1);
  });
  it("A → B → A yeni revizyonunda eski eşleşme otomatik canlanmaz", () => {
    const w = fixture();
    const again = { ...w.context, id: "address-a-again" };
    expect(groupRestaurants(copyAt(w, again), w.matches)).toHaveLength(2);
  });
  it("B onayı A geçmişini değiştirmez; yeni onayın geri alınması yalnız B'yi ayırır", () => {
    const w = fixture(),
      oldMatch = structuredClone(w.matches[0]);
    const b = { ...w.context, id: "address-b", label: "Sentetik adres B" };
    const records = copyAt(w, b);
    w.observations.push(...records);
    w.matches.push({
      left: branchKey(records[0]),
      right: branchKey(records[1]),
    });
    const restored = parseImport(exportWorkspace(w));
    expect(restored.matches).toHaveLength(2);
    expect(
      groupRestaurants(restored.observations, restored.matches).map(
        (g) => g.length,
      ),
    ).toEqual([2, 2]);
    restored.matches = [oldMatch];
    expect(groupRestaurants(records, restored.matches)).toHaveLength(2);
    expect(
      groupRestaurants(restored.observations.slice(0, 2), restored.matches),
    ).toHaveLength(1);
  });
  it("yeni adresteki kaydı silmek eski adresin onayını silmez", () => {
    const w = fixture();
    const records = copyAt(w, { ...w.context, id: "b", label: "Sentetik B" });
    w.observations.push(...records);
    expect(removeRecord(w, records[0].id).matches).toEqual(w.matches);
  });
  it.each([1, 2])(
    "gerçek eski v%s anahtarları tek ortak adres kapsamında kayıpsız okunur",
    (version) => {
      const w = fixture();
      const legacy = { ...w, version, matches: legacyKeys() } as Record<
        string,
        unknown
      >;
      if (version === 1) delete legacy.discoveries;
      const raw = JSON.stringify(legacy),
        restored = parseImport(raw);
      expect(restored.observations).toEqual(w.observations);
      expect(restored.context).toEqual(w.context);
      expect(restored.basket).toEqual(w.basket);
      expect(restored.matches).toEqual(w.matches);
      expect(compare(restored).winnerIds).toEqual(["quote-1"]);
      expect(parseImport(exportWorkspace(restored))).toEqual(restored);
      const b = { ...w.context, id: "b", label: "Sentetik B" };
      expect(
        groupRestaurants(copyAt(restored, b), restored.matches),
      ).toHaveLength(2);
    },
  );
  it.each([1, 2])(
    "v%s belirsiz eski onay kaybolmaz ama iki adreste de otomatik kanıt olmaz",
    (version) => {
      const w = fixture(),
        b = { ...w.context, id: "b", label: "Sentetik B" };
      w.observations.push(...copyAt(w, b));
      const legacy = { ...w, version, matches: legacyKeys() } as Record<
        string,
        unknown
      >;
      if (version === 1) delete legacy.discoveries;
      const restored = parseImport(JSON.stringify(legacy));
      expect(restored.observations).toEqual(w.observations);
      expect(restored.matches).toEqual(
        legacyKeys().map((m) => ({ ...m, unscoped: true })),
      );
      expect(
        groupRestaurants(restored.observations.slice(0, 2), restored.matches),
      ).toHaveLength(2);
      expect(
        groupRestaurants(restored.observations.slice(2), restored.matches),
      ).toHaveLength(2);
      expect(
        compare(restored, restored.observations.slice(0, 2)).winnerIds,
      ).toEqual([]);
      expect(parseImport(exportWorkspace(restored))).toEqual(restored);
    },
  );
  it("belirsiz eski onay kayıtlar azalınca veya yeniden içe aktarılınca canlanmaz", () => {
    const w = fixture();
    const extra = copyAt(w, { ...w.context, id: "b", label: "Sentetik B" });
    w.observations.push(...extra);
    const restored = parseImport(
      JSON.stringify({ ...w, matches: legacyKeys() }),
    );
    const reduced = removeRecord(
      removeRecord(restored, extra[0].id),
      extra[1].id,
    );
    const roundTrip = parseImport(exportWorkspace(reduced));
    expect(roundTrip.matches).toEqual(
      legacyKeys().map((m) => ({ ...m, unscoped: true })),
    );
    expect(compare(roundTrip).winnerIds).toEqual([]);
    roundTrip.matches.push(...fixture().matches);
    expect(compare(parseImport(exportWorkspace(roundTrip))).winnerIds).toEqual([
      "quote-1",
    ]);
  });
  it("iki farklı adrese açıkça bağlanan yeni eşleştirme içe alınamaz", () => {
    const w = fixture();
    w.observations[1].context = { ...w.context, id: "b", label: "Sentetik B" };
    w.matches = [
      {
        left: branchKey(w.observations[0]),
        right: branchKey(w.observations[1]),
      },
    ];
    expect(() => validateWorkspace(w)).toThrow("eşleştirmesi");
    expect(groupRestaurants(w.observations, w.matches)).toHaveLength(2);
  });
  it("onay teslimat beyanı olmayan yeni fiyatı karşılaştırılabilir yapmaz", () => {
    const w = fixture();
    w.observations[1].deliveryConfirmed = false;
    expect(compare(w).winnerIds).toEqual([]);
  });
  it("eski onay yalnız tek ortak adrese taşınır, diğer adresteki tek tarafı kapsamına almaz", () => {
    const w = fixture();
    const other = copyAt(w, { ...w.context, id: "b", label: "Sentetik B" })[0];
    w.observations.push(other);
    const restored = parseImport(
      JSON.stringify({ ...w, matches: legacyKeys() }),
    );
    expect(restored.matches).toEqual(w.matches);
    expect(restored.observations).toEqual(w.observations);
    expect(
      groupRestaurants(restored.observations, restored.matches).map(
        (g) => g.length,
      ),
    ).toEqual([2, 1]);
  });
  it("ortak adresi bulunmayan eski onay da silinmeden etkisiz saklanır", () => {
    const w = fixture();
    w.observations[1].context = { ...w.context, id: "b", label: "Sentetik B" };
    const restored = parseImport(
      JSON.stringify({ ...w, matches: legacyKeys() }),
    );
    expect(restored.matches).toEqual(
      legacyKeys().map((m) => ({ ...m, unscoped: true })),
    );
    expect(restored.observations).toEqual(w.observations);
    expect(compare(restored).winnerIds).toEqual([]);
  });
  it.each([false, null, "true"])(
    "bozuk unscoped=%s işareti sessizce kabul edilmez",
    (unscoped) => {
      expect(() =>
        parseImport(
          JSON.stringify({
            ...fixture(),
            matches: legacyKeys().map((m) => ({ ...m, unscoped })),
          }),
        ),
      ).toThrow();
    },
  );
  it("izinli metin uzunlukları adres kapsamlı anahtarda da kayıpsız taşınır", () => {
    const w = fixture();
    w.context = {
      ...w.context,
      id: "id".repeat(50),
      label: "\u0000".repeat(200),
    };
    w.observations.forEach((o) => {
      o.context = { ...w.context };
      o.restaurant = "\u0000".repeat(200);
      o.branch = "\u0000".repeat(200);
    });
    w.matches = [
      {
        left: branchKey(w.observations[0]),
        right: branchKey(w.observations[1]),
      },
    ];
    expect(w.matches[0].left.length).toBeGreaterThan(1500);
    expect(parseImport(exportWorkspace(w))).toEqual(w);
  });
});

describe("Fiyat uç durumlarında kazanan doğruluğu", () => {
  it("0 TL teslimatı bilinen ücretsiz tutar olarak hesaplar", () => {
    const w = fixture(),
      result = compare(w);
    expect(result.evaluations.map((e) => e.total)).toEqual([10_000, 9_000]);
    expect(result.winnerIds).toEqual(["quote-1"]);
  });
  it.each(["deliveryFee", "serviceFee"] as const)(
    "%s bilinmiyorsa kaynak toplamı verilse bile kazanan yok",
    (field) => {
      const w = fixture();
      w.observations[1][field] = null;
      w.observations[1].observedTotal = 9_000;
      expect(compare(w).evaluations[1].total).toBeNull();
      expect(compare(w).winnerIds).toEqual([]);
    },
  );
  it("birden fazla indirimi uygunluğuna göre tam kuruşla toplar", () => {
    const w = fixture();
    w.observations[0].discounts = [
      { id: "A", amount: 600, eligible: true },
      { id: "B", amount: 501, eligible: true },
      { id: "C", amount: 999, eligible: false },
    ];
    expect(compare(w).evaluations[0]).toMatchObject({
      discount: 1101,
      total: 8899,
      issues: [],
    });
    expect(compare(w).winnerIds).toEqual(["quote-0"]);
  });
  it("biçimi farklı yinelenen indirim kazananı engeller", () => {
    const w = fixture();
    w.observations[0].discounts = [
      { id: "İNDİRİM", amount: 1000, eligible: true },
      { id: " indirim ", amount: 1000, eligible: true },
    ];
    expect(compare(w).evaluations[0].discount).toBe(1000);
    expect(compare(w).winnerIds).toEqual([]);
  });
  it.each(["before-discount", "after-discount"] as const)(
    "%s minimumuna eşitlik kabul edilir, bir kuruş altı engellenir",
    (basis) => {
      const w = fixture(),
        o = w.observations[0];
      o.discounts = [{ id: "A", amount: 1000, eligible: true }];
      o.minimumBasis = basis;
      o.minimumOrder = basis === "before-discount" ? 10_000 : 9_000;
      expect(compare(w).comparable).toBe(true);
      o.minimumOrder++;
      expect(compare(w).winnerIds).toEqual([]);
    },
  );
  it("desteklenen üst sınırda çarpım, ücret ve indirim tam kuruş kalır", () => {
    const w = fixture(),
      o = w.observations[0];
    w.basket.items[0].quantity = 99;
    o.items[0] = { ...w.basket.items[0], unitPrice: 1_010_101 };
    o.deliveryFee = 2;
    o.discounts = [{ id: "A", amount: 1, eligible: true }];
    expect(evaluateQuote(o, w.context, w.basket, NOW)).toEqual({
      subtotal: 99_999_999,
      discount: 1,
      total: MAX_MONEY,
      issues: [],
    });
    o.deliveryFee++;
    expect(evaluateQuote(o, w.context, w.basket, NOW).issues).toContain(
      "Hesaplanan toplam geçersiz.",
    );
  });
  it.each([
    MAX_MONEY + 1,
    Number.MAX_SAFE_INTEGER,
    Number.MAX_SAFE_INTEGER + 1,
    Infinity,
  ])("güvensiz/desteklenmeyen %s tutarı kazanan üretemez", (amount) => {
    const w = fixture();
    w.observations[1].items[0].unitPrice = amount;
    expect(compare(w).winnerIds).toEqual([]);
    expect(() => validateWorkspace(w)).toThrow();
  });
  it("eşit toplamlar tek kazanana düşürülmez", () => {
    const w = fixture();
    w.observations[1].serviceFee = 1000;
    expect(compare(w).winnerIds).toEqual(["quote-0", "quote-1"]);
  });
  it.each(["portion", "options"] as const)(
    "%s farklılığı ucuz fiyatın kazanmasına izin vermez",
    (field) => {
      const w = fixture();
      w.observations[1].items[0][field] = "Farklı sentetik seçenek";
      expect(compare(w).winnerIds).toEqual([]);
    },
  );
  it.each([-1, 1])(
    "kaynak toplamındaki %s kuruş fark karşılaştırmayı engeller",
    (difference) => {
      const w = fixture();
      w.observations[1].observedTotal = 9000 + difference;
      expect(compare(w).winnerIds).toEqual([]);
      w.observations[1].observedTotal = 9000;
      expect(compare(w).winnerIds).toEqual(["quote-1"]);
    },
  );
});

describe("Kalıcı veri sınırları ve kaynak ayrımı", () => {
  it.each([0, 1])("UTF-8 olarak 1 MB sınırı +%s bayt", (extra) => {
    const raw = JSON.stringify(fixture());
    const padded =
      raw +
      " ".repeat(
        MAX_IMPORT_BYTES - new TextEncoder().encode(raw).length + extra,
      );
    expect(new TextEncoder().encode(padded).length).toBe(
      MAX_IMPORT_BYTES + extra,
    );
    if (extra) expect(() => parseImport(padded)).toThrow("1 MB");
    else expect(parseImport(padded).observations).toHaveLength(2);
  });
  it.each([0, 250, 500])(
    "500 kayıt sınırında %s fiyat, kalanı keşif kayıpsız taşınır",
    (prices) => {
      const w = fixture(),
        base = w.observations[0];
      w.matches = [];
      w.observations = Array.from({ length: prices }, (_, i) => ({
        ...base,
        id: `p-${i}`,
      }));
      w.discoveries = Array.from({ length: 500 - prices }, (_, i) =>
        asDiscovery(base, `d-${i}`),
      );
      expect(parseImport(exportWorkspace(w))).toEqual(w);
      w.discoveries.push(asDiscovery(base, "extra"));
      expect(() => validateWorkspace(w)).toThrow();
    },
  );
  it.each(["LIVE", "DEMO"] as const)(
    "%s iddiası fiyat/keşif JSON'u üzerinden MANUAL'a sızamaz",
    (source) => {
      const w = fixture(),
        before = structuredClone(w);
      for (const invalid of [
        { ...w, observations: [{ ...w.observations[0], source }] },
        { ...w, discoveries: [{ ...asDiscovery(w.observations[0]), source }] },
      ])
        expect(() => parseImport(JSON.stringify(invalid))).toThrow();
      expect(w).toEqual(before);
    },
  );
  it.each(["{", "null", "[]", "", '{"version":2}', '{"version":3}'])(
    "bozuk v2 %s eski v1'e düşmez veya ham depolamayı değiştirmez",
    (raw) => {
      const w = fixture(),
        { discoveries: _discoveries, ...rest } = w;
      const data = new Map([
        [STORAGE_KEY, raw],
        [LEGACY_STORAGE_KEY, JSON.stringify({ ...rest, version: 1 })],
      ]);
      const before = new Map(data);
      expect(() =>
        readStoredWorkspace({ getItem: (key) => data.get(key) ?? null }),
      ).toThrow();
      expect(data).toEqual(before);
    },
  );
});
