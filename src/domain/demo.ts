import { branchKey, emptyWorkspace, PROVIDERS } from "./model";
import type { Observation, Platform, Workspace } from "./model";

export function demoWorkspace(now = new Date()): Workspace {
  const workspace = emptyWorkspace();
  workspace.context.label = "Örnek adres · tamamen sentetik";
  workspace.basket.items = [
    {
      name: "Klasik burger",
      portion: "150 g",
      options: "İlave yok",
      quantity: 1,
    },
  ];
  const create = (
    platform: Platform,
    restaurant: string,
    branch: string,
    unitPrice: number,
    deliveryFee: number | null,
  ): Observation => ({
    id: crypto.randomUUID(),
    platform,
    source: "DEMO",
    restaurant,
    branch,
    context: { ...workspace.context },
    basketId: workspace.basket.id,
    items: workspace.basket.items.map((i) => ({ ...i, unitPrice })),
    deliveryFee,
    serviceFee: 500,
    discounts: [],
    minimumOrder: 10000,
    minimumBasis: "before-discount",
    observedTotal: null,
    deliveryConfirmed: true,
    eta: "25–40 dk (örnek)",
    sourceUrl: PROVIDERS[platform].url,
    observedAt: now.toISOString(),
  });
  workspace.observations = [
    create("yemeksepeti", "Örnek Burger", "Merkez · örnek şube", 21000, 2500),
    create("trendyol-go", "Örnek Burger", "Merkez · örnek şube", 19500, 3000),
    create("yemeksepeti", "Örnek Mutfak", "Park · örnek şube", 23000, null),
    create(
      "trendyol-go",
      "Örnek Burger",
      "Sahil · farklı örnek şube",
      20000,
      2000,
    ),
  ];
  workspace.matches = [
    {
      left: branchKey(workspace.observations[0]),
      right: branchKey(workspace.observations[1]),
    },
  ];
  return workspace;
}
