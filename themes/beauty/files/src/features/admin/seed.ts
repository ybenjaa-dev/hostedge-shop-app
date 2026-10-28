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

const xml = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type Kind = "dropper" | "jar" | "lipstick" | "pump" | "perfume" | "compact" | "tube" | "mascara";
type Pal = { bg1: string; bg2: string; body: string; cap: string };

/** Soft studio-style product illustration (portrait 4:5): pastel backdrop, blurred blob, product silhouette, floor shadow. */
export function svg(pal: Pal, kind: Kind) {
  const shapes: Record<Kind, string> = {
    dropper: `<rect x="270" y="330" width="60" height="50" rx="8" fill="${pal.cap}"/><rect x="278" y="205" width="44" height="130" rx="22" fill="${pal.cap}"/><rect x="215" y="372" width="170" height="270" rx="30" fill="${pal.body}" opacity=".92"/><rect x="232" y="395" width="26" height="215" rx="13" fill="#fff" opacity=".35"/><rect x="262" y="470" width="106" height="80" rx="8" fill="#fff" opacity=".85"/><rect x="278" y="492" width="74" height="8" rx="4" fill="${pal.cap}"/><rect x="278" y="510" width="52" height="6" rx="3" fill="${pal.cap}" opacity=".6"/>`,
    jar: `<rect x="175" y="400" width="250" height="190" rx="38" fill="${pal.body}" opacity=".95"/><rect x="165" y="335" width="270" height="82" rx="22" fill="${pal.cap}"/><rect x="195" y="425" width="24" height="140" rx="12" fill="#fff" opacity=".3"/><rect x="250" y="470" width="150" height="62" rx="8" fill="#fff" opacity=".85"/><rect x="266" y="490" width="100" height="8" rx="4" fill="${pal.cap}"/>`,
    lipstick: `<path d="M262 330 L338 300 L338 400 L262 400 Z" fill="${pal.cap}"/><rect x="258" y="395" width="84" height="40" rx="6" fill="#d9c7a0"/><rect x="250" y="432" width="100" height="170" rx="14" fill="${pal.body}"/><rect x="262" y="450" width="14" height="130" rx="7" fill="#fff" opacity=".35"/>`,
    pump: `<rect x="285" y="238" width="30" height="105" rx="10" fill="${pal.cap}"/><rect x="285" y="228" width="92" height="22" rx="11" fill="${pal.cap}"/><rect x="268" y="338" width="64" height="40" rx="8" fill="${pal.cap}"/><rect x="205" y="372" width="190" height="270" rx="36" fill="${pal.body}" opacity=".95"/><rect x="224" y="395" width="24" height="220" rx="12" fill="#fff" opacity=".33"/><rect x="262" y="470" width="110" height="78" rx="8" fill="#fff" opacity=".85"/><rect x="278" y="492" width="78" height="8" rx="4" fill="${pal.cap}"/>`,
    perfume: `<rect x="262" y="270" width="76" height="86" rx="10" fill="${pal.cap}"/><rect x="278" y="350" width="44" height="30" fill="#d9c7a0"/><rect x="195" y="378" width="210" height="250" rx="26" fill="${pal.body}" opacity=".88"/><rect x="214" y="398" width="22" height="200" rx="11" fill="#fff" opacity=".38"/><rect x="248" y="468" width="116" height="88" rx="6" fill="#fff" opacity=".88"/><rect x="266" y="490" width="80" height="7" rx="3.5" fill="${pal.cap}"/><rect x="266" y="508" width="56" height="6" rx="3" fill="${pal.cap}" opacity=".6"/>`,
    compact: `<ellipse cx="300" cy="470" rx="165" ry="150" fill="${pal.cap}"/><ellipse cx="300" cy="470" rx="140" ry="126" fill="${pal.body}"/><ellipse cx="300" cy="448" rx="92" ry="78" fill="#fff" opacity=".28"/><rect x="262" y="590" width="76" height="14" rx="7" fill="${pal.cap}"/>`,
    tube: `<path d="M235 270 H365 L352 330 H248 Z" fill="${pal.cap}"/><path d="M248 330 H352 L372 612 Q372 640 344 640 H256 Q228 640 228 612 Z" fill="${pal.body}" opacity=".95"/><rect x="248" y="360" width="20" height="230" rx="10" fill="#fff" opacity=".35"/><rect x="278" y="450" width="76" height="62" rx="6" fill="#fff" opacity=".85"/><rect x="290" y="470" width="52" height="7" rx="3.5" fill="${pal.cap}"/>`,
    mascara: `<rect x="278" y="210" width="44" height="190" rx="22" fill="${pal.cap}"/><rect x="262" y="395" width="76" height="40" rx="6" fill="#d9c7a0"/><rect x="255" y="432" width="90" height="190" rx="22" fill="${pal.body}"/><rect x="266" y="452" width="12" height="140" rx="6" fill="#fff" opacity=".3"/><rect x="288" y="500" width="48" height="44" rx="6" fill="#fff" opacity=".85"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.bg1}"/><stop offset="1" stop-color="${pal.bg2}"/></linearGradient><filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="38"/></filter></defs><rect width="600" height="750" fill="url(#g)"/><circle cx="440" cy="190" r="150" fill="#fff" opacity=".45" filter="url(#b)"/><circle cx="130" cy="620" r="130" fill="${pal.cap}" opacity=".18" filter="url(#b)"/><ellipse cx="300" cy="655" rx="150" ry="16" fill="#3a1f28" opacity=".14" filter="url(#b)"/>${shapes[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  blush: { bg1: "#fbe3dc", bg2: "#f3c9c0", body: "#f7d3cc", cap: "#b5656f" },
  cream: { bg1: "#fbf0e1", bg2: "#efd9bd", body: "#f4e1c6", cap: "#9b6a43" },
  sage: { bg1: "#e6eee3", bg2: "#c9dac7", body: "#d8e6d4", cap: "#5f7d62" },
  lilac: { bg1: "#efe6f3", bg2: "#d9c8e4", body: "#e5d5ee", cap: "#76508f" },
  berry: { bg1: "#f6dde3", bg2: "#e9b3c2", body: "#c85b7a", cap: "#5b1d33" },
  amber: { bg1: "#fbeacd", bg2: "#f0cf94", body: "#e2a94d", cap: "#5a3a17" },
  sky: { bg1: "#e3eef6", bg2: "#c3d9ea", body: "#cfe2f1", cap: "#476c8a" },
  rosegold: { bg1: "#f9e5df", bg2: "#ecc3b6", body: "#e0a99b", cap: "#8a5546" },
} satisfies Record<string, Pal>;

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "skincare", name: i18n("Skincare", "Soins du visage", "العناية بالبشرة"), pal: PAL.blush, kind: "dropper" as Kind },
    { id: newId(), slug: "makeup", name: i18n("Makeup", "Maquillage", "المكياج"), pal: PAL.berry, kind: "lipstick" as Kind },
    { id: newId(), slug: "hair", name: i18n("Hair", "Cheveux", "الشعر"), pal: PAL.amber, kind: "pump" as Kind },
    { id: newId(), slug: "body", name: i18n("Body & Bath", "Corps & bain", "الجسم والاستحمام"), pal: PAL.sage, kind: "jar" as Kind },
    { id: newId(), slug: "fragrance", name: i18n("Fragrance", "Parfums", "العطور"), pal: PAL.lilac, kind: "perfume" as Kind },
  ];
  type PD = { cat: number; slug: string; n: [string, string, string]; s: [string, string, string]; l: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; pal: Pal; kind: Kind; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "vitamin-c-serum", n: ["Vitamin C brightening serum", "Sérum éclat vitamine C", "سيروم فيتامين سي للإشراق"], s: ["Fades dullness for a lit-from-within glow.", "Estompe le teint terne pour un éclat naturel.", "يمنح بشرتك إشراقة طبيعية ويخفف الهالة الباهتة."], l: ["Lightweight daily serum with 10% vitamin C and hyaluronic acid. Apply 3–4 drops on clean skin every morning, then moisturiser and sunscreen.", "Sérum léger quotidien à 10 % de vitamine C et acide hyaluronique. Appliquez 3 à 4 gouttes sur peau propre chaque matin, puis crème et protection solaire.", "سيروم خفيف للاستخدام اليومي بتركيز 10٪ فيتامين سي وحمض الهيالورونيك. ضعي 3 إلى 4 قطرات على بشرة نظيفة كل صباح ثم الكريم المرطب وواقي الشمس."], p: 189, cmp: 249, stock: 0, feat: 1, best: 1, pal: PAL.amber, kind: "dropper", v: [["30 ml", 189, 30], ["50 ml", 269, 18]] },
    { cat: 0, slug: "hyaluronic-moisturizer", n: ["Hyaluronic cloud moisturizer", "Crème hydratante acide hyaluronique", "كريم مرطب بالهيالورونيك"], s: ["72-hour hydration, never greasy.", "Hydratation 72 h, jamais grasse.", "ترطيب يدوم 72 ساعة دون لمعان."], l: ["A cushiony gel-cream that plumps and softens. Suitable for all skin types, including sensitive.", "Une crème-gel coussin qui repulpe et assouplit. Convient à tous les types de peau, même sensible.", "كريم جل منعش يملأ البشرة ويمنحها نعومة. مناسب لكل أنواع البشرة بما فيها الحساسة."], p: 149, cmp: 189, stock: 45, feat: 1, best: 1, pal: PAL.sky, kind: "jar", v: [] },
    { cat: 0, slug: "rose-water-toner", n: ["Damask rose water toner", "Lotion eau de rose de Damas", "تونر ماء الورد الدمشقي"], s: ["Refreshing, calming, alcohol-free.", "Rafraîchissante, apaisante, sans alcool.", "منعش ومهدئ وخالٍ من الكحول."], l: ["Pure distilled rose water to tone and prep skin. Mist or sweep with a cotton pad after cleansing.", "Eau de rose distillée pure pour tonifier et préparer la peau. Vaporisez ou appliquez avec un coton après le nettoyage.", "ماء ورد مقطّر نقي لتنظيف وتحضير البشرة. رشيه أو امسحي به بقطنة بعد الغسل."], p: 79, cmp: 0, stock: 60, feat: 0, best: 0, pal: PAL.blush, kind: "pump", v: [] },
    { cat: 0, slug: "clay-detox-mask", n: ["Moroccan clay detox mask", "Masque détox argile marocaine", "ماسك الطين المغربي للتنقية"], s: ["Rhassoul clay that clears pores gently.", "Au rhassoul pour purifier les pores en douceur.", "بالغاسول المغربي لتنقية المسام بلطف."], l: ["Mix with water or rose water, apply for 10 minutes and rinse. Use once or twice a week.", "Mélangez à l'eau ou à l'eau de rose, laissez poser 10 minutes puis rincez. 1 à 2 fois par semaine.", "اخلطيه بالماء أو ماء الورد، اتركيه 10 دقائق ثم اشطفيه. مرة أو مرتين أسبوعياً."], p: 99, cmp: 129, stock: 38, feat: 0, best: 0, pal: PAL.cream, kind: "jar", v: [] },
    { cat: 1, slug: "velvet-matte-lipstick", n: ["Velvet matte lipstick", "Rouge à lèvres mat velours", "أحمر شفاه مات مخملي"], s: ["Comfortable colour with a soft-focus finish.", "Couleur confortable au fini soft-focus.", "لون مريح بتأثير ناعم يدوم طويلاً."], l: ["Highly pigmented, non-drying matte formula enriched with vitamin E and argan oil.", "Formule mate très pigmentée, non desséchante, enrichie en vitamine E et huile d'argan.", "تركيبة مات عالية التصبغ لا تجفف الشفاه وغنية بفيتامين هـ وزيت الأرغان."], p: 119, cmp: 149, stock: 0, feat: 1, best: 1, pal: PAL.berry, kind: "lipstick", v: [["Rose", 119, 24], ["Berry", 119, 18], ["Nude", 119, 30], ["Coral", 119, 12], ["Brick", 119, 0]] },
    { cat: 1, slug: "second-skin-foundation", n: ["Second-skin foundation", "Fond de teint seconde peau", "كريم أساس بتأثير البشرة الثانية"], s: ["Buildable, breathable medium coverage.", "Couvrance moyenne modulable et respirante.", "تغطية متوسطة قابلة للبناء وخفيفة على البشرة."], l: ["Weightless satin finish that evens tone without masking skin. Shake well, apply with a sponge or brush.", "Fini satiné ultra léger qui unifie sans masquer. Bien agiter, appliquer à l'éponge ou au pinceau.", "ملمس ساتاني خفيف يوحّد اللون دون إخفاء البشرة. رجّيه جيداً وضعيه بإسفنجة أو فرشاة."], p: 219, cmp: 0, stock: 0, feat: 1, best: 0, pal: PAL.rosegold, kind: "tube", v: [["Ivory", 219, 14], ["Beige", 219, 20], ["Sand", 219, 16], ["Caramel", 219, 9], ["Mocha", 219, 6]] },
    { cat: 1, slug: "lengthening-mascara", n: ["Lengthening black mascara", "Mascara noir allongeant", "ماسكارا سوداء للتطويل"], s: ["Lifted, defined lashes without clumps.", "Cils définis et allongés sans paquets.", "رموش مرفوعة ومحددة دون تكتل."], l: ["Flexible brush that grabs every lash. Smudge-resistant and easy to remove with warm water.", "Brosse souple qui capte chaque cil. Résiste aux traces, s'enlève facilement à l'eau tiède.", "فرشاة مرنة تلتقط كل رمش. مقاومة للتلطخ وتُزال بسهولة بالماء الدافئ."], p: 109, cmp: 139, stock: 52, feat: 0, best: 1, pal: PAL.lilac, kind: "mascara", v: [] },
    { cat: 1, slug: "glow-cream-blush", n: ["Glow cream blush", "Blush crème éclat", "أحمر خدود كريمي"], s: ["A flush of colour that melts into skin.", "Un voile de couleur qui fond sur la peau.", "لمسة لون تذوب على البشرة."], l: ["Blend with fingertips for a natural, dewy flush. Layer for more intensity.", "Estompez du bout des doigts pour un teint frais et naturel. Superposez pour plus d'intensité.", "وزّعيه بأطراف الأصابع لإطلالة منتعشة وطبيعية. كرّريه لتعزيز اللون."], p: 99, cmp: 0, stock: 0, feat: 0, best: 0, pal: PAL.rosegold, kind: "compact", v: [["Peach", 99, 22], ["Pink", 99, 20], ["Plum", 99, 8]] },
    { cat: 2, slug: "argan-hair-mask", n: ["Pure argan repair hair mask", "Masque réparateur à l'argan pur", "ماسك الأرغان لإصلاح الشعر"], s: ["Deep conditioning for dry, damaged hair.", "Soin profond pour cheveux secs et abîmés.", "ترطيب عميق للشعر الجاف والتالف."], l: ["Cold-pressed Moroccan argan oil and shea butter. Leave on for 10 minutes on damp hair, then rinse.", "Huile d'argan marocaine pressée à froid et beurre de karité. Laisser poser 10 minutes sur cheveux humides, puis rincer.", "زيت أرغان مغربي معصور على البارد وزبدة الشيا. اتركيه 10 دقائق على شعر رطب ثم اشطفيه."], p: 129, cmp: 169, stock: 40, feat: 1, best: 1, pal: PAL.amber, kind: "jar", v: [] },
    { cat: 2, slug: "nourishing-hair-oil", n: ["Nourishing hair & scalp oil", "Huile nourrissante cheveux & cuir chevelu", "زيت مغذٍّ للشعر وفروة الرأس"], s: ["Shine and strength without weighing hair down.", "Brillance et force sans alourdir.", "لمعان وقوة دون تثقيل الشعر."], l: ["A blend of argan, castor and rosemary oils. Massage into the scalp or smooth through lengths.", "Mélange d'huiles d'argan, de ricin et de romarin. Massez le cuir chevelu ou lissez sur les longueurs.", "مزيج من زيوت الأرغان والخروع وإكليل الجبل. دلّكي به فروة الرأس أو وزّعيه على الأطوال."], p: 89, cmp: 119, stock: 70, feat: 0, best: 0, pal: PAL.cream, kind: "dropper", v: [] },
    { cat: 3, slug: "whipped-body-butter", n: ["Whipped shea body butter", "Beurre corporel fouetté au karité", "زبدة الجسم المخفوقة بالشيا"], s: ["Soft, supple skin that lasts all day.", "Une peau douce et souple toute la journée.", "بشرة ناعمة ومرنة طوال اليوم."], l: ["Rich yet fast-absorbing, with a soft vanilla and almond scent. Smooth on after showering.", "Riche mais à absorption rapide, parfum doux vanille-amande. À appliquer après la douche.", "غنية وسريعة الامتصاص بعطر الفانيلا واللوز الناعم. ضعيها بعد الاستحمام."], p: 119, cmp: 0, stock: 33, feat: 0, best: 0, pal: PAL.sage, kind: "jar", v: [] },
    { cat: 4, slug: "oud-rose-eau-de-parfum", n: ["Oud & rose eau de parfum", "Eau de parfum oud & rose", "عطر العود والورد"], s: ["Warm oud softened by Damask rose.", "Un oud chaleureux adouci par la rose de Damas.", "عود دافئ يلطّفه الورد الدمشقي."], l: ["Top: bergamot and saffron. Heart: Damask rose. Base: oud, amber and musk. Long-lasting.", "Tête : bergamote et safran. Cœur : rose de Damas. Fond : oud, ambre et musc. Longue tenue.", "المقدمة: برغموت وزعفران. القلب: ورد دمشقي. القاعدة: عود وعنبر ومسك. ثبات طويل."], p: 329, cmp: 419, stock: 0, feat: 1, best: 1, pal: PAL.lilac, kind: "perfume", v: [["50 ml", 329, 16], ["100 ml", 489, 9]] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.pal, c.kind));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, svg(p.pal, p.kind));
    const totalStock = p.v.length ? 0 : p.stock;
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]),
        cats[p.cat]!.id, `BTY-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 12 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ [/\d/.test(name) ? "Size" : "Shade"]: name }), `BTY-${100 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Ma peau est plus lumineuse en deux semaines. Livraison rapide et colis soigné !"],
    [4, "Imane", "Rabat", 5, "The shade Rose is exactly like the photo. Pays on delivery made me feel safe."],
    [10, "Nour", "Marrakech", 5, "ماسك الأرغان غيّر شعري تماماً، ناعم ولامع. أنصح به."],
    [11, "Yasmine", "Tanger", 4, "Parfum élégant, tenue de plus de 8 heures. Je recommande."],
    [1, "Khadija", "Fès", 5, "Texture légère, hydrate sans graisser. Je rachète."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "GLOW10", "percent", 10, 0),
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
  await putSvg(env, "uploads/sample-hero.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d9d0"/><stop offset="1" stop-color="#d9a597"/></linearGradient><filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="55"/></filter></defs><rect width="900" height="1100" fill="url(#g)"/><circle cx="650" cy="280" r="230" fill="#fff" opacity=".5" filter="url(#b)"/><circle cx="200" cy="900" r="220" fill="#7a2e46" opacity=".25" filter="url(#b)"/><rect x="330" y="520" width="240" height="380" rx="46" fill="#fff" opacity=".9"/><rect x="390" y="440" width="120" height="100" rx="14" fill="#7a2e46"/><rect x="415" y="320" width="70" height="130" rx="35" fill="#7a2e46"/><rect x="365" y="640" width="170" height="14" rx="7" fill="#c98f78"/><rect x="390" y="672" width="120" height="10" rx="5" fill="#c98f78" opacity=".6"/></svg>`);
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
