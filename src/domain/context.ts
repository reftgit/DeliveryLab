import { basketSignature } from "./comparison";
import { sameAddress, sameDeliveryContext } from "./model";
import type { Basket, BasketItem, DeliveryContext, Observation } from "./model";

/** Inputs are validated by the editor before deciding whether to mint a revision. */
export function saveAddressContext(
  current: DeliveryContext,
  draft: DeliveryContext,
): DeliveryContext {
  return sameAddress(current, draft)
    ? current
    : { ...draft, id: crypto.randomUUID() };
}

export function saveBasketContext(
  current: Basket,
  items: BasketItem[],
): Basket {
  return {
    id:
      basketSignature(current.items) === basketSignature(items)
        ? current.id
        : crypto.randomUUID(),
    items,
  };
}

export function partitionObservations(
  observations: Observation[],
  context: DeliveryContext,
) {
  const current: Observation[] = [],
    history: Observation[] = [];
  for (const observation of observations) {
    (sameDeliveryContext(observation.context, context)
      ? current
      : history
    ).push(observation);
  }
  return { current, history };
}
