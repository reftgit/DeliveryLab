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
export interface Observation {
  id: string;
  platform: Platform;
  source: Source;
  restaurant: string;
  branch: string;
  context: DeliveryContext;
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
  sourceUrl: string;
  observedAt: string;
}
export interface BranchMatch {
  left: string;
  right: string;
}
export interface Workspace {
  version: 1;
  context: DeliveryContext;
  basket: Basket;
  observations: Observation[];
  matches: BranchMatch[];
}
export const FRESHNESS_MS = 30 * 60 * 1000;
export const MAX_MONEY = 100_000_000;
export const normalize = (value: string) =>
  value.trim().normalize("NFC").toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
export function branchKey(o: Observation): string {
  return JSON.stringify([
    o.source,
    o.platform,
    normalize(o.restaurant),
    normalize(o.branch),
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
    version: 1,
    context: {
      id: crypto.randomUUID(),
      label: "",
      latitude: null,
      longitude: null,
    },
    basket: { id: crypto.randomUUID(), items: [] },
    observations: [],
    matches: [],
  };
}
