export const PLATFORMS = ["yemeksepeti", "trendyol-go"] as const;
export type Platform = (typeof PLATFORMS)[number];
export type Source = "LIVE" | "MANUAL" | "DEMO";
export const PROVIDERS: Record<
  Platform,
  { name: string; url: string; hosts: string[] }
> = {
  yemeksepeti: {
    name: "Yemeksepeti",
    url: "https://www.yemeksepeti.com/",
    hosts: ["yemeksepeti.com", "www.yemeksepeti.com"],
  },
  "trendyol-go": {
    name: "Uber Eats Trendyol Go",
    url: "https://tgoyemek.com/",
    hosts: [
      "tgoyemek.com",
      "www.tgoyemek.com",
      "trendyolgo.com",
      "www.trendyolgo.com",
    ],
  },
};
export interface DeliveryContext {
  id: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
}
export interface BasketItem {
  name: string;
  portion: string;
  options: string;
  quantity: number;
}
export interface PricedItem extends BasketItem {
  unitPrice: number;
}
export interface Basket {
  id: string;
  items: BasketItem[];
}
export interface Discount {
  id: string;
  amount: number;
  eligible: boolean | null;
}
export interface RestaurantRecord {
  id: string;
  platform: Platform;
  source: Source;
  restaurant: string;
  branch: string;
  context: DeliveryContext;
  sourceUrl: string;
  observedAt: string;
}
export interface DiscoveryObservation extends RestaurantRecord {
  source: "MANUAL";
  deliveryStatus: "listed" | "confirmed";
  deliveryEvidence: string;
}
export interface Observation extends RestaurantRecord {
  basketId: string;
  items: PricedItem[];
  deliveryFee: number | null;
  serviceFee: number | null;
  discounts: Discount[];
  minimumOrder: number | null;
  minimumBasis: "before-discount" | "after-discount" | "unknown";
  observedTotal: number | null;
  deliveryConfirmed: boolean;
  eta: string;
}
export interface BranchMatch {
  left: string;
  right: string;
  // Preserved legacy evidence whose address scope cannot be established.
  unscoped?: true;
}
export interface Workspace {
  version: 2;
  context: DeliveryContext;
  basket: Basket;
  observations: Observation[];
  discoveries: DiscoveryObservation[];
  matches: BranchMatch[];
}
export const FRESHNESS_MS = 30 * 60 * 1000;
export const MAX_MONEY = 100_000_000;
export const normalize = (value: string) =>
  value.trim().normalize("NFC").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
export function sameAddress(a: DeliveryContext, b: DeliveryContext): boolean {
  return (
    normalize(a.label) === normalize(b.label) &&
    a.latitude === b.latitude &&
    a.longitude === b.longitude
  );
}
export function sameDeliveryContext(
  a: DeliveryContext,
  b: DeliveryContext,
): boolean {
  // A -> B -> A creates a new revision; never revive a previous observation.
  return a.id === b.id && sameAddress(a, b);
}
export function legacyBranchKey(o: RestaurantRecord): string {
  return JSON.stringify([
    o.source,
    o.platform,
    normalize(o.restaurant),
    normalize(o.branch),
  ]);
}
export function branchKey(o: RestaurantRecord): string {
  return JSON.stringify([
    o.source,
    o.platform,
    normalize(o.restaurant),
    normalize(o.branch),
    o.context.id,
    normalize(o.context.label),
    o.context.latitude,
    o.context.longitude,
  ]);
}
export function safeSourceUrl(value: string, platform: Platform): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      PROVIDERS[platform].hosts.includes(url.hostname)
    );
  } catch {
    return false;
  }
}
export function emptyWorkspace(): Workspace {
  return {
    version: 2,
    context: {
      id: crypto.randomUUID(),
      label: "",
      latitude: null,
      longitude: null,
    },
    basket: { id: crypto.randomUUID(), items: [] },
    observations: [],
    discoveries: [],
    matches: [],
  };
}
