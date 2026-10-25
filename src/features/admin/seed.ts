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

type Kind = "dogface" | "catface" | "rabbitface" | "carrierface" | "bag" | "rope" | "harness" | "bed" | "litter" | "post" | "fountain" | "hay" | "brush" | "carrier";
type Pal = { bg: string; a: string; b: string; c: string };

/** Warm flat tile with a faint paw-print pattern: either a friendly animal face or a product (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { a, b, c } = pal;
  const eyes = (x: number, y: number, gap: number) => `<circle cx="${x - gap}" cy="${y}" r="13" fill="#2b2118"/><circle cx="${x + gap}" cy="${y}" r="13" fill="#2b2118"/><circle cx="${x - gap + 4}" cy="${y - 4}" r="4" fill="#fff"/><circle cx="${x + gap + 4}" cy="${y - 4}" r="4" fill="#fff"/>`;
  const S: Record<Kind, string> = {
    dogface: `<ellipse cx="190" cy="360" rx="52" ry="110" fill="${b}" transform="rotate(14 190 360)"/><ellipse cx="410" cy="360" rx="52" ry="110" fill="${b}" transform="rotate(-14 410 360)"/><ellipse cx="300" cy="400" rx="130" ry="140" fill="${a}"/><ellipse cx="300" cy="470" rx="80" ry="62" fill="#fff" opacity=".85"/>${eyes(300, 380, 52)}<ellipse cx="300" cy="438" rx="26" ry="18" fill="#2b2118"/><path d="M300 456 V480 M276 488 Q300 508 324 488" stroke="#2b2118" stroke-width="6" fill="none" stroke-linecap="round"/><ellipse cx="300" cy="500" rx="22" ry="12" fill="${c}" opacity=".9"/>`,
    catface: `<path d="M180 330 L190 200 L270 270 Z" fill="${a}"/><path d="M420 330 L410 200 L330 270 Z" fill="${a}"/><path d="M196 300 L202 232 L246 272 Z" fill="${b}"/><path d="M404 300 L398 232 L354 272 Z" fill="${b}"/><ellipse cx="300" cy="400" rx="140" ry="124" fill="${a}"/>${eyes(300, 390, 54)}<path d="M290 430 L310 430 L300 446 Z" fill="${c}"/><path d="M300 446 Q282 468 262 456 M300 446 Q318 468 338 456" stroke="#2b2118" stroke-width="5" fill="none" stroke-linecap="round"/><g stroke="#2b2118" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M150 420 H220 M150 440 L220 436 M450 420 H380 M450 440 L380 436"/></g>`,
    rabbitface: `<ellipse cx="248" cy="220" rx="36" ry="120" fill="${a}" transform="rotate(-8 248 220)"/><ellipse cx="352" cy="220" rx="36" ry="120" fill="${a}" transform="rotate(8 352 220)"/><ellipse cx="248" cy="226" rx="16" ry="86" fill="${b}" transform="rotate(-8 248 226)"/><ellipse cx="352" cy="226" rx="16" ry="86" fill="${b}" transform="rotate(8 352 226)"/><ellipse cx="300" cy="430" rx="132" ry="118" fill="${a}"/>${eyes(300, 410, 50)}<ellipse cx="300" cy="450" rx="14" ry="10" fill="${c}"/><path d="M300 460 V474 M282 482 Q300 494 318 482" stroke="#2b2118" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="284" y="480" width="14" height="22" rx="4" fill="#fff"/><rect x="302" y="480" width="14" height="22" rx="4" fill="#fff"/>`,
    carrierface: `<rect x="130" y="330" width="340" height="220" rx="46" fill="${a}"/><rect x="160" y="360" width="190" height="160" rx="26" fill="#2b2118" opacity=".18"/><g stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"><path d="M190 380 V500 M230 380 V500 M270 380 V500 M310 380 V500"/></g><path d="M220 330 C 220 260 380 260 380 330" stroke="${c}" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="410" cy="440" r="16" fill="${b}"/>`,
    bag: `<path d="M180 240 L420 240 L440 560 H160 Z" fill="${a}"/><path d="M180 240 H420 L426 290 H174 Z" fill="${b}"/><path d="M180 240 C 200 214 400 214 420 240" fill="${a}"/><circle cx="300" cy="410" r="86" fill="#fff" opacity=".92"/><g fill="${c}"><ellipse cx="300" cy="426" rx="26" ry="22"/><circle cx="262" cy="392" r="11"/><circle cx="286" cy="372" r="11"/><circle cx="314" cy="372" r="11"/><circle cx="338" cy="392" r="11"/></g><rect x="214" y="500" width="172" height="12" rx="6" fill="#fff" opacity=".7"/>`,
    rope: `<path d="M150 470 C 220 360 380 360 450 470" stroke="${a}" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M150 470 C 220 360 380 360 450 470" stroke="#fff" stroke-opacity=".5" stroke-width="40" fill="none" stroke-dasharray="6 22"/><circle cx="150" cy="474" r="38" fill="${b}"/><circle cx="450" cy="474" r="38" fill="${b}"/><circle cx="300" cy="396" r="30" fill="${c}"/>`,
    harness: `<path d="M210 250 Q300 330 390 250 L420 300 Q300 400 180 300 Z" fill="${a}"/><path d="M300 330 V 520" stroke="${a}" stroke-width="44"/><path d="M210 520 H390" stroke="${a}" stroke-width="40" stroke-linecap="round"/><rect x="262" y="360" width="76" height="30" rx="8" fill="${b}"/><circle cx="300" cy="250" r="22" fill="none" stroke="${c}" stroke-width="10"/><g fill="#fff" opacity=".7"><rect x="230" y="486" width="28" height="12" rx="3"/><rect x="342" y="486" width="28" height="12" rx="3"/></g>`,
    bed: `<ellipse cx="300" cy="500" rx="210" ry="76" fill="${a}"/><ellipse cx="300" cy="476" rx="170" ry="52" fill="${b}"/><path d="M110 470 C 90 380 130 330 180 360 C 220 390 220 440 200 480 Z" fill="${a}"/><path d="M490 470 C 510 380 470 330 420 360 C 380 390 380 440 400 480 Z" fill="${a}"/><g fill="${c}" opacity=".85"><ellipse cx="300" cy="480" rx="24" ry="20"/><circle cx="266" cy="450" r="10"/><circle cx="290" cy="432" r="10"/><circle cx="314" cy="432" r="10"/><circle cx="338" cy="450" r="10"/></g>`,
    litter: `<rect x="190" y="230" width="220" height="330" rx="26" fill="${a}"/><path d="M190 290 H410" stroke="${b}" stroke-width="14"/><rect x="220" y="330" width="160" height="150" rx="16" fill="#fff" opacity=".9"/><g fill="${c}"><ellipse cx="300" cy="422" rx="26" ry="22"/><circle cx="264" cy="388" r="11"/><circle cx="288" cy="368" r="11"/><circle cx="312" cy="368" r="11"/><circle cx="336" cy="388" r="11"/></g><rect x="226" y="236" width="148" height="34" rx="10" fill="${b}"/>`,
    post: `<rect x="190" y="520" width="220" height="40" rx="14" fill="${a}"/><rect x="270" y="270" width="60" height="260" fill="${b}"/><g stroke="${c}" stroke-width="5" opacity=".6"><path d="M270 300 H330 M270 340 H330 M270 380 H330 M270 420 H330 M270 460 H330 M270 500 H330"/></g><ellipse cx="300" cy="270" rx="100" ry="38" fill="${a}"/><circle cx="410" cy="300" r="14" fill="${c}"/><path d="M410 314 C 410 380 360 380 340 430" stroke="${c}" stroke-width="6" fill="none"/>`,
    fountain: `<ellipse cx="300" cy="520" rx="170" ry="40" fill="${a}"/><path d="M150 520 V 420 C 150 400 450 400 450 420 V 520 Z" fill="${b}"/><ellipse cx="300" cy="420" rx="150" ry="28" fill="#cfeaf6"/><rect x="262" y="260" width="76" height="160" rx="30" fill="${a}"/><path d="M300 300 C 300 340 270 360 270 400" stroke="#8cd0ee" stroke-width="10" fill="none" stroke-linecap="round"/><circle cx="300" cy="300" r="10" fill="${c}"/><ellipse cx="300" cy="420" rx="90" ry="14" fill="#8cd0ee" opacity=".6"/>`,
    hay: `<rect x="150" y="360" width="300" height="190" rx="22" fill="${a}"/><g stroke="${b}" stroke-width="6" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<path d="M${170 + i * 22} 372 L${176 + i * 22} 540"/>`).join("")}</g><rect x="270" y="360" width="60" height="190" fill="${c}" opacity=".8"/><path d="M180 360 C 200 320 190 300 210 270 M280 360 C 290 320 300 300 310 260 M390 360 C 380 330 400 300 410 280" stroke="${a}" stroke-width="8" fill="none" stroke-linecap="round"/>`,
    brush: `<rect x="170" y="380" width="260" height="110" rx="46" fill="${a}"/><g stroke="${c}" stroke-width="5" stroke-linecap="round">${Array.from({ length: 16 }, (_, i) => `<path d="M${200 + i * 13} 380 V 350"/>`).join("")}</g><circle cx="215" cy="344" r="0" fill="none"/><path d="M430 435 H 520" stroke="${b}" stroke-width="40" stroke-linecap="round"/><rect x="200" y="410" width="200" height="30" rx="15" fill="${b}" opacity=".5"/>`,
    carrier: `<rect x="130" y="330" width="340" height="220" rx="46" fill="${a}"/><rect x="170" y="364" width="180" height="150" rx="26" fill="#2b2118" opacity=".2"/><g stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M200 380 V496 M240 380 V496 M280 380 V496 M320 380 V496"/></g><path d="M220 330 C 220 260 380 260 380 330" stroke="${c}" stroke-width="18" fill="none" stroke-linecap="round"/><rect x="380" y="380" width="60" height="110" rx="14" fill="${b}"/><circle cx="410" cy="436" r="8" fill="#fff"/>`,
  };
  const paws = [[80, 120], [510, 90], [70, 520], [520, 560], [300, 70], [310, 700]].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(.9) rotate(${(x! % 40) - 20})" fill="${pal.c}" opacity=".13"><ellipse cx="0" cy="12" rx="16" ry="13"/><circle cx="-18" cy="-8" r="7"/><circle cx="-6" cy="-18" r="7"/><circle cx="8" cy="-18" r="7"/><circle cx="20" cy="-8" r="7"/></g>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="${pal.bg}"/>${paws}<circle cx="300" cy="400" r="250" fill="#fff" opacity=".4"/><ellipse cx="300" cy="582" rx="190" ry="14" fill="#2b2118" opacity=".1"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  dog: { bg: "#ffe6c7", a: "#d9953f", b: "#a8641f", c: "#7a4513" },
  cat: { bg: "#e7e0f7", a: "#9b8bd6", b: "#c4b8ee", c: "#e88aa3" },
  rabbit: { bg: "#dff2e3", a: "#f4efe8", b: "#f4b6c2", c: "#e88aa3" },
  care: { bg: "#d8ecf6", a: "#4aa3c8", b: "#8cd0ee", c: "#1d6f94" },
  food: { bg: "#ffe0b8", a: "#e8782a", b: "#f7a24d", c: "#a8480d" },
  rope: { bg: "#d8f0e8", a: "#2f9e82", b: "#ff8a1f", c: "#ffd23d" },
  teal: { bg: "#d6efec", a: "#0f766e", b: "#2fa59b", c: "#ff8a1f" },
  bed: { bg: "#fde3e3", a: "#d9737a", b: "#f2a7ac", c: "#8c3a40" },
  litter: { bg: "#e6e9f7", a: "#5a6bc0", b: "#8a98e0", c: "#2b3a8c" },
  post: { bg: "#f0e6d6", a: "#c9a574", b: "#b0884f", c: "#6b4a1f" },
  hay: { bg: "#f1f0cf", a: "#d8c25a", b: "#b9a23a", c: "#6e5f12" },
  brush: { bg: "#f6dff0", a: "#c06aa9", b: "#8c3f7a", c: "#5a1f4c" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  for: ["Suitable for", "Convient à", "مناسب لـ"], stage: ["Life stage", "Stade de vie", "المرحلة العمرية"], size: ["Size", "Taille", "الحجم"], ing: ["Ingredients", "Composition", "المكونات"], feed: ["Feeding guide", "Guide de rations", "دليل التغذية"], care: ["Care", "Entretien", "العناية"], mat: ["Material", "Matière", "الخامة"], weight: ["Weight", "Poids", "الوزن"], dim: ["Dimensions", "Dimensions", "الأبعاد"],
};
const PET: Record<string, T3> = { dog: ["Dog", "Chien", "كلب"], cat: ["Cat", "Chat", "قطة"], rabbit: ["Rabbit", "Lapin", "أرنب"], small: ["Small pets", "Petits animaux", "حيوانات صغيرة"] };
const STAGE: Record<string, T3> = { adult: ["Adult", "Adulte", "بالغ"], all: ["All ages", "Tous âges", "كل الأعمار"], puppy: ["Puppy to adult", "Chiot à adulte", "من الجرو إلى البالغ"] };
const WASH: T3 = ["Wipe clean or hand wash", "Essuyer ou laver à la main", "مسح أو غسل يدوي"];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "dogs", name: i18n("Dogs", "Chiens", "الكلاب"), kind: "dogface" as Kind, pal: PAL.dog },
    { id: newId(), slug: "cats", name: i18n("Cats", "Chats", "القطط"), kind: "catface" as Kind, pal: PAL.cat },
    { id: newId(), slug: "small-pets", name: i18n("Small pets", "Petits animaux", "الحيوانات الصغيرة"), kind: "rabbitface" as Kind, pal: PAL.rabbit },
    { id: newId(), slug: "care-travel", name: i18n("Care & travel", "Soins & voyage", "العناية والسفر"), kind: "carrierface" as Kind, pal: PAL.care },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; pet: string[]; stage?: string; sizeT?: T3; ing?: T3; feed?: string; specs: [string, T3 | string][]; p: number; cmp: number; stock: number; feat: number; best: number; v?: [string, number, number][]; vkey?: string };
  const products: PD[] = [
    { cat: 0, slug: "adult-dog-food-chicken", kind: "bag", pal: PAL.food, n: ["Adult dry dog food — chicken & rice", "Croquettes chien adulte — poulet & riz", "طعام جاف للكلاب البالغة — دجاج وأرز"], s: ["Complete food with 28% chicken, no artificial colours.", "Aliment complet avec 28 % de poulet, sans colorants artificiels.", "طعام متكامل بـ28٪ دجاج دون ألوان صناعية."], l: ["A balanced daily food for adult dogs of medium and large breeds. Omega-3 for a shiny coat and prebiotics for digestion.", "Un aliment quotidien équilibré pour chiens adultes de races moyennes et grandes. Oméga-3 pour un poil brillant et prébiotiques pour la digestion.", "طعام يومي متوازن للكلاب البالغة من السلالات المتوسطة والكبيرة. أوميغا 3 لفرو لامع ومُنشّطات حيوية للهضم."], pet: ["dog"], stage: "adult", sizeT: ["Medium & large breeds", "Races moyennes et grandes", "السلالات المتوسطة والكبيرة"], ing: ["Chicken 28%, rice, maize, chicken fat, beet pulp, fish oil, minerals", "Poulet 28 %, riz, maïs, graisse de poulet, pulpe de betterave, huile de poisson, minéraux", "دجاج 28٪، أرز، ذرة، دهن دجاج، لب الشمندر، زيت سمك، معادن"], feed: "10 kg = 160 g · 20 kg = 260 g · 30 kg = 350 g · 40 kg = 430 g", specs: [], p: 389, cmp: 459, stock: 0, feat: 1, best: 1, v: [["3 kg", 129, 30], ["12 kg", 389, 22], ["20 kg", 589, 0]], vkey: "Weight" },
    { cat: 0, slug: "knotted-rope-toys", kind: "rope", pal: PAL.rope, n: ["Knotted rope chew toys, set of 3", "Jouets à mâcher en corde nouée, lot de 3", "ألعاب حبل معقودة للعض، 3 قطع"], s: ["Cotton rope that cleans teeth while they play.", "Corde en coton qui nettoie les dents pendant le jeu.", "حبل قطني ينظف الأسنان أثناء اللعب."], l: ["Three tough cotton rope toys in different lengths for tug, fetch and chewing. Dye-free and washable.", "Trois jouets en corde de coton résistants de longueurs différentes pour tirer, rapporter et mâcher. Sans teinture et lavables.", "ثلاث ألعاب حبل قطنية متينة بأطوال مختلفة للشد والجلب والعض. بلا صبغات وقابلة للغسل."], pet: ["dog"], stage: "all", specs: [["mat", ["Natural cotton rope", "Corde en coton naturel", "حبل قطن طبيعي"]], ["dim", "20 · 28 · 35 cm"], ["care", WASH]], p: 69, cmp: 89, stock: 70, feat: 1, best: 0 },
    { cat: 0, slug: "no-pull-dog-harness", kind: "harness", pal: PAL.teal, n: ["No-pull dog harness", "Harnais anti-traction pour chien", "حزام منع الشد للكلاب"], s: ["Padded, reflective and quick to put on.", "Rembourré, réfléchissant et rapide à enfiler.", "مبطّن عاكس للضوء وسريع الارتداء."], l: ["A front-clip harness that discourages pulling without pressure on the neck. Reflective stitching for evening walks.", "Un harnais à clip frontal qui limite la traction sans pression sur le cou. Coutures réfléchissantes pour les promenades du soir.", "حزام بمشبك أمامي يقلل الشد دون ضغط على الرقبة. خياطة عاكسة للمشي مساءً."], pet: ["dog"], stage: "all", specs: [["mat", ["Breathable mesh, nylon webbing", "Maille respirante, sangle nylon", "شبك مسامي وحزام نايلون"]], ["care", WASH]], p: 169, cmp: 0, stock: 0, feat: 1, best: 1, v: [["S · chest 40–55 cm", 149, 20], ["M · chest 50–70 cm", 169, 26], ["L · chest 65–90 cm", 189, 0]], vkey: "Size" },
    { cat: 0, slug: "orthopedic-dog-bed", kind: "bed", pal: PAL.bed, n: ["Orthopaedic memory-foam dog bed", "Panier orthopédique à mémoire de forme", "سرير كلاب طبي من الإسفنج الذكي"], s: ["Supports joints, washable cover, non-slip base.", "Soutient les articulations, housse lavable, base antidérapante.", "يدعم المفاصل بغطاء قابل للغسل وقاعدة غير قابلة للانزلاق."], l: ["A bolstered bed with 10 cm of memory foam — ideal for older dogs and heavy sleepers.", "Un panier à rebords avec 10 cm de mousse à mémoire de forme — idéal pour les chiens âgés et les gros dormeurs.", "سرير بحواف مرتفعة و10 سم من الإسفنج الذكي — مثالي للكلاب الكبيرة والنوّامة."], pet: ["dog", "cat"], stage: "all", specs: [["mat", ["Memory foam, soft plush cover", "Mousse à mémoire de forme, housse peluche douce", "إسفنج ذكي وغطاء قطيفة ناعم"]], ["care", ["Removable cover, machine wash 30 °C", "Housse amovible, lavage 30 °C", "غطاء قابل للنزع وغسالة 30 درجة"]]], p: 429, cmp: 529, stock: 0, feat: 1, best: 0, v: [["M · 70 × 50 cm", 429, 12], ["L · 90 × 65 cm", 549, 8]], vkey: "Size" },
    { cat: 1, slug: "adult-cat-food-salmon", kind: "bag", pal: PAL.cat, n: ["Adult dry cat food — salmon", "Croquettes chat adulte — saumon", "طعام جاف للقطط البالغة — سلمون"], s: ["Rich in salmon, with taurine for heart and eyes.", "Riche en saumon, avec taurine pour le cœur et les yeux.", "غني بالسلمون مع التورين لصحة القلب والعينين."], l: ["A complete food for adult cats with controlled minerals for urinary health and hairball-care fibres.", "Un aliment complet pour chats adultes avec minéraux contrôlés pour la santé urinaire et fibres anti-boules de poils.", "طعام متكامل للقطط البالغة بمعادن مضبوطة لصحة المسالك البولية وألياف لتقليل كرات الشعر."], pet: ["cat"], stage: "adult", sizeT: ["All breeds", "Toutes races", "كل السلالات"], ing: ["Salmon 30%, rice, maize gluten, chicken fat, taurine, minerals", "Saumon 30 %, riz, gluten de maïs, graisse de poulet, taurine, minéraux", "سلمون 30٪، أرز، غلوتين الذرة، دهن دجاج، تورين، معادن"], feed: "3 kg = 45 g · 4 kg = 55 g · 5 kg = 65 g · 6 kg = 75 g", specs: [], p: 249, cmp: 299, stock: 0, feat: 1, best: 1, v: [["1.5 kg", 109, 28], ["4 kg", 249, 19]], vkey: "Weight" },
    { cat: 1, slug: "clumping-cat-litter-10l", kind: "litter", pal: PAL.litter, n: ["Clumping cat litter, 10 L", "Litière agglomérante pour chat, 10 L", "رمل قطط متكتل 10 لتر"], s: ["Low-dust, strong clumps, lightly scented.", "Peu poussiéreuse, agglomérats solides, légèrement parfumée.", "قليل الغبار بتكتلات قوية وعطر خفيف."], l: ["Bentonite litter that clumps fast and locks in odour for up to ten days of use.", "Litière en bentonite qui s'agglomère vite et neutralise les odeurs jusqu'à dix jours.", "رمل بنتونيت يتكتل بسرعة ويحبس الروائح حتى عشرة أيام."], pet: ["cat"], stage: "all", specs: [["mat", ["Bentonite clay", "Argile bentonite", "طين بنتونيت"]], ["weight", "≈ 8.5 kg"], ["care", ["Scoop daily, change monthly", "Retirer chaque jour, changer chaque mois", "تنظيف يومي وتغيير شهري"]]], p: 79, cmp: 0, stock: 60, feat: 1, best: 0 },
    { cat: 1, slug: "cat-scratching-post", kind: "post", pal: PAL.post, n: ["Sisal cat scratching post", "Griffoir en sisal pour chat", "عمود خدش للقطط من السيزال"], s: ["70 cm tall with a weighted base and a perch.", "70 cm de haut, base lestée et plateforme.", "ارتفاع 70 سم بقاعدة ثقيلة ومنصة."], l: ["A sturdy post wrapped in natural sisal with a plush perch on top. Stable enough for big cats.", "Un griffoir robuste en sisal naturel avec plateforme en peluche. Assez stable pour les gros chats.", "عمود متين ملفوف بسيزال طبيعي مع منصة قطيفة. ثابت بما يكفي للقطط الكبيرة."], pet: ["cat"], stage: "all", specs: [["mat", ["Natural sisal, plush, MDF base", "Sisal naturel, peluche, base MDF", "سيزال طبيعي وقطيفة وقاعدة MDF"]], ["dim", "Ø 40 cm base · H 70 cm"], ["weight", "3.1 kg"]], p: 229, cmp: 279, stock: 26, feat: 0, best: 1 },
    { cat: 1, slug: "pet-water-fountain-2l", kind: "fountain", pal: PAL.care, n: ["Pet water fountain, 2 L", "Fontaine à eau pour animaux, 2 L", "نافورة مياه للحيوانات 2 لتر"], s: ["Filtered, whisper-quiet running water.", "Eau filtrée en circulation, ultra silencieuse.", "مياه مفلترة متجددة بصمت تام."], l: ["Encourages cats and small dogs to drink more. Three-stage filter and a quiet pump.", "Encourage chats et petits chiens à boire davantage. Filtre en trois étapes et pompe silencieuse.", "تشجّع القطط والكلاب الصغيرة على الشرب أكثر. فلتر بثلاث مراحل ومضخة هادئة."], pet: ["cat", "dog"], stage: "all", sizeT: ["Cats and small dogs", "Chats et petits chiens", "القطط والكلاب الصغيرة"], specs: [["mat", ["BPA-free plastic, ceramic-look", "Plastique sans BPA", "بلاستيك بدون BPA"]], ["dim", "Ø 17 × H 19 cm · 2 L"], ["care", ["Change the filter every 30 days", "Changer le filtre tous les 30 jours", "غيّر الفلتر كل 30 يوماً"]]], p: 199, cmp: 249, stock: 34, feat: 0, best: 0 },
    { cat: 2, slug: "rabbit-food-timothy-1-5kg", kind: "bag", pal: PAL.rabbit, n: ["Rabbit food with timothy hay, 1.5 kg", "Aliment lapin au foin de fléole, 1,5 kg", "طعام أرانب بعشب التيموثي 1.5 كغ"], s: ["High-fibre pellets for healthy teeth and digestion.", "Granulés riches en fibres pour des dents et une digestion saines.", "حبيبات غنية بالألياف لأسنان وهضم سليمين."], l: ["A daily pellet for adult rabbits made with timothy hay. Always serve with fresh hay and water.", "Un granulé quotidien pour lapins adultes à base de foin de fléole. À servir avec du foin frais et de l'eau.", "حبيبات يومية للأرانب البالغة بعشب التيموثي. تقدّم مع دريس طازج وماء."], pet: ["rabbit"], stage: "adult", ing: ["Timothy hay 40%, alfalfa, wheat bran, linseed, vitamins, minerals", "Foin de fléole 40 %, luzerne, son de blé, lin, vitamines, minéraux", "عشب التيموثي 40٪، برسيم حجازي، نخالة قمح، بذور كتان، فيتامينات ومعادن"], feed: "1.5 kg = 25 g · 2.5 kg = 40 g · 4 kg = 60 g", specs: [], p: 89, cmp: 109, stock: 44, feat: 1, best: 0 },
    { cat: 2, slug: "timothy-hay-bale-1kg", kind: "hay", pal: PAL.hay, n: ["Timothy hay bale, 1 kg", "Botte de foin de fléole, 1 kg", "حزمة عشب التيموثي 1 كغ"], s: ["Sweet, dust-reduced hay for rabbits and guinea pigs.", "Foin doux et dépoussiéré pour lapins et cochons d'Inde.", "دريس حلو قليل الغبار للأرانب وخنازير غينيا."], l: ["The staple of a small pet's diet. Second-cut timothy, sun-dried and compressed for freshness.", "La base de l'alimentation des petits animaux. Fléole de deuxième coupe, séchée au soleil et compressée pour rester fraîche.", "أساس غذاء الحيوانات الصغيرة. تيموثي حصاد ثانٍ مجفف بالشمس ومضغوط للحفاظ على الطراوة."], pet: ["rabbit", "small"], stage: "all", specs: [["mat", ["100% timothy hay", "100 % foin de fléole", "100٪ عشب تيموثي"]], ["weight", "1 kg"]], p: 59, cmp: 0, stock: 52, feat: 1, best: 0 },
    { cat: 3, slug: "deshedding-grooming-brush", kind: "brush", pal: PAL.brush, n: ["Self-cleaning grooming brush", "Brosse de toilettage autonettoyante", "فرشاة تمشيط ذاتية التنظيف"], s: ["Removes loose hair, one click to clean.", "Retire les poils morts, un clic pour nettoyer.", "تزيل الشعر المتساقط وتنظف بنقرة واحدة."], l: ["Fine bent bristles lift loose undercoat and tangles without scratching. Suits dogs and cats.", "Fines pointes courbes qui retirent le sous-poil et les nœuds sans griffer. Pour chiens et chats.", "شعيرات دقيقة منحنية ترفع الشعر الميت والعقد دون خدش. للكلاب والقطط."], pet: ["dog", "cat"], stage: "all", specs: [["mat", ["Stainless steel pins, ergonomic grip", "Picots inox, poignée ergonomique", "أسنان ستانلس ومقبض مريح"]], ["care", ["Press the button to release hair", "Appuyer sur le bouton pour libérer les poils", "اضغط الزر لتحرير الشعر"]]], p: 99, cmp: 129, stock: 58, feat: 0, best: 1 },
    { cat: 3, slug: "airline-style-pet-carrier", kind: "carrier", pal: PAL.care, n: ["Ventilated pet carrier", "Caisse de transport ventilée", "حقيبة نقل مهوّاة للحيوانات"], s: ["Sturdy, mesh windows, fits under most seats.", "Solide, fenêtres en maille, passe sous la plupart des sièges.", "متينة بنوافذ شبكية وتناسب أسفل معظم المقاعد."], l: ["A soft-sided carrier with a padded mat, a front and a top opening and a seat-belt strap for the car.", "Un sac de transport souple avec tapis matelassé, ouverture avant et supérieure et sangle de ceinture pour la voiture.", "حقيبة نقل ناعمة بحصيرة مبطّنة وفتحتين أمامية وعلوية وحزام يثبّت بحزام الأمان."], pet: ["cat", "dog"], stage: "all", specs: [["mat", ["Oxford fabric, mesh, steel frame", "Tissu Oxford, maille, armature acier", "قماش أكسفورد وشبك وهيكل فولاذي"]], ["care", WASH]], p: 279, cmp: 339, stock: 0, feat: 0, best: 0, v: [["S · up to 5 kg", 249, 13], ["M · up to 9 kg", 279, 10]], vkey: "Size" },
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
      const rows = [`${L.for![li]}: ${p.pet.map((x) => PET[x]![li]).join(", ")}`];
      if (p.stage) rows.push(`${L.stage![li]}: ${STAGE[p.stage]![li]}`);
      if (p.sizeT) rows.push(`${L.size![li]}: ${p.sizeT[li]}`);
      if (p.ing) rows.push(`${L.ing![li]}: ${p.ing[li]}`);
      if (p.feed) rows.push(`${L.feed![li]}: ${p.feed}`);
      for (const [k, v] of p.specs) rows.push(`${L[k]![li]}: ${typeof v === "string" ? v : v[li]}`);
      return rows.join("\n");
    });
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `PAW-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v?.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ [p.vkey ?? "Option"]: name }), `PAW-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Mon labrador adore ces croquettes et son poil est visiblement plus brillant. Le gros sac est arrivé jusqu'à ma porte."],
    [4, "Karim", "Rabat", 5, "My cat actually finishes her bowl now. The salmon smell is mild and no stomach upset."],
    [3, "Imane", "Tanger", 5, "السرير مريح جداً وكلبي الكبير ينام عليه كل ليلة، والغطاء سهل الغسل."],
    [6, "Youssef", "Marrakech", 4, "Griffoir solide et stable. Mon chat de 6 kg ne le renverse pas."],
    [8, "Nadia", "Fès", 5, "Mes lapins se jettent sur le foin, il sent bon et il y a très peu de poussière."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "PAWS10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on the featured products: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.9, 1], [3, 0.82, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("dogface", PAL.dog));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
