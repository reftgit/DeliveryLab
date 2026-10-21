import {
  FRESHNESS_MS,
  MAX_MONEY,
  branchKey,
  normalize,
  sameDeliveryContext,
} from "./model";
import type {
  Basket,
  BasketItem,
  BranchMatch,
  DeliveryContext,
  Observation,
  RestaurantRecord,
} from "./model";

export function parseMoney(value: string): number | null {
  const cleaned = value.trim();
  if (!cleaned) return null;
  if (!/^\d{1,7}([.,]\d{1,2})?$/.test(cleaned))
    throw new Error(
      "Tutar pozitif olmalı, binlik ayırıcı içermemeli ve en fazla iki ondalık basamak taşımalıdır.",
    );
  const [whole, decimal = ""] = cleaned.replace(",", ".").split(".");
  const result = Number(whole) * 100 + Number(decimal.padEnd(2, "0"));
  if (!Number.isSafeInteger(result) || result > MAX_MONEY)
    throw new Error("Tutar desteklenen sınırı aşıyor.");
  return result;
}
export const money = (value: number | null) =>
  value === null
    ? "Bilinmiyor"
    : new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
      }).format(value / 100);
export function basketSignature(items: BasketItem[]): string {
  // Row order is irrelevant. Portion, options and quantities are never guessed.
  const sums = new Map<string, number>();
  for (const item of items) {
    const key = JSON.stringify([
      normalize(item.name),
      normalize(item.portion),
      normalize(item.options),
    ]);
    sums.set(key, (sums.get(key) ?? 0) + item.quantity);
  }
  return JSON.stringify([...sums].sort(([a], [b]) => a.localeCompare(b)));
}
export function sameBranch(
  a: RestaurantRecord,
  b: RestaurantRecord,
  matches: BranchMatch[],
): boolean {
  if (a.source !== b.source || !sameDeliveryContext(a.context, b.context))
    return false;
  const left = branchKey(a),
    right = branchKey(b);
  return (
    left === right ||
    matches.some(
      (m) =>
        !m.unscoped &&
        ((m.left === left && m.right === right) ||
          (m.left === right && m.right === left)),
    )
  );
}
export interface QuoteEvaluation {
  subtotal: number;
  discount: number;
  total: number | null;
  issues: string[];
}
export function evaluateQuote(
  o: Observation,
  context: DeliveryContext,
  basket: Basket,
  now = Date.now(),
): QuoteEvaluation {
  const issues: string[] = [];
  const validMoney = (n: number) =>
    Number.isSafeInteger(n) && n >= 0 && n <= MAX_MONEY;
  const subtotal = o.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  if (
    !o.items.length ||
    o.items.some(
      (i) =>
        !validMoney(i.unitPrice) ||
        !Number.isInteger(i.quantity) ||
        i.quantity < 1 ||
        i.quantity > 99,
    ) ||
    !validMoney(subtotal)
  )
    issues.push("Ürün tutarı veya adedi geçersiz.");
  const ids = new Set<string>();
  let discount = 0;
  for (const d of o.discounts) {
    const id = normalize(d.id);
    if (ids.has(id)) {
      issues.push("Aynı indirim birden fazla kez kaydedilmiş.");
      continue;
    }
    ids.add(id);
    if (!validMoney(d.amount)) issues.push("İndirim tutarı geçersiz.");
    if (d.eligible === null) issues.push("İndirim uygunluğu doğrulanmadı.");
    if (d.eligible === true) discount += d.amount;
  }
  const feesKnown = o.deliveryFee !== null && o.serviceFee !== null;
  if (!feesKnown)
    issues.push("Teslimat veya zorunlu hizmet ücreti bilinmiyor.");
  if (
    [o.deliveryFee, o.serviceFee, o.minimumOrder, o.observedTotal].some(
      (n) => n !== null && !validMoney(n),
    )
  )
    issues.push("Ücret veya toplam geçersiz.");
  const total = feesKnown
    ? subtotal + o.deliveryFee! + o.serviceFee! - discount
    : null;
  if (total !== null && !validMoney(total))
    issues.push("Hesaplanan toplam geçersiz.");
  if (discount > subtotal)
    issues.push(
      "İndirim ürün toplamını aşıyor; indirim kapsamını yeniden kontrol edin.",
    );
  if (o.minimumOrder === null) issues.push("Minimum sepet koşulu bilinmiyor.");
  else if (o.minimumOrder > 0 && o.minimumBasis === "unknown")
    issues.push("Minimum sepetin hesaplama temeli bilinmiyor.");
  else if (
    (o.minimumBasis === "after-discount" ? subtotal - discount : subtotal) <
    o.minimumOrder
  )
    issues.push("Minimum sepet tutarı karşılanmıyor.");
  if (o.observedTotal !== null && total !== null && o.observedTotal !== total)
    issues.push("Görülen toplam ile hesaplanan toplam uyuşmuyor.");
  if (!sameDeliveryContext(o.context, context))
    issues.push("Adres değişti; gözlemi yenileyin.");
  if (
    o.basketId !== basket.id ||
    basketSignature(o.items) !== basketSignature(basket.items)
  )
    issues.push("Sepet değişti veya ürün/seçenek/adet eşleşmiyor.");
  if (!o.deliveryConfirmed)
    issues.push("Bu adres için teslimat uygunluğu gözlenmedi.");
  const age = now - Date.parse(o.observedAt);
  if (!Number.isFinite(age) || age < -60_000)
    issues.push("Gözlem zamanı geçersiz veya gelecekte.");
  else if (age > FRESHNESS_MS)
    issues.push("Gözlem 30 dakikadan eski; fiyatı yeniden kontrol edin.");
  return { subtotal, discount, total, issues: [...new Set(issues)] };
}
export function compareQuotes(
  quotes: Observation[],
  context: DeliveryContext,
  basket: Basket,
  matches: BranchMatch[],
  now = Date.now(),
) {
  const evaluations = quotes.map((o) => ({
    observation: o,
    ...evaluateQuote(o, context, basket, now),
  }));
  let reason = "";
  if (quotes.length !== 2)
    reason = "Karşılaştırmak için iki farklı platformdan gözlem seçin.";
  else if (quotes[0].platform === quotes[1].platform)
    reason = "İki farklı platform seçin.";
  else if (quotes[0].source !== quotes[1].source)
    reason = "Farklı veri türleri birlikte karşılaştırılamaz.";
  else if (!sameBranch(quotes[0], quotes[1], matches))
    reason = "Aynı fiziksel şube olduğu henüz onaylanmadı.";
  else if (
    basketSignature(quotes[0].items) !== basketSignature(quotes[1].items)
  )
    reason = "Ürün, porsiyon, seçenek veya adetler farklı.";
  else if (evaluations.some((e) => e.issues.length || e.total === null))
    reason = "İki eksiksiz ve güncel gözlem gerekli; eksikleri kontrol edin.";
  const winnerIds = reason
    ? []
    : evaluations
        .filter(
          (e) => e.total === Math.min(...evaluations.map((q) => q.total!)),
        )
        .map((e) => e.observation.id);
  return { evaluations, reason, winnerIds, comparable: !reason };
}
export function groupRestaurants<T extends RestaurantRecord>(
  observations: T[],
  matches: BranchMatch[],
) {
  const groups: T[][] = [];
  for (const observation of observations) {
    const group = groups.find((items) =>
      sameBranch(items[0], observation, matches),
    );
    if (group) group.push(observation);
    else groups.push([observation]);
  }
  return groups;
}
