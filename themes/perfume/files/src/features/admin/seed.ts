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

type Kind = "rect" | "round" | "tall" | "square" | "atomizer" | "set";
type Pal = { c1: string; c2: string; liq: string; cap: string };

/** Soft studio tile with a glass flacon, coloured liquid and a cap (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const glass = `fill="#fff" fill-opacity=".3" stroke="#fff" stroke-opacity=".9" stroke-width="3"`;
  const gloss = (x: number, y: number, h: number) => `<rect x="${x}" y="${y}" width="12" height="${h}" rx="6" fill="#fff" opacity=".55"/>`;
  const label = (x: number, y: number, w: number) => `<rect x="${x}" y="${y}" width="${w}" height="64" fill="#fffaf0" fill-opacity=".92"/><rect x="${x + 14}" y="${y + 16}" width="${w - 28}" height="5" fill="${pal.cap}" opacity=".85"/><rect x="${x + 26}" y="${y + 30}" width="${w - 52}" height="3" fill="${pal.cap}" opacity=".5"/><rect x="${x + 34}" y="${y + 42}" width="${w - 68}" height="3" fill="${pal.cap}" opacity=".35"/>`;
  const S: Record<Kind, string> = {
    rect: `<rect x="280" y="296" width="40" height="38" ${glass}/><rect x="215" y="330" width="170" height="240" rx="16" ${glass}/><rect x="228" y="396" width="144" height="161" rx="9" fill="${pal.liq}" opacity=".92"/>${label(255, 440, 90)}${gloss(232, 346, 196)}<rect x="262" y="196" width="76" height="106" rx="8" fill="${pal.cap}"/><rect x="262" y="196" width="76" height="14" rx="6" fill="#fff" opacity=".18"/>`,
    round: `<clipPath id="c"><circle cx="300" cy="446" r="124"/></clipPath><rect x="278" y="296" width="44" height="36" ${glass}/><circle cx="300" cy="446" r="128" ${glass}/><rect x="170" y="408" width="260" height="170" fill="${pal.liq}" opacity=".92" clip-path="url(#c)"/>${label(255, 436, 90)}<path d="M196 410 A112 112 0 0 1 236 350" stroke="#fff" stroke-opacity=".7" stroke-width="12" stroke-linecap="round" fill="none"/><circle cx="300" cy="262" r="46" fill="${pal.cap}"/><ellipse cx="288" cy="248" rx="16" ry="9" fill="#fff" opacity=".25"/>`,
    tall: `<rect x="282" y="270" width="36" height="34" ${glass}/><rect x="244" y="300" width="112" height="272" rx="12" ${glass}/><rect x="254" y="372" width="92" height="190" rx="7" fill="${pal.liq}" opacity=".92"/>${label(252, 430, 96)}${gloss(256, 316, 220)}<rect x="268" y="170" width="64" height="106" rx="6" fill="${pal.cap}"/><rect x="268" y="196" width="64" height="6" fill="#fff" opacity=".35"/>`,
    square: `<rect x="262" y="262" width="76" height="44" ${glass}/><rect x="200" y="316" width="200" height="254" rx="10" ${glass.replace('stroke-width="3"', 'stroke-width="5"')}/><rect x="226" y="350" width="148" height="196" rx="6" fill="${pal.liq}" opacity=".92"/>${label(250, 420, 100)}${gloss(214, 332, 214)}<rect x="244" y="214" width="112" height="58" rx="4" fill="${pal.cap}"/><rect x="244" y="262" width="112" height="8" fill="#fff" opacity=".35"/>`,
    atomizer: `<rect x="250" y="300" width="100" height="272" rx="24" ${glass}/><rect x="260" y="360" width="80" height="202" rx="16" fill="${pal.liq}" opacity=".92"/>${label(252, 440, 96)}${gloss(262, 316, 230)}<rect x="262" y="268" width="76" height="36" rx="6" fill="${pal.cap}" opacity=".9"/><rect x="284" y="214" width="32" height="58" rx="8" fill="${pal.cap}"/><rect x="268" y="186" width="64" height="30" rx="10" fill="${pal.cap}"/>`,
    set: `<g>${[168, 268, 368].map((x, i) => `<rect x="${x + 22}" y="${300 + i * 8}" width="26" height="22" ${glass}/><rect x="${x}" y="${320 + i * 8}" width="70" height="120" rx="10" ${glass}/><rect x="${x + 8}" y="${366 + i * 8}" width="54" height="66" rx="6" fill="${pal.liq}" opacity="${0.95 - i * 0.12}"/><rect x="${x + 16}" y="${252 + i * 8}" width="38" height="56" rx="5" fill="${pal.cap}"/>`).join("")}</g><rect x="130" y="430" width="340" height="140" rx="6" fill="${pal.cap}"/><rect x="130" y="430" width="340" height="22" fill="#fff" opacity=".1"/><rect x="262" y="478" width="76" height="3" fill="#fff" opacity=".6"/><rect x="284" y="492" width="32" height="3" fill="#fff" opacity=".4"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.c1}"/><stop offset="1" stop-color="${pal.c2}"/></linearGradient><radialGradient id="h" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="600" height="750" fill="url(#g)"/><rect width="600" height="750" fill="url(#h)"/><rect y="574" width="600" height="176" fill="#000" opacity=".06"/><ellipse cx="300" cy="580" rx="170" ry="16" fill="#000" opacity=".16"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  citrus: { c1: "#f7ecc0", c2: "#e8d07e", liq: "#f2d052", cap: "#2b2a28" },
  sea: { c1: "#d6e8ee", c2: "#a3c6d3", liq: "#5ea3bd", cap: "#1f2d3a" },
  green: { c1: "#dce8d0", c2: "#aec897", liq: "#86ad63", cap: "#34382c" },
  rose: { c1: "#f6d9da", c2: "#e4a9ae", liq: "#d86b7c", cap: "#6b2a3a" },
  jasmin: { c1: "#f6f1e6", c2: "#e3d9c3", liq: "#efe1ac", cap: "#b58a4e" },
  cedar: { c1: "#dcc7ac", c2: "#ab8866", liq: "#8a5a34", cap: "#1f1612" },
  santal: { c1: "#e8d4c3", c2: "#c49d83", liq: "#b2663f", cap: "#2a1a12" },
  vetiver: { c1: "#d2d6c4", c2: "#9ca483", liq: "#6e7b4e", cap: "#222622" },
  vanilla: { c1: "#f5e3c6", c2: "#e1bc8a", liq: "#e8bd6d", cap: "#5a3a20" },
  caramel: { c1: "#f1d6ba", c2: "#d4a272", liq: "#c47a35", cap: "#3a2414" },
  set: { c1: "#e9deed", c2: "#c7b2d3", liq: "#a47bc0", cap: "#4b1d3f" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
/** Note names, translated once so each fragrance only lists keys. */
const N: Record<string, T3> = {
  bergamot: ["Bergamot", "Bergamote", "برغموت"], lemon: ["Lemon", "Citron", "ليمون"], neroli: ["Neroli", "Néroli", "زهر البرتقال"], greentea: ["Green tea", "Thé vert", "شاي أخضر"],
  whitemusk: ["White musk", "Musc blanc", "مسك أبيض"], cedar: ["Cedar", "Cèdre", "أرز"], seasalt: ["Sea salt", "Sel marin", "ملح البحر"], grapefruit: ["Grapefruit", "Pamplemousse", "جريب فروت"],
  sage: ["Sage", "Sauge", "مريمية"], geranium: ["Geranium", "Géranium", "إبرة الراعي"], driftwood: ["Driftwood", "Bois flotté", "خشب طافٍ"], amber: ["Amber", "Ambre", "عنبر"],
  mint: ["Mint", "Menthe", "نعناع"], jasmine: ["Jasmine", "Jasmin", "ياسمين"], vetiver: ["Vetiver", "Vétiver", "فيتيفر"], lychee: ["Lychee", "Litchi", "ليتشي"],
  pinkpepper: ["Pink pepper", "Poivre rose", "فلفل وردي"], rose: ["Rose", "Rose", "ورد"], peony: ["Peony", "Pivoine", "فاوانيا"], patchouli: ["Patchouli", "Patchouli", "باتشولي"],
  pear: ["Pear", "Poire", "إجاص"], vanilla: ["Vanilla", "Vanille", "فانيليا"], pepper: ["Black pepper", "Poivre noir", "فلفل أسود"], lavender: ["Lavender", "Lavande", "لافندر"],
  tonka: ["Tonka bean", "Fève tonka", "فول التونكا"], nutmeg: ["Nutmeg", "Muscade", "جوزة الطيب"], sandalwood: ["Sandalwood", "Bois de santal", "خشب الصندل"], iris: ["Iris", "Iris", "سوسن"],
  almond: ["Almond", "Amande", "لوز"], caramel: ["Caramel", "Caramel", "كراميل"], mandarin: ["Mandarin", "Mandarine", "يوسفي"],
};
const L: Record<string, T3> = {
  fam: ["Scent family", "Famille olfactive", "العائلة العطرية"], conc: ["Concentration", "Concentration", "التركيز"], who: ["For", "Pour", "للجنسين"],
  top: ["Top notes", "Notes de tête", "النوتات العليا"], heart: ["Heart notes", "Notes de cœur", "نوتات القلب"], base: ["Base notes", "Notes de fond", "نوتات القاعدة"], long: ["Longevity", "Tenue", "الثبات"], inc: ["Contents", "Contenu", "المحتويات"],
};
const FAM: Record<string, T3> = { fresh: ["Fresh citrus", "Frais & agrumes", "منعش حمضي"], floral: ["Floral", "Floral", "زهري"], woody: ["Woody aromatic", "Boisé aromatique", "خشبي عطري"], sweet: ["Sweet gourmand", "Gourmand sucré", "حلو شهي"], aqua: ["Aquatic fresh", "Frais aquatique", "منعش مائي"], set: ["Discovery", "Découverte", "اكتشاف"] };
const CONC: T3[] = [["Eau de parfum", "Eau de parfum", "أو دو بارفان"], ["Eau de toilette", "Eau de toilette", "أو دو تواليت"], ["Cologne", "Cologne", "كولونيا"], ["5 × 10 ml sprays", "5 vaporisateurs de 10 ml", "5 عبوات رذاذ 10 مل"]];
const WHO: T3[] = [["Unisex", "Mixte", "للجنسين"], ["Women", "Femme", "نسائي"], ["Men", "Homme", "رجالي"]];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "fresh-citrus", name: i18n("Fresh & Citrus", "Frais & Agrumes", "منعش وحمضي"), kind: "rect" as Kind, pal: PAL.citrus },
    { id: newId(), slug: "floral", name: i18n("Floral", "Floral", "زهري"), kind: "round" as Kind, pal: PAL.rose },
    { id: newId(), slug: "woody-spicy", name: i18n("Woody & Spicy", "Boisé & Épicé", "خشبي وحار"), kind: "square" as Kind, pal: PAL.cedar },
    { id: newId(), slug: "sweet-gourmand", name: i18n("Sweet & Gourmand", "Sucré & Gourmand", "حلو وشهي"), kind: "atomizer" as Kind, pal: PAL.vanilla },
    { id: newId(), slug: "gift-sets", name: i18n("Gift sets", "Coffrets", "أطقم الهدايا"), kind: "set" as Kind, pal: PAL.set },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; fam: string; conc: number; who: number; notes?: [string[], string[], string[]]; long: T3; inc?: T3; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const SZ = (a: number, b: number, c: number, out = -1): [string, number, number][] => [["30 ml", a, 14], ["50 ml", b, 22], ["100 ml", c, out === 100 ? 0 : 9]];
  const products: PD[] = [
    { cat: 0, slug: "brise-citrus-edt", kind: "rect", pal: PAL.citrus, n: ["Brise Citrus eau de toilette", "Brise Citrus eau de toilette", "بريز سيتروس أو دو تواليت"], s: ["Sparkling bergamot over white musk.", "Bergamote pétillante sur un musc blanc.", "برغموت منعش فوق المسك الأبيض."], l: ["A bright, clean daily scent. Bergamot and lemon open on a heart of neroli and green tea, settling into soft white musk and cedar.", "Un parfum lumineux et net pour chaque jour. Bergamote et citron s'ouvrent sur un cœur de néroli et de thé vert, avant un fond de musc blanc et de cèdre.", "عطر مشرق ونظيف لكل يوم. يفتتح بالبرغموت والليمون على قلب من زهر البرتقال والشاي الأخضر ثم يستقر على المسك الأبيض والأرز."], fam: "fresh", conc: 1, who: 0, notes: [["bergamot", "lemon"], ["neroli", "greentea"], ["whitemusk", "cedar"]], long: ["4–6 h", "4–6 h", "4–6 ساعات"], p: 290, cmp: 0, stock: 0, feat: 1, best: 1, v: SZ(290, 420, 620) },
    { cat: 0, slug: "aqua-marine-homme", kind: "tall", pal: PAL.sea, n: ["Aqua Marine for men", "Aqua Marine pour homme", "أكوا مارين للرجال"], s: ["Sea salt, grapefruit and driftwood.", "Sel marin, pamplemousse et bois flotté.", "ملح البحر والجريب فروت والخشب الطافي."], l: ["An open-air aquatic with a salty freshness and a warm amber trail.", "Un aquatique au grand air, à la fraîcheur saline et au sillage ambré.", "عطر مائي منعش بملوحة البحر وأثر دافئ من العنبر."], fam: "aqua", conc: 1, who: 2, notes: [["seasalt", "grapefruit"], ["sage", "geranium"], ["driftwood", "amber"]], long: ["5–7 h", "5–7 h", "5–7 ساعات"], p: 320, cmp: 390, stock: 0, feat: 1, best: 0, v: SZ(320, 460, 690) },
    { cat: 0, slug: "verde-tea-cologne", kind: "atomizer", pal: PAL.green, n: ["Verde Tea cologne", "Cologne Verde Tea", "كولونيا فيردي تي"], s: ["Mint, green tea and white musk.", "Menthe, thé vert et musc blanc.", "نعناع وشاي أخضر ومسك أبيض."], l: ["A light, tea-led cologne to spray generously. Ideal for summer and for those who prefer something discreet.", "Une cologne légère au thé, à vaporiser généreusement. Idéale en été et pour celles et ceux qui aiment la discrétion.", "كولونيا خفيفة بالشاي ترشّ بسخاء. مناسبة للصيف ولمن يفضّل الهدوء."], fam: "fresh", conc: 2, who: 0, notes: [["mint", "lemon"], ["greentea", "jasmine"], ["whitemusk", "vetiver"]], long: ["2–3 h", "2–3 h", "2–3 ساعات"], p: 210, cmp: 0, stock: 40, feat: 0, best: 0, v: [] },
    { cat: 1, slug: "rose-eternelle-edp", kind: "round", pal: PAL.rose, n: ["Rose Éternelle eau de parfum", "Rose Éternelle eau de parfum", "روز إيتيرنيل أو دو بارفان"], s: ["Fresh-cut rose with lychee sparkle.", "Rose fraîchement coupée et éclat de litchi.", "ورد طازج مع لمعة الليتشي."], l: ["A modern rose: juicy lychee and pink pepper, a velvety heart of rose and peony, and a soft musky base.", "Une rose moderne : litchi juteux et poivre rose, cœur velouté de rose et de pivoine, fond de musc doux.", "وردة عصرية: ليتشي طري وفلفل وردي وقلب مخملي من الورد والفاوانيا وقاعدة مسكية ناعمة."], fam: "floral", conc: 0, who: 1, notes: [["lychee", "pinkpepper"], ["rose", "peony"], ["whitemusk", "patchouli"]], long: ["7–9 h", "7–9 h", "7–9 ساعات"], p: 420, cmp: 520, stock: 0, feat: 1, best: 1, v: SZ(420, 640, 940, 100) },
    { cat: 1, slug: "jasmin-blanc-edp", kind: "tall", pal: PAL.jasmin, n: ["Jasmin Blanc eau de parfum", "Jasmin Blanc eau de parfum", "ياسمين بلان أو دو بارفان"], s: ["White jasmine, pear and soft vanilla.", "Jasmin blanc, poire et vanille douce.", "ياسمين أبيض وإجاص وفانيليا ناعمة."], l: ["Creamy white florals wrapped in juicy pear, drying down to a warm vanilla musk.", "Des fleurs blanches crémeuses enveloppées de poire juteuse, avec un fond de musc vanillé.", "أزهار بيضاء كريمية تحيط بها ثمرة الإجاص وتنتهي بمسك فانيليا دافئ."], fam: "floral", conc: 0, who: 1, notes: [["pear", "bergamot"], ["jasmine", "iris"], ["vanilla", "whitemusk"]], long: ["6–8 h", "6–8 h", "6–8 ساعات"], p: 440, cmp: 0, stock: 0, feat: 1, best: 0, v: SZ(440, 660, 980) },
    { cat: 1, slug: "pivoine-legere-edt", kind: "rect", pal: PAL.rose, n: ["Pivoine Légère eau de toilette", "Pivoine Légère eau de toilette", "بيفوان ليجير أو دو تواليت"], s: ["Peony, mandarin and a hint of musk.", "Pivoine, mandarine et un soupçon de musc.", "فاوانيا ويوسفي ولمسة مسك."], l: ["A weightless floral for office and daytime. Soft, clean and easy to wear.", "Un floral aérien pour le bureau et la journée. Doux, net et facile à porter.", "عطر زهري خفيف للعمل والنهار. ناعم ونظيف وسهل الارتداء."], fam: "floral", conc: 1, who: 1, notes: [["mandarin", "pear"], ["peony", "jasmine"], ["whitemusk", "cedar"]], long: ["4–5 h", "4–5 h", "4–5 ساعات"], p: 310, cmp: 0, stock: 0, feat: 0, best: 0, v: SZ(310, 450, 660) },
    { cat: 2, slug: "cedre-noir-edp", kind: "square", pal: PAL.cedar, n: ["Cèdre Noir eau de parfum", "Cèdre Noir eau de parfum", "سيدر نوار أو دو بارفان"], s: ["Cedar, lavender and black pepper.", "Cèdre, lavande et poivre noir.", "أرز ولافندر وفلفل أسود."], l: ["A confident woody-aromatic: peppery bergamot, lavender and cedar over vetiver and tonka bean.", "Un boisé aromatique affirmé : bergamote poivrée, lavande et cèdre sur un fond de vétiver et de fève tonka.", "عطر خشبي عطري واثق: برغموت بالفلفل ولافندر وأرز فوق الفيتيفر والتونكا."], fam: "woody", conc: 0, who: 2, notes: [["pepper", "bergamot"], ["cedar", "lavender"], ["vetiver", "tonka"]], long: ["8–10 h", "8–10 h", "8–10 ساعات"], p: 460, cmp: 560, stock: 0, feat: 1, best: 1, v: SZ(460, 690, 1020) },
    { cat: 2, slug: "santal-velours-edp", kind: "square", pal: PAL.santal, n: ["Santal Velours eau de parfum", "Santal Velours eau de parfum", "سانتال فيلور أو دو بارفان"], s: ["Creamy sandalwood, iris and amber.", "Santal crémeux, iris et ambre.", "خشب الصندل الكريمي والسوسن والعنبر."], l: ["A smooth, enveloping wood: nutmeg and pear open on sandalwood and iris, resting on amber and tonka.", "Un bois enveloppant et soyeux : muscade et poire s'ouvrent sur le santal et l'iris, reposant sur l'ambre et la tonka.", "خشب ناعم يحتضنك: جوزة الطيب والإجاص يفتحان على الصندل والسوسن ويستقران على العنبر والتونكا."], fam: "woody", conc: 0, who: 0, notes: [["nutmeg", "pear"], ["sandalwood", "iris"], ["amber", "tonka"]], long: ["8–10 h", "8–10 h", "8–10 ساعات"], p: 480, cmp: 0, stock: 0, feat: 0, best: 1, v: SZ(480, 720, 1060) },
    { cat: 2, slug: "vetiver-nocturne-edt", kind: "tall", pal: PAL.vetiver, n: ["Vétiver Nocturne eau de toilette", "Vétiver Nocturne eau de toilette", "فيتيفر نوكتورن أو دو تواليت"], s: ["Smoky vetiver with grapefruit.", "Vétiver fumé et pamplemousse.", "فيتيفر مدخّن مع الجريب فروت."], l: ["Dry, green and slightly smoky. Grapefruit and pepper lift a vetiver heart over patchouli and cedar.", "Sec, vert et légèrement fumé. Pamplemousse et poivre relèvent un cœur de vétiver sur le patchouli et le cèdre.", "جاف وأخضر ومدخّن قليلاً. الجريب فروت والفلفل يرفعان قلب الفيتيفر فوق الباتشولي والأرز."], fam: "woody", conc: 1, who: 2, notes: [["grapefruit", "pepper"], ["vetiver", "geranium"], ["patchouli", "cedar"]], long: ["5–7 h", "5–7 h", "5–7 ساعات"], p: 340, cmp: 0, stock: 0, feat: 0, best: 0, v: SZ(340, 490, 720) },
    { cat: 3, slug: "vanille-praline-edp", kind: "atomizer", pal: PAL.vanilla, n: ["Vanille Praline eau de parfum", "Vanille Praline eau de parfum", "فانيل برالين أو دو بارفان"], s: ["Toasted almond, vanilla and tonka.", "Amande grillée, vanille et tonka.", "لوز محمّص وفانيليا وتونكا."], l: ["A warm gourmand with a roasted almond top, a creamy vanilla heart and a tonka-musk base.", "Un gourmand chaleureux : amande grillée en tête, vanille crémeuse au cœur, fond de tonka et de musc.", "عطر شهي دافئ بلوز محمّص في الافتتاح وفانيليا كريمية في القلب وقاعدة من التونكا والمسك."], fam: "sweet", conc: 0, who: 1, notes: [["pear", "almond"], ["vanilla", "jasmine"], ["tonka", "whitemusk"]], long: ["7–9 h", "7–9 h", "7–9 ساعات"], p: 430, cmp: 520, stock: 0, feat: 1, best: 1, v: SZ(430, 650, 960) },
    { cat: 3, slug: "caramel-musc-edp", kind: "round", pal: PAL.caramel, n: ["Caramel Musc eau de parfum", "Caramel Musc eau de parfum", "كراميل مسك أو دو بارفان"], s: ["Salted caramel on a bed of musk.", "Caramel salé sur un lit de musc.", "كراميل مملّح على قاعدة من المسك."], l: ["Playful and cosy: mandarin and pink pepper, a caramel-rose heart and a long, skin-like musk.", "Joueur et enveloppant : mandarine et poivre rose, cœur caramel-rose et musc longue tenue façon peau.", "مرح ومريح: يوسفي وفلفل وردي وقلب من الكراميل والورد ومسك يلتصق بالبشرة طويلاً."], fam: "sweet", conc: 0, who: 1, notes: [["mandarin", "pinkpepper"], ["caramel", "rose"], ["whitemusk", "tonka"]], long: ["6–8 h", "6–8 h", "6–8 ساعات"], p: 410, cmp: 0, stock: 0, feat: 0, best: 0, v: SZ(410, 620, 910) },
    { cat: 4, slug: "discovery-set-5", kind: "set", pal: PAL.set, n: ["Discovery set — 5 × 10 ml", "Coffret découverte — 5 × 10 ml", "طقم الاكتشاف — 5 × 10 مل"], s: ["Five bestsellers to try before you choose.", "Cinq best-sellers à essayer avant de choisir.", "خمسة عطور الأكثر مبيعاً لتجربها قبل أن تختار."], l: ["One 10 ml spray each of our five most loved fragrances, in a gift box. Find your signature before committing to a full bottle.", "Un vaporisateur de 10 ml de nos cinq parfums préférés, dans un coffret cadeau. Trouvez votre signature avant d'opter pour un grand flacon.", "رذاذ 10 مل من كل عطر من عطورنا الخمسة المفضلة في علبة هدية. اعثر على توقيعك قبل أن تختار الزجاجة الكبيرة."], fam: "set", conc: 3, who: 0, long: ["—", "—", "—"], inc: ["Rose Éternelle, Cèdre Noir, Vanille Praline, Brise Citrus, Santal Velours", "Rose Éternelle, Cèdre Noir, Vanille Praline, Brise Citrus, Santal Velours", "روز إيتيرنيل، سيدر نوار، فانيل برالين، بريز سيتروس، سانتال فيلور"], p: 380, cmp: 450, stock: 26, feat: 1, best: 1, v: [] },
    { cat: 4, slug: "travel-trio-3x20", kind: "set", pal: PAL.set, n: ["Travel trio — 3 × 20 ml", "Trio de voyage — 3 × 20 ml", "ثلاثي السفر — 3 × 20 مل"], s: ["Three pocket sprays in a pouch.", "Trois vaporisateurs de poche dans une pochette.", "ثلاثة بخاخات صغيرة في حقيبة."], l: ["Pick-and-go: Brise Citrus, Rose Éternelle and Cèdre Noir in leak-proof 20 ml sprays.", "Prêt à partir : Brise Citrus, Rose Éternelle et Cèdre Noir en vaporisateurs de 20 ml anti-fuite.", "جاهز للسفر: بريز سيتروس وروز إيتيرنيل وسيدر نوار في بخاخات 20 مل محكمة."], fam: "set", conc: 0, who: 0, long: ["—", "—", "—"], inc: ["Brise Citrus, Rose Éternelle, Cèdre Noir", "Brise Citrus, Rose Éternelle, Cèdre Noir", "بريز سيتروس، روز إيتيرنيل، سيدر نوار"], p: 340, cmp: 0, stock: 33, feat: 0, best: 0, v: [] },
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
      const rows = [`${L.fam![li]}: ${FAM[p.fam]![li]}`, `${L.conc![li]}: ${CONC[p.conc]![li]}`, `${L.who![li]}: ${WHO[p.who]![li]}`];
      if (p.notes) (["top", "heart", "base"] as const).forEach((k, t) => rows.push(`${L[k]![li]}: ${p.notes![t]!.map((n) => N[n]![li]).join(", ")}`));
      if (p.inc) rows.push(`${L.inc![li]}: ${p.inc[li]}`);
      if (p.long[0] !== "—") rows.push(`${L.long![li]}: ${p.long[li]}`);
      return rows.join("\n");
    });
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `ESS-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v.length ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Size: name }), `ESS-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [3, "Yasmine", "Casablanca", 5, "Une rose très élégante, pas du tout lourde. Le flacon était scellé et je l'ai ouvert devant le livreur."],
    [6, "Mehdi", "Rabat", 5, "Cedar and pepper, lasts all day at the office. Compliments every time."],
    [9, "Nadia", "Tanger", 5, "رائحة الفانيليا دافئة وثابتة، والتغليف كان أنيقاً جداً."],
    [0, "Sofia", "Marrakech", 4, "Fraîche et propre, parfaite pour l'été. J'aurais aimé une tenue un peu plus longue."],
    [11, "Othmane", "Fès", 5, "The discovery set helped me choose — ended up ordering the Santal full size."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "ESSENCE10", "percent", 10, 0),
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
  await putSvg(env, "uploads/sample-hero.svg", svg("round", PAL.rose));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
