import { CITY_DATA, MA_MAJOR } from "@/lib/cities-data";
import { decimalsOf } from "@/lib/money";
import { newId } from "@/lib/id";
import { COUNTRIES } from "@/lib/phone";
import type { AppEnv } from "@/lib/env";
import { plantArt, heroArt, CAT_ART, type ArtKind } from "./plant-art";

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
    ["about", ["About us", "À propos", "من نحن"], ["We are a small plant nursery and garden shop. Healthy plants, pots and tools delivered to your door, with payment on delivery.", "Nous sommes une petite pépinière et boutique de jardin. Plantes en pleine forme, pots et outils livrés chez vous, avec paiement à la livraison.", "نحن مشتل ومتجر حدائق صغير. نوصل لك نباتات سليمة وأوانٍ وأدوات إلى باب بيتك مع الدفع عند الاستلام."]],
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

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "indoor", name: i18n("Indoor plants", "Plantes d'intérieur", "نباتات داخلية") },
    { id: newId(), slug: "succulents", name: i18n("Succulents & cacti", "Succulentes & cactus", "صبار ونباتات عصارية") },
    { id: newId(), slug: "pots", name: i18n("Pots & planters", "Pots & jardinières", "أوانٍ وأحواض") },
    { id: newId(), slug: "tools", name: i18n("Garden tools", "Outils de jardin", "أدوات الحديقة") },
    { id: newId(), slug: "seeds", name: i18n("Seeds & kits", "Graines & kits", "بذور وأطقم زراعة") },
  ];
  type PD = { cat: number; slug: string; art: ArtKind; n: [string, string, string]; s: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "monstera-deliciosa", art: "monstera", n: ["Monstera deliciosa", "Monstera deliciosa", "مونسترا ديليسيوزا"], s: ["The Swiss-cheese plant, a bold statement leaf.", "Le monstera trouée, un feuillage XXL plein de caractère.", "نبتة الجبن السويسري بأوراق كبيرة مميزة."], p: 189, cmp: 239, stock: 18, feat: 1, best: 1, v: [["30 cm", 189, 10], ["50 cm", 289, 6]] },
    { cat: 0, slug: "snake-plant", art: "snake", n: ["Snake plant (Sansevieria)", "Sansevieria (langue de belle-mère)", "سانسيفيريا (لسان الحماة)"], s: ["Nearly indestructible, purifies indoor air.", "Presque increvable, purifie l'air intérieur.", "شبه مستحيلة الموت وتنقي هواء المنزل."], p: 129, cmp: 0, stock: 30, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "golden-pothos", art: "pothos", n: ["Golden pothos trailing plant", "Pothos doré retombant", "بوتس ذهبي متدلٍّ"], s: ["Trailing vines that love shelves and hanging pots.", "Lianes retombantes idéales pour étagères et suspensions.", "متسلقة متدلية مثالية للرفوف والأواني المعلقة."], p: 99, cmp: 129, stock: 40, feat: 1, best: 0, v: [] },
    { cat: 1, slug: "echeveria-rosette", art: "rosette", n: ["Echeveria rosette succulent", "Succulente Echeveria en rosette", "إيكيفيريا عصارية وردية"], s: ["A tiny stone rose for sunny windowsills.", "Une petite rose de pierre pour les rebords ensoleillés.", "وردة حجرية صغيرة لحافة النافذة المشمسة."], p: 59, cmp: 0, stock: 55, feat: 1, best: 1, v: [] },
    { cat: 1, slug: "cactus-trio", art: "cactus", n: ["Mini cactus trio", "Trio de mini cactus", "ثلاثة صبارات صغيرة"], s: ["Three spiky friends that thrive on neglect.", "Trois petits cactus qui adorent qu'on les oublie.", "ثلاثة صبارات صغيرة تعيش بأقل اهتمام."], p: 79, cmp: 99, stock: 35, feat: 0, best: 1, v: [] },
    { cat: 1, slug: "aloe-vera", art: "aloe", n: ["Aloe vera plant", "Aloe vera en pot", "نبتة الألوفيرا"], s: ["Soothing gel on tap, easy to grow.", "Du gel apaisant à portée de main, facile à cultiver.", "جل مهدئ بين يديك وسهلة النمو."], p: 69, cmp: 0, stock: 0, feat: 0, best: 0, v: [["Small", 69, 20], ["Large", 119, 8]] },
    { cat: 2, slug: "terracotta-pot-set", art: "pots", n: ["Painted terracotta pots (3 pcs)", "Pots en terre cuite peints (3)", "أصص فخارية ملونة (3 قطع)"], s: ["Three sizes with drainage holes and saucers.", "Trois tailles avec trous de drainage et soucoupes.", "ثلاثة مقاسات بفتحات تصريف وصحون."], p: 119, cmp: 159, stock: 25, feat: 1, best: 0, v: [] },
    { cat: 2, slug: "hanging-planter", art: "hanging", n: ["Macramé hanging planter", "Suspension macramé pour plantes", "حامل نباتات معلق ماكرامية"], s: ["Hand-knotted cotton rope with a ceramic bowl.", "Corde en coton nouée main avec bol en céramique.", "حبل قطني معقود يدويا مع وعاء خزفي."], p: 89, cmp: 0, stock: 20, feat: 0, best: 0, v: [] },
    { cat: 3, slug: "watering-can", art: "can", n: ["Long-spout watering can 2L", "Arrosoir à long bec 2L", "إبريق ري بفوهة طويلة 2 لتر"], s: ["Precise pouring for indoor plants.", "Un arrosage précis pour plantes d'intérieur.", "سكب دقيق لنباتات المنزل."], p: 79, cmp: 0, stock: 30, feat: 0, best: 1, v: [] },
    { cat: 3, slug: "garden-tool-set", art: "tools", n: ["Mini garden tool set (3 pcs)", "Set de mini outils de jardin (3)", "طقم أدوات حديقة صغيرة (3 قطع)"], s: ["Trowel, fork and pruner with comfy grips.", "Transplantoir, fourche et sécateur ergonomiques.", "مجرفة وشوكة ومقص بمقابض مريحة."], p: 109, cmp: 149, stock: 22, feat: 1, best: 0, v: [] },
    { cat: 4, slug: "herb-seed-kit", art: "herbs", n: ["Kitchen herb seed kit", "Kit de graines d'herbes aromatiques", "طقم بذور أعشاب المطبخ"], s: ["Basil, mint and parsley with pots and soil discs.", "Basilic, menthe et persil avec pots et pastilles de terreau.", "ريحان ونعناع وبقدونس مع أصص وأقراص تربة."], p: 69, cmp: 89, stock: 60, feat: 1, best: 1, v: [] },
    { cat: 4, slug: "wildflower-seeds", art: "wildflowers", n: ["Wildflower seed mix", "Mélange de graines de fleurs sauvages", "خليط بذور الأزهار البرية"], s: ["A colourful meadow for pots and borders.", "Une prairie colorée pour pots et massifs.", "مرج ملون للأصص والحواف."], p: 39, cmp: 0, stock: 80, feat: 0, best: 0, v: [] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, plantArt(CAT_ART[c.slug]!));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const cat = cats[p.cat]!;
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, plantArt(p.art));
    const totalStock = p.v.length ? 0 : p.stock;
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]),
        i18n(`${p.s[0]} Grown and packed with care. Pay only when you receive it.`, `${p.s[1]} Cultivé et emballé avec soin. Vous ne payez qu'à la réception.`, `${p.s[2]} مجهز بعناية. لا تدفع إلا عند الاستلام.`),
        cat.id, `SKU-${1000 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 10 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `SKU-${1000 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Ma monstera est arrivée parfaite, bien emballée. Merci !"],
    [1, "Youssef", "Rabat", 5, "Tough plant, survived my travel month. Paid the courier on arrival."],
    [3, "Fatima", "Marrakech", 4, "نبتة جميلة وصلت سليمة، والتوصيل كان سريع."],
    [10, "Omar", "Tanger", 5, "Le basilic a germé en 5 jours, super kit pour débuter."],
    [6, "Nadia", "Fès", 5, "Pots très jolis, couleurs fidèles aux photos."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "WELCOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on the featured products: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.9, 1], [3, 0.82, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
    // show a few of the offer-card layouts: every product after the first uses the next template (the first keeps the store default)
    if (i > 0) stmts.push(db.prepare("UPDATE products SET offer_template = ? WHERE id = ?").bind((["tiles", "photo", "pills", "highlight"] as const)[(i - 1) % 4], pids[i]!));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));

  // hero slide image
  await putSvg(env, "uploads/sample-hero.svg", heroArt());
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
