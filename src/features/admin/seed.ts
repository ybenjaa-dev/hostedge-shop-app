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

type Kind = "sneaker" | "runner" | "chunky" | "canvas" | "chelsea" | "loafer" | "slide" | "backpack" | "crossbody" | "tote" | "duffel" | "wallet";
type Pal = { bg: string; bg2: string; main: string; accent: string; sole: string };

/** Sporty tile: diagonal colour split, giant outline stroke and a flat side-view shoe or bag with an accent stripe (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { main, accent, sole } = pal;
  const lace = `<path d="M268 320 l36 -22 M288 336 l40 -24 M310 352 l42 -26 M334 366 l40 -26" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
  const upper = `<path d="M120 470 C 110 400 118 350 150 336 L 235 318 C 262 312 276 290 292 262 L 332 276 C 372 292 400 330 440 366 C 486 390 508 420 508 470 Z" fill="${main}"/><path d="M292 262 L330 238 L362 266 L332 280 Z" fill="${main}" stroke="#000" stroke-opacity=".15" stroke-width="3"/><path d="M180 452 C 240 404 330 404 410 452" stroke="${accent}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M420 362 C 474 386 508 412 508 470 H 404 C 414 430 424 400 420 362 Z" fill="#000" opacity=".12"/>${lace}`;
  const S: Record<Kind, string> = {
    sneaker: `${upper}<path d="M104 470 H512 C 516 500 500 524 470 526 H150 C120 524 104 500 104 470 Z" fill="${sole}"/><path d="M104 486 H512" stroke="#000" stroke-opacity=".15" stroke-width="4"/>`,
    runner: `${upper}<path d="M96 466 H520 C 530 512 500 540 462 540 C 420 520 390 520 350 540 C 300 520 270 520 230 540 H146 C 112 538 92 504 96 466 Z" fill="${sole}"/><path d="M110 480 H516" stroke="${accent}" stroke-width="8"/>`,
    chunky: `${upper}<path d="M92 462 H524 C 534 520 512 556 470 556 H146 C 106 556 86 520 92 462 Z" fill="${sole}"/><g fill="#000" opacity=".12"><rect x="130" y="500" width="40" height="40" rx="8"/><rect x="190" y="500" width="40" height="40" rx="8"/><rect x="250" y="500" width="40" height="40" rx="8"/><rect x="310" y="500" width="40" height="40" rx="8"/><rect x="370" y="500" width="40" height="40" rx="8"/><rect x="430" y="500" width="40" height="40" rx="8"/></g>`,
    canvas: `${upper}<path d="M104 470 H512 C 516 498 500 520 470 522 H150 C120 520 104 498 104 470 Z" fill="#fff"/><path d="M420 362 C 474 386 508 412 508 470 H 404 C 414 430 424 400 420 362 Z" fill="#fff"/><path d="M108 484 H510" stroke="${accent}" stroke-width="6"/>`,
    chelsea: `<path d="M170 210 H318 L324 380 C 390 396 476 400 504 452 V 486 H 150 C 140 400 150 300 170 210 Z" fill="${main}"/><path d="M178 300 H316 L318 380 H172 Z" fill="#000" opacity=".28"/><path d="M168 220 H320" stroke="${accent}" stroke-width="16" stroke-linecap="round"/><path d="M140 486 H514 C 520 520 500 544 466 546 H160 C 136 540 130 510 140 486 Z" fill="${sole}"/><path d="M150 512 H500" stroke="#000" stroke-opacity=".2" stroke-width="4"/>`,
    loafer: `<path d="M120 446 C 120 402 160 392 204 394 L 330 396 C 400 380 468 404 508 454 V 486 H 120 Z" fill="${main}"/><path d="M230 394 C 260 360 340 360 372 396 Z" fill="#000" opacity=".25"/><rect x="264" y="378" width="58" height="12" rx="6" fill="${accent}"/><path d="M108 486 H516 C 522 512 504 530 474 532 H150 C122 530 106 512 108 486 Z" fill="${sole}"/>`,
    slide: `<path d="M120 490 C 120 430 200 414 300 414 C 400 414 484 432 504 476 L 504 504 H 120 Z" fill="${sole}"/><path d="M196 440 C 226 362 396 360 450 444 L 418 454 C 380 404 262 404 232 456 Z" fill="${main}"/><path d="M236 400 C 280 372 372 374 412 410" stroke="${accent}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M110 504 H516 C 520 522 504 534 480 534 H146 C 122 534 108 522 110 504 Z" fill="#000" opacity=".25"/>`,
    backpack: `<path d="M300 150 C 240 150 220 190 220 230" stroke="${accent}" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="190" y="210" width="220" height="340" rx="64" fill="${main}"/><rect x="226" y="360" width="148" height="140" rx="24" fill="#000" opacity=".2"/><path d="M226 400 H374" stroke="${accent}" stroke-width="10"/><rect x="262" y="260" width="76" height="14" rx="7" fill="${accent}"/><path d="M190 300 C 160 340 160 440 190 500 M410 300 C 440 340 440 440 410 500" stroke="#000" stroke-opacity=".3" stroke-width="16" fill="none" stroke-linecap="round"/>`,
    crossbody: `<path d="M190 250 C 190 120 410 120 410 250" stroke="${sole}" stroke-width="14" fill="none"/><rect x="170" y="290" width="260" height="190" rx="28" fill="${main}"/><path d="M170 320 H430 C 430 340 410 360 390 360 H210 C 190 360 170 340 170 320 Z" fill="#000" opacity=".22"/><rect x="278" y="346" width="44" height="34" rx="8" fill="${accent}"/><path d="M190 440 H410" stroke="${accent}" stroke-width="6" stroke-dasharray="10 8"/>`,
    tote: `<path d="M230 300 C 230 170 370 170 370 300" stroke="${sole}" stroke-width="14" fill="none"/><path d="M156 300 H444 L424 540 H176 Z" fill="${main}"/><path d="M156 300 H444 L440 340 H160 Z" fill="#000" opacity=".2"/><rect x="262" y="396" width="76" height="76" rx="10" fill="none" stroke="${accent}" stroke-width="6"/><path d="M262 434 H338 M300 396 V472" stroke="${accent}" stroke-width="6"/>`,
    duffel: `<path d="M210 300 C 210 220 390 220 390 300" stroke="${sole}" stroke-width="14" fill="none"/><rect x="120" y="290" width="360" height="200" rx="90" fill="${main}"/><path d="M260 290 V490 M340 290 V490" stroke="#000" stroke-opacity=".25" stroke-width="10"/><rect x="120" y="372" width="360" height="26" fill="${accent}"/><circle cx="150" cy="500" r="0" fill="none"/>`,
    wallet: `<rect x="150" y="320" width="300" height="200" rx="26" fill="${main}"/><path d="M150 380 H450" stroke="#000" stroke-opacity=".22" stroke-width="8"/><rect x="360" y="400" width="60" height="44" rx="10" fill="${accent}"/><rect x="170" y="340" width="260" height="170" rx="18" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="9 8"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="${pal.bg}"/><path d="M0 0 H600 L0 560 Z" fill="${pal.bg2}"/><text x="590" y="250" text-anchor="end" font-family="Arial Black, Impact, sans-serif" font-size="230" font-weight="900" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3">${kind === "backpack" || kind === "crossbody" || kind === "tote" || kind === "duffel" || kind === "wallet" ? "BAG" : "RUN"}</text><ellipse cx="310" cy="${kind === "slide" ? 536 : kind === "chunky" ? 566 : 540}" rx="220" ry="14" fill="#000" opacity=".22"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  court: { bg: "#e9e9e4", bg2: "#d6d6cf", main: "#ffffff", accent: "#0d0d0d", sole: "#f1f1ec" },
  pace: { bg: "#ff6a2a", bg2: "#f0541a", main: "#111111", accent: "#c6ff3d", sole: "#f4f4f0" },
  chunky: { bg: "#2f5fd0", bg2: "#264ebb", main: "#e9e9e4", accent: "#ff6a2a", sole: "#ffffff" },
  canvas: { bg: "#c6ff3d", bg2: "#b3ec27", main: "#1f2a44", accent: "#ff6a2a", sole: "#ffffff" },
  chelsea: { bg: "#d9c3a5", bg2: "#c6ab88", main: "#6b4428", accent: "#c6ff3d", sole: "#1b1410" },
  loafer: { bg: "#e4dccf", bg2: "#d3c8b6", main: "#2a1d16", accent: "#c9a24b", sole: "#6a6560" },
  slide: { bg: "#ffd23d", bg2: "#f2c01f", main: "#111111", accent: "#c6ff3d", sole: "#2b2b2b" },
  pack: { bg: "#c6ff3d", bg2: "#b3ec27", main: "#111111", accent: "#ff6a2a", sole: "#444444" },
  cross: { bg: "#ff6a2a", bg2: "#f0541a", main: "#1f2a44", accent: "#c6ff3d", sole: "#111111" },
  tote: { bg: "#e9e9e4", bg2: "#d6d6cf", main: "#8a5a34", accent: "#111111", sole: "#2a1d16" },
  duffel: { bg: "#2f5fd0", bg2: "#264ebb", main: "#111111", accent: "#c6ff3d", sole: "#e9e9e4" },
  wallet: { bg: "#ffd23d", bg2: "#f2c01f", main: "#111111", accent: "#ff6a2a", sole: "#444444" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  fit: ["Fit", "Chaussant", "القياس"], upper: ["Upper", "Tige", "الجزء العلوي"], sole: ["Sole", "Semelle", "النعل"], close: ["Closure", "Fermeture", "الإغلاق"], weight: ["Weight", "Poids", "الوزن"], cap: ["Capacity", "Capacité", "السعة"], dim: ["Dimensions", "Dimensions", "الأبعاد"], mat: ["Material", "Matière", "الخامة"], comp: ["Compartments", "Compartiments", "الجيوب"], care: ["Care", "Entretien", "العناية"],
};
const FIT: Record<string, T3> = { true: ["True to size", "Taille normalement", "مقاسه مضبوط"], small: ["Runs small — size up", "Taille petit — prenez une taille au-dessus", "يأتي صغيراً — اختر مقاساً أكبر"], large: ["Runs large — size down", "Taille grand — prenez une taille en dessous", "يأتي واسعاً — اختر مقاساً أصغر"] };

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "sneakers", name: i18n("Sneakers", "Baskets", "الأحذية الرياضية"), kind: "sneaker" as Kind, pal: PAL.pace },
    { id: newId(), slug: "boots-loafers", name: i18n("Boots & loafers", "Bottines & mocassins", "الجزم والمحاذي"), kind: "chelsea" as Kind, pal: PAL.chelsea },
    { id: newId(), slug: "slides", name: i18n("Slides & sandals", "Claquettes & sandales", "الصنادل"), kind: "slide" as Kind, pal: PAL.slide },
    { id: newId(), slug: "bags", name: i18n("Bags & backpacks", "Sacs & sacs à dos", "الحقائب"), kind: "backpack" as Kind, pal: PAL.pack },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; specs: [string, T3 | string][]; p: number; cmp: number; stock: number; feat: number; best: number; colors: string[]; sizes?: string[] };
  const SZ = ["40", "41", "42", "43", "44", "45"];
  const products: PD[] = [
    { cat: 0, slug: "court-sneaker", kind: "sneaker", pal: PAL.court, n: ["Court sneaker", "Baskets Court", "حذاء كورت الرياضي"], s: ["Clean leather court shoe with cushioned insole.", "Basket cuir épurée avec semelle intérieure amortissante.", "حذاء جلدي بسيط ببطانة مبطّنة."], l: ["A court-inspired sneaker in smooth leather with a rubber cupsole and a padded collar. Goes with everything.", "Une basket inspirée du court en cuir lisse, avec semelle cupsole en caoutchouc et col rembourré. Va avec tout.", "حذاء مستوحى من الملاعب بجلد ناعم ونعل مطاطي وياقة مبطّنة. يناسب كل شيء."], specs: [["fit", FIT.true!], ["upper", ["Smooth leather", "Cuir lisse", "جلد ناعم"]], ["sole", ["Rubber cupsole", "Cupsole caoutchouc", "نعل مطاطي"]], ["close", ["Lace-up", "Lacets", "رباط"]], ["weight", "380 g"]], p: 449, cmp: 549, stock: 0, feat: 1, best: 1, colors: ["White", "Black"], sizes: SZ },
    { cat: 0, slug: "pace-running-shoe", kind: "runner", pal: PAL.pace, n: ["Pace running shoe", "Chaussure de running Pace", "حذاء الجري بيس"], s: ["Lightweight mesh with a responsive foam sole.", "Maille légère et semelle en mousse réactive.", "شبك خفيف ونعل إسفنجي سريع الاستجابة."], l: ["Built for daily miles: breathable engineered mesh, a 32 mm foam midsole and a grippy outsole.", "Pensée pour les kilomètres du quotidien : maille respirante, semelle intermédiaire en mousse de 32 mm et semelle extérieure adhérente.", "مصمم لمسافات الجري اليومية: شبك مسامي ونعل أوسط إسفنجي 32 مم ونعل خارجي ثابت."], specs: [["fit", FIT.small!], ["upper", ["Engineered mesh", "Maille technique", "شبك هندسي"]], ["sole", ["EVA foam, rubber outsole", "Mousse EVA, semelle caoutchouc", "إسفنج EVA ونعل مطاطي"]], ["close", ["Lace-up", "Lacets", "رباط"]], ["weight", "260 g"]], p: 599, cmp: 699, stock: 0, feat: 1, best: 1, colors: ["Black", "Blue"], sizes: SZ },
    { cat: 0, slug: "chunky-trainer", kind: "chunky", pal: PAL.chunky, n: ["Chunky trainer", "Basket chunky", "حذاء تشانكي رياضي"], s: ["A bold platform sole and plush padding.", "Semelle plateforme marquée et rembourrage moelleux.", "نعل مرتفع بارز وحشوة مريحة."], l: ["Statement trainer with a 4 cm platform sole, suede overlays and a cushioned footbed.", "Basket statement avec semelle plateforme de 4 cm, empiècements en daim et semelle intérieure moelleuse.", "حذاء لافت بنعل مرتفع 4 سم وطبقات من الشمواه وقاعدة مبطّنة."], specs: [["fit", FIT.true!], ["upper", ["Leather and suede", "Cuir et daim", "جلد وشمواه"]], ["sole", ["Platform rubber, 4 cm", "Caoutchouc plateforme 4 cm", "مطاط مرتفع 4 سم"]], ["close", ["Lace-up", "Lacets", "رباط"]], ["weight", "540 g"]], p: 649, cmp: 0, stock: 0, feat: 1, best: 0, colors: ["White", "Grey"], sizes: SZ },
    { cat: 0, slug: "canvas-low-top", kind: "canvas", pal: PAL.canvas, n: ["Canvas low-top", "Basket basse en toile", "حذاء كانفاس منخفض"], s: ["Washed canvas with a vulcanised sole.", "Toile délavée et semelle vulcanisée.", "قماش مغسول ونعل مفلكن."], l: ["The easy everyday shoe. Cotton canvas upper, vulcanised rubber sole and a cushioned insole.", "La chaussure facile du quotidien. Tige en toile de coton, semelle en caoutchouc vulcanisé et semelle intérieure amortissante.", "الحذاء اليومي السهل. علوي من قماش قطني ونعل مطاطي مفلكن وبطانة مريحة."], specs: [["fit", FIT.large!], ["upper", ["Cotton canvas", "Toile de coton", "قماش قطني"]], ["sole", ["Vulcanised rubber", "Caoutchouc vulcanisé", "مطاط مفلكن"]], ["close", ["Lace-up", "Lacets", "رباط"]], ["weight", "340 g"]], p: 299, cmp: 349, stock: 0, feat: 1, best: 0, colors: ["Navy", "White", "Black"], sizes: SZ },
    { cat: 1, slug: "leather-chelsea-boot", kind: "chelsea", pal: PAL.chelsea, n: ["Leather Chelsea boot", "Bottine Chelsea en cuir", "جزمة تشيلسي جلدية"], s: ["Full-grain leather with elastic side panels.", "Cuir pleine fleur et élastiques latéraux.", "جلد طبيعي كامل مع جوانب مطاطية."], l: ["A sleek boot with a pull tab and a durable rubber sole. Leather lining for all-day comfort.", "Une bottine épurée avec tirette et semelle caoutchouc résistante. Doublure cuir pour un confort toute la journée.", "جزمة أنيقة بلسان سحب ونعل مطاطي متين. بطانة جلدية لراحة طوال اليوم."], specs: [["fit", FIT.true!], ["upper", ["Full-grain leather", "Cuir pleine fleur", "جلد طبيعي كامل"]], ["sole", ["Rubber, Goodyear-style stitch", "Caoutchouc, couture type Goodyear", "مطاط بخياطة جودير"]], ["close", ["Elastic side panels", "Élastiques latéraux", "جوانب مطاطية"]], ["weight", "720 g"]], p: 799, cmp: 949, stock: 0, feat: 1, best: 1, colors: ["Black", "Brown"], sizes: SZ },
    { cat: 1, slug: "penny-loafer", kind: "loafer", pal: PAL.loafer, n: ["Penny loafer", "Mocassin penny", "حذاء لوفر"], s: ["Soft leather, flexible sole, easy on.", "Cuir souple, semelle flexible, facile à enfiler.", "جلد ناعم ونعل مرن وسهل الارتداء."], l: ["A classic loafer with a hand-stitched apron and a cushioned leather insole.", "Un mocassin classique à bout cousu main et semelle intérieure en cuir amortissante.", "حذاء لوفر كلاسيكي بخياطة يدوية وبطانة جلدية مبطّنة."], specs: [["fit", FIT.true!], ["upper", ["Calf leather", "Cuir de veau", "جلد عجل"]], ["sole", ["Leather and rubber", "Cuir et caoutchouc", "جلد ومطاط"]], ["close", ["Slip-on", "Sans lacets", "دون رباط"]], ["weight", "420 g"]], p: 549, cmp: 0, stock: 0, feat: 0, best: 0, colors: ["Black", "Brown"], sizes: SZ },
    { cat: 2, slug: "comfort-slides", kind: "slide", pal: PAL.slide, n: ["Comfort slides", "Claquettes confort", "شبشب مريح"], s: ["Moulded footbed, quick-dry strap.", "Semelle anatomique, bride séchage rapide.", "قاعدة مشكّلة وسير سريع الجفاف."], l: ["Soft EVA slides with an anatomical footbed. Light, waterproof and easy to rinse.", "Claquettes en EVA souple avec semelle anatomique. Légères, imperméables et faciles à rincer.", "شبشب من الإيفا الناعم بقاعدة تشريحية. خفيف ومقاوم للماء وسهل الغسل."], specs: [["fit", FIT.large!], ["upper", ["EVA strap", "Bride EVA", "سير إيفا"]], ["sole", ["Moulded EVA", "EVA moulé", "إيفا مشكّل"]], ["weight", "240 g"]], p: 149, cmp: 189, stock: 0, feat: 1, best: 1, colors: ["Black", "Navy"], sizes: SZ },
    { cat: 3, slug: "everyday-backpack-22l", kind: "backpack", pal: PAL.pack, n: ["Everyday backpack 22 L", "Sac à dos quotidien 22 L", "حقيبة ظهر يومية 22 لتراً"], s: ["Padded laptop sleeve, water-resistant fabric.", "Compartiment ordinateur matelassé, tissu déperlant.", "جيب لابتوب مبطّن وقماش مقاوم للماء."], l: ["A clean daily pack with a 15″ laptop sleeve, a quick-access pocket and breathable shoulder straps.", "Un sac épuré pour le quotidien avec compartiment ordinateur 15″, poche à accès rapide et bretelles respirantes.", "حقيبة يومية أنيقة بجيب لابتوب 15 بوصة وجيب سريع وأحزمة كتف مسامية."], specs: [["cap", "22 L"], ["dim", "45 × 30 × 16 cm"], ["mat", ["Recycled polyester, water-resistant", "Polyester recyclé déperlant", "بوليستر معاد تدويره مقاوم للماء"]], ["comp", ["Main · laptop 15″ · front pocket · side bottle pocket", "Principal · ordinateur 15″ · poche avant · poche gourde", "رئيسي · لابتوب 15 بوصة · جيب أمامي · جيب زجاجة"]], ["weight", "640 g"]], p: 349, cmp: 429, stock: 0, feat: 1, best: 1, colors: ["Black", "Navy", "Olive"] },
    { cat: 3, slug: "crossbody-bag", kind: "crossbody", pal: PAL.cross, n: ["Crossbody bag", "Sac bandoulière", "حقيبة كروس"], s: ["Compact, with an adjustable strap.", "Compact, avec bandoulière réglable.", "مدمجة بحزام قابل للتعديل."], l: ["Fits a phone, wallet and keys. Zipped main pocket and a hidden back pocket.", "Contient téléphone, portefeuille et clés. Poche principale zippée et poche arrière cachée.", "تتسع للهاتف والمحفظة والمفاتيح. جيب رئيسي بسحاب وجيب خلفي مخفي."], specs: [["cap", "3 L"], ["dim", "22 × 15 × 7 cm"], ["mat", ["Nylon, brass hardware", "Nylon, quincaillerie en laiton", "نايلون وإكسسوارات نحاسية"]], ["weight", "260 g"]], p: 279, cmp: 0, stock: 0, feat: 0, best: 0, colors: ["Navy", "Black"] },
    { cat: 3, slug: "leather-tote-bag", kind: "tote", pal: PAL.tote, n: ["Leather tote bag", "Cabas en cuir", "حقيبة توت جلدية"], s: ["Roomy, structured, with an inner zip pocket.", "Spacieux, structuré, avec poche zippée intérieure.", "واسعة ومنظّمة بجيب داخلي بسحاب."], l: ["A structured tote in grained leather with a magnetic closure and reinforced handles.", "Un cabas structuré en cuir grainé avec fermeture magnétique et anses renforcées.", "حقيبة توت منظّمة من الجلد المحبّب بإغلاق مغناطيسي ومقابض معززة."], specs: [["cap", "16 L"], ["dim", "38 × 30 × 13 cm"], ["mat", ["Grained leather", "Cuir grainé", "جلد محبّب"]], ["comp", ["Main · inner zip pocket · phone pocket", "Principal · poche zippée · poche téléphone", "رئيسي · جيب بسحاب · جيب هاتف"]], ["weight", "820 g"]], p: 599, cmp: 699, stock: 0, feat: 1, best: 0, colors: ["Tan", "Black"] },
    { cat: 3, slug: "gym-duffel-40l", kind: "duffel", pal: PAL.duffel, n: ["Gym duffel 40 L", "Sac de sport 40 L", "حقيبة رياضة 40 لتراً"], s: ["Separate shoe compartment, wet pocket.", "Compartiment chaussures séparé, poche humide.", "قسم منفصل للحذاء وجيب للمبلل."], l: ["A tough duffel with a ventilated shoe compartment, a zipped wet pocket and a detachable shoulder strap.", "Un sac robuste avec compartiment chaussures ventilé, poche humide zippée et bandoulière amovible.", "حقيبة متينة بقسم للحذاء مهوّى وجيب مبلل بسحاب وحزام كتف قابل للفك."], specs: [["cap", "40 L"], ["dim", "55 × 28 × 26 cm"], ["mat", ["Ripstop polyester", "Polyester ripstop", "بوليستر ريب ستوب"]], ["comp", ["Main · ventilated shoe compartment · wet pocket", "Principal · compartiment chaussures ventilé · poche humide", "رئيسي · قسم حذاء مهوّى · جيب مبلل"]], ["weight", "780 g"]], p: 399, cmp: 479, stock: 0, feat: 0, best: 1, colors: ["Black", "Blue"] },
    { cat: 3, slug: "slim-card-wallet", kind: "wallet", pal: PAL.wallet, n: ["Slim card wallet", "Porte-cartes fin", "محفظة بطاقات رفيعة"], s: ["Six cards and folded notes, RFID blocking.", "Six cartes et billets pliés, anti-RFID.", "ست بطاقات وأوراق نقدية مع حجب RFID."], l: ["Slim leather wallet that fits in a front pocket. Six card slots, a note pocket and RFID protection.", "Portefeuille fin en cuir qui se glisse dans la poche avant. Six emplacements cartes, poche billets et protection RFID.", "محفظة جلدية رفيعة تدخل الجيب الأمامي. ست فتحات للبطاقات وجيب للنقود وحماية RFID."], specs: [["dim", "10 × 7.5 × 1 cm"], ["mat", ["Vegetable-tanned leather", "Cuir tanné végétal", "جلد مدبوغ نباتياً"]], ["comp", ["6 card slots · 1 note pocket", "6 emplacements cartes · 1 poche billets", "6 فتحات بطاقات · جيب نقود"]], ["weight", "45 g"]], p: 129, cmp: 0, stock: 0, feat: 0, best: 0, colors: ["Black", "Brown"] },
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
        cats[p.cat]!.id, `STR-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, 0, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    let j = 0;
    for (const color of p.colors) {
      if (p.sizes) for (const sz of p.sizes) { stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, `${color} / ${sz}`, JSON.stringify({ Color: color, Size: sz }), `STR-${100 + i}-${j}`, price(p.p), (j * 5 + i * 3) % 9 === 0 ? 0 : 3 + ((j * 3 + i) % 12), j)); j++; }
      else { stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, color, JSON.stringify({ Color: color }), `STR-${100 + i}-${j}`, price(p.p), (i + j) % 7 === 0 ? 0 : 8 + ((j * 4 + i) % 15), j)); j++; }
    }
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Anas", "Casablanca", 5, "Très confortables dès le premier jour. J'ai essayé la 43 devant le livreur et elle allait parfaitement."],
    [1, "Salma", "Rabat", 5, "Light and responsive — I wear them for my morning runs. Size up like they say."],
    [4, "Karim", "Tanger", 5, "الجزمة جلد حقيقي ومريحة جداً، المقاس مضبوط."],
    [8, "Imane", "Marrakech", 4, "Sac à dos pratique avec une vraie poche ordinateur. Les bretelles sont confortables."],
    [7, "Youssef", "Fès", 5, "Les claquettes sont légères et sèchent vite, je les ai prises pour la salle de sport."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "STRIDE10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on the featured products: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.9, 1], [3, 0.82, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("runner", PAL.pace));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
