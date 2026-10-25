import { CITY_DATA, MA_MAJOR } from "@/lib/cities-data";
import { decimalsOf } from "@/lib/money";
import { newId } from "@/lib/id";
import { COUNTRIES } from "@/lib/phone";
import type { AppEnv } from "@/lib/env";

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

function svg(c1: string, c2: string, label: string, shape: number) {
  const shapes = [
    `<circle cx="300" cy="300" r="150" fill="rgba(255,255,255,.22)"/><circle cx="300" cy="300" r="90" fill="rgba(255,255,255,.35)"/>`,
    `<rect x="170" y="170" width="260" height="260" rx="40" fill="rgba(255,255,255,.25)" transform="rotate(12 300 300)"/>`,
    `<path d="M300 150 L440 410 L160 410 Z" fill="rgba(255,255,255,.28)"/>`,
    `<rect x="150" y="230" width="300" height="140" rx="70" fill="rgba(255,255,255,.28)"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/>${shapes[shape % 4]}<text x="300" y="520" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,.9)">${label}</text></svg>`;
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
    { id: newId(), slug: "home", name: i18n("Home & Kitchen", "Maison & Cuisine", "المنزل والمطبخ"), c: ["#0f766e", "#14b8a6"] },
    { id: newId(), slug: "beauty", name: i18n("Beauty & Care", "Beauté & Soins", "الجمال والعناية"), c: ["#be185d", "#f472b6"] },
    { id: newId(), slug: "gadgets", name: i18n("Gadgets", "Gadgets", "إلكترونيات"), c: ["#1d4ed8", "#60a5fa"] },
  ];
  type PD = { cat: number; slug: string; n: [string, string, string]; s: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "ceramic-pan-set", n: ["Ceramic non-stick pan set", "Set de poêles céramique", "طقم مقالي سيراميك"], s: ["Even heating, easy to clean.", "Chauffe uniforme, facile à nettoyer.", "تسخين متساوٍ وسهل التنظيف."], p: 249, cmp: 349, stock: 40, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "electric-grinder", n: ["Rechargeable spice grinder", "Moulin électrique rechargeable", "مطحنة توابل قابلة للشحن"], s: ["USB-C, stainless blades.", "USB-C, lames inox.", "شحن USB-C وشفرات ستانلس."], p: 129, cmp: 179, stock: 25, feat: 1, best: 0, v: [] },
    { cat: 1, slug: "argan-hair-oil", n: ["Pure argan hair oil 100ml", "Huile d'argan cheveux 100ml", "زيت الأرغان للشعر 100مل"], s: ["Cold-pressed, nourishing.", "Pressée à froid, nourrissante.", "معصور على البارد ومغذٍّ."], p: 89, cmp: 119, stock: 80, feat: 1, best: 1, v: [] },
    { cat: 1, slug: "face-serum", n: ["Vitamin C face serum", "Sérum visage vitamine C", "سيروم فيتامين سي للوجه"], s: ["Brightens and evens skin tone.", "Éclat et teint uniforme.", "يمنح إشراقة ويوحّد لون البشرة."], p: 149, cmp: 0, stock: 0, feat: 0, best: 1, v: [["30 ml", 149, 30], ["50 ml", 219, 18]] },
    { cat: 2, slug: "smart-watch", n: ["Smart fitness watch", "Montre connectée sport", "ساعة ذكية رياضية"], s: ["Heart-rate, sleep, 7-day battery.", "Cardio, sommeil, 7 jours d'autonomie.", "نبض ونوم وبطارية 7 أيام."], p: 299, cmp: 449, stock: 0, feat: 1, best: 1, v: [["Black", 299, 20], ["Silver", 299, 12], ["Rose", 319, 0]] },
    { cat: 2, slug: "wireless-earbuds", n: ["Wireless earbuds Pro", "Écouteurs sans fil Pro", "سماعات لاسلكية برو"], s: ["Noise reduction, 24h with case.", "Réduction de bruit, 24h avec boîtier.", "عزل ضوضاء و24 ساعة مع العلبة."], p: 199, cmp: 279, stock: 60, feat: 1, best: 0, v: [] },
    { cat: 2, slug: "phone-stand", n: ["Foldable phone stand", "Support téléphone pliable", "حامل هاتف قابل للطي"], s: ["Aluminium, adjustable angle.", "Aluminium, angle réglable.", "ألمنيوم بزاوية قابلة للتعديل."], p: 49, cmp: 0, stock: 30, feat: 0, best: 0, v: [] },
    { cat: 0, slug: "storage-baskets", n: ["Woven storage baskets (3 pcs)", "Paniers de rangement tressés (3)", "سلال تخزين منسوجة (3 قطع)"], s: ["Natural fibre, three sizes.", "Fibre naturelle, trois tailles.", "ألياف طبيعية بثلاثة مقاسات."], p: 119, cmp: 159, stock: 15, feat: 0, best: 0, v: [] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.c[0]!, c.c[1]!, JSON.parse(c.name).en, i));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const cat = cats[p.cat]!;
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, svg(cat.c[0]!, cat.c[1]!, p.n[0].slice(0, 26), i));
    const totalStock = p.v.length ? 0 : p.stock;
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]),
        i18n(`${p.s[0]} Carefully selected for quality and value. Pay only when you receive it.`, `${p.s[1]} Sélectionné pour sa qualité. Vous ne payez qu'à la réception.`, `${p.s[2]} منتج مختار بعناية للجودة. لا تدفع إلا عند الاستلام.`),
        cat.id, `SKU-${1000 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 10 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `SKU-${1000 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Livraison rapide et produit conforme. Merci !"],
    [2, "Youssef", "Rabat", 5, "Great quality, I paid the courier when it arrived."],
    [4, "Fatima", "Marrakech", 4, "ممتازة وسعرها مناسب، والتوصيل كان سريع."],
    [5, "Omar", "Tanger", 5, "Son très clair, très bon rapport qualité-prix."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "WELCOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));

  // hero slide image
  await putSvg(env, "uploads/sample-hero.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#134e4a"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><rect width="1600" height="900" fill="url(#g)"/><circle cx="1250" cy="450" r="330" fill="rgba(255,255,255,.12)"/><circle cx="1250" cy="450" r="200" fill="rgba(255,255,255,.18)"/></svg>`);
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
