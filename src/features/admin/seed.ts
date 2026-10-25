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

type Kind = "bottle" | "pasta" | "jar" | "pouch" | "bar" | "tin";
type Pal = { bg: string; main: string; label: string; accent: string; dark: string };

/** Flat "packshot" tile on a bright colour field: bottle, bag, jar, pouch, bar or tin with a label (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { main, label, accent, dark } = pal;
  const lab = (x: number, y: number, w: number, h: number) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${label}"/><rect x="${x + 16}" y="${y + 16}" width="${w - 32}" height="9" rx="4" fill="${dark}"/><rect x="${x + 28}" y="${y + 34}" width="${w - 56}" height="6" rx="3" fill="${dark}" opacity=".45"/><circle cx="${x + w / 2}" cy="${y + h - 28}" r="14" fill="${accent}"/>`;
  const S: Record<Kind, string> = {
    bottle: `<rect x="272" y="140" width="56" height="48" rx="8" fill="${dark}"/><rect x="278" y="186" width="44" height="86" fill="${main}"/><path d="M278 262 C 200 290 200 330 200 380 V 540 C 200 566 222 576 250 576 H350 C378 576 400 566 400 540 V380 C400 330 400 290 322 262 Z" fill="${main}"/>${lab(228, 380, 144, 150)}<path d="M222 340 C 224 310 238 296 256 286" stroke="#fff" stroke-opacity=".4" stroke-width="10" fill="none" stroke-linecap="round"/>`,
    pasta: `<rect x="190" y="170" width="220" height="410" rx="10" fill="${main}"/><path d="M190 170 l16 -14 h188 l16 14" fill="${dark}" opacity=".35"/><rect x="190" y="180" width="220" height="18" fill="${dark}" opacity=".25"/><rect x="214" y="224" width="172" height="130" rx="8" fill="#fff" opacity=".55"/><g stroke="${accent}" stroke-width="7" stroke-linecap="round"><path d="M240 238 V340"/><path d="M262 238 V340"/><path d="M284 238 V340"/><path d="M306 238 V340"/><path d="M328 238 V340"/><path d="M350 238 V340"/></g>${lab(214, 390, 172, 150)}`,
    jar: `<rect x="196" y="150" width="208" height="62" rx="14" fill="${dark}"/><rect x="204" y="206" width="192" height="20" fill="${dark}" opacity=".5"/><path d="M204 226 H396 C 412 250 412 270 412 300 V520 C412 556 392 576 358 576 H242 C208 576 188 556 188 520 V300 C188 270 188 250 204 226 Z" fill="${main}"/><path d="M204 226 H396 C 412 250 412 270 412 300 V330 H188 V300 C188 270 188 250 204 226 Z" fill="#fff" opacity=".22"/>${lab(214, 380, 172, 150)}<path d="M214 290 V 440" stroke="#fff" stroke-opacity=".35" stroke-width="12" stroke-linecap="round"/>`,
    pouch: `<path d="M180 180 H420 L430 570 H170 Z" fill="${main}"/><rect x="180" y="180" width="240" height="26" fill="${dark}" opacity=".35"/><path d="M180 232 H420" stroke="#fff" stroke-opacity=".5" stroke-dasharray="6 8" stroke-width="3"/>${lab(212, 290, 176, 190)}<path d="M180 180 l-10 0 M420 180 l10 0" stroke="${dark}" stroke-width="3"/><ellipse cx="300" cy="536" rx="70" ry="12" fill="#fff" opacity=".25"/>`,
    bar: `<rect x="150" y="270" width="300" height="250" rx="14" fill="${main}" transform="rotate(-6 300 400)"/><g transform="rotate(-6 300 400)"><rect x="150" y="270" width="300" height="104" rx="14" fill="${dark}"/><g fill="${pal.accent}" opacity=".9"><rect x="166" y="286" width="52" height="34" rx="4"/><rect x="226" y="286" width="52" height="34" rx="4"/><rect x="286" y="286" width="52" height="34" rx="4"/><rect x="346" y="286" width="52" height="34" rx="4"/><rect x="166" y="326" width="52" height="34" rx="4"/><rect x="226" y="326" width="52" height="34" rx="4"/></g><rect x="180" y="404" width="240" height="90" rx="8" fill="${label}"/><rect x="198" y="424" width="204" height="10" rx="5" fill="${dark}"/><rect x="218" y="448" width="120" height="6" rx="3" fill="${dark}" opacity=".45"/></g>`,
    tin: `<ellipse cx="300" cy="212" rx="130" ry="30" fill="${dark}"/><rect x="170" y="212" width="260" height="330" fill="${main}"/><ellipse cx="300" cy="542" rx="130" ry="30" fill="${main}"/><rect x="170" y="212" width="260" height="18" fill="#fff" opacity=".18"/>${lab(204, 290, 192, 190)}<ellipse cx="300" cy="200" rx="130" ry="30" fill="${dark}"/><ellipse cx="300" cy="196" rx="108" ry="22" fill="#fff" opacity=".18"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="${pal.bg}"/><circle cx="470" cy="150" r="90" fill="#fff" opacity=".28"/><circle cx="120" cy="640" r="120" fill="#000" opacity=".05"/><ellipse cx="300" cy="584" rx="180" ry="14" fill="#000" opacity=".16"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  olive: { bg: "#e7e9b9", main: "#4c5a1f", label: "#fbf4e4", accent: "#e0452f", dark: "#1f2a1c" },
  tomato: { bg: "#f7cdbd", main: "#d6492f", label: "#fbf4e4", accent: "#2f6b3a", dark: "#431a12" },
  mustard: { bg: "#f8e29a", main: "#e8a91b", label: "#fbf4e4", accent: "#c0391f", dark: "#3d2a05" },
  honey: { bg: "#fbe3a9", main: "#d9891b", label: "#fff8e8", accent: "#3a7d3a", dark: "#3b2405" },
  berry: { bg: "#f2c7d2", main: "#a8213f", label: "#fff3f0", accent: "#2f6b3a", dark: "#35101b" },
  cocoa: { bg: "#e4cdb8", main: "#5a2e1b", label: "#f6e7d3", accent: "#e8a91b", dark: "#2a140b" },
  leaf: { bg: "#cfe5c4", main: "#2f6b3a", label: "#fbf4e4", accent: "#e8a91b", dark: "#16301b" },
  sky: { bg: "#c9e0ec", main: "#2f6f93", label: "#fbf4e4", accent: "#e0452f", dark: "#102b3a" },
  nut: { bg: "#ecd8bd", main: "#b57a3a", label: "#fbf4e4", accent: "#2f6b3a", dark: "#3a230d" },
  coffee: { bg: "#ddd0c0", main: "#3d2a22", label: "#f3e8d8", accent: "#e0452f", dark: "#1d120d" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  origin: ["Origin", "Origine", "المنشأ"], weight: ["Net weight", "Poids net", "الوزن الصافي"], shelf: ["Shelf life", "Conservation", "مدة الصلاحية"], diet: ["Suitable for", "Convient aux régimes", "مناسب لـ"],
  ing: ["Ingredients", "Ingrédients", "المكونات"], all: ["Allergens", "Allergènes", "مسببات الحساسية"], store: ["Storage", "Stockage", "التخزين"],
  energy: ["Energy", "Énergie", "الطاقة"], fat: ["Fat", "Matières grasses", "الدهون"], sat: ["of which saturates", "dont saturés", "منها مشبعة"], carb: ["Carbohydrates", "Glucides", "الكربوهيدرات"], sugar: ["of which sugars", "dont sucres", "منها سكريات"], fibre: ["Fibre", "Fibres", "الألياف"], prot: ["Protein", "Protéines", "البروتين"], salt: ["Salt", "Sel", "الملح"],
};
const NK = ["energy", "fat", "sat", "carb", "sugar", "fibre", "prot", "salt"] as const;
const D: Record<string, T3> = { vegan: ["Vegan", "Vegan", "نباتي"], gf: ["Gluten-free", "Sans gluten", "خالٍ من الغلوتين"], organic: ["Organic", "Bio", "عضوي"], nosugar: ["No added sugar", "Sans sucres ajoutés", "بدون سكر مضاف"], veg: ["Vegetarian", "Végétarien", "نباتي (لاكتو)"] };
const NONE: T3 = ["None", "Aucun", "لا يوجد"];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "pantry", name: i18n("Pantry", "Épicerie", "المؤونة"), kind: "bottle" as Kind, pal: PAL.olive },
    { id: newId(), slug: "honey-spreads", name: i18n("Honey & spreads", "Miels & pâtes à tartiner", "العسل والمربيات"), kind: "jar" as Kind, pal: PAL.honey },
    { id: newId(), slug: "snacks", name: i18n("Snacks", "Snacks", "وجبات خفيفة"), kind: "bar" as Kind, pal: PAL.cocoa },
    { id: newId(), slug: "coffee-tea", name: i18n("Coffee & tea", "Café & thé", "القهوة والشاي"), kind: "pouch" as Kind, pal: PAL.coffee },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; origin: T3; weight: string; shelf: T3; diet: string[]; ing: T3; allergens: T3 | null; store: T3; nut: string[]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const COOL: T3 = ["Store in a cool, dry place", "À conserver au sec et au frais", "يُحفظ في مكان بارد وجاف"];
  const products: PD[] = [
    { cat: 0, slug: "extra-virgin-olive-oil", kind: "bottle", pal: PAL.olive, n: ["Extra-virgin olive oil", "Huile d'olive vierge extra", "زيت زيتون بكر ممتاز"], s: ["First cold press, fruity with a peppery finish.", "Première pression à froid, fruitée et poivrée.", "عصرة أولى على البارد بنكهة فاكهية وحدّة خفيفة."], l: ["Cold-extracted within hours of harvest and bottled in dark glass. Use it raw on salads and bread or to finish hot dishes.", "Extraite à froid quelques heures après la récolte et mise en bouteille de verre sombre. À cru sur les salades et le pain ou en finition.", "تُستخلص على البارد بعد ساعات من الحصاد وتُعبّأ في زجاج داكن. تُستخدم نيئة على السلطات والخبز أو لإنهاء الأطباق."], origin: ["Italy", "Italie", "إيطاليا"], weight: "500 ml", shelf: ["18 months", "18 mois", "18 شهراً"], diet: ["vegan", "gf"], ing: ["100% extra-virgin olive oil", "100 % huile d'olive vierge extra", "100٪ زيت زيتون بكر ممتاز"], allergens: null, store: ["Away from light and heat", "À l'abri de la lumière et de la chaleur", "بعيداً عن الضوء والحرارة"], nut: ["824 kcal", "91.6 g", "13.8 g", "0 g", "0 g", "0 g", "0 g", "0 g"], p: 149, cmp: 179, stock: 0, feat: 1, best: 1, v: [["250 ml", 89, 24], ["500 ml", 149, 31], ["1 L", 269, 0]] },
    { cat: 0, slug: "durum-wheat-spaghetti", kind: "pasta", pal: PAL.mustard, n: ["Durum wheat spaghetti", "Spaghetti de blé dur", "معكرونة سباغيتي من القمح الصلب"], s: ["Bronze-cut, holds the sauce, cooks in 9 minutes.", "Tréfilée au bronze, retient la sauce, 9 minutes.", "مقطّعة بالبرونز تحتفظ بالصلصة وتُطهى في 9 دقائق."], l: ["Slow-dried pasta with a rough surface so sauce clings. Al dente in nine minutes.", "Pâtes séchées lentement à la surface rugueuse pour que la sauce accroche. Al dente en neuf minutes.", "معكرونة مجففة ببطء بسطح خشن يلتصق به الصلصة. جاهزة خلال تسع دقائق."], origin: ["Italy", "Italie", "إيطاليا"], weight: "500 g", shelf: ["36 months", "36 mois", "36 شهراً"], diet: ["vegan"], ing: ["Durum wheat semolina, water", "Semoule de blé dur, eau", "سميد القمح الصلب، ماء"], allergens: ["Gluten (wheat)", "Gluten (blé)", "غلوتين (قمح)"], store: COOL, nut: ["359 kcal", "1.5 g", "0.3 g", "72 g", "3.2 g", "3.0 g", "13 g", "0.01 g"], p: 24, cmp: 0, stock: 90, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "basil-pesto", kind: "jar", pal: PAL.leaf, n: ["Fresh basil pesto", "Pesto frais au basilic", "صلصة بيستو الريحان"], s: ["Basil, pine nuts and Parmesan in olive oil.", "Basilic, pignons et parmesan à l'huile d'olive.", "ريحان وصنوبر وبارميزان بزيت الزيتون."], l: ["Stir it through pasta, spread it on toast or spoon it over roast vegetables.", "À mélanger aux pâtes, à tartiner sur du pain grillé ou à déposer sur des légumes rôtis.", "تُخلط مع المعكرونة أو تُدهن على التوست أو تُوضع على الخضار المشوية."], origin: ["Italy", "Italie", "إيطاليا"], weight: "190 g", shelf: ["12 months unopened · 5 days once opened", "12 mois fermé · 5 jours après ouverture", "12 شهراً مغلقاً · 5 أيام بعد الفتح"], diet: ["veg", "gf"], ing: ["Basil 42%, olive oil, pine nuts, Parmesan cheese, salt, garlic", "Basilic 42 %, huile d'olive, pignons, parmesan, sel, ail", "ريحان 42٪، زيت زيتون، صنوبر، جبن بارميزان، ملح، ثوم"], allergens: ["Milk, pine nuts", "Lait, pignons", "حليب، صنوبر"], store: ["Refrigerate after opening", "Réfrigérer après ouverture", "يُبرّد بعد الفتح"], nut: ["462 kcal", "46 g", "8.2 g", "3 g", "1.2 g", "1.8 g", "6 g", "1.4 g"], p: 49, cmp: 0, stock: 54, feat: 1, best: 0, v: [] },
    { cat: 0, slug: "smoked-paprika", kind: "tin", pal: PAL.tomato, n: ["Smoked sweet paprika", "Paprika doux fumé", "بابريكا حلوة مدخنة"], s: ["Oak-smoked and ground in small batches.", "Fumé au chêne et moulu en petits lots.", "مدخنة بخشب البلوط ومطحونة بدفعات صغيرة."], l: ["Deep red, sweet and smoky. A spoonful transforms stews, roast potatoes and eggs.", "Rouge profond, doux et fumé. Une cuillère transforme ragoûts, pommes de terre rôties et œufs.", "أحمر داكن حلو ومدخن. ملعقة واحدة تغيّر اليخنات والبطاطس المشوية والبيض."], origin: ["Spain", "Espagne", "إسبانيا"], weight: "90 g", shelf: ["24 months", "24 mois", "24 شهراً"], diet: ["vegan", "gf"], ing: ["100% smoked paprika", "100 % paprika fumé", "100٪ بابريكا مدخنة"], allergens: null, store: COOL, nut: ["282 kcal", "13 g", "2.1 g", "54 g", "10 g", "35 g", "14 g", "0.07 g"], p: 39, cmp: 0, stock: 62, feat: 0, best: 0, v: [] },
    { cat: 1, slug: "wildflower-honey", kind: "jar", pal: PAL.honey, n: ["Wildflower honey", "Miel de fleurs sauvages", "عسل أزهار برية"], s: ["Raw, unheated and unblended.", "Cru, non chauffé et non assemblé.", "خام غير مسخّن وغير ممزوج."], l: ["Floral and mellow, extracted and jarred by the beekeeper. It may crystallise naturally — warm the jar gently to loosen it.", "Floral et rond, extrait et mis en pot par l'apiculteur. Il peut cristalliser naturellement — réchauffez doucement le pot.", "زهري ولطيف يستخرجه النحّال ويعبّئه بنفسه. قد يتبلور طبيعياً — سخّن المرطبان برفق لإذابته."], origin: ["Portugal", "Portugal", "البرتغال"], weight: "500 g", shelf: ["36 months", "36 mois", "36 شهراً"], diet: ["veg", "gf", "nosugar"], ing: ["100% raw wildflower honey", "100 % miel de fleurs sauvages cru", "100٪ عسل أزهار برية خام"], allergens: null, store: COOL, nut: ["304 kcal", "0 g", "0 g", "82 g", "81 g", "0 g", "0.3 g", "0.01 g"], p: 89, cmp: 109, stock: 0, feat: 1, best: 1, v: [["250 g", 55, 28], ["500 g", 89, 33], ["1 kg", 159, 12]] },
    { cat: 1, slug: "strawberry-jam", kind: "jar", pal: PAL.berry, n: ["Strawberry jam", "Confiture de fraises", "مربى الفراولة"], s: ["70% fruit, cooked in small copper pans.", "70 % de fruits, cuite en petites bassines.", "70٪ فاكهة تُطبخ في أوعية صغيرة."], l: ["Soft-set with whole pieces of fruit and a little lemon. Great on bread, yoghurt and pancakes.", "Texture souple avec des morceaux de fruits et un peu de citron. Parfaite sur pain, yaourt et crêpes.", "قوام طري بقطع فاكهة كاملة وقليل من الليمون. رائعة على الخبز والزبادي والفطائر."], origin: ["France", "France", "فرنسا"], weight: "340 g", shelf: ["24 months", "24 mois", "24 شهراً"], diet: ["vegan", "gf"], ing: ["Strawberries 70%, cane sugar, lemon juice", "Fraises 70 %, sucre de canne, jus de citron", "فراولة 70٪، سكر قصب، عصير ليمون"], allergens: null, store: ["Refrigerate once opened", "Réfrigérer après ouverture", "يُبرّد بعد الفتح"], nut: ["178 kcal", "0.1 g", "0 g", "43 g", "42 g", "1.2 g", "0.5 g", "0.01 g"], p: 45, cmp: 0, stock: 48, feat: 0, best: 0, v: [] },
    { cat: 1, slug: "crunchy-peanut-butter", kind: "jar", pal: PAL.nut, n: ["Crunchy peanut butter", "Beurre de cacahuète croquant", "زبدة الفول السوداني المقرمشة"], s: ["100% roasted peanuts, nothing else.", "100 % cacahuètes grillées, rien d'autre.", "100٪ فول سوداني محمّص دون إضافات."], l: ["Stone-ground from slow-roasted peanuts. The oil may rise — just stir.", "Broyé sur pierre à partir de cacahuètes grillées lentement. L'huile peut remonter — mélangez simplement.", "مطحون بالحجر من فول سوداني محمّص ببطء. قد يطفو الزيت — يكفي أن تحرّكه."], origin: ["USA", "États-Unis", "الولايات المتحدة"], weight: "350 g", shelf: ["12 months", "12 mois", "12 شهراً"], diet: ["vegan", "gf", "nosugar"], ing: ["100% roasted peanuts", "100 % cacahuètes grillées", "100٪ فول سوداني محمّص"], allergens: ["Peanuts", "Arachides", "فول سوداني"], store: COOL, nut: ["614 kcal", "51 g", "9.5 g", "13 g", "5 g", "8 g", "27 g", "0.02 g"], p: 52, cmp: 0, stock: 41, feat: 0, best: 1, v: [] },
    { cat: 2, slug: "roasted-mixed-nuts", kind: "pouch", pal: PAL.nut, n: ["Roasted mixed nuts", "Mélange de noix grillées", "مكسرات محمّصة مشكلة"], s: ["Almonds, cashews and hazelnuts, lightly salted.", "Amandes, noix de cajou et noisettes, légèrement salées.", "لوز وكاجو وبندق بملح خفيف."], l: ["Dry-roasted in small batches with a pinch of sea salt. Resealable pouch.", "Grillées à sec en petits lots avec une pincée de sel marin. Pochette refermable.", "محمّصة جافة بدفعات صغيرة مع رشة ملح بحري. كيس قابل لإعادة الإغلاق."], origin: ["Spain", "Espagne", "إسبانيا"], weight: "400 g", shelf: ["9 months", "9 mois", "9 أشهر"], diet: ["vegan", "gf"], ing: ["Almonds, cashews, hazelnuts, sea salt", "Amandes, noix de cajou, noisettes, sel marin", "لوز، كاجو، بندق، ملح بحري"], allergens: ["Tree nuts", "Fruits à coque", "مكسرات"], store: COOL, nut: ["618 kcal", "53 g", "5.2 g", "14 g", "4 g", "8 g", "20 g", "0.6 g"], p: 99, cmp: 119, stock: 36, feat: 1, best: 1, v: [] },
    { cat: 2, slug: "dark-chocolate-70", kind: "bar", pal: PAL.cocoa, n: ["Dark chocolate bar", "Tablette de chocolat noir", "لوح شوكولاتة داكنة"], s: ["Single-origin cacao, stone-ground.", "Cacao d'origine unique, broyé sur pierre.", "كاكاو من مصدر واحد مطحون بالحجر."], l: ["A smooth bar with notes of red fruit and a clean finish. Three cocoa strengths.", "Une tablette onctueuse aux notes de fruits rouges et à la finale nette. Trois intensités de cacao.", "لوح ناعم بنكهات الفواكه الحمراء ونهاية نقية. بثلاث نسب كاكاو."], origin: ["Ecuador", "Équateur", "الإكوادور"], weight: "100 g", shelf: ["18 months", "18 mois", "18 شهراً"], diet: ["vegan", "gf"], ing: ["Cacao mass, cane sugar, cocoa butter", "Pâte de cacao, sucre de canne, beurre de cacao", "عجينة كاكاو، سكر قصب، زبدة كاكاو"], allergens: ["May contain traces of milk and nuts", "Peut contenir des traces de lait et de fruits à coque", "قد يحتوي على آثار من الحليب والمكسرات"], store: ["Store below 20 °C", "À conserver en dessous de 20 °C", "يُحفظ تحت 20 درجة"], nut: ["566 kcal", "42 g", "25 g", "34 g", "26 g", "10 g", "9 g", "0.02 g"], p: 35, cmp: 0, stock: 0, feat: 1, best: 0, v: [["70% cacao", 35, 40], ["85% cacao", 38, 22], ["70% with sea salt", 38, 0]] },
    { cat: 2, slug: "crunchy-granola", kind: "pouch", pal: PAL.mustard, n: ["Crunchy oat granola", "Granola croustillant à l'avoine", "جرانولا الشوفان المقرمشة"], s: ["Baked with honey, seeds and almonds.", "Cuit au miel, graines et amandes.", "مخبوزة بالعسل والبذور واللوز."], l: ["Big clusters, low in sugar, delicious over yoghurt or straight from the bag.", "De gros clusters peu sucrés, délicieux sur un yaourt ou à même le sachet.", "تكتلات كبيرة قليلة السكر لذيذة مع الزبادي أو مباشرة من الكيس."], origin: ["Germany", "Allemagne", "ألمانيا"], weight: "500 g", shelf: ["9 months", "9 mois", "9 أشهر"], diet: ["veg"], ing: ["Oats 62%, almonds, sunflower seeds, honey, sunflower oil", "Avoine 62 %, amandes, graines de tournesol, miel, huile de tournesol", "شوفان 62٪، لوز، بذور دوّار الشمس، عسل، زيت دوّار الشمس"], allergens: ["Gluten (oats), almonds", "Gluten (avoine), amandes", "غلوتين (شوفان)، لوز"], store: COOL, nut: ["452 kcal", "19 g", "2.6 g", "55 g", "12 g", "8 g", "11 g", "0.05 g"], p: 69, cmp: 0, stock: 33, feat: 1, best: 0, v: [] },
    { cat: 3, slug: "arabica-coffee-beans", kind: "pouch", pal: PAL.coffee, n: ["Arabica coffee beans", "Café en grains arabica", "حبوب قهوة أرابيكا"], s: ["Medium roast, chocolate and caramel notes.", "Torréfaction moyenne, notes de chocolat et de caramel.", "تحميص متوسط بنكهة الشوكولاتة والكراميل."], l: ["Roasted weekly and packed in a valved bag. Suits espresso, filter and moka pot.", "Torréfié chaque semaine et emballé en sachet à valve. Pour espresso, filtre et cafetière italienne.", "يُحمّص أسبوعياً ويُعبّأ في كيس بصمام. مناسب للإسبريسو والفلتر وموكا."], origin: ["Colombia", "Colombie", "كولومبيا"], weight: "250 g", shelf: ["12 months", "12 mois", "12 شهراً"], diet: ["vegan", "gf"], ing: ["100% arabica coffee beans", "100 % grains de café arabica", "100٪ حبوب قهوة أرابيكا"], allergens: null, store: ["Seal after opening, away from light", "Refermer après ouverture, à l'abri de la lumière", "أغلقه بعد الفتح بعيداً عن الضوء"], nut: ["2 kcal", "0 g", "0 g", "0 g", "0 g", "0 g", "0.1 g", "0 g"], p: 79, cmp: 0, stock: 0, feat: 1, best: 1, v: [["250 g", 79, 26], ["1 kg", 249, 14]] },
    { cat: 3, slug: "japanese-green-tea", kind: "tin", pal: PAL.leaf, n: ["Sencha green tea", "Thé vert sencha", "شاي أخضر سنشا"], s: ["Loose leaves, fresh and grassy.", "Feuilles entières, fraîches et végétales.", "أوراق كاملة بنكهة منعشة عشبية."], l: ["Steam-fixed Japanese tea. Steep 1 minute at 75 °C for a sweet, clean cup.", "Thé japonais fixé à la vapeur. Infusez 1 minute à 75 °C pour une tasse douce et nette.", "شاي ياباني مثبّت بالبخار. انقعه دقيقة عند 75 درجة لكوب حلو ونقي."], origin: ["Japan", "Japon", "اليابان"], weight: "100 g", shelf: ["18 months", "18 mois", "18 شهراً"], diet: ["vegan", "gf", "nosugar"], ing: ["100% sencha green tea", "100 % thé vert sencha", "100٪ شاي أخضر سنشا"], allergens: null, store: COOL, nut: ["1 kcal", "0 g", "0 g", "0 g", "0 g", "0 g", "0.2 g", "0 g"], p: 69, cmp: 79, stock: 27, feat: 0, best: 0, v: [] },
  ];
  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.kind, c.pal));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, svg(p.kind, p.pal));
    const specLines = [0, 1, 2].map((li) => {
      const rows = [`${L.origin![li]}: ${p.origin[li]}`, `${L.weight![li]}: ${p.weight}`, `${L.shelf![li]}: ${p.shelf[li]}`, `${L.diet![li]}: ${p.diet.map((d) => D[d]![li]).join(", ")}`, `${L.ing![li]}: ${p.ing[li]}`, `${L.all![li]}: ${(p.allergens ?? NONE)[li]}`, `${L.store![li]}: ${p.store[li]}`];
      NK.forEach((k, n) => rows.push(`${L[k]![li]}: ${p.nut[n]}`));
      return rows.join("\n");
    });
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `PNT-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v.length ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `PNT-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Une huile d'olive vraiment fruitée, on sent la différence sur une simple salade. Bouteille bien protégée."],
    [4, "Karim", "Rabat", 5, "Lovely honey, thick and floral. The jar arrived intact and sealed."],
    [9, "Imane", "Tanger", 5, "القهوة طازجة ورائحتها رائعة، التحميص متوسط كما وصفوا."],
    [7, "Youssef", "Marrakech", 4, "Super mélange de noix, croquant et pas trop salé."],
    [1, "Nadia", "Fès", 5, "Les spaghetti tiennent très bien la cuisson, ma famille a adoré."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "PANTRY10", "percent", 10, 0),
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
  await putSvg(env, "uploads/sample-hero.svg", svg("bottle", PAL.olive));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
