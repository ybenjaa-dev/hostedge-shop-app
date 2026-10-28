import { CITY_DATA, MA_MAJOR } from "@/lib/cities-data";
import { decimalsOf } from "@/lib/money";
import { newId } from "@/lib/id";
import { COUNTRIES } from "@/lib/phone";
import type { AppEnv } from "@/lib/env";
import { productSvg, svg, HERO_SVG, type Art } from "./sample-art";

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

export { svg };

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
    { id: newId(), slug: "running", name: i18n("Running", "Course à pied", "الجري"), c: ["#c6ff00", ""] },
    { id: newId(), slug: "gym", name: i18n("Gym & Strength", "Musculation", "كمال الأجسام"), c: ["#ff5a1f", ""] },
    { id: newId(), slug: "yoga", name: i18n("Yoga & Mobility", "Yoga & Mobilité", "اليوغا والمرونة"), c: ["#b46bff", ""] },
    { id: newId(), slug: "cycling", name: i18n("Cycling", "Cyclisme", "الدراجات"), c: ["#18d2ff", ""] },
    { id: newId(), slug: "football", name: i18n("Football", "Football", "كرة القدم"), c: ["#ffd400", ""] },
  ];
  type PD = { cat: number; art: Art; slug: string; n: [string, string, string]; s: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, art: "shoe", slug: "velocity-pro-running-shoes", n: ["Velocity Pro running shoes", "Chaussures de running Velocity Pro", "حذاء الجري فيلوسيتي برو"], s: ["Carbon-plated energy return, 240 g.", "Retour d'énergie carbone, 240 g.", "إرجاع طاقة بالكربون ووزن 240 غ."], p: 690, cmp: 890, stock: 0, feat: 1, best: 1, v: [["40", 690, 8], ["42", 690, 14], ["44", 690, 6], ["46", 690, 0]] },
    { cat: 0, art: "shorts", slug: "aeroflex-running-shorts", n: ["AeroFlex 2-in-1 running shorts", "Short de running AeroFlex 2-en-1", "شورت الجري إيروفلكس 2 في 1"], s: ["Featherweight, with phone pocket.", "Ultra léger, avec poche téléphone.", "خفيف جداً مع جيب للهاتف."], p: 189, cmp: 249, stock: 0, feat: 1, best: 0, v: [["S", 189, 20], ["M", 189, 30], ["L", 189, 24], ["XL", 189, 10]] },
    { cat: 0, art: "bottle", slug: "hydro-flask-750", n: ["Hydro insulated bottle 750 ml", "Gourde isotherme Hydro 750 ml", "قارورة حرارية هيدرو 750 مل"], s: ["Cold 24 h, hot 12 h, leak-proof.", "Froid 24 h, chaud 12 h, étanche.", "باردة 24 ساعة وساخنة 12 ساعة وبلا تسرب."], p: 149, cmp: 0, stock: 70, feat: 0, best: 1, v: [] },
    { cat: 1, art: "dumbbell", slug: "hex-dumbbell-pair-10kg", n: ["Hex dumbbell pair 2 × 10 kg", "Paire d'haltères hexagonaux 2 × 10 kg", "زوج دمبل سداسي 2 × 10 كغ"], s: ["Rubber-coated, knurled steel grip.", "Revêtement caoutchouc, poignée moletée.", "مطاطي مع قبضة فولاذية مخرّشة."], p: 449, cmp: 549, stock: 22, feat: 1, best: 1, v: [] },
    { cat: 1, art: "kettlebell", slug: "cast-iron-kettlebell-16kg", n: ["Cast-iron kettlebell 16 kg", "Kettlebell fonte 16 kg", "كيتل بيل حديد 16 كغ"], s: ["Wide handle, flat base, powder coat.", "Poignée large, base plate, peinture poudre.", "مقبض عريض وقاعدة مسطحة."], p: 329, cmp: 399, stock: 18, feat: 1, best: 1, v: [] },
    { cat: 1, art: "bands", slug: "resistance-bands-set", n: ["Resistance bands set (5 levels)", "Set de bandes de résistance (5 niveaux)", "طقم أحزمة مقاومة (5 مستويات)"], s: ["Latex loops with handles and a carry bag.", "Boucles latex, poignées et sac.", "حلقات لاتكس مع مقابض وحقيبة."], p: 119, cmp: 159, stock: 90, feat: 0, best: 0, v: [] },
    { cat: 2, art: "mat", slug: "grip-yoga-mat-6mm", n: ["Grip yoga mat 6 mm", "Tapis de yoga Grip 6 mm", "سجادة يوغا جريب 6 مم"], s: ["Non-slip, cushioned, alignment lines.", "Antidérapant, épais, lignes d'alignement.", "غير قابلة للانزلاق مع خطوط محاذاة."], p: 229, cmp: 289, stock: 0, feat: 1, best: 1, v: [["Violet", 229, 16], ["Black", 229, 22], ["Teal", 249, 0]] },
    { cat: 2, art: "blocks", slug: "cork-yoga-blocks", n: ["Cork yoga blocks (set of 2)", "Briques de yoga en liège (x2)", "مكعبات يوغا من الفلين (2)"], s: ["Firm, light and naturally grippy.", "Fermes, légères et adhérentes.", "صلبة وخفيفة وذات تماسك طبيعي."], p: 139, cmp: 0, stock: 35, feat: 0, best: 0, v: [] },
    { cat: 3, art: "helmet", slug: "aero-road-cycling-helmet", n: ["Aero road cycling helmet", "Casque de vélo route Aero", "خوذة دراجات إيرو للطرق"], s: ["In-mould shell, 18 vents, 260 g.", "Coque in-mould, 18 aérations, 260 g.", "هيكل مصبوب و18 فتحة تهوية و260 غ."], p: 389, cmp: 490, stock: 0, feat: 1, best: 0, v: [["M (55-59)", 389, 12], ["L (59-63)", 389, 9]] },
    { cat: 3, art: "bottle", slug: "cycling-bidon-700", n: ["Cycling bidon 700 ml", "Bidon cyclisme 700 ml", "قارورة دراجة 700 مل"], s: ["Soft squeeze, valve cap, BPA-free.", "Souple, bouchon à valve, sans BPA.", "ضغط ناعم وغطاء بصمام بدون BPA."], p: 59, cmp: 79, stock: 120, feat: 0, best: 0, v: [] },
    { cat: 4, art: "ball", slug: "match-football-size-5", n: ["Match football size 5", "Ballon de football match taille 5", "كرة قدم المباراة مقاس 5"], s: ["Thermo-bonded, true flight, all pitches.", "Thermocollé, trajectoire précise.", "ملتصقة حرارياً بمسار دقيق."], p: 259, cmp: 329, stock: 45, feat: 1, best: 1, v: [] },
    { cat: 4, art: "shin", slug: "carbon-shin-guards", n: ["Carbon shin guards", "Protège-tibias carbone", "واقيات ساق من الكربون"], s: ["Ultra-light shell with soft ankle pad.", "Coque ultra légère, protège-cheville.", "هيكل خفيف جداً مع حماية للكاحل."], p: 129, cmp: 0, stock: 40, feat: 0, best: 0, v: [] },
    { cat: 4, art: "glove", slug: "pro-goalkeeper-gloves", n: ["Pro goalkeeper gloves", "Gants de gardien Pro", "قفازات حارس مرمى برو"], s: ["Latex palm, finger-save spines.", "Paume latex, renforts doigts.", "كف لاتكس مع دعامات للأصابع."], p: 199, cmp: 259, stock: 28, feat: 1, best: 0, v: [] },
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
    await putSvg(env, key, productSvg(p.art, cat.c[0]!, p.n[0].slice(0, 26), i));
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
    [0, "Salma", "Casablanca", 5, "Super légères, j'ai battu mon record sur 10 km. Livraison rapide !"],
    [3, "Youssef", "Rabat", 5, "Solid build, great grip. Paid the courier on delivery, zero hassle."],
    [6, "Fatima", "Marrakech", 4, "سجادة ممتازة وما تنزلقش، والتوصيل كان سريع."],
    [10, "Omar", "Tanger", 5, "Ballon top pour le foot du week-end, très bon rapport qualité-prix."],
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

  // hero slide cutout (transparent: it sits on the lime block)
  await putSvg(env, "uploads/sample-hero.svg", HERO_SVG);
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
