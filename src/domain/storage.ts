import {
  MAX_MONEY,
  PLATFORMS,
  branchKey,
  legacyBranchKey,
  sameDeliveryContext,
  safeSourceUrl,
  emptyWorkspace,
} from "./model";
import type {
  BasketItem,
  BranchMatch,
  DeliveryContext,
  DiscoveryObservation,
  Observation,
  RestaurantRecord,
  Source,
  Workspace,
} from "./model";

export const LEGACY_STORAGE_KEY = "deliverylab.workspace.v1";
export const STORAGE_KEY = "deliverylab.workspace.v2";
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
function timestamp(value: unknown): string {
  const result = text(value, 50);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(result) ||
    !Number.isFinite(Date.parse(result))
  )
    fail("Gözlem tarihi ISO UTC biçiminde olmalı.");
  if (new Date(result).toISOString().slice(0, 19) !== result.slice(0, 19))
    fail("Gözlem tarihi takvimde geçersiz.");
  return result;
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
  const observedAt = timestamp(o.observedAt);
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
export function validateDiscovery(value: unknown): DiscoveryObservation {
  const o = object(value, [
    "id",
    "platform",
    "source",
    "restaurant",
    "branch",
    "context",
    "sourceUrl",
    "observedAt",
    "deliveryStatus",
    "deliveryEvidence",
  ]);
  const platform = oneOf(o.platform, PLATFORMS);
  const sourceUrl = text(o.sourceUrl, 2000);
  if (!safeSourceUrl(sourceUrl, platform))
    fail("Kaynak bağlantısı seçilen platformun resmî HTTPS adresi olmalı.");
  const context = validateContext(o.context);
  if (!context.label.trim()) fail("Restoran gözlemi için adres gerekli.");
  const deliveryStatus = oneOf(o.deliveryStatus, ["listed", "confirmed"]);
  const deliveryEvidence = text(
    o.deliveryEvidence,
    300,
    deliveryStatus === "listed",
  );
  if (deliveryStatus === "listed" && deliveryEvidence !== "")
    fail("Yalnız listelenme kaydı teslimat doğrulama açıklaması içeremez.");
  return {
    id: text(o.id, 100),
    platform,
    source: oneOf(o.source, ["MANUAL"]),
    restaurant: text(o.restaurant),
    branch: text(o.branch),
    context,
    sourceUrl,
    observedAt: timestamp(o.observedAt),
    deliveryStatus,
    deliveryEvidence,
  };
}
export function validateWorkspace(
  value: unknown,
  allowed: Source[] = ["MANUAL"],
): Workspace {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Nesne bekleniyor.");
  const version = (value as Record<string, unknown>).version;
  if (version !== 1 && version !== 2) fail("Desteklenmeyen dosya sürümü.");
  const o = object(value, [
    "version",
    "context",
    "basket",
    "observations",
    "matches",
    ...(version === 2 ? ["discoveries"] : []),
  ]);
  const b = object(o.basket, ["id", "items"]);
  const observations = list(o.observations, 500).map((item) =>
    validateObservation(item, allowed),
  );
  const discoveries =
    version === 1 ? [] : list(o.discoveries, 500).map(validateDiscovery);
  if (discoveries.length && !allowed.includes("MANUAL"))
    fail("Bu çalışma alanında MANUAL keşif kaydı kullanılamaz.");
  const records = [...observations, ...discoveries];
  if (records.length > 500)
    fail("En fazla 500 fiyat ve keşif kaydı tutulabilir.");
  if (new Set(records.map((r) => r.id)).size !== records.length)
    fail("Tekrarlanan gözlem kimliği.");
  const keys = new Map(records.map((r) => [branchKey(r), r]));
  const legacy = new Map<string, RestaurantRecord[]>();
  for (const record of keys.values()) {
    const key = legacyBranchKey(record);
    legacy.set(key, [...(legacy.get(key) ?? []), record]);
  }
  const used = new Set<string>();
  const matches = list(o.matches, 250).map((value): BranchMatch => {
    const hasFlag =
      !!value && typeof value === "object" && Object.hasOwn(value, "unscoped");
    const m = object(value, [
      "left",
      "right",
      ...(hasFlag ? ["unscoped"] : []),
    ]);
    if (hasFlag && m.unscoped !== true) fail("Geçersiz şube onay kapsamı.");
    // Escaped names plus the full address scope can exceed the old key length.
    let left = text(m.left, 6000),
      right = text(m.right, 6000);
    const a = keys.get(left),
      b = keys.get(right);
    let unscoped = false;
    if (a && b) {
      if (hasFlag || !sameDeliveryContext(a.context, b.context))
        fail("Geçersiz veya çelişen şube eşleştirmesi.");
    } else {
      const leftRecords = legacy.get(left),
        rightRecords = legacy.get(right);
      if (!leftRecords || !rightRecords)
        fail("Geçersiz veya çelişen şube eşleştirmesi.");
      const pairs = leftRecords.flatMap((a) =>
        rightRecords
          .filter((b) => sameDeliveryContext(a.context, b.context))
          .map((b) => ({ a, b })),
      );
      if (!hasFlag && pairs.length === 1) {
        left = branchKey(pairs[0].a);
        right = branchKey(pairs[0].b);
      } else {
        // Never infer a scope from the active address or array order. Once
        // ambiguous, keep the original evidence inert even if records are deleted.
        unscoped = true;
      }
    }
    const first = keys.get(left) ?? legacy.get(left)?.[0];
    const second = keys.get(right) ?? legacy.get(right)?.[0];
    if (
      !first ||
      !second ||
      first.platform === second.platform ||
      first.source !== second.source ||
      used.has(left) ||
      used.has(right)
    )
      fail("Geçersiz veya çelişen şube eşleştirmesi.");
    used.add(left);
    used.add(right);
    return { left, right, ...(unscoped ? { unscoped: true as const } : {}) };
  });
  return {
    version: 2,
    context: validateContext(o.context),
    basket: {
      id: text(b.id, 100),
      items: list(b.items, 20).map((i) => validateItem(i)),
    },
    observations,
    discoveries,
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
export function readStoredWorkspace(storage: Pick<Storage, "getItem">) {
  const current = storage.getItem(STORAGE_KEY);
  const raw = current === null ? storage.getItem(LEGACY_STORAGE_KEY) : current;
  if (raw === null) return { workspace: emptyWorkspace(), migrated: false };
  // Never fall back from invalid v2 to v1: that could silently hide newer records.
  const workspace = parseImport(raw);
  return { workspace, migrated: JSON.parse(raw).version === 1 };
}
