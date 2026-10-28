/** The storefront's own name and default logo. Each storefront theme overrides this file; the owner can still change both in Admin → Appearance. */
export const BRAND = {
  name: "Hearth & Co",
  /** Static files under /public/brand. Empty → the header shows the store name as text. */
  logo: "/brand/hearth.svg",
  icon: "/brand/hearth-icon.svg",
  /** Wrapper class of this storefront's theme (scopes its CSS); lets admin previews look like the real shop. */
  themeClass: "v10",
};
