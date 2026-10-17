import { describe, expect, it } from "vitest";
import {
  basketSignature,
  compareQuotes,
  evaluateQuote,
  groupRestaurants,
  parseMoney,
} from "./comparison";
import { collectObservations, localAdapters } from "./adapters";
import { demoWorkspace } from "./demo";
import { branchKey, FRESHNESS_MS, safeSourceUrl } from "./model";
import type { Observation, Source } from "./model";
import { exportWorkspace, parseImport, validateWorkspace } from "./storage";

const NOW = Date.parse("2026-10-17T12:00:00.000Z");
function fixture(source: Source = "MANUAL") {
  const w = demoWorkspace(new Date(NOW));
  w.observations.forEach((o) => {
    o.source = source;
  });
  w.matches = [
    { left: branchKey(w.observations[0]), right: branchKey(w.observations[1]) },
  ];
  return w;
}
function evaluate(change: Partial<Observation> = {}) {
  const w = fixture();
  return evaluateQuote(
    { ...w.observations[0], ...change },
    w.context,
    w.basket,
    NOW,
  );
}
describe("Kuruş hesabı ve koşullar", () => {
  it.each([
    ["0", 0],
    ["0,10", 10],
    ["12.34", 1234],
    ["21,5", 2150],
    ["", null],
  ])("%s değerini tam kuruş olarak işler", (text, expected) =>
    expect(parseMoney(text)).toBe(expected),
  );
  it.each([
    "-1",
    "NaN",
    "Infinity",
    "1,001",
    "1.000,00",
    "1e3",
    "1000001",
    "-0",
  ])("%s tutarını reddeder", (text) =>
    expect(() => parseMoney(text)).toThrow(),
  );
  it("ürün, adet, ücret ve geçerli indirimi tam sayı olarak hesaplar", () => {
    const w = fixture();
    w.basket.items[0].quantity = 3;
    w.observations[0].items[0].quantity = 3;
    w.observations[0].items[0].unitPrice = 12345;
    w.observations[0].discounts = [
      { id: "KUPON", amount: 1000, eligible: true },
    ];
    const e = evaluateQuote(w.observations[0], w.context, w.basket, NOW);
    expect(e).toMatchObject({
      subtotal: 37035,
      discount: 1000,
      total: 39035,
      issues: [],
    });
  });
  it("uygun olmayan indirimi uygulamaz", () =>
    expect(
      evaluate({ discounts: [{ id: "X", amount: 1000, eligible: false }] })
        .total,
    ).toBe(24000));
  it("uygunluğu bilinmeyen indirimi karşılaştırmaya sokmaz", () =>
    expect(
      evaluate({ discounts: [{ id: "X", amount: 1000, eligible: null }] })
        .issues,
    ).toContain("İndirim uygunluğu doğrulanmadı."));
  it("aynı indirimi ikinci defa uygulamaz ve sonucu engeller", () => {
    const e = evaluate({
      discounts: [
        { id: "Kod", amount: 1000, eligible: true },
        { id: " kod ", amount: 1000, eligible: true },
      ],
    });
    expect(e.discount).toBe(1000);
    expect(e.issues).toContain("Aynı indirim birden fazla kez kaydedilmiş.");
  });
  it("minimum sepeti indirim sonrası temelde kontrol eder", () =>
    expect(
      evaluate({
        minimumOrder: 20000,
        minimumBasis: "after-discount",
        discounts: [{ id: "X", amount: 2000, eligible: true }],
      }).issues,
    ).toContain("Minimum sepet tutarı karşılanmıyor."));
  it("minimum sepetin bilinmeyen temelini engeller", () =>
    expect(evaluate({ minimumBasis: "unknown" }).issues).toContain(
      "Minimum sepetin hesaplama temeli bilinmiyor.",
    ));
  it("minimum tutar bilinmiyorsa sıfır varsaymaz", () =>
    expect(evaluate({ minimumOrder: null }).issues).toContain(
      "Minimum sepet koşulu bilinmiyor.",
    ));
  it("minimum koşulu yoksa sıfırı kabul eder", () =>
    expect(
      evaluate({ minimumOrder: 0, minimumBasis: "unknown" }).issues,
    ).toEqual([]));
  it.each(["deliveryFee", "serviceFee"] as const)(
    "%s bilinmiyorsa toplam üretmez",
    (field) => expect(evaluate({ [field]: null }).total).toBeNull(),
  );
  it("kaynak toplamındaki farkı yakalar", () =>
    expect(evaluate({ observedTotal: 23999 }).issues).toContain(
      "Görülen toplam ile hesaplanan toplam uyuşmuyor.",
    ));
  it("negatif ücretleri ve toplamı reddeder", () =>
    expect(evaluate({ deliveryFee: -100 }).issues).toContain(
      "Ücret veya toplam geçersiz.",
    ));
  it("ürün toplamını aşan indirimi engeller", () =>
    expect(
      evaluate({ discounts: [{ id: "X", amount: 22000, eligible: true }] })
        .issues.length,
    ).toBeGreaterThan(0));
});
describe("Karşılaştırma, bağlam ve şube kimliği", () => {
  it("yalnızca eksiksiz iki farklı platformdan kazanan üretir", () => {
    const w = fixture(),
      result = compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        w.basket,
        w.matches,
        NOW,
      );
    expect(result.comparable).toBe(true);
    expect(result.winnerIds).toEqual([w.observations[1].id]);
  });
  it("eşit toplamda iki kaydı da işaretler", () => {
    const w = fixture();
    w.observations[1].items[0].unitPrice = 20500;
    expect(
      compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        w.basket,
        w.matches,
        NOW,
      ).winnerIds,
    ).toHaveLength(2);
  });
  it("tek gözlemden veya tek geçerli toplamdan en ucuz üretmez", () => {
    const w = fixture();
    expect(
      compareQuotes(
        w.observations.slice(0, 1),
        w.context,
        w.basket,
        w.matches,
        NOW,
      ).winnerIds,
    ).toEqual([]);
    w.observations[1].serviceFee = null;
    expect(
      compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        w.basket,
        w.matches,
        NOW,
      ).winnerIds,
    ).toEqual([]);
  });
  it("aynı platformdaki iki kaydı karşılaştırmaz", () => {
    const w = fixture();
    w.observations[1].platform = w.observations[0].platform;
    expect(
      compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        w.basket,
        w.matches,
        NOW,
      ).comparable,
    ).toBe(false);
  });
  it("aynı isimli şubeler açık onay olmadan birleşmez; onay geri alınabilir", () => {
    const w = fixture();
    expect(groupRestaurants(w.observations, [])).toHaveLength(4);
    expect(groupRestaurants(w.observations, w.matches)).toHaveLength(3);
    expect(groupRestaurants(w.observations, [])).toHaveLength(4);
    expect(
      compareQuotes(w.observations.slice(0, 2), w.context, w.basket, [], NOW)
        .winnerIds,
    ).toEqual([]);
  });
  it("aynı markanın başka şubesini ve tek platformlu restoranları korur", () => {
    const w = fixture();
    const groups = groupRestaurants(w.observations, w.matches);
    expect(groups.map((g) => g.length)).toEqual([2, 1, 1]);
    expect(groups[2][0].branch).toContain("farklı");
  });
  it.each(["name", "portion", "options", "quantity"] as const)(
    "%s farklıysa sepetleri eşitlemez",
    (field) => {
      const w = fixture();
      const changed = {
        ...w.observations[1].items[0],
        [field]: field === "quantity" ? 2 : "Farklı",
      };
      w.observations[1].items = [changed];
      expect(
        compareQuotes(
          w.observations.slice(0, 2),
          w.context,
          w.basket,
          w.matches,
          NOW,
        ).winnerIds,
      ).toEqual([]);
    },
  );
  it("satır sırasını yok sayar, aynı ürünü adetleriyle toplar", () => {
    const item = fixture().basket.items[0];
    expect(basketSignature([item, item])).toBe(
      basketSignature([{ ...item, quantity: 2 }]),
    );
  });
  it("adres değişince, geri dönülse de eski kimlikle teklifi geçersizleştirir", () => {
    const w = fixture();
    w.context = { ...w.context, id: "changed" };
    expect(
      evaluateQuote(w.observations[0], w.context, w.basket, NOW).issues,
    ).toContain("Adres değişti; gözlemi yenileyin.");
  });
  it("aynı kimlikle koordinat değişmesini de yakalar", () => {
    const w = fixture();
    w.context = { ...w.context, latitude: 41, longitude: 29 };
    expect(
      evaluateQuote(w.observations[0], w.context, w.basket, NOW).issues.length,
    ).toBeGreaterThan(0);
  });
  it("sepet revizyonu değişince eşit ürünlerde de eski teklifi geçersizleştirir", () => {
    const w = fixture();
    w.basket.id = "new";
    expect(
      evaluateQuote(w.observations[0], w.context, w.basket, NOW).issues,
    ).toContain("Sepet değişti veya ürün/seçenek/adet eşleşmiyor.");
  });
  it("eski ve gelecek gözlemlerden kazanan çıkarmaz", () => {
    const w = fixture();
    for (const time of [NOW + FRESHNESS_MS + 1, NOW - 120_000])
      expect(
        compareQuotes(
          w.observations.slice(0, 2),
          w.context,
          w.basket,
          w.matches,
          time,
        ).winnerIds,
      ).toEqual([]);
  });
  it("adres etiketini teslimat kanıtı saymaz", () =>
    expect(evaluate({ deliveryConfirmed: false }).issues).toContain(
      "Bu adres için teslimat uygunluğu gözlenmedi.",
    ));
  it("DEMO ile MANUAL veya LIVE kaynaklarını karşılaştırmaz", () => {
    const w = fixture();
    for (const source of ["DEMO", "LIVE"] as const) {
      w.observations[1].source = source;
      expect(
        compareQuotes(
          w.observations.slice(0, 2),
          w.context,
          w.basket,
          w.matches,
          NOW,
        ).winnerIds,
      ).toEqual([]);
    }
  });
});
describe("Kaynak izolasyonu ve güvenli dosyalar", () => {
  it("bir sağlayıcı reddedilirse diğerinin gerçek sonucu korunur; demo eklenmez", async () => {
    const w = fixture(),
      adapters = localAdapters(w.observations, "MANUAL");
    adapters[0].load = async () => {
      throw new Error("okunamadı");
    };
    const result = await collectObservations(adapters);
    expect(result.errors).toHaveLength(1);
    expect(result.observations).toHaveLength(2);
    expect(
      result.observations.every(
        (o) => o.platform === "trendyol-go" && o.source === "MANUAL",
      ),
    ).toBe(true);
  });
  it("adapterin yanlış kaynak etiketi reddedilir", async () => {
    const w = fixture(),
      adapters = localAdapters(w.observations, "MANUAL");
    adapters[0].load = async () => [{ ...w.observations[0], source: "LIVE" }];
    expect((await collectObservations(adapters)).errors).toHaveLength(1);
  });
  it("JSON dışa/içe aktarımı aynı kuruş ve bağlamı korur", () => {
    const w = fixture();
    expect(parseImport(exportWorkspace(w))).toEqual(w);
  });
  it.each(["{broken", "null", "[]", "{}", '{"__proto__":{"polluted":true}}'])(
    "geçersiz JSON/şemayı reddeder: %s",
    (raw) => expect(() => parseImport(raw)).toThrow(),
  );
  it("beklenmeyen iç alanları reddeder", () => {
    const w = fixture();
    Object.assign(w.observations[0].items[0], {
      hiddenToken: "not-a-real-token",
    });
    expect(() => parseImport(JSON.stringify(w))).toThrow("beklenmeyen");
  });
  it.each(["LIVE", "DEMO"] as const)(
    "JSON yoluyla %s kaynak iddiasını kabul etmez",
    (source) =>
      expect(() => parseImport(JSON.stringify(fixture(source)))).toThrow(),
  );
  it("kesirli kuruş, yinelenen kimlik, hatalı tarih ve koordinatı reddeder", () => {
    const w = fixture();
    w.observations[0].deliveryFee = 1.5;
    expect(() => validateWorkspace(w)).toThrow();
    w.observations[0].deliveryFee = 0;
    w.observations[1].id = w.observations[0].id;
    expect(() => validateWorkspace(w)).toThrow();
    w.observations[1].id = "different";
    w.observations[0].observedAt = "yesterday";
    expect(() => validateWorkspace(w)).toThrow();
    w.observations[0].observedAt = new Date(NOW).toISOString();
    w.context.latitude = 91;
    expect(() => validateWorkspace(w)).toThrow();
  });
  it("boyut sınırını uygular", () =>
    expect(() => parseImport(" ".repeat(1_000_001))).toThrow("1 MB"));
  it("yeniden içe alınamayacak büyüklükte dışa aktarım üretmez", () => {
    const w = fixture();
    w.matches = [];
    w.observations = Array.from({ length: 500 }, (_, i) => ({
      ...w.observations[0],
      id: "record-" + i,
      items: Array.from({ length: 20 }, () => ({
        ...w.observations[0].items[0],
        options: "x".repeat(300),
      })),
    }));
    expect(() => exportWorkspace(w)).toThrow("1 MB");
  });
  it("takvimde olmayan tarihleri reddeder", () => {
    const w = fixture();
    w.observations[0].observedAt = "2026-02-30T12:00:00Z";
    expect(() => validateWorkspace(w)).toThrow("takvimde");
  });
  it.each([
    "javascript:alert(1)",
    "https://yemeksepeti.com.evil.test",
    "https://evil.test/yemeksepeti.com",
    "http://www.yemeksepeti.com",
    "https://user:secret@www.yemeksepeti.com",
    "https://www.yemeksepeti.com:444",
  ])("güvenilmeyen bağlantıyı engeller: %s", (url) =>
    expect(safeSourceUrl(url, "yemeksepeti")).toBe(false),
  );
  it("resmî bağlantıyı doğru platform için kabul eder", () => {
    expect(
      safeSourceUrl(
        "https://www.yemeksepeti.com/restaurant/example",
        "yemeksepeti",
      ),
    ).toBe(true);
    expect(safeSourceUrl("https://tgoyemek.com/", "yemeksepeti")).toBe(false);
  });
  it("aynı şubeye çelişen eşleştirmeleri reddeder", () => {
    const w = fixture();
    w.matches.push({
      left: branchKey(w.observations[0]),
      right: branchKey(w.observations[3]),
    });
    expect(() => validateWorkspace(w)).toThrow("eşleştirmesi");
  });
});
