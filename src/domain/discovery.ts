import {
  FRESHNESS_MS,
  sameDeliveryContext,
  branchKey,
  legacyBranchKey,
} from "./model";
import type { DeliveryContext, DiscoveryObservation, Workspace } from "./model";

export function evaluateDiscovery(
  record: DiscoveryObservation,
  context: DeliveryContext,
  now = Date.now(),
) {
  const issues: string[] = [];
  if (!sameDeliveryContext(record.context, context))
    issues.push("Önceki adres bağlamı; bu adres için yeniden gözlemleyin.");
  const age = now - Date.parse(record.observedAt);
  if (!Number.isFinite(age) || age < -60_000)
    issues.push("Gözlem zamanı geçersiz veya gelecekte.");
  else if (age > FRESHNESS_MS)
    issues.push(
      "Keşif gözlemi 30 dakikadan eski; listelenme ve teslimatı yeniden kontrol edin.",
    );
  return { issues, current: issues.length === 0 };
}

// A match remains valid while either record type still represents both branches.
export function removeRecord(workspace: Workspace, id: string): Workspace {
  const observations = workspace.observations.filter((o) => o.id !== id);
  const discoveries = workspace.discoveries.filter((o) => o.id !== id);
  const remaining = new Set(
    [...observations, ...discoveries].flatMap((r) => [
      branchKey(r),
      legacyBranchKey(r),
    ]),
  );
  return {
    ...workspace,
    observations,
    discoveries,
    matches: workspace.matches.filter(
      (m) => remaining.has(m.left) && remaining.has(m.right),
    ),
  };
}
