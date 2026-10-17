import { describe, expect, it } from "vitest";
import { demoWorkspace } from "./demo";
import { branchKey, FRESHNESS_MS, PROVIDERS } from "./model";
import type { DiscoveryObservation, Workspace } from "./model";
import { groupRestaurants, compareQuotes } from "./comparison";
import {
  partitionObservations,
  saveAddressContext,
  saveBasketContext,
} from "./context";
import { evaluateDiscovery, removeRecord } from "./discovery";
import {
  exportWorkspace,
  LEGACY_STORAGE_KEY,
  parseImport,
  readStoredWorkspace,
  STORAGE_KEY,
  validateDiscovery,
  validateWorkspace,
} from "./storage";

const NOW = Date.parse("2026-10-17T12:00:00.000Z");
// All fixtures are synthetic. The legacy shape deliberately excludes discoveries.
function fixture() {
  const w = demoWorkspace(new Date(NOW));
  w.observations.forEach((o) => {
    o.source = "MANUAL";
  });
  w.matches = [
    { left: branchKey(w.observations[0]), right: branchKey(w.observations[1]) },
  ];
  return w;
}
function legacyFixture() {
  const w = fixture();
  w.observations[3].context.id = "synthetic-old-context";
  const { discoveries: _discoveries, ...old } = w;
  return { ...old, version: 1 };
}
function discovery(w: Workspace): DiscoveryObservation {
  return {
    id: "synthetic-discovery",
    source: "MANUAL",
    platform: "yemeksepeti",
    restaurant: "Örnek Burger",
    branch: "Merkez · örnek şube",
    context: { ...w.context },
    sourceUrl: PROVIDERS.yemeksepeti.url,
    observedAt: new Date(NOW).toISOString(),
    deliveryStatus: "listed",
    deliveryEvidence: "",
  };
}

describe("Sepetten bağımsız keşif", () => {
  it("boş sepet ve fiyat olmadan MANUAL restoran kaydı saklar", () => {
    const w = fixture();
    w.basket.items = [];
    w.observations = [];
    w.matches = [];
    w.discoveries = [discovery(w)];
    expect(parseImport(exportWorkspace(w))).toEqual(w);
    expect(
      compareQuotes(w.observations, w.context, w.basket, w.matches, NOW)
        .winnerIds,
    ).toEqual([]);
  });
  it("listelenme teslimat doğrulaması değildir; doğrulama ek açıklama ister", () => {
    const d = discovery(fixture());
    expect(validateDiscovery(d).deliveryStatus).toBe("listed");
    expect(() =>
      validateDiscovery({ ...d, deliveryStatus: "confirmed" }),
    ).toThrow();
    expect(() =>
      validateDiscovery({
        ...d,
        deliveryStatus: "confirmed",
        deliveryEvidence: "   ",
      }),
    ).toThrow();
    expect(
      validateDiscovery({
        ...d,
        deliveryStatus: "confirmed",
        deliveryEvidence: "Sentetik ek teslimat bilgisi",
      }).deliveryStatus,
    ).toBe("confirmed");
    expect(() =>
      validateDiscovery({
        ...d,
        deliveryEvidence: "Listelenme tek başına kanıt değil",
      }),
    ).toThrow();
  });
  it.each(["LIVE", "DEMO"])(
    "keşifte %s kaynak iddiasını reddeder",
    (source) => {
      const w = fixture();
      expect(() => validateDiscovery({ ...discovery(w), source })).toThrow();
      expect(() =>
        parseImport(
          JSON.stringify({ ...w, discoveries: [{ ...discovery(w), source }] }),
        ),
      ).toThrow();
    },
  );
  it.each(["items", "basketId", "deliveryFee"])(
    "keşifte beklenmeyen %s alanını reddeder",
    (field) => {
      expect(() =>
        validateDiscovery({ ...discovery(fixture()), [field]: 0 }),
      ).toThrow("beklenmeyen");
    },
  );
  it("keşifte yanlış URL, boş adres ve imkânsız tarihi reddeder", () => {
    const d = discovery(fixture());
    expect(() =>
      validateDiscovery({ ...d, sourceUrl: "https://tgoyemek.com/" }),
    ).toThrow();
    expect(() =>
      validateDiscovery({ ...d, context: { ...d.context, label: "" } }),
    ).toThrow();
    expect(() =>
      validateDiscovery({ ...d, observedAt: "2026-02-30T12:00:00Z" }),
    ).toThrow();
  });
  it("aynı adla iki platformu birleştirmez; açık şube onayı ve geri alma çalışır", () => {
    const a = discovery(fixture());
    const b: DiscoveryObservation = {
      ...a,
      id: "b",
      platform: "trendyol-go",
      sourceUrl: PROVIDERS["trendyol-go"].url,
    };
    expect(groupRestaurants([a, b], [])).toHaveLength(2);
    expect(
      groupRestaurants([a, b], [{ left: branchKey(a), right: branchKey(b) }]),
    ).toHaveLength(1);
    expect(groupRestaurants([a, b], [])).toHaveLength(2);
    expect(groupRestaurants([a], [])).toEqual([[a]]);
  });
  it("aynı şubenin fiyat ve keşfi çift kart oluşturmaz; fiyat karşılaştırması korunur", () => {
    const w = fixture(),
      d = discovery(w);
    expect(
      groupRestaurants([...w.observations, d], w.matches).map((g) => g.length),
    ).toEqual([3, 1, 1]);
    expect(
      compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        w.basket,
        w.matches,
        NOW,
      ).winnerIds,
    ).toHaveLength(1);
  });
  it("adresin aynı kaydı ve sepet değişimi keşfi geçersizleştirmez", () => {
    const w = fixture(),
      d = discovery(w);
    w.context = saveAddressContext(w.context, { ...w.context });
    w.basket = saveBasketContext(w.basket, []);
    expect(partitionObservations([d], w.context).current).toEqual([d]);
    expect(evaluateDiscovery(d, w.context, NOW).current).toBe(true);
  });
  it("adres ve A → B → A değişimi kayıtları silmeden geçmişte tutar", () => {
    const w = fixture(),
      d = discovery(w);
    const b = saveAddressContext(w.context, {
      ...w.context,
      label: "Sentetik B",
    });
    const again = saveAddressContext(b, w.context);
    for (const context of [
      b,
      again,
      { ...w.context, latitude: 0, longitude: 0 },
    ]) {
      expect(partitionObservations([d], context)).toEqual({
        current: [],
        history: [d],
      });
      expect(evaluateDiscovery(d, context, NOW).current).toBe(false);
    }
  });
  it("30 dakika sınırı ve gelecek zaman teslimat kanıtını geçersiz kılar; adres geçmişine taşımaz", () => {
    const w = fixture(),
      d = discovery(w);
    expect(evaluateDiscovery(d, w.context, NOW + FRESHNESS_MS).current).toBe(
      true,
    );
    for (const now of [NOW + FRESHNESS_MS + 1, NOW - 60_001])
      expect(evaluateDiscovery(d, w.context, now).current).toBe(false);
    expect(partitionObservations([d], w.context).current).toEqual([d]);
  });
  it("bir kayıt silinince diğer türdeki aynı şube varsa eşleştirmeyi korur", () => {
    const w = fixture();
    w.discoveries = [discovery(w)];
    const first = removeRecord(w, w.observations[0].id);
    expect(first.matches).toEqual(w.matches);
    expect(validateWorkspace(first)).toEqual(first);
    const last = removeRecord(first, w.discoveries[0].id);
    expect(last.matches).toEqual([]);
    expect(w.observations).toHaveLength(4);
  });
});

describe("v1 uyumluluğu ve v2 saklama", () => {
  it("geçerli v1 JSON fiyatları, geçmişi, kimlikleri ve şube onaylarını kayıpsız taşır", () => {
    const legacy = legacyFixture(),
      before = structuredClone(legacy);
    expect(parseImport(JSON.stringify(legacy))).toEqual({
      ...legacy,
      version: 2,
      discoveries: [],
    });
    expect(legacy).toEqual(before);
  });
  it("karışık türler ve adres geçmişi v2 JSON turunda korunur", () => {
    const w = parseImport(JSON.stringify(legacyFixture()));
    w.discoveries = [
      discovery(w),
      {
        ...discovery(w),
        id: "old-discovery",
        context: { ...w.context, id: "old" },
      },
    ];
    expect(parseImport(exportWorkspace(w))).toEqual(w);
  });
  it("v1 dönüşümü bozuk fiyat veya çelişen onayı sessizce düşürmez", () => {
    const legacy = legacyFixture();
    legacy.observations[0].deliveryFee = -1;
    expect(() => parseImport(JSON.stringify(legacy))).toThrow();
    const other = legacyFixture();
    other.matches[0].right = "missing";
    expect(() => parseImport(JSON.stringify(other))).toThrow();
  });
  it("sürüm ile alanların uyuşmaması ve bilinmeyen sürüm reddedilir", () => {
    const w = fixture();
    expect(() => parseImport(JSON.stringify({ ...w, version: 1 }))).toThrow();
    expect(() =>
      parseImport(JSON.stringify({ ...legacyFixture(), version: 2 })),
    ).toThrow();
    expect(() => parseImport(JSON.stringify({ ...w, version: 3 }))).toThrow();
  });
  it("keşif ve fiyat arasında yinelenen kimliği reddeder", () => {
    const w = fixture();
    w.discoveries = [{ ...discovery(w), id: w.observations[0].id }];
    expect(() => validateWorkspace(w)).toThrow("Tekrarlanan");
  });
  it("keşifler arasında geçerli onay kabul edilir, aynı platform onayı reddedilir", () => {
    const w = fixture();
    w.observations = [];
    w.discoveries = [
      discovery(w),
      {
        ...discovery(w),
        id: "b",
        platform: "trendyol-go",
        sourceUrl: PROVIDERS["trendyol-go"].url,
      },
    ];
    w.matches = [
      { left: branchKey(w.discoveries[0]), right: branchKey(w.discoveries[1]) },
    ];
    expect(validateWorkspace(w)).toEqual(w);
    w.discoveries[1].platform = "yemeksepeti";
    w.discoveries[1].sourceUrl = PROVIDERS.yemeksepeti.url;
    w.discoveries[1].branch = "Başka";
    w.matches[0].right = branchKey(w.discoveries[1]);
    expect(() => validateWorkspace(w)).toThrow("eşleştirmesi");
  });
  it("DEMO çalışma alanına MANUAL keşif karıştırılmaz", () => {
    const w = demoWorkspace(new Date(NOW));
    w.discoveries = [discovery(w)];
    expect(() => validateWorkspace(w, ["DEMO"])).toThrow();
  });
  it("toplam 500 kayıt sınırı iki türe birlikte uygulanır", () => {
    const w = fixture();
    w.discoveries = Array.from({ length: 497 }, (_, i) => ({
      ...discovery(w),
      id: "d" + i,
    }));
    expect(() => validateWorkspace(w)).toThrow("500");
  });
  it("v1 LocalStorage yalnız okunur; v2 varsa önceliklidir", () => {
    const legacy = JSON.stringify(legacyFixture()),
      current = exportWorkspace(fixture());
    const data = new Map([[LEGACY_STORAGE_KEY, legacy]]);
    const storage = { getItem: (key: string) => data.get(key) ?? null };
    expect(readStoredWorkspace(storage).migrated).toBe(true);
    expect(data.size).toBe(1);
    expect(data.get(LEGACY_STORAGE_KEY)).toBe(legacy);
    data.set(STORAGE_KEY, current);
    expect(readStoredWorkspace(storage)).toEqual({
      workspace: parseImport(current),
      migrated: false,
    });
  });
  it.each(["{broken", "", "null"])(
    "bozuk v2 (%s) varsa v1'e sessiz dönülmez",
    (raw) => {
      const data = new Map([
        [LEGACY_STORAGE_KEY, JSON.stringify(legacyFixture())],
        [STORAGE_KEY, raw],
      ]);
      expect(() =>
        readStoredWorkspace({ getItem: (key) => data.get(key) ?? null }),
      ).toThrow();
      expect(data.get(STORAGE_KEY)).toBe(raw);
    },
  );
});
