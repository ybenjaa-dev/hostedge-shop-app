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

type Kind = "ring" | "twist" | "pearl" | "chain" | "hoops" | "drops" | "studs" | "tennis" | "cuff" | "watch" | "chrono" | "box";
type Pal = { c1: string; c2: string; metal: "gold" | "silver" | "rose"; accent: string };

const METAL = {
  gold: ["#fff1c1", "#d4af37", "#8d6b1d"],
  silver: ["#ffffff", "#c3c6cc", "#7d838c"],
  rose: ["#fbe3da", "#d3a193", "#8e5a4c"],
};

/** Boutique shot: warm studio backdrop, soft pedestal shadow and a metallic piece with a gradient finish (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const [m1, m2, m3] = METAL[pal.metal];
  const g = `fill="url(#m)"`;
  const st = `fill="none" stroke="url(#m)"`;
  const gem = (x: number, y: number, r: number) => `<path d="M${x} ${y - r} L${x + r} ${y} L${x} ${y + r * 1.15} L${x - r} ${y} Z" fill="${pal.accent}" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="M${x - r} ${y} H${x + r} M${x} ${y - r} L${x - r * 0.4} ${y} L${x} ${y + r * 1.15} L${x + r * 0.4} ${y} Z" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" fill="none"/>`;
  const S: Record<Kind, string> = {
    ring: `<ellipse cx="300" cy="470" rx="124" ry="124" ${st} stroke-width="30"/><ellipse cx="300" cy="470" rx="124" ry="124" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="60 400" stroke-dashoffset="40"/><path d="M262 360 L338 360 L318 330 L282 330 Z" ${g}/>${gem(300, 318, 34)}`,
    twist: `<ellipse cx="300" cy="460" rx="130" ry="130" ${st} stroke-width="26"/><path d="M175 430 C 215 410 235 450 275 430 C 315 410 335 450 375 430 C 405 416 420 430 428 440" stroke="${m3}" stroke-opacity=".55" stroke-width="5" fill="none" stroke-linecap="round" transform="rotate(-8 300 430)"/><ellipse cx="300" cy="460" rx="130" ry="130" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-dasharray="70 420" stroke-dashoffset="20"/>`,
    pearl: `<path d="M140 190 C 140 420 230 480 300 480 C 370 480 460 420 460 190" ${st} stroke-width="5"/><circle cx="300" cy="500" r="46" fill="#fbf7f0" stroke="#e6dccb" stroke-width="3"/><ellipse cx="286" cy="486" rx="14" ry="9" fill="#fff" opacity=".9"/><rect x="288" y="446" width="24" height="12" rx="4" ${g}/>`,
    chain: `<path d="M150 190 C 160 400 240 440 300 440 C 360 440 440 400 450 190" ${st} stroke-width="6" stroke-dasharray="14 6"/><path d="M180 190 C 190 460 250 520 300 520 C 350 520 410 460 420 190" ${st} stroke-width="6" stroke-dasharray="3 9" stroke-linecap="round"/><path d="M300 520 l-16 22 l16 22 l16 -22 z" ${g}/>`,
    hoops: `<circle cx="226" cy="420" r="92" ${st} stroke-width="16"/><circle cx="374" cy="420" r="92" ${st} stroke-width="16"/><circle cx="226" cy="322" r="8" ${g}/><circle cx="374" cy="322" r="8" ${g}/><path d="M160 360 A92 92 0 0 1 200 335" stroke="#fff" stroke-opacity=".6" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    drops: [[226], [374]].map(([x]) => `<circle cx="${x}" cy="290" r="14" ${g}/><path d="M${x} 304 V350" stroke="${m2}" stroke-width="4"/><circle cx="${x}" cy="414" r="60" fill="#fbf7f0" stroke="#e6dccb" stroke-width="3"/><ellipse cx="${(x as number) - 18}" cy="394" rx="16" ry="10" fill="#fff" opacity=".9"/>`).join(""),
    studs: [[200, 360], [400, 360], [300, 470], [220, 510], [380, 510]].map(([x, y], i) => i < 4 ? `<circle cx="${x}" cy="${y}" r="38" ${g}/><circle cx="${x}" cy="${y}" r="20" fill="${i % 2 ? pal.accent : "#fff"}" fill-opacity=".85"/>` : `<circle cx="${x}" cy="${y}" r="38" ${g}/><circle cx="${x}" cy="${y}" r="20" fill="#fbf7f0"/>`).join(""),
    tennis: `<ellipse cx="300" cy="450" rx="170" ry="120" ${st} stroke-width="30"/><g fill="#fff" stroke="${m2}" stroke-width="2">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<circle cx="${300 + 170 * Math.cos(a)}" cy="${450 + 120 * Math.sin(a)}" r="10"/>`; }).join("")}</g>`,
    cuff: `<path d="M170 380 C 170 320 430 320 430 380 L 450 520 C 450 570 150 570 150 520 Z" ${g}/><path d="M170 380 C 170 330 430 330 430 380" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="5"/><path d="M180 470 C 240 500 360 500 420 470" stroke="${m3}" stroke-opacity=".5" stroke-width="4" fill="none"/>`,
    watch: `<rect x="262" y="140" width="76" height="130" rx="14" fill="#2b2622"/><rect x="262" y="480" width="76" height="130" rx="14" fill="#2b2622"/><circle cx="300" cy="375" r="118" ${g}/><circle cx="300" cy="375" r="98" fill="#fbf7f0"/><g stroke="#2b2622" stroke-width="4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${300 + 86 * Math.sin(a)} ${375 - 86 * Math.cos(a)} L${300 + 76 * Math.sin(a)} ${375 - 76 * Math.cos(a)}"/>`; }).join("")}</g><path d="M300 375 V312" stroke="#2b2622" stroke-width="6" stroke-linecap="round"/><path d="M300 375 L342 392" stroke="#2b2622" stroke-width="5" stroke-linecap="round"/><circle cx="300" cy="375" r="6" fill="${m3}"/><rect x="414" y="368" width="14" height="14" rx="3" ${g}/>`,
    chrono: `<rect x="258" y="130" width="84" height="150" rx="10" ${g}/><rect x="258" y="470" width="84" height="150" rx="10" ${g}/><circle cx="300" cy="375" r="128" ${g}/><circle cx="300" cy="375" r="106" fill="#1b2230"/><circle cx="300" cy="320" r="26" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><circle cx="256" cy="380" r="24" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><circle cx="344" cy="380" r="24" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/><g stroke="${m1}" stroke-width="4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${300 + 98 * Math.sin(a)} ${375 - 98 * Math.cos(a)} L${300 + 88 * Math.sin(a)} ${375 - 88 * Math.cos(a)}"/>`; }).join("")}</g><path d="M300 375 L320 330" stroke="${m1}" stroke-width="6" stroke-linecap="round"/><path d="M300 375 L270 410" stroke="${m1}" stroke-width="5" stroke-linecap="round"/><circle cx="300" cy="375" r="7" fill="${pal.accent}"/><rect x="430" y="340" width="18" height="16" rx="3" ${g}/><rect x="430" y="394" width="18" height="16" rx="3" ${g}/>`,
    box: `<rect x="150" y="400" width="300" height="170" rx="10" fill="${pal.accent}"/><path d="M150 400 L170 340 H430 L450 400 Z" fill="${pal.accent}" opacity=".85"/><rect x="150" y="400" width="300" height="14" ${g}/><rect x="284" y="414" width="32" height="156" fill="${m2}" opacity=".7"/><ellipse cx="300" cy="340" rx="70" ry="14" ${g}/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.c1}"/><stop offset="1" stop-color="${pal.c2}"/></linearGradient><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m1}"/><stop offset=".5" stop-color="${m2}"/><stop offset="1" stop-color="${m3}"/></linearGradient><radialGradient id="h" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="600" height="750" fill="url(#bg)"/><rect width="600" height="750" fill="url(#h)"/><ellipse cx="300" cy="618" rx="190" ry="14" fill="#000" opacity=".12"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  sand: { c1: "#f4eee6", c2: "#e4d9c8", metal: "gold", accent: "#9fb7d6" },
  blush: { c1: "#f6e9e6", c2: "#e8cfc9", metal: "rose", accent: "#e8a4b5" },
  stone: { c1: "#eceff1", c2: "#d3d9de", metal: "silver", accent: "#7fb3d5" },
  night: { c1: "#2c3036", c2: "#14171b", metal: "gold", accent: "#d6c9a8" },
  olive: { c1: "#e6e8dc", c2: "#c9cdb6", metal: "gold", accent: "#4d7a5b" },
  ink: { c1: "#e9e6f2", c2: "#cbc5e0", metal: "silver", accent: "#6b5bb5" },
  wine: { c1: "#f1dfe0", c2: "#dcb9bd", metal: "rose", accent: "#7a1f35" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  mat: ["Material", "Matière", "المادة"], stone: ["Stone", "Pierre", "الحجر"], weight: ["Weight", "Poids", "الوزن"], dim: ["Dimensions", "Dimensions", "الأبعاد"], clasp: ["Clasp", "Fermoir", "القفل"], case: ["Case", "Boîtier", "العلبة"], move: ["Movement", "Mouvement", "الحركة"], water: ["Water resistance", "Étanchéité", "مقاومة الماء"], glass: ["Glass", "Verre", "الزجاج"], care: ["Care", "Entretien", "العناية"],
};
const V = {
  gold: ["18k gold plated brass", "Laiton plaqué or 18 carats", "نحاس مطلي بالذهب عيار 18"] as T3,
  silver: ["925 sterling silver", "Argent 925", "فضة إسترليني 925"] as T3,
  steel: ["316L stainless steel", "Acier inoxydable 316L", "ستانلس ستيل 316L"] as T3,
  cz: ["Cubic zirconia", "Zircone cubique", "زركون مكعب"] as T3,
  pearl: ["Freshwater pearl", "Perle d'eau douce", "لؤلؤ مياه عذبة"] as T3,
  none: ["None", "Aucune", "لا يوجد"] as T3,
  care: ["Keep dry, wipe with a soft cloth", "Garder au sec, essuyer avec un chiffon doux", "أبقِها جافة وامسحها بقطعة قماش ناعمة"] as T3,
  quartz: ["Japanese quartz", "Quartz japonais", "كوارتز ياباني"] as T3,
  sapphire: ["Sapphire-coated mineral", "Minéral traité saphir", "معدني بطلاء السفير"] as T3,
};

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "rings", name: i18n("Rings", "Bagues", "الخواتم"), kind: "ring" as Kind, pal: PAL.sand },
    { id: newId(), slug: "necklaces", name: i18n("Necklaces", "Colliers", "القلائد"), kind: "pearl" as Kind, pal: PAL.blush },
    { id: newId(), slug: "earrings", name: i18n("Earrings", "Boucles d'oreilles", "الأقراط"), kind: "hoops" as Kind, pal: PAL.stone },
    { id: newId(), slug: "bracelets", name: i18n("Bracelets", "Bracelets", "الأساور"), kind: "tennis" as Kind, pal: PAL.wine },
    { id: newId(), slug: "watches", name: i18n("Watches", "Montres", "الساعات"), kind: "watch" as Kind, pal: PAL.night },
  ];
  type Opt = { metal?: string[]; second?: [string, string[]]; strap?: string[] };
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; specs: [string, T3 | string][]; p: number; cmp: number; stock: number; feat: number; best: number; opts: Opt | null; extra?: Record<string, number> };
  const METALS: Record<string, T3> = { Gold: ["Gold", "Or", "ذهبي"], Silver: ["Silver", "Argent", "فضي"], "Rose gold": ["Rose gold", "Or rose", "ذهبي وردي"] };
  const products: PD[] = [
    { cat: 0, slug: "solitaire-ring", kind: "ring", pal: PAL.sand, n: ["Solitaire ring", "Bague solitaire", "خاتم سوليتير"], s: ["A single stone on a slim band.", "Une seule pierre sur un anneau fin.", "حجر واحد على حلقة رفيعة."], l: ["A timeless solitaire with a 6 mm brilliant-cut zirconia in a four-claw setting. Slim 2 mm band that stacks well.", "Un solitaire intemporel avec un zircon taille brillant de 6 mm serti griffes. Anneau fin de 2 mm facile à superposer.", "سوليتير خالد بحجر زركون مقطوع بريليان 6 مم بتثبيت رباعي. حلقة رفيعة 2 مم يسهل تكديسها."], specs: [["mat", V.gold], ["stone", V.cz], ["dim", "Band 2 mm · Stone 6 mm"], ["weight", "2.1 g"], ["care", V.care]], p: 349, cmp: 429, stock: 0, feat: 1, best: 1, opts: { metal: ["Gold", "Silver"], second: ["Size", ["50", "52", "54", "56"]] } },
    { cat: 0, slug: "twisted-band-ring", kind: "twist", pal: PAL.blush, n: ["Twisted band ring", "Bague jonc torsadé", "خاتم ملتوي"], s: ["Rope-twist detail, polished finish.", "Détail corde torsadée, finition polie.", "تفصيلة حبل ملتوي بلمعة مصقولة."], l: ["A bold, smooth-edged band with a rope texture. Comfortable to wear every day.", "Un anneau affirmé aux bords lisses et à la texture cordée. Confortable au quotidien.", "حلقة بارزة بحواف ناعمة وملمس حبل. مريحة للارتداء اليومي."], specs: [["mat", V.silver], ["dim", "Band 4 mm"], ["weight", "3.4 g"], ["care", V.care]], p: 279, cmp: 0, stock: 0, feat: 1, best: 0, opts: { metal: ["Silver", "Rose gold"], second: ["Size", ["52", "54", "56", "58"]] } },
    { cat: 1, slug: "pearl-pendant-necklace", kind: "pearl", pal: PAL.blush, n: ["Pearl pendant necklace", "Collier pendentif perle", "قلادة بتعليقة لؤلؤ"], s: ["A single freshwater pearl on a fine chain.", "Une perle d'eau douce sur une chaîne fine.", "لؤلؤة مياه عذبة على سلسلة رفيعة."], l: ["A pearl pendant that goes with everything. Adjustable chain with a lobster clasp.", "Un pendentif perle qui va avec tout. Chaîne ajustable avec fermoir mousqueton.", "تعليقة لؤلؤ تناسب كل شيء. سلسلة قابلة للتعديل بقفل كلاب."], specs: [["mat", V.gold], ["stone", V.pearl], ["dim", "Pearl Ø 9 mm"], ["clasp", ["Lobster", "Mousqueton", "كلاب"]], ["care", V.care]], p: 299, cmp: 369, stock: 0, feat: 1, best: 1, opts: { metal: ["Gold", "Silver"], second: ["Length", ["40 cm", "45 cm"]] } },
    { cat: 1, slug: "layered-chain-necklace", kind: "chain", pal: PAL.sand, n: ["Layered chain necklace", "Collier chaînes superposées", "قلادة سلاسل متعددة الطبقات"], s: ["Two chains, one clasp, ready to wear.", "Deux chaînes, un fermoir, prêt à porter.", "سلسلتان بقفل واحد وجاهزة للارتداء."], l: ["A fine chain and a dotted chain joined for an effortless layered look.", "Une chaîne fine et une chaîne perlée réunies pour un effet superposé sans effort.", "سلسلة رفيعة وأخرى منقّطة متصلتان لمظهر متعدد الطبقات بلا عناء."], specs: [["mat", V.steel], ["dim", "40 + 45 cm"], ["weight", "5.2 g"], ["clasp", ["Lobster", "Mousqueton", "كلاب"]], ["care", V.care]], p: 249, cmp: 0, stock: 0, feat: 0, best: 0, opts: { metal: ["Gold", "Silver", "Rose gold"] } },
    { cat: 2, slug: "classic-hoop-earrings", kind: "hoops", pal: PAL.stone, n: ["Classic hoop earrings 30 mm", "Créoles classiques 30 mm", "أقراط حلقية كلاسيكية 30 مم"], s: ["Lightweight hoops with a smooth shine.", "Créoles légères au brillant lisse.", "أقراط خفيفة بلمعة ناعمة."], l: ["Hollow construction keeps them feather-light. Hinged closure, hypoallergenic posts.", "Construction creuse très légère. Fermeture à charnière, tiges hypoallergéniques.", "تصميم مجوف شديد الخفة. إغلاق بمفصلة وأعمدة مضادة للحساسية."], specs: [["mat", V.silver], ["dim", "Ø 30 mm · Width 3 mm"], ["weight", "2.6 g"], ["care", V.care]], p: 229, cmp: 279, stock: 0, feat: 1, best: 1, opts: { metal: ["Gold", "Silver", "Rose gold"] } },
    { cat: 2, slug: "pearl-drop-earrings", kind: "drops", pal: PAL.blush, n: ["Pearl drop earrings", "Boucles d'oreilles perles", "أقراط لؤلؤ متدلية"], s: ["Round pearls on slim posts.", "Perles rondes sur tiges fines.", "لآلئ مستديرة على أعمدة رفيعة."], l: ["Cultured freshwater pearls that catch the light. Hypoallergenic posts, butterfly backs.", "Perles d'eau douce de culture qui captent la lumière. Tiges hypoallergéniques, fermoirs papillon.", "لآلئ مياه عذبة مستزرعة تلتقط الضوء. أعمدة مضادة للحساسية وإغلاق فراشة."], specs: [["mat", V.gold], ["stone", V.pearl], ["dim", "Pearl Ø 10 mm · Drop 35 mm"], ["care", V.care]], p: 259, cmp: 0, stock: 36, feat: 1, best: 0, opts: null },
    { cat: 2, slug: "stud-set-5-pairs", kind: "studs", pal: PAL.ink, n: ["Stud earring set, 5 pairs", "Set de 5 paires de puces", "طقم أقراط ستاد، 5 أزواج"], s: ["Five everyday studs in a gift tray.", "Cinq puces du quotidien dans un plateau cadeau.", "خمسة أزواج يومية في صينية هدية."], l: ["Plain, zirconia and pearl studs to mix and match. Each pair has hypoallergenic posts.", "Puces lisses, zircone et perle à associer librement. Chaque paire a des tiges hypoallergéniques.", "أقراط سادة وزركون ولؤلؤ للتنسيق الحر. كل زوج بأعمدة مضادة للحساسية."], specs: [["mat", V.silver], ["stone", V.cz], ["dim", "5–8 mm"], ["care", V.care]], p: 199, cmp: 249, stock: 45, feat: 0, best: 1, opts: null },
    { cat: 3, slug: "tennis-bracelet", kind: "tennis", pal: PAL.wine, n: ["Tennis bracelet", "Bracelet rivière", "سوار تنس"], s: ["A line of 3 mm stones that catches the light.", "Une ligne de pierres de 3 mm qui capte la lumière.", "صف من الأحجار 3 مم يلتقط الضوء."], l: ["Seventy-two hand-set zirconia stones on a flexible band. Secure box clasp with a safety catch.", "Soixante-douze zircons sertis à la main sur un bracelet souple. Fermoir à cliquet sécurisé.", "اثنان وسبعون حجر زركون مثبّتة يدوياً على سوار مرن. قفل صندوقي آمن."], specs: [["mat", V.silver], ["stone", V.cz], ["dim", "Length 17 cm · Stone 3 mm"], ["clasp", ["Box clasp with safety catch", "Fermoir à cliquet de sécurité", "قفل صندوقي بمشبك أمان"]], ["care", V.care]], p: 449, cmp: 549, stock: 0, feat: 1, best: 1, opts: { metal: ["Gold", "Silver"] } },
    { cat: 3, slug: "open-cuff-bangle", kind: "cuff", pal: PAL.sand, n: ["Open cuff bangle", "Jonc ouvert", "سوار مفتوح"], s: ["A broad, adjustable cuff with a mirror shine.", "Un large jonc ajustable au brillant miroir.", "سوار عريض قابل للتعديل بلمعة مرآة."], l: ["A statement cuff that slips on and adjusts gently for a snug fit.", "Un jonc statement qui s'enfile facilement et s'ajuste doucement.", "سوار لافت يُرتدى بسهولة ويُعدَّل برفق ليلائم المعصم."], specs: [["mat", V.steel], ["dim", "Width 18 mm · Opening adjustable"], ["weight", "14 g"], ["care", V.care]], p: 219, cmp: 0, stock: 0, feat: 0, best: 0, opts: { metal: ["Gold", "Silver", "Rose gold"] } },
    { cat: 4, slug: "minimal-quartz-watch-36", kind: "watch", pal: PAL.night, n: ["Minimal quartz watch 36 mm", "Montre quartz minimaliste 36 mm", "ساعة كوارتز بسيطة 36 مم"], s: ["A clean dial on a leather strap.", "Un cadran épuré sur bracelet cuir.", "مينا نظيف على سوار جلدي."], l: ["Slim 7 mm case with a domed sapphire-coated crystal and a Japanese quartz movement. Quick-release strap.", "Boîtier fin de 7 mm avec verre bombé traité saphir et mouvement quartz japonais. Bracelet à démontage rapide.", "علبة نحيفة 7 مم بزجاج مقبّب بطلاء السفير وحركة كوارتز يابانية. سوار سريع التبديل."], specs: [["case", "36 mm · 7 mm thick"], ["move", V.quartz], ["glass", V.sapphire], ["water", "3 ATM"], ["mat", V.steel]], p: 699, cmp: 849, stock: 0, feat: 1, best: 1, opts: { strap: ["Black leather", "Tan leather", "Steel mesh"] } },
    { cat: 4, slug: "chronograph-watch-42", kind: "chrono", pal: PAL.olive, n: ["Chronograph watch 42 mm", "Montre chronographe 42 mm", "ساعة كرونوغراف 42 مم"], s: ["Three sub-dials and a date window.", "Trois compteurs et un guichet date.", "ثلاثة عدادات ونافذة تاريخ."], l: ["A sporty-elegant chronograph with luminous hands, date window and a screw-down crown.", "Un chronographe sport-chic aux aiguilles luminescentes, avec guichet date et couronne vissée.", "كرونوغراف رياضي أنيق بعقارب مضيئة ونافذة تاريخ وتاج لولبي."], specs: [["case", "42 mm · 12 mm thick"], ["move", V.quartz], ["glass", V.sapphire], ["water", "10 ATM"], ["mat", V.steel]], p: 1190, cmp: 1490, stock: 0, feat: 1, best: 0, opts: { strap: ["Steel bracelet", "Black rubber", "Green leather"] } },
    { cat: 4, slug: "velvet-jewellery-box", kind: "box", pal: PAL.wine, n: ["Velvet jewellery box", "Écrin à bijoux en velours", "علبة مجوهرات مخملية"], s: ["Soft-lined, with a ring roll and a mirror.", "Doublé doux, avec rouleau à bagues et miroir.", "بطانة ناعمة مع مكان للخواتم ومرآة."], l: ["A compact box with a ring roll, earring panel and a mirror lid. Fits on a dresser or in a travel bag.", "Un écrin compact avec rouleau à bagues, panneau boucles d'oreilles et couvercle miroir. Se glisse dans un sac de voyage.", "علبة مدمجة بمكان للخواتم ولوح للأقراط وغطاء بمرآة. تناسب الخزانة أو حقيبة السفر."], specs: [["mat", ["Velvet, MDF, mirror", "Velours, MDF, miroir", "مخمل وMDF ومرآة"]], ["dim", "18 × 12 × 8 cm"], ["weight", "420 g"]], p: 179, cmp: 0, stock: 28, feat: 0, best: 0, opts: null },
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
    const specLines = [0, 1, 2].map((li) => p.specs.map(([k, v]) => `${L[k]![li]}: ${typeof v === "string" ? v : v[li]}`).join("\n"));
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `LUM-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.opts ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    if (p.opts) {
      const o = p.opts;
      const combos: { name: string; options: Record<string, string>; add: number }[] = [];
      if (o.strap) for (const s of o.strap) combos.push({ name: s, options: { Strap: s }, add: s === "Steel mesh" || s === "Steel bracelet" ? 80 : 0 });
      else for (const m of o.metal ?? []) {
        const mAdd = m === "Rose gold" ? 20 : 0;
        if (o.second) for (const v of o.second[1]) combos.push({ name: `${m} / ${v}`, options: { Metal: m, [o.second[0]]: v }, add: mAdd });
        else combos.push({ name: m, options: { Metal: m }, add: mAdd });
      }
      combos.forEach((c, j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, c.name, JSON.stringify(c.options), `LUM-${100 + i}-${j}`, price(p.p + c.add), (j * 7 + i * 3) % 11 === 0 ? 0 : 6 + ((j * 5 + i) % 14), j)));
    }
  }
  void METALS;
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Elle est encore plus belle en vrai. J'ai pu l'essayer devant le livreur, la taille 52 est parfaite."],
    [2, "Karim", "Rabat", 5, "Bought this as a gift — the box and the certificate made it feel really special."],
    [4, "Imane", "Tanger", 5, "الأقراط خفيفة جداً وتناسب الاستخدام اليومي، اللمعة ممتازة."],
    [9, "Youssef", "Marrakech", 4, "Montre élégante, finition soignée. Le bracelet cuir est souple dès le premier jour."],
    [7, "Nadia", "Fès", 5, "Le bracelet brille beaucoup, le fermoir de sécurité est rassurant."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "LUMIERE10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("ring", PAL.night));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
