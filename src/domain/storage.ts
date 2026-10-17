import { MAX_MONEY, PLATFORMS, branchKey, safeSourceUrl } from "./model";
import type {
  BasketItem,
  DeliveryContext,
  Observation,
  Source,
  Workspace,
} from "./model";

export const STORAGE_KEY = "deliverylab.workspace.v1";
export const MAX_IMPORT_BYTES = 1_000_000;
function fail(message: string): never {
  throw new Error(message);
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Nesne bekleniyor.");
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).some((k) => !keys.includes(k)) ||
    keys.some((k) => !Object.hasOwn(record, k))
  )
    fail("Eksik veya beklenmeyen JSON alanı.");
  return record;
}
function text(value: unknown, max = 200, allowEmpty = false): string {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (!allowEmpty && !value.trim())
  )
    fail("Metin alanı geçersiz.");
  return value;
}
function integer(value: unknown, max = MAX_MONEY, min = 0): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    fail("Geçersiz sayı.");
  return value;
}
function nullableMoney(value: unknown): number | null {
  return value === null ? null : integer(value);
}
function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max)
    fail("Liste boyutu veya türü geçersiz.");
  return value;
}
function bool(value: unknown): boolean {
  if (typeof value !== "boolean") fail("Boolean bekleniyor.");
  return value;
}
function oneOf<T extends string>(value: unknown, values: readonly T[]): T {
  if (typeof value !== "string" || !values.includes(value as T))
    fail("Desteklenmeyen alan değeri.");
  return value as T;
}
export function validateContext(value: unknown): DeliveryContext {
  const o = object(value, ["id", "label", "latitude", "longitude"]);
  for (const [key, max] of [
    ["latitude", 90],
    ["longitude", 180],
  ] as const) {
    if (
      o[key] !== null &&
      (typeof o[key] !== "number" ||
        !Number.isFinite(o[key]) ||
        Math.abs(o[key]) > max)
    )
      fail("Koordinat aralık dışında.");
  }
  if ((o.latitude === null) !== (o.longitude === null))
    fail("İki koordinatı birlikte girin.");
  return {
    id: text(o.id, 100),
    label: text(o.label, 200, true),
    latitude: o.latitude as number | null,
    longitude: o.longitude as number | null,
  };
}
export function validateItem(
  value: unknown,
  priced = false,
): BasketItem & { unitPrice?: number } {
  const o = object(value, [
    "name",
    "portion",
    "options",
    "quantity",
    ...(priced ? ["unitPrice"] : []),
  ]);
  return {
    name: text(o.name),
    portion: text(o.portion),
    options: text(o.options, 300, true),
    quantity: integer(o.quantity, 99, 1),
    ...(priced ? { unitPrice: integer(o.unitPrice) } : {}),
  };
}
export function validateObservation(
  value: unknown,
  allowed: Source[] = ["MANUAL"],
): Observation {
  const o = object(value, [
    "id",
    "platform",
    "source",
    "restaurant",
    "branch",
    "context",
    "basketId",
    "items",
    "deliveryFee",
    "serviceFee",
    "discounts",
    "minimumOrder",
    "minimumBasis",
    "observedTotal",
    "deliveryConfirmed",
    "eta",
    "sourceUrl",
    "observedAt",
  ]);
  const platform = oneOf(o.platform, PLATFORMS);
  const sourceUrl = text(o.sourceUrl, 2000);
  if (!safeSourceUrl(sourceUrl, platform))
    fail("Kaynak bağlantısı seçilen platformun resmî HTTPS adresi olmalı.");
  const observedAt = text(o.observedAt, 50);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(observedAt) ||
    !Number.isFinite(Date.parse(observedAt))
  )
    fail("Gözlem tarihi ISO UTC biçiminde olmalı.");
  if (
    new Date(observedAt).toISOString().slice(0, 19) !== observedAt.slice(0, 19)
  )
    fail("Gözlem tarihi takvimde geçersiz.");
  const items = list(o.items, 20).map(
    (i) => validateItem(i, true) as Observation["items"][number],
  );
  if (!items.length) fail("En az bir ürün gerekli.");
  return {
    id: text(o.id, 100),
    platform,
    source: oneOf(o.source, allowed),
    restaurant: text(o.restaurant),
    branch: text(o.branch),
    context: validateContext(o.context),
    basketId: text(o.basketId, 100),
    items,
    deliveryFee: nullableMoney(o.deliveryFee),
    serviceFee: nullableMoney(o.serviceFee),
    discounts: list(o.discounts, 10).map((v) => {
      const d = object(v, ["id", "amount", "eligible"]);
      return {
        id: text(d.id),
        amount: integer(d.amount),
        eligible: d.eligible === null ? null : bool(d.eligible),
      };
    }),
    minimumOrder: nullableMoney(o.minimumOrder),
    minimumBasis: oneOf(o.minimumBasis, [
      "before-discount",
      "after-discount",
      "unknown",
    ]),
    observedTotal: nullableMoney(o.observedTotal),
    deliveryConfirmed: bool(o.deliveryConfirmed),
    eta: text(o.eta, 100, true),
    sourceUrl,
    observedAt,
  };
}
export function validateWorkspace(
  value: unknown,
  allowed: Source[] = ["MANUAL"],
): Workspace {
  const o = object(value, [
    "version",
    "context",
    "basket",
    "observations",
    "matches",
  ]);
  if (o.version !== 1) fail("Desteklenmeyen dosya sürümü.");
  const b = object(o.basket, ["id", "items"]);
  const observations = list(o.observations, 500).map((item) =>
    validateObservation(item, allowed),
  );
  if (new Set(observations.map((r) => r.id)).size !== observations.length)
    fail("Tekrarlanan gözlem kimliği.");
  const keys = new Map(observations.map((r) => [branchKey(r), r]));
  const used = new Set<string>();
  const matches = list(o.matches, 250).map((value) => {
    const m = object(value, ["left", "right"]);
    const left = text(m.left, 1500),
      right = text(m.right, 1500);
    const a = keys.get(left),
      b = keys.get(right);
    if (
      !a ||
      !b ||
      a.platform === b.platform ||
      a.source !== b.source ||
      used.has(left) ||
      used.has(right)
    )
      fail("Geçersiz veya çelişen şube eşleştirmesi.");
    used.add(left);
    used.add(right);
    return { left, right };
  });
  return {
    version: 1,
    context: validateContext(o.context),
    basket: {
      id: text(b.id, 100),
      items: list(b.items, 20).map((i) => validateItem(i)),
    },
    observations,
    matches,
  };
}
export function parseImport(raw: string): Workspace {
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    fail("Dosya en fazla 1 MB olabilir.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    fail("Geçersiz JSON. Mevcut kayıtlar değiştirilmedi.");
  }
  return validateWorkspace(value);
}
export function exportWorkspace(workspace: Workspace): string {
  const raw = JSON.stringify(validateWorkspace(workspace), null, 2);
  if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
    fail("Kayıtlar 1 MB sınırını aşıyor; eski gözlemleri azaltın.");
  return raw;
}
