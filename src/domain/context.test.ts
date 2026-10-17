import { describe, expect, it } from "vitest";
import { compareQuotes, evaluateQuote, groupRestaurants } from "./comparison";
import {
  partitionObservations,
  saveAddressContext,
  saveBasketContext,
} from "./context";
import { demoWorkspace } from "./demo";
import { branchKey, FRESHNESS_MS } from "./model";
import { exportWorkspace, parseImport } from "./storage";

const NOW = Date.parse("2026-10-17T12:00:00.000Z");
// Synthetic observations only; never a real address or platform record.
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

describe("Adres kimliği ve gözlem geçmişi", () => {
  it.each(["aynı", "biçim"])(
    "%s adres yeniden kaydedilince geçerli teklif korunur",
    (kind) => {
      const w = fixture();
      const draft = { ...w.context };
      if (kind === "biçim")
        draft.label = `  ${draft.label.toLocaleUpperCase("tr-TR")}  `;
      const context = saveAddressContext(w.context, draft);
      expect(context.id).toBe(w.context.id);
      expect(
        evaluateQuote(w.observations[0], context, w.basket, NOW).issues,
      ).toEqual([]);
    },
  );
  it.each(["label", "latitude", "longitude"] as const)(
    "%s değişirse yeni kimlik oluşur ve eski teklif engellenir",
    (field) => {
      const w = fixture();
      w.context = { ...w.context, latitude: 0, longitude: 0 };
      w.observations.forEach((o) => {
        o.context = { ...w.context };
      });
      const changed = saveAddressContext(w.context, {
        ...w.context,
        [field]: field === "label" ? "Sentetik B" : 0.000001,
      });
      expect(changed.id).not.toBe(w.context.id);
      expect(
        evaluateQuote(w.observations[0], changed, w.basket, NOW).issues,
      ).toContain("Adres değişti; gözlemi yenileyin.");
      expect(
        compareQuotes(
          w.observations.slice(0, 2),
          changed,
          w.basket,
          w.matches,
          NOW,
        ).winnerIds,
      ).toEqual([]);
      expect(partitionObservations(w.observations, changed)).toEqual({
        current: [],
        history: w.observations,
      });
    },
  );
  it("koordinat eklemek ve kaldırmak da gerçek değişikliktir", () => {
    const w = fixture();
    const withCoordinates = saveAddressContext(w.context, {
      ...w.context,
      latitude: 0,
      longitude: 0,
    });
    const removed = saveAddressContext(withCoordinates, {
      ...withCoordinates,
      latitude: null,
      longitude: null,
    });
    expect(new Set([w.context.id, withCoordinates.id, removed.id]).size).toBe(
      3,
    );
  });
  it("A → B → A dönüşü eski gözlemi canlandırmaz; geçmiş silinmez", () => {
    const w = fixture(),
      before = structuredClone(w.observations);
    const b = saveAddressContext(w.context, {
      ...w.context,
      label: "Sentetik B",
    });
    const aAgain = saveAddressContext(b, w.context);
    expect(aAgain.id).not.toBe(w.context.id);
    expect(partitionObservations(w.observations, aAgain).current).toEqual([]);
    expect(w.observations).toEqual(before);
  });
  it("aynı kimlik altında farklı adres içeren içe aktarım keşfe veya kazanana giremez", () => {
    const w = fixture();
    w.context.label = "Başka sentetik adres";
    const restored = parseImport(exportWorkspace(w));
    expect(
      partitionObservations(restored.observations, restored.context).current,
    ).toEqual([]);
    expect(
      compareQuotes(
        restored.observations.slice(0, 2),
        restored.context,
        restored.basket,
        restored.matches,
        NOW,
      ).winnerIds,
    ).toEqual([]);
  });
  it("30 dakikayı aşan aynı adres kaydı adres geçmişine taşınmaz", () => {
    const w = fixture();
    const { current, history } = partitionObservations(
      w.observations,
      w.context,
    );
    expect(current).toEqual(w.observations);
    expect(history).toEqual([]);
    expect(
      evaluateQuote(current[0], w.context, w.basket, NOW + FRESHNESS_MS + 1)
        .issues,
    ).toContain("Gözlem 30 dakikadan eski; fiyatı yeniden kontrol edin.");
  });
  it("karışık adresler ayrılır; tek platformlu kayıt ve şube onayı/geri alma korunur", () => {
    const w = fixture();
    const old = {
      ...w.observations[0],
      id: "old",
      context: { ...w.context, id: "previous" },
    };
    const all = [...w.observations, old];
    const { current, history } = partitionObservations(all, w.context);
    expect(history).toEqual([old]);
    expect(groupRestaurants(current, w.matches).map((g) => g.length)).toEqual([
      2, 1, 1,
    ]);
    expect(groupRestaurants(current, [])).toHaveLength(4);
    expect(all).toHaveLength(5);
  });
  it("JSON tüm geçmişi, aktif kayıtları, fiyatları ve şube onayını kayıpsız taşır", () => {
    const w = fixture();
    const b = saveAddressContext(w.context, {
      ...w.context,
      label: "Sentetik B",
    });
    w.context = b;
    w.observations.push({
      ...w.observations[0],
      id: "b-observation",
      context: { ...b },
    });
    const restored = parseImport(exportWorkspace(w));
    expect(restored).toEqual(w);
    const split = partitionObservations(
      restored.observations,
      restored.context,
    );
    expect(split.current).toHaveLength(1);
    expect(split.history).toHaveLength(4);
  });
});

describe("Sepet kimliği", () => {
  it("aynı sepet tekrar kaydedilince kimlik ve kazanan korunur", () => {
    const w = fixture();
    const saved = saveBasketContext(w.basket, structuredClone(w.basket.items));
    expect(saved.id).toBe(w.basket.id);
    expect(
      compareQuotes(
        w.observations.slice(0, 2),
        w.context,
        saved,
        w.matches,
        NOW,
      ).winnerIds,
    ).toHaveLength(1);
  });
  it("satır sırası ve eşdeğer adet gruplaması sepet kimliğini değiştirmez", () => {
    const w = fixture();
    const first = w.basket.items[0],
      second = { ...first, name: "Sentetik ayran" };
    w.basket.items = [first, second, first];
    w.observations[0].items = w.basket.items.map((i) => ({
      ...i,
      unitPrice: 10000,
    }));
    const saved = saveBasketContext(w.basket, [
      second,
      { ...first, quantity: 2 },
    ]);
    expect(saved.id).toBe(w.basket.id);
    expect(
      evaluateQuote(w.observations[0], w.context, saved, NOW).issues,
    ).toEqual([]);
  });
  it.each(["name", "portion", "options", "quantity"] as const)(
    "%s değişince yeni kimlik ve geçersiz teklif; geri dönüşte eski kimlik canlanmaz",
    (field) => {
      const w = fixture();
      const changed = saveBasketContext(w.basket, [
        { ...w.basket.items[0], [field]: field === "quantity" ? 2 : "Farklı" },
      ]);
      expect(changed.id).not.toBe(w.basket.id);
      expect(
        evaluateQuote(w.observations[0], w.context, changed, NOW).issues,
      ).toContain("Sepet değişti veya ürün/seçenek/adet eşleşmiyor.");
      const reverted = saveBasketContext(changed, w.basket.items);
      expect(new Set([w.basket.id, changed.id, reverted.id]).size).toBe(3);
      expect(
        compareQuotes(
          w.observations.slice(0, 2),
          w.context,
          reverted,
          w.matches,
          NOW,
        ).winnerIds,
      ).toEqual([]);
    },
  );
});
