import { PLATFORMS } from "./model";
import type { Observation, Platform, Source } from "./model";
import { validateObservation } from "./storage";

/** Only local observations are implemented. No LIVE adapter or network fallback exists. */
export interface ObservationAdapter {
  platform: Platform;
  source: Source;
  load(): Promise<Observation[]>;
}
export function localAdapters(
  records: Observation[],
  source: "MANUAL" | "DEMO",
): ObservationAdapter[] {
  return PLATFORMS.map((platform) => ({
    platform,
    source,
    load: async () =>
      records
        .filter((o) => o.platform === platform)
        .map((o) => validateObservation(o, [source])),
  }));
}
export async function collectObservations(adapters: ObservationAdapter[]) {
  const results = await Promise.allSettled(
    adapters.map(async (adapter) => {
      const records = await adapter.load();
      return records.map((record) => {
        if (
          record.platform !== adapter.platform ||
          record.source !== adapter.source
        )
          throw new Error("Sağlayıcı veya kaynak türü uyuşmuyor.");
        return validateObservation(record, [adapter.source]);
      });
    }),
  );
  const observations: Observation[] = [],
    errors: { platform: Platform; message: string }[] = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") observations.push(...result.value);
    else
      errors.push({
        platform: adapters[i].platform,
        message: "Bu kaynağın kayıtları okunamadı. Diğer kaynaklar korunuyor.",
      });
  });
  return { observations, errors };
}
