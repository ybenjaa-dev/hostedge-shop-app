# Storefront themes

One codebase, 20 storefronts. `main` is the shared base (the **classic** storefront). Every other storefront is a
*theme overlay*: the handful of files that make it look and behave differently (header, footer, home/shop/product
pages, product card, CSS, fonts, brand, seed data, small helper libs, brand logos).

```
themes/<name>/files/<repo path>   files copied over the base (replaced or added)
themes/<name>/deleted.txt         base files the theme removes
```

## Commands

| | |
|---|---|
| `npm run theme -- fashion` | apply a theme to the working tree (local dev) |
| `npm run theme:reset` | put the base back (uses git) — **do this before committing** |
| `THEME=fashion npm run dev` | `predev` applies the theme, then starts the dev server |
| `npm run theme:verify` | proves every theme = base + overlay is byte-identical to its original `shop-*` branch |

`THEME` unset ⇒ `classic`. The apply step is idempotent and refuses to stack two themes.

## Deploying a storefront (HostEdge project settings)

Production branch `main`, and build command:

```
THEME=<name> node scripts/apply-theme.mjs && npx opennextjs-cloudflare build
```

| Project | THEME | Project | THEME |
|---|---|---|---|
| arabic-souk | arabic | perfume-oud | perfume |
| auto-garage | auto | pets-paradise | pets |
| beauty-glow | beauty | redesign-shop | redesign |
| classic-market | classic | stride-shoes | shoes |
| electro-hub | electronics | supplements-fuel | supplements |
| fashion-avenue | fashion | marginalia-books | books |
| food-pantry | food | nordhaus-home | furniture |
| home-nest | home | apex-athletics | sports |
| jewelry-atelier | jewelry | maison-aurelle | watches |
| kids-corner | kids | leafy-corner | plants |

## Changing things

* **A shared fix/feature** (anything not under `themes/`): edit `src/…` once on `main`. It reaches every theme.
  If a theme overlays that same file (see below) the overlay wins, so edit the overlay copy too.
* **One storefront's look**: edit `themes/<name>/files/…`, or `npm run theme -- <name>`, edit in place, then copy the
  changed files back into `themes/<name>/files/` before `npm run theme:reset`.
* `scripts/build-overlays.mjs` regenerates overlays from the `shop-*` branches (only needed while those exist).

## Files that are themed (shared edits must be mirrored here)

Per-theme in almost every storefront: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(shop)/{layout,page}.tsx`,
`src/app/(shop)/shop/page.tsx`, `src/app/(shop)/p/[slug]/page.tsx`, `src/components/{site-header,site-footer,whatsapp-fab,mobile-menu}.tsx`,
`src/features/catalog/components/{product-card,gallery,filters}.tsx`, `src/features/checkout/components/{product-buy,order-form}.tsx`,
`src/features/admin/{seed,setup-actions}.ts`, `src/lib/{brand,settings,dict,fonts}.ts`, `src/features/catalog/queries.ts`, `public/brand/*`.

Tip: before editing one of those on `main`, run `grep -rl "<path>" themes/*/files` to see which overlays carry a copy.
