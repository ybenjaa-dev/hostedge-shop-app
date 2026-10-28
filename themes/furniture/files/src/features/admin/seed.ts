import { CITY_DATA, MA_MAJOR } from "@/lib/cities-data";
import { decimalsOf } from "@/lib/money";
import { newId } from "@/lib/id";
import { COUNTRIES } from "@/lib/phone";
import type { AppEnv } from "@/lib/env";
import { categoryArt, heroArt, productArt } from "./furniture-art";

type Env = Pick<AppEnv, "DB" | "FILES">;
const i18n = (en: string, fr: string, ar: string) => JSON.stringify({ en, fr, ar });

/** Insert cities for a country if none exist yet. Idempotent. */
export async function seedCities(env: Env, country: string, defaultFee: number) {
  const exists = await env.DB.prepare("SELECT 1 FROM cities WHERE country = ? LIMIT 1").bind(country).first();
  if (exists) return;
  const list = CITY_DATA[country] ?? [];
  const stmts = list.map(([name, ar, region], i) =>
    env.DB.prepare("INSERT INTO cities (id, country, name, name_ar, region, fee, position) VALUES (?,?,?,?,?,?,?)").bind(
      newId(), country, name, ar, region,
      country === "MA" && !MA_MAJOR.has(name) ? Math.round(defaultFee * 1.5) : defaultFee,
      i,
    ),
  );
  for (let i = 0; i < stmts.length; i += 50) await env.DB.batch(stmts.slice(i, i + 50));
}

export async function seedPages(env: Env) {
  const pages: [string, [string, string, string], [string, string, string]][] = [
    ["about", ["About us", "À propos", "من نحن"], ["We are a local store delivering quality products to your door, with payment on delivery.", "Nous sommes une boutique locale qui livre des produits de qualité chez vous, avec paiement à la livraison.", "نحن متجر محلي نوصل لك منتجات عالية الجودة إلى باب بيتك مع الدفع عند الاستلام."]],
    ["shipping-policy", ["Shipping policy", "Politique de livraison", "سياسة الشحن"], ["We deliver in 2–4 business days. You pay the courier when you receive your order.", "Livraison en 2 à 4 jours ouvrables. Vous payez au livreur à la réception.", "نوصّل خلال 2 إلى 4 أيام عمل. تدفع للمندوب عند استلام طلبك."]],
    ["returns", ["Returns", "Retours", "الإرجاع"], ["Not satisfied? Contact us within 7 days of delivery and we will arrange a return.", "Pas satisfait ? Contactez-nous dans les 7 jours suivant la livraison.", "غير راضٍ؟ تواصل معنا خلال 7 أيام من الاستلام وسنرتب الإرجاع."]],
    ["contact", ["Contact", "Contact", "اتصل بنا"], ["Reach us on WhatsApp or by phone — see the details in the footer.", "Contactez-nous sur WhatsApp ou par téléphone — voir le pied de page.", "تواصل معنا عبر واتساب أو الهاتف — التفاصيل في أسفل الصفحة."]],
    ["terms", ["Terms & conditions", "Conditions générales", "الشروط والأحكام"], ["By placing an order you agree to receive a confirmation call and to pay the total on delivery.", "En passant commande, vous acceptez d'être contacté pour confirmation et de payer à la livraison.", "بإتمام الطلب فإنك توافق على تلقي مكالمة تأكيد ودفع المبلغ عند الاستلام."]],
  ];
  await env.DB.batch(
    pages.map(([slug, t, b], i) =>
      env.DB.prepare("INSERT OR IGNORE INTO pages (id, slug, title, body, published, position) VALUES (?,?,?,?,1,?)").bind(newId(), slug, i18n(...t), i18n(...b), i),
    ),
  );
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

type T3 = [string, string, string];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "sofas", name: i18n("Sofas", "Canapés", "الأرائك") },
    { id: newId(), slug: "chairs", name: i18n("Chairs & stools", "Chaises & tabourets", "الكراسي والمقاعد") },
    { id: newId(), slug: "tables", name: i18n("Tables", "Tables", "الطاولات") },
    { id: newId(), slug: "storage", name: i18n("Storage", "Rangements", "التخزين") },
    { id: newId(), slug: "lighting", name: i18n("Lighting", "Luminaires", "الإضاءة") },
  ];
  const L = { dim: ["Dimensions", "Dimensions", "الأبعاد"], mat: ["Material", "Matière", "الخامة"], fin: ["Finish", "Finition", "التشطيب"] } as const;
  type PD = { cat: number; slug: string; n: T3; s: T3; dim: string; mat: T3; fin: T3; p: number; cmp: number; stock: number; feat: number; best: number; multi?: number; v: [string, number, number][] };
  const oak: T3 = ["Solid oak, natural oil", "Chêne massif, huile naturelle", "خشب بلوط صلب بزيت طبيعي"];
  const products: PD[] = [
    { cat: 0, slug: "fjord-sofa", n: ["Fjord 3-seater sofa", "Canapé Fjord 3 places", "أريكة فيورد بثلاثة مقاعد"], s: ["Deep seats in soft bouclé, on slim oak legs.", "Assises profondes en bouclé doux, sur fins pieds en chêne.", "مقاعد عميقة من قماش البوكليه الناعم على أرجل بلوط رفيعة."], dim: "224 × 94 × 80 cm", mat: ["Bouclé fabric, beech frame, oak legs", "Tissu bouclé, structure en hêtre, pieds en chêne", "قماش بوكليه وهيكل زان وأرجل بلوط"], fin: ["Removable covers", "Housses déhoussables", "أغطية قابلة للإزالة"], p: 8900, cmp: 10900, stock: 0, feat: 1, best: 1, v: [["Oat", 8900, 6], ["Sage", 8900, 4], ["Charcoal", 9300, 3]] },
    { cat: 0, slug: "skog-loveseat", n: ["Skog loveseat", "Canapé 2 places Skog", "أريكة سكوج لشخصين"], s: ["A compact terracotta two-seater for calm corners.", "Un deux places compact en terracotta pour les coins calmes.", "أريكة مدمجة بلون التراكوتا للزوايا الهادئة."], dim: "160 × 90 × 80 cm", mat: ["Linen blend, beech frame", "Mélange de lin, structure en hêtre", "مزيج كتان وهيكل زان"], fin: ["Walnut-stained legs", "Pieds teinte noyer", "أرجل بلون الجوز"], p: 6400, cmp: 0, stock: 9, feat: 1, best: 0, v: [] },
    { cat: 1, slug: "vik-lounge-chair", n: ["Vik lounge chair", "Fauteuil Vik", "كرسي فيك المريح"], s: ["A low, generous armchair with an oak frame.", "Un fauteuil bas et généreux, cadre en chêne.", "كرسي منخفض ومريح بإطار من خشب البلوط."], dim: "78 × 82 × 74 cm", mat: ["Solid oak, wool-blend upholstery", "Chêne massif, tapisserie laine mélangée", "بلوط صلب وتنجيد من مزيج الصوف"], fin: oak, p: 3200, cmp: 3900, stock: 0, feat: 1, best: 1, v: [["Natural oak", 3200, 8], ["Dark walnut", 3500, 5], ["Smoked oak", 3500, 0]] },
    { cat: 1, slug: "oak-dining-chair", n: ["Oak dining chairs (set of 2)", "Chaises en chêne (lot de 2)", "كراسي طعام بلوط (طقم من 2)"], s: ["Slatted backs, a seat shaped for long dinners.", "Dossier à lattes, assise pensée pour les longs dîners.", "ظهر بألواح ومقعد مصمم للجلسات الطويلة."], dim: "44 × 50 × 82 cm", mat: oak, fin: ["Stackable", "Empilables", "قابلة للتكديس"], p: 1800, cmp: 2200, stock: 24, feat: 1, best: 1, multi: 1, v: [] },
    { cat: 1, slug: "lund-bar-stool", n: ["Lund bar stool", "Tabouret de bar Lund", "كرسي بار لوند"], s: ["Oak seat on a slim black steel frame.", "Assise en chêne sur fin piètement en acier noir.", "مقعد بلوط على هيكل فولاذ أسود رفيع."], dim: "Ø 38 × 65 cm", mat: ["Oak seat, powder-coated steel", "Assise en chêne, acier laqué", "مقعد بلوط وفولاذ مطلي"], fin: ["Felt floor pads", "Patins en feutre", "وسادات لباد للأرضية"], p: 650, cmp: 0, stock: 40, feat: 0, best: 0, multi: 1, v: [] },
    { cat: 2, slug: "arne-dining-table", n: ["Arne dining table", "Table à manger Arne", "طاولة طعام آرنه"], s: ["Seats six comfortably. Oiled oak, softened edges.", "Six personnes à l'aise. Chêne huilé, arêtes adoucies.", "تتسع لستة أشخاص بارتياح. بلوط مزيّت وحواف ناعمة."], dim: "180 × 90 × 75 cm", mat: oak, fin: ["Hand-sanded, matte", "Poncé main, mat", "صنفرة يدوية ومظهر مطفي"], p: 7200, cmp: 8500, stock: 7, feat: 1, best: 1, v: [] },
    { cat: 2, slug: "round-coffee-table", n: ["Round coffee table", "Table basse ronde", "طاولة قهوة مستديرة"], s: ["A round oak top that softens any living room.", "Un plateau rond en chêne qui adoucit le salon.", "سطح بلوط مستدير يضفي نعومة على غرفة الجلوس."], dim: "Ø 90 × 38 cm", mat: ["Oak veneer, solid walnut legs", "Placage chêne, pieds noyer massif", "قشرة بلوط وأرجل جوز صلب"], fin: ["Matte lacquer", "Vernis mat", "طلاء مطفي"], p: 1950, cmp: 0, stock: 18, feat: 1, best: 0, v: [] },
    { cat: 2, slug: "nesting-side-tables", n: ["Nesting side tables (2 pcs)", "Tables gigognes (2 pièces)", "طاولات جانبية متداخلة (قطعتان)"], s: ["Two sizes that tuck together when space is tight.", "Deux tailles qui s'emboîtent quand la place manque.", "حجمان يتداخلان عند ضيق المساحة."], dim: "Ø 50 × 52 / Ø 36 × 40 cm", mat: ["Oak top, terracotta lacquer, steel legs", "Plateau chêne, laque terracotta, pieds acier", "سطح بلوط وطلاء تراكوتا وأرجل فولاذ"], fin: ["Scratch-resistant", "Résistant aux rayures", "مقاوم للخدوش"], p: 1200, cmp: 1500, stock: 22, feat: 0, best: 1, multi: 1, v: [] },
    { cat: 3, slug: "oak-sideboard", n: ["Oak sideboard", "Buffet en chêne", "خزانة جانبية من البلوط"], s: ["Four quiet doors, brass pulls, tapered legs.", "Quatre portes discrètes, poignées laiton, pieds fuselés.", "أربعة أبواب هادئة ومقابض نحاسية وأرجل مدببة."], dim: "180 × 42 × 74 cm", mat: ["Solid oak front, oak veneer body", "Façade chêne massif, caisson plaqué chêne", "واجهة بلوط صلب وهيكل بقشرة بلوط"], fin: ["Soft-close hinges", "Charnières à fermeture douce", "مفصلات بإغلاق هادئ"], p: 5400, cmp: 0, stock: 6, feat: 1, best: 0, v: [] },
    { cat: 3, slug: "open-bookshelf", n: ["Open bookshelf", "Bibliothèque ouverte", "مكتبة مفتوحة"], s: ["Five shelves for books, plants and small things you love.", "Cinq étagères pour livres, plantes et petits trésors.", "خمسة رفوف للكتب والنباتات وما تحب."], dim: "90 × 32 × 190 cm", mat: ["Ash veneer, solid oak shelves", "Placage frêne, étagères chêne massif", "قشرة زان ورفوف بلوط صلب"], fin: ["Wall anchor included", "Fixation murale incluse", "مع مثبّت جداري"], p: 3600, cmp: 4200, stock: 11, feat: 0, best: 1, v: [] },
    { cat: 4, slug: "arc-floor-lamp", n: ["Arc floor lamp", "Lampadaire arc", "مصباح أرضي قوسي"], s: ["A brass arc that reaches over the sofa. Warm, dimmable light.", "Un arc en laiton qui surplombe le canapé. Lumière chaude et variable.", "قوس نحاسي يمتد فوق الأريكة. إضاءة دافئة قابلة للتعتيم."], dim: "Height 195 cm, reach 120 cm", mat: ["Brass-finish steel, linen shade, stone base", "Acier finition laiton, abat-jour lin, base pierre", "فولاذ بلمسة نحاس وظلة كتان وقاعدة حجرية"], fin: ["E27 bulb, dimmable", "Ampoule E27, variable", "مصباح E27 قابل للتعتيم"], p: 1450, cmp: 1800, stock: 15, feat: 1, best: 1, multi: 1, v: [] },
    { cat: 4, slug: "dome-pendant", n: ["Dome pendant light", "Suspension dôme", "ثريا معلّقة بشكل قبة"], s: ["A terracotta dome that pools light over the table.", "Un dôme terracotta qui concentre la lumière sur la table.", "قبة بلون التراكوتا تجمع الضوء فوق الطاولة."], dim: "Ø 40 × 28 cm, cord 150 cm", mat: ["Powder-coated metal", "Métal laqué", "معدن مطلي"], fin: ["E27 bulb", "Ampoule E27", "مصباح E27"], p: 780, cmp: 0, stock: 30, feat: 0, best: 0, multi: 1, v: [] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, categoryArt(c.slug));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const cat = cats[p.cat]!;
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, productArt(p.slug));
    const totalStock = p.v.length ? 0 : p.stock;
    const spec = (k: 0 | 1 | 2) => `${L.dim[k]}: ${p.dim}\n${L.mat[k]}: ${p.mat[k]}\n${L.fin[k]}: ${p.fin[k]}`;
    const more: T3 = ["Made to be lived with. Pay only when it arrives.", "Pensé pour durer. Vous ne payez qu'à la livraison.", "صُنع ليدوم. لا تدفع إلا عند الاستلام."];
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(...p.n), i18n(...p.s),
        i18n(`${p.s[0]} ${more[0]}\n\n${spec(0)}`, `${p.s[1]} ${more[1]}\n\n${spec(1)}`, `${p.s[2]} ${more[2]}\n\n${spec(2)}`),
        cat.id, `NH-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 10 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `NH-${100 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Le canapé est encore plus beau en vrai. Livraison soignée, montage inclus."],
    [3, "Youssef", "Rabat", 5, "Solid oak, beautifully finished. I paid the courier once I had checked them."],
    [5, "Fatima", "Marrakech", 5, "طاولة رائعة وبجودة ممتازة، والتوصيل كان في الموعد."],
    [2, "Omar", "Tanger", 4, "Très confortable, le chêne est magnifique. Un peu plus grand que prévu."],
    [10, "Nadia", "Fès", 5, "Warm light, feels like a boutique hotel in our living room."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "WELCOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on pieces people buy in pairs: 2 or 3 at a fixed (lower) total
  let tpl = 0;
  products.forEach((p, i) => {
    if (!p.multi || !p.feat) return;
    for (const [q, f, pop] of [[2, 0.92, 1], [3, 0.86, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
    if (tpl++ > 0) stmts.push(db.prepare("UPDATE products SET offer_template = ? WHERE id = ?").bind((["tiles", "pills", "highlight"] as const)[(tpl - 2) % 3], pids[i]!));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));

  await putSvg(env, "uploads/sample-hero.svg", heroArt());
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
