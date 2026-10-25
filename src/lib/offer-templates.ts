/** Layouts for the quantity-offer cards on the product page. The store has a default; each product can override it. */
export const OFFER_TEMPLATES = [
  { id: "list", name: "List", hint: "One row per offer with a radio, price and savings. Clear and works for any number of offers." },
  { id: "tiles", name: "Tiles", hint: "Side-by-side tiles with a big quantity. Great for 2–4 offers on mobile." },
  { id: "photo", name: "Photo cards", hint: "Picture first — your pack photo, or the product shown ×N. Best when you add offer photos." },
  { id: "pills", name: "Compact pills", hint: "A slim row of choices. Takes the least space." },
  { id: "highlight", name: "Highlight", hint: "The most popular / best-value offer is shown big, the others stay compact." },
] as const;

export type OfferTemplate = (typeof OFFER_TEMPLATES)[number]["id"];
export const DEFAULT_OFFER_TEMPLATE: OfferTemplate = "list";

export function isOfferTemplate(v: unknown): v is OfferTemplate {
  return typeof v === "string" && OFFER_TEMPLATES.some((t) => t.id === v);
}

/** The template to render: the product's own choice, else the store default, else the list. */
export function resolveOfferTemplate(product: unknown, store: unknown): OfferTemplate {
  return isOfferTemplate(product) ? product : isOfferTemplate(store) ? store : DEFAULT_OFFER_TEMPLATE;
}
