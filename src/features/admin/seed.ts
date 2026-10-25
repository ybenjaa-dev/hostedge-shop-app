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

type Kind = "dishes" | "board" | "skillet" | "jars" | "cushion" | "throw" | "vase" | "duvet" | "pillow" | "towels" | "basket" | "shelf";
type Pal = { bg: string; floor: string; a: string; b: string; c: string };

/** Warm flat "catalogue" tile: wall, floor line, soft shadow and a simple object (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { a, b, c } = pal;
  const S: Record<Kind, string> = {
    dishes: `<ellipse cx="300" cy="520" rx="170" ry="34" fill="${a}"/><ellipse cx="300" cy="500" rx="170" ry="34" fill="${b}"/><ellipse cx="300" cy="500" rx="120" ry="22" fill="${a}" opacity=".55"/><ellipse cx="300" cy="462" rx="170" ry="34" fill="${a}"/><ellipse cx="300" cy="446" rx="170" ry="34" fill="${b}"/><ellipse cx="300" cy="446" rx="120" ry="22" fill="${a}" opacity=".55"/><path d="M210 330 H390 C390 400 350 430 300 430 C250 430 210 400 210 330 Z" fill="${c}"/><ellipse cx="300" cy="330" rx="90" ry="16" fill="${a}"/>`,
    board: `<g transform="rotate(-8 300 400)"><rect x="170" y="290" width="260" height="190" rx="26" fill="${a}"/><rect x="176" y="296" width="248" height="178" rx="22" fill="${b}" opacity=".5"/><circle cx="400" cy="316" r="12" fill="${pal.bg}"/><g stroke="${c}" stroke-opacity=".35" stroke-width="3" fill="none"><path d="M200 340 H360"/><path d="M200 380 H330"/><path d="M200 420 H370"/></g></g><circle cx="250" cy="470" r="34" fill="${c}"/><circle cx="268" cy="458" r="10" fill="#fff" opacity=".3"/>`,
    skillet: `<ellipse cx="270" cy="480" rx="150" ry="40" fill="${a}"/><ellipse cx="270" cy="462" rx="150" ry="40" fill="${b}"/><ellipse cx="270" cy="462" rx="122" ry="30" fill="${a}"/><rect x="410" y="450" width="140" height="26" rx="13" fill="${a}"/><circle cx="540" cy="463" r="7" fill="${pal.bg}"/><ellipse cx="270" cy="462" rx="122" ry="30" fill="${c}" opacity=".25"/>`,
    jars: [[150, 340, 130, 200], [255, 300, 130, 240], [360, 360, 100, 180]].map(([x, y, w, h], i) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#fff" fill-opacity=".55" stroke="${a}" stroke-width="4"/><rect x="${x! + 8}" y="${y! + h! * (0.35 - i * 0.05)}" width="${w! - 16}" height="${h! * (0.65 + i * 0.05) - 8}" rx="12" fill="${[b, c, a][i]}" opacity=".75"/><rect x="${x! - 4}" y="${y! - 26}" width="${w! + 8}" height="30" rx="10" fill="${a}"/>`).join(""),
    cushion: `<rect x="170" y="290" width="260" height="260" rx="40" fill="${a}"/><rect x="186" y="306" width="228" height="228" rx="30" fill="none" stroke="${pal.bg}" stroke-opacity=".7" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/><g stroke="${b}" stroke-width="12" stroke-linecap="round"><path d="M220 380 H380"/><path d="M220 430 H380"/><path d="M220 480 H380"/></g>`,
    throw: `<path d="M150 300 H450 V540 H150 Z" fill="${a}"/><g fill="${b}"><rect x="150" y="340" width="300" height="26"/><rect x="150" y="410" width="300" height="26"/><rect x="150" y="480" width="300" height="26"/></g><path d="M150 540 v36 M170 540 v36 M190 540 v36 M210 540 v36 M230 540 v36 M250 540 v36 M270 540 v36 M290 540 v36 M310 540 v36 M330 540 v36 M350 540 v36 M370 540 v36 M390 540 v36 M410 540 v36 M430 540 v36 M450 540 v36" stroke="${c}" stroke-width="5"/>`,
    vase: `<path d="M240 540 V400 C240 320 280 290 300 290 C320 290 360 320 360 400 V540 Z" fill="${a}"/><path d="M250 520 V404 C250 340 282 306 300 306" stroke="#fff" stroke-opacity=".3" stroke-width="10" fill="none" stroke-linecap="round"/><g stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"><path d="M300 290 C300 220 270 180 240 150"/><path d="M300 290 C310 220 350 190 390 170"/><path d="M300 290 C300 230 300 200 300 140"/></g><g fill="${b}"><ellipse cx="240" cy="146" rx="22" ry="12" transform="rotate(-40 240 146)"/><ellipse cx="392" cy="168" rx="22" ry="12" transform="rotate(30 392 168)"/><ellipse cx="300" cy="136" rx="22" ry="12" transform="rotate(90 300 136)"/></g>`,
    duvet: `<rect x="120" y="360" width="360" height="180" rx="18" fill="${a}"/><rect x="120" y="360" width="360" height="52" rx="18" fill="${b}"/><rect x="150" y="300" width="130" height="80" rx="30" fill="#fff" fill-opacity=".85"/><rect x="320" y="300" width="130" height="80" rx="30" fill="#fff" fill-opacity=".85"/><g stroke="${c}" stroke-opacity=".35" stroke-width="3"><path d="M200 420 V540 M300 420 V540 M400 420 V540"/></g><rect x="110" y="540" width="14" height="34" fill="${c}"/><rect x="476" y="540" width="14" height="34" fill="${c}"/>`,
    pillow: `<path d="M150 360 C150 320 200 310 300 316 C400 310 450 320 450 360 V470 C450 510 400 520 300 514 C200 520 150 510 150 470 Z" fill="${a}"/><path d="M180 350 C250 336 350 336 420 350" stroke="${b}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="170" cy="340" r="6" fill="${b}"/><circle cx="430" cy="340" r="6" fill="${b}"/>`,
    towels: [[0, a], [1, b], [2, c], [3, a]].map(([i, col]) => `<rect x="170" y="${470 - (i as number) * 56}" width="260" height="52" rx="14" fill="${col}"/><rect x="170" y="${486 - (i as number) * 56}" width="260" height="8" fill="#fff" opacity=".4"/>`).join(""),
    basket: `<path d="M170 360 H430 L400 540 H200 Z" fill="${a}"/><g stroke="${b}" stroke-width="5"><path d="M180 410 H420"/><path d="M188 460 H412"/><path d="M196 510 H404"/><path d="M230 360 L240 540"/><path d="M300 360 V540"/><path d="M370 360 L360 540"/></g><path d="M200 360 C200 300 400 300 400 360" stroke="${c}" stroke-width="12" fill="none" stroke-linecap="round"/><rect x="164" y="350" width="272" height="16" rx="8" fill="${c}"/>`,
    shelf: `<rect x="130" y="420" width="340" height="22" rx="6" fill="${a}"/><rect x="170" y="442" width="10" height="40" fill="${c}"/><rect x="420" y="442" width="10" height="40" fill="${c}"/><rect x="170" y="340" width="40" height="80" rx="6" fill="${b}"/><rect x="216" y="360" width="34" height="60" rx="6" fill="${c}"/><rect x="256" y="346" width="26" height="74" rx="4" fill="${b}"/><path d="M360 420 V380 H400 V420" fill="${pal.bg}" stroke="${c}" stroke-width="5"/><ellipse cx="380" cy="372" rx="30" ry="14" fill="${b}"/>`,
  };
  const noShadow = kind === "duvet" || kind === "shelf" || kind === "throw";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="${pal.bg}"/><rect y="574" width="600" height="176" fill="${pal.floor}"/><rect x="40" y="70" width="140" height="190" rx="70" fill="#fff" opacity=".35"/>${noShadow ? "" : `<ellipse cx="300" cy="578" rx="190" ry="14" fill="#000" opacity=".1"/>`}${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  sand: { bg: "#efe3d0", floor: "#e0cfb4", a: "#d6bf9a", b: "#f4ead9", c: "#8f7a58" },
  sage: { bg: "#e1e7d6", floor: "#ccd5bd", a: "#9fb18a", b: "#e9efdd", c: "#5f7348" },
  terracotta: { bg: "#f1ddd0", floor: "#e6c8b4", a: "#c8643a", b: "#f0c9b2", c: "#7c3a1f" },
  oat: { bg: "#f2ebdf", floor: "#e3d8c5", a: "#d9cbb2", b: "#f8f3e9", c: "#a28e6b" },
  slate: { bg: "#dfe3e4", floor: "#c9cfd1", a: "#6b777b", b: "#b9c3c5", c: "#2f393d" },
  blush: { bg: "#f4e3df", floor: "#e8cdc7", a: "#d9a79d", b: "#f6d9d3", c: "#a26b61" },
  oak: { bg: "#efe2d0", floor: "#dfcbb0", a: "#c79a62", b: "#e9cfa6", c: "#7a5530" },
  white: { bg: "#ecefef", floor: "#d9dede", a: "#ffffff", b: "#e1e5e6", c: "#9aa5a7" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  dim: ["Dimensions", "Dimensions", "الأبعاد"], mat: ["Material", "Matière", "الخامة"], weight: ["Weight", "Poids", "الوزن"], cap: ["Capacity", "Capacité", "السعة"], care: ["Care", "Entretien", "العناية"], pcs: ["Pieces", "Pièces", "عدد القطع"], load: ["Max load", "Charge max", "الحمولة القصوى"],
};

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "kitchen-dining", name: i18n("Kitchen & dining", "Cuisine & table", "المطبخ والمائدة"), kind: "dishes" as Kind, pal: PAL.sand },
    { id: newId(), slug: "living-room", name: i18n("Living room", "Salon", "غرفة المعيشة"), kind: "vase" as Kind, pal: PAL.terracotta },
    { id: newId(), slug: "bedroom", name: i18n("Bedroom", "Chambre", "غرفة النوم"), kind: "duvet" as Kind, pal: PAL.blush },
    { id: newId(), slug: "bathroom", name: i18n("Bathroom", "Salle de bain", "الحمام"), kind: "towels" as Kind, pal: PAL.sage },
    { id: newId(), slug: "storage", name: i18n("Storage & shelves", "Rangement", "التخزين والرفوف"), kind: "basket" as Kind, pal: PAL.oak },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; specs: [string, string | T3][]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "stoneware-dinner-set-16", kind: "dishes", pal: PAL.sand, n: ["Stoneware dinner set, 16 pieces", "Service de table en grès, 16 pièces", "طقم مائدة من الحجر الصيني 16 قطعة"], s: ["Plates, bowls and mugs for four.", "Assiettes, bols et mugs pour quatre.", "أطباق وأوعية وأكواب لأربعة أشخاص."], l: ["Reactive-glaze stoneware that is dishwasher and microwave safe. Each set holds four dinner plates, four side plates, four bowls and four mugs.", "Grès à émail réactif, compatible lave-vaisselle et micro-ondes. Chaque service comprend quatre assiettes plates, quatre assiettes à dessert, quatre bols et quatre mugs.", "حجر صيني بطلاء متفاعل آمن لغسالة الأطباق والميكروويف. يضم كل طقم أربعة أطباق وأربعة أطباق جانبية وأربعة أوعية وأربعة أكواب."], specs: [["dim", "Dinner plate Ø 27 cm"], ["mat", ["Glazed stoneware", "Grès émaillé", "حجر صيني مطلي"]], ["pcs", "16"], ["weight", "9.4 kg"], ["care", ["Dishwasher and microwave safe", "Lave-vaisselle et micro-ondes", "آمن لغسالة الأطباق والميكروويف"]]], p: 890, cmp: 1090, stock: 0, feat: 1, best: 1, v: [["Sand", 890, 12], ["Sage", 890, 7]] },
    { cat: 0, slug: "bamboo-cutting-board", kind: "board", pal: PAL.oak, n: ["Bamboo cutting board", "Planche à découper en bambou", "لوح تقطيع من الخيزران"], s: ["Durable, gentle on knives, with a juice groove.", "Robuste, douce pour les couteaux, avec rigole.", "متين ولطيف على السكاكين مع قناة للعصارة."], l: ["Dense, hard-wearing bamboo with a deep juice groove and a hanging hole.", "Bambou dense et résistant avec rigole profonde et trou de suspension.", "خيزران كثيف ومتين مع قناة عميقة وفتحة للتعليق."], specs: [["dim", "S 30 × 20 · M 40 × 28 · L 50 × 35 cm"], ["mat", ["Bamboo", "Bambou", "خيزران"]], ["weight", "0.6–1.4 kg"], ["care", ["Hand wash, oil monthly", "Lavage à la main, huiler chaque mois", "غسل يدوي وتزييت شهري"]]], p: 129, cmp: 159, stock: 0, feat: 1, best: 1, v: [["S · 30 × 20 cm", 129, 30], ["M · 40 × 28 cm", 179, 22], ["L · 50 × 35 cm", 229, 0]] },
    { cat: 0, slug: "cast-iron-skillet-26", kind: "skillet", pal: PAL.slate, n: ["Cast-iron skillet 26 cm", "Poêle en fonte 26 cm", "مقلاة حديد زهر 26 سم"], s: ["Pre-seasoned, oven safe, works on every hob.", "Pré-culottée, passe au four, tous feux.", "مجهزة مسبقاً وتناسب الفرن وكل أنواع المواقد."], l: ["A heavy pan that holds heat and lasts for decades. Works on gas, electric, induction and in the oven.", "Une poêle lourde qui retient la chaleur et dure des décennies. Compatible gaz, électrique, induction et four.", "مقلاة ثقيلة تحتفظ بالحرارة وتدوم لعقود. تعمل على الغاز والكهرباء والحث وفي الفرن."], specs: [["dim", "Ø 26 cm · depth 5 cm"], ["mat", ["Cast iron", "Fonte", "حديد زهر"]], ["weight", "2.6 kg"], ["care", ["Hand wash, dry and oil lightly", "Lavage à la main, séchez et huilez", "غسل يدوي وتجفيف وتزييت خفيف"]]], p: 349, cmp: 0, stock: 24, feat: 1, best: 0, v: [] },
    { cat: 0, slug: "glass-storage-jars-6", kind: "jars", pal: PAL.sage, n: ["Glass storage jars, set of 6", "Bocaux de rangement en verre, lot de 6", "مرطبانات زجاجية للتخزين، 6 قطع"], s: ["Airtight lids in three sizes.", "Couvercles hermétiques, trois tailles.", "أغطية محكمة بثلاثة أحجام."], l: ["Borosilicate glass jars with bamboo lids and silicone seals — for pasta, flour, grains and coffee.", "Bocaux en verre borosilicate avec couvercles en bambou et joints en silicone — pâtes, farine, céréales et café.", "مرطبانات من زجاج البورسليكات بأغطية خيزران وحشوات سيليكون — للمعكرونة والدقيق والحبوب والقهوة."], specs: [["cap", "2 × 0.5 L · 2 × 1 L · 2 × 1.5 L"], ["mat", ["Glass, bamboo, silicone", "Verre, bambou, silicone", "زجاج وخيزران وسيليكون"]], ["pcs", "6"], ["care", ["Dishwasher safe (remove lids)", "Lave-vaisselle (sans couvercle)", "آمن لغسالة الأطباق (بدون الغطاء)"]]], p: 249, cmp: 299, stock: 38, feat: 0, best: 1, v: [] },
    { cat: 1, slug: "linen-cushion-cover-45", kind: "cushion", pal: PAL.terracotta, n: ["Linen cushion cover 45 × 45", "Housse de coussin en lin 45 × 45", "غطاء وسادة من الكتان 45 × 45"], s: ["Washed linen with a hidden zip.", "Lin lavé avec fermeture invisible.", "كتان مغسول بسحاب مخفي."], l: ["Soft stonewashed linen that gets better with every wash. Hidden zip, insert not included.", "Lin délavé tout doux qui s'améliore à chaque lavage. Fermeture invisible, garnissage non inclus.", "كتان مغسول ناعم يتحسن مع كل غسلة. سحاب مخفي والحشوة غير مشمولة."], specs: [["dim", "45 × 45 cm"], ["mat", ["100% linen", "100 % lin", "100٪ كتان"]], ["weight", "180 g"], ["care", ["Machine wash 30 °C", "Lavage machine 30 °C", "غسالة 30 درجة"]]], p: 99, cmp: 0, stock: 0, feat: 1, best: 0, v: [["Terracotta", 99, 25], ["Oat", 99, 18], ["Sage", 99, 0]] },
    { cat: 1, slug: "woven-throw-blanket", kind: "throw", pal: PAL.oat, n: ["Woven cotton throw", "Plaid en coton tissé", "بطانية قطنية منسوجة"], s: ["Striped, with hand-knotted fringe.", "Rayé, avec franges nouées main.", "مقلّمة بأهداب معقودة يدوياً."], l: ["A generous cotton throw for sofa or bed. Medium weight, so it works across the seasons.", "Un plaid en coton généreux pour le canapé ou le lit. Poids moyen, utilisable toute l'année.", "بطانية قطنية سخية للأريكة أو السرير. وزن متوسط يناسب كل الفصول."], specs: [["dim", "130 × 170 cm"], ["mat", ["100% cotton", "100 % coton", "100٪ قطن"]], ["weight", "820 g"], ["care", ["Machine wash 30 °C", "Lavage machine 30 °C", "غسالة 30 درجة"]]], p: 229, cmp: 279, stock: 31, feat: 1, best: 1, v: [] },
    { cat: 1, slug: "arch-ceramic-vase", kind: "vase", pal: PAL.blush, n: ["Arch ceramic vase", "Vase arche en céramique", "مزهرية قوسية من السيراميك"], s: ["Matte glaze, fits dried or fresh stems.", "Émail mat, pour fleurs séchées ou fraîches.", "طلاء مطفأ يناسب الأزهار الجافة أو الطازجة."], l: ["A sculptural vase with a soft arch silhouette, glazed inside so it holds water.", "Un vase sculptural à la silhouette en arche douce, émaillé à l'intérieur pour tenir l'eau.", "مزهرية نحتية بشكل قوس ناعم مطلية من الداخل لتحمل الماء."], specs: [["dim", "Ø 14 × H 28 cm"], ["mat", ["Glazed ceramic", "Céramique émaillée", "سيراميك مطلي"]], ["weight", "1.1 kg"], ["care", ["Wipe clean", "Essuyer", "تمسح بقطعة قماش"]]], p: 179, cmp: 0, stock: 20, feat: 0, best: 0, v: [] },
    { cat: 2, slug: "percale-duvet-set", kind: "duvet", pal: PAL.blush, n: ["Cotton percale duvet set", "Parure de lit en percale de coton", "طقم أغطية سرير من البركال القطني"], s: ["Crisp and cool, 200 thread count.", "Frais et net, 200 fils.", "منعش ومنتظم بكثافة 200 خيط."], l: ["A duvet cover and two pillowcases in crisp cotton percale. Breathable and easy to iron.", "Une housse de couette et deux taies en percale de coton. Respirante et facile à repasser.", "غطاء لحاف ووسادتان من البركال القطني. يسمح بمرور الهواء وسهل الكي."], specs: [["mat", ["100% cotton percale", "Percale 100 % coton", "بركال قطن 100٪"]], ["pcs", "3"], ["care", ["Machine wash 40 °C", "Lavage machine 40 °C", "غسالة 40 درجة"]]], p: 399, cmp: 499, stock: 0, feat: 1, best: 1, v: [["Single · 140 × 200 cm", 399, 14], ["Double · 200 × 200 cm", 549, 11], ["King · 240 × 220 cm", 649, 6]] },
    { cat: 2, slug: "memory-foam-pillow", kind: "pillow", pal: PAL.white, n: ["Memory-foam pillow", "Oreiller à mémoire de forme", "وسادة بالإسفنج الذكي"], s: ["Supports neck and shoulders, washable cover.", "Soutient la nuque et les épaules, housse lavable.", "تدعم الرقبة والكتفين بغطاء قابل للغسل."], l: ["Contoured memory foam that adapts to your sleeping position. Breathable bamboo-blend cover.", "Mousse à mémoire de forme ergonomique qui s'adapte à votre position. Housse respirante en mélange bambou.", "إسفنج ذكي مقوّس يتكيّف مع وضعية نومك وغطاء مسامي من مزيج الخيزران."], specs: [["dim", "60 × 40 × 12 cm"], ["mat", ["Memory foam, bamboo-blend cover", "Mousse à mémoire de forme, housse mélange bambou", "إسفنج ذكي وغطاء من مزيج الخيزران"]], ["weight", "1.2 kg"], ["care", ["Cover machine washable", "Housse lavable en machine", "الغطاء قابل للغسل بالغسالة"]]], p: 219, cmp: 269, stock: 44, feat: 0, best: 0, v: [] },
    { cat: 3, slug: "cotton-towel-set-4", kind: "towels", pal: PAL.sage, n: ["Cotton bath towel set, 4 pieces", "Lot de 4 serviettes de bain en coton", "طقم 4 مناشف حمام قطنية"], s: ["Heavy, absorbent 500 gsm cotton.", "Coton épais et absorbant, 500 g/m².", "قطن سميك وماص بوزن 500 غ/م²."], l: ["Two bath towels and two hand towels in dense, quick-drying cotton.", "Deux serviettes de bain et deux serviettes de toilette en coton dense qui sèche vite.", "منشفتا حمام ومنشفتا يدين من قطن كثيف سريع الجفاف."], specs: [["dim", "Bath 70 × 140 cm · Hand 50 × 90 cm"], ["mat", ["100% cotton, 500 gsm", "100 % coton, 500 g/m²", "100٪ قطن 500 غ/م²"]], ["pcs", "4"], ["care", ["Machine wash 40 °C", "Lavage machine 40 °C", "غسالة 40 درجة"]]], p: 279, cmp: 349, stock: 0, feat: 1, best: 1, v: [["Sage", 279, 16], ["Sand", 279, 12], ["Slate", 279, 9]] },
    { cat: 4, slug: "foldable-baskets-3", kind: "basket", pal: PAL.oak, n: ["Woven storage baskets, set of 3", "Paniers de rangement tressés, lot de 3", "سلال تخزين منسوجة، 3 قطع"], s: ["Nesting baskets with handles.", "Paniers gigognes avec poignées.", "سلال متداخلة بمقابض."], l: ["Three nesting baskets in natural seagrass for toys, laundry or blankets.", "Trois paniers gigognes en jonc de mer naturel pour jouets, linge ou plaids.", "ثلاث سلال متداخلة من الأعشاب البحرية الطبيعية للألعاب والغسيل والبطانيات."], specs: [["dim", "L 40 × 30 cm · M 34 × 26 cm · S 28 × 22 cm"], ["mat", ["Seagrass", "Jonc de mer", "أعشاب بحرية"]], ["pcs", "3"], ["load", "5 kg"]], p: 259, cmp: 0, stock: 29, feat: 1, best: 0, v: [] },
    { cat: 4, slug: "oak-wall-shelf-80", kind: "shelf", pal: PAL.oak, n: ["Solid oak wall shelf 80 cm", "Étagère murale en chêne massif 80 cm", "رف حائط من خشب البلوط 80 سم"], s: ["Hidden brackets, holds up to 15 kg.", "Fixations invisibles, jusqu'à 15 kg.", "حوامل مخفية وتتحمل حتى 15 كغ."], l: ["A clean floating shelf in oiled solid oak. Wall fixings included.", "Une étagère flottante épurée en chêne massif huilé. Fixations murales incluses.", "رف عائم أنيق من البلوط الصلب المزيّت. ملحقات التثبيت مشمولة."], specs: [["dim", "80 × 20 × 4 cm"], ["mat", ["Oiled solid oak", "Chêne massif huilé", "بلوط صلب مزيّت"]], ["weight", "2.3 kg"], ["load", "15 kg"]], p: 329, cmp: 399, stock: 0, feat: 0, best: 1, v: [["60 cm", 289, 14], ["80 cm", 329, 18], ["100 cm", 389, 0]] },
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
        cats[p.cat]!.id, `HRT-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v.length ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `HRT-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Le service est magnifique, la couleur sable est exactement comme sur les photos. Rien n'était cassé à l'ouverture."],
    [5, "Karim", "Rabat", 5, "Soft, heavy enough and the stripes look great on our sofa. Arrived in four days."],
    [7, "Imane", "Tanger", 5, "الأغطية ناعمة جداً ومريحة والمقاس مضبوط على السرير."],
    [2, "Youssef", "Marrakech", 4, "Excellent skillet, a bit heavy but it holds the heat perfectly."],
    [9, "Nadia", "Fès", 5, "Les serviettes sont épaisses et sèchent vite. Très bon rapport qualité-prix."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "HOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("dishes", PAL.sand));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
