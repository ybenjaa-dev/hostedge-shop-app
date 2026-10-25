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

type Kind = "rings" | "blocks" | "bunny" | "train" | "feeding" | "towel" | "bottles" | "onesie" | "jacket" | "stroller" | "nightlight" | "mat";
type Pal = { bg: string; a: string; b: string; c: string; d: string };

/** Soft pastel tile with rounded, friendly flat shapes and a few confetti dots (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { a, b, c, d } = pal;
  const face = (x: number, y: number) => `<circle cx="${x - 16}" cy="${y}" r="5" fill="#2a2f45"/><circle cx="${x + 16}" cy="${y}" r="5" fill="#2a2f45"/><path d="M${x - 10} ${y + 14} Q${x} ${y + 24} ${x + 10} ${y + 14}" stroke="#2a2f45" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="${x - 28}" cy="${y + 12}" r="7" fill="#ff8a8a" opacity=".5"/><circle cx="${x + 28}" cy="${y + 12}" r="7" fill="#ff8a8a" opacity=".5"/>`;
  const S: Record<Kind, string> = {
    rings: `<rect x="288" y="250" width="24" height="320" rx="12" fill="${d}"/><circle cx="300" cy="236" r="26" fill="${c}"/><rect x="190" y="500" width="220" height="64" rx="32" fill="${a}"/><rect x="210" y="440" width="180" height="62" rx="31" fill="${b}"/><rect x="230" y="382" width="140" height="60" rx="30" fill="${c}"/><rect x="250" y="328" width="100" height="56" rx="28" fill="${d}"/>`,
    blocks: `<rect x="150" y="440" width="140" height="140" rx="22" fill="${a}"/><rect x="310" y="440" width="140" height="140" rx="22" fill="${b}"/><rect x="230" y="296" width="140" height="140" rx="22" fill="${c}"/><g fill="#fff" opacity=".85" font-family="sans-serif" font-weight="800" font-size="84" text-anchor="middle"><text x="220" y="545">A</text><text x="380" y="545">B</text><text x="300" y="401">C</text></g>`,
    bunny: `<ellipse cx="248" cy="196" rx="30" ry="86" fill="${a}" transform="rotate(-10 248 196)"/><ellipse cx="352" cy="196" rx="30" ry="86" fill="${a}" transform="rotate(10 352 196)"/><ellipse cx="248" cy="204" rx="14" ry="60" fill="${b}" transform="rotate(-10 248 204)"/><ellipse cx="352" cy="204" rx="14" ry="60" fill="${b}" transform="rotate(10 352 204)"/><ellipse cx="300" cy="500" rx="116" ry="84" fill="${a}"/><circle cx="300" cy="350" r="104" fill="${a}"/>${face(300, 346)}<ellipse cx="300" cy="372" rx="14" ry="10" fill="${c}"/>`,
    train: `<rect x="110" y="410" width="150" height="110" rx="20" fill="${a}"/><rect x="270" y="430" width="120" height="90" rx="20" fill="${b}"/><rect x="400" y="430" width="100" height="90" rx="20" fill="${c}"/><rect x="110" y="350" width="80" height="80" rx="16" fill="${d}"/><rect x="200" y="380" width="30" height="40" rx="8" fill="${d}"/><g fill="#2a2f45"><circle cx="160" cy="536" r="26"/><circle cx="230" cy="536" r="26"/><circle cx="320" cy="536" r="24"/><circle cx="450" cy="536" r="24"/></g><g fill="#fff"><circle cx="160" cy="536" r="9"/><circle cx="230" cy="536" r="9"/><circle cx="320" cy="536" r="8"/><circle cx="450" cy="536" r="8"/></g><circle cx="215" cy="330" r="18" fill="#fff" opacity=".7"/><circle cx="250" cy="296" r="24" fill="#fff" opacity=".5"/>`,
    feeding: `<ellipse cx="300" cy="490" rx="170" ry="50" fill="${a}"/><ellipse cx="300" cy="484" rx="130" ry="34" fill="${b}"/><path d="M170 380 H300 C300 440 270 470 235 470 C200 470 170 440 170 380 Z" fill="${c}"/><rect x="380" y="270" width="26" height="170" rx="13" fill="${d}" transform="rotate(14 393 355)"/><ellipse cx="428" cy="262" rx="38" ry="28" fill="${d}" transform="rotate(14 428 262)"/><circle cx="470" cy="470" r="22" fill="${c}"/>`,
    towel: `<path d="M180 250 Q300 170 420 250 L440 540 H160 Z" fill="${a}"/><path d="M215 262 Q300 206 385 262 Q300 318 215 262 Z" fill="${b}"/><circle cx="260" cy="238" r="20" fill="${a}"/><circle cx="340" cy="238" r="20" fill="${a}"/><circle cx="260" cy="238" r="9" fill="${b}"/><circle cx="340" cy="238" r="9" fill="${b}"/>${face(300, 270).replace(/#2a2f45/g, "#2a2f45")}<rect x="160" y="500" width="280" height="40" fill="${c}" opacity=".6"/>`,
    bottles: [[190, a], [330, b]].map(([x, col]) => `<rect x="${(x as number) + 28}" y="250" width="44" height="40" rx="10" fill="${c}"/><rect x="${(x as number) + 14}" y="280" width="72" height="30" rx="12" fill="${d}"/><rect x="${x}" y="310" width="100" height="250" rx="34" fill="#fff" fill-opacity=".7" stroke="${col}" stroke-width="5"/><rect x="${(x as number) + 10}" y="400" width="80" height="150" rx="26" fill="${col}" opacity=".55"/><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M${(x as number) + 24} 340 V 380"/></g><path d="M${(x as number) + 20} 450 h60 M${(x as number) + 20} 480 h40" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`).join(""),
    onesie: `<path d="M210 210 Q300 280 390 210 L470 270 L420 330 L390 310 V500 Q390 540 350 540 H250 Q210 540 210 500 V310 L180 330 L130 270 Z" fill="${a}"/><path d="M210 210 Q300 280 390 210" stroke="${b}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M250 540 V560 M350 540 V560" stroke="${d}" stroke-width="10" stroke-linecap="round"/><circle cx="300" cy="420" r="38" fill="${c}"/><path d="M300 396 l9 19 21 3 -15 15 4 21 -19 -10 -19 10 4 -21 -15 -15 21 -3 z" fill="#fff"/>`,
    jacket: `<path d="M210 200 Q300 170 390 200 L460 300 L420 520 H180 L140 300 Z" fill="${a}"/><path d="M200 200 Q300 130 400 200 L370 260 H230 Z" fill="${b}"/><path d="M300 262 V520" stroke="${d}" stroke-width="8"/><rect x="230" y="400" width="70" height="60" rx="10" fill="${c}"/><rect x="310" y="400" width="60" height="60" rx="10" fill="${c}"/><g fill="${d}"><circle cx="300" cy="300" r="7"/><circle cx="300" cy="350" r="7"/></g>`,
    stroller: `<path d="M180 420 H420 C420 340 350 280 270 290 L180 420 Z" fill="${a}"/><path d="M180 420 Q300 470 420 420" fill="${b}"/><path d="M420 420 L470 290 H500" stroke="${d}" stroke-width="12" stroke-linecap="round" fill="none"/><path d="M200 440 L170 540 M400 440 L440 540" stroke="${d}" stroke-width="10" stroke-linecap="round"/><g fill="#2a2f45"><circle cx="170" cy="548" r="34"/><circle cx="440" cy="548" r="34"/></g><g fill="${c}"><circle cx="170" cy="548" r="12"/><circle cx="440" cy="548" r="12"/></g>`,
    nightlight: `<path d="M300 220 C360 220 410 266 410 330 C410 390 380 424 360 460 H240 C220 424 190 390 190 330 C190 266 240 220 300 220 Z" fill="${a}"/><circle cx="300" cy="320" r="130" fill="${c}" opacity=".18"/><path d="M330 280 a60 60 0 1 0 0 90 a46 46 0 1 1 0 -90 Z" fill="${c}"/><circle cx="268" cy="296" r="6" fill="${c}"/><rect x="240" y="460" width="120" height="34" rx="12" fill="${d}"/><rect x="224" y="494" width="152" height="52" rx="18" fill="${b}"/>`,
    mat: `<rect x="110" y="330" width="380" height="240" rx="34" fill="${a}"/><g opacity=".9"><circle cx="190" cy="410" r="34" fill="${b}"/><rect x="260" y="380" width="68" height="68" rx="14" fill="${c}"/><path d="M380 380 l34 62 h-68 z" fill="${d}"/><rect x="170" y="490" width="66" height="40" rx="20" fill="${d}"/><circle cx="300" cy="510" r="22" fill="${b}"/><circle cx="380" cy="510" r="22" fill="${c}"/></g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><rect width="600" height="750" fill="${pal.bg}"/><circle cx="500" cy="130" r="70" fill="#fff" opacity=".5"/><circle cx="90" cy="610" r="90" fill="#fff" opacity=".35"/><g fill="#fff" opacity=".8"><circle cx="110" cy="140" r="7"/><circle cx="470" cy="660" r="9"/><circle cx="530" cy="400" r="6"/><circle cx="70" cy="380" r="8"/></g><ellipse cx="300" cy="590" rx="190" ry="16" fill="#2a2f45" opacity=".1"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  wood: { bg: "#fdeac9", a: "#e9a24b", b: "#ff6b57", c: "#3fb6a8", d: "#7a5230" },
  blocks: { bg: "#d8ecfb", a: "#ff6b57", b: "#3b82f6", c: "#ffc933", d: "#1e2a4a" },
  bunny: { bg: "#fde0e6", a: "#f4f1ee", b: "#f7a8b8", c: "#ef7f96", d: "#7a5a60" },
  train: { bg: "#d6f1e8", a: "#ff6b57", b: "#3b82f6", c: "#ffc933", d: "#1e2a4a" },
  feeding: { bg: "#dcf3ee", a: "#fff8ec", b: "#bfe9df", c: "#3fb6a8", d: "#ffc933" },
  towel: { bg: "#fff1c7", a: "#ffd966", b: "#fff6d6", c: "#ffb703", d: "#7a5230" },
  bottles: { bg: "#e4dcfa", a: "#8b7bea", b: "#ff9bb0", c: "#ffc933", d: "#ffffff" },
  onesie: { bg: "#e0f0e8", a: "#ffffff", b: "#8fd3c4", c: "#ffc933", d: "#8fd3c4" },
  jacket: { bg: "#d7eaff", a: "#ffc933", b: "#ff8a3d", c: "#ffffff", d: "#1e2a4a" },
  stroller: { bg: "#e9e2f8", a: "#5b6bd6", b: "#8793ea", c: "#ffc933", d: "#1e2a4a" },
  night: { bg: "#2a2f5c", a: "#5b6bd6", b: "#8793ea", c: "#ffe27a", d: "#ffffff" },
  mat: { bg: "#ffe4d6", a: "#ffd1b8", b: "#ff6b57", c: "#3b82f6", d: "#ffc933" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  age: ["Age", "Âge", "العمر"], mat: ["Material", "Matière", "الخامة"], size: ["Size", "Taille", "المقاس"], care: ["Care", "Entretien", "العناية"], safety: ["Safety", "Sécurité", "السلامة"], pcs: ["Pieces", "Pièces", "عدد القطع"],
};
const AGE: Record<string, T3> = { a0: ["0–6 months", "0–6 mois", "0–6 أشهر"], a1: ["6–12 months", "6–12 mois", "6–12 شهراً"], a2: ["1–3 years", "1–3 ans", "1–3 سنوات"], a3: ["3–6 years", "3–6 ans", "3–6 سنوات"], a4: ["0–3 years", "0–3 ans", "0–3 سنوات"] };
const SAFE: Record<string, T3> = {
  en71: ["EN71 certified", "Norme EN71", "معتمد EN71"], bpa: ["BPA-free", "Sans BPA", "بدون BPA"], paint: ["Non-toxic paint", "Peinture non toxique", "طلاء غير سام"], wash: ["Machine washable", "Lavable en machine", "قابل للغسل بالغسالة"], oeko: ["OEKO-TEX cotton", "Coton OEKO-TEX", "قطن OEKO-TEX"], smooth: ["Rounded edges", "Bords arrondis", "حواف مستديرة"], water: ["Water-repellent", "Déperlant", "طارد للماء"], cpsia: ["Tested for small parts", "Testé pour petites pièces", "مختبر للأجزاء الصغيرة"],
};

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "toys", name: i18n("Toys & play", "Jouets & jeux", "الألعاب"), kind: "blocks" as Kind, pal: PAL.blocks },
    { id: newId(), slug: "feeding-bath", name: i18n("Feeding & bath", "Repas & bain", "التغذية والاستحمام"), kind: "feeding" as Kind, pal: PAL.feeding },
    { id: newId(), slug: "clothing", name: i18n("Clothing", "Vêtements", "الملابس"), kind: "onesie" as Kind, pal: PAL.onesie },
    { id: newId(), slug: "gear-nursery", name: i18n("Gear & nursery", "Équipement & chambre", "المستلزمات وغرفة الطفل"), kind: "stroller" as Kind, pal: PAL.stroller },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; age: string; mat: T3; size?: string; care?: T3; safety: string[]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const WASH: T3 = ["Machine wash 30 °C", "Lavage machine 30 °C", "غسالة 30 درجة"];
  const WIPE: T3 = ["Wipe clean with a damp cloth", "Essuyer avec un chiffon humide", "تُمسح بقطعة قماش رطبة"];
  const products: PD[] = [
    { cat: 0, slug: "wooden-stacking-rings", kind: "rings", pal: PAL.wood, n: ["Wooden stacking rings", "Anneaux à empiler en bois", "حلقات خشبية للتركيب"], s: ["Chunky, easy-grip rings in five colours.", "Gros anneaux faciles à saisir, cinq couleurs.", "حلقات كبيرة سهلة الإمساك بخمسة ألوان."], l: ["A classic first toy that builds hand-eye coordination. Solid beech with water-based paint.", "Un jouet d'éveil classique qui travaille la coordination main-œil. Hêtre massif et peinture à l'eau.", "لعبة أولى كلاسيكية تنمّي التآزر بين اليد والعين. من خشب الزان الصلب بطلاء مائي."], age: "a1", mat: ["Beech wood, water-based paint", "Hêtre, peinture à l'eau", "خشب الزان وطلاء مائي"], size: "Ø 18 cm · H 24 cm", care: WIPE, safety: ["en71", "paint", "smooth"], p: 129, cmp: 159, stock: 38, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "magnetic-blocks-40", kind: "blocks", pal: PAL.blocks, n: ["Magnetic building blocks, 40 pieces", "Blocs de construction aimantés, 40 pièces", "مكعبات مغناطيسية للبناء، 40 قطعة"], s: ["Click, build and rebuild in seconds.", "On clique, on construit, on recommence.", "اضغط وابنِ وأعد البناء في ثوانٍ."], l: ["Brightly coloured tiles with enclosed magnets that snap together to make towers, houses and cars. Comes with a storage bag.", "Tuiles colorées aux aimants intégrés qui s'assemblent pour créer tours, maisons et voitures. Livré avec un sac de rangement.", "قطع ملوّنة بمغناطيس داخلي تلتصق لبناء الأبراج والبيوت والسيارات. تأتي مع حقيبة تخزين."], age: "a3", mat: ["ABS plastic, sealed magnets", "Plastique ABS, aimants scellés", "بلاستيك ABS ومغناطيس مغلق"], size: "40 pcs", care: WIPE, safety: ["en71", "bpa", "cpsia"], p: 249, cmp: 299, stock: 44, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "plush-bunny", kind: "bunny", pal: PAL.bunny, n: ["Soft plush bunny", "Peluche lapin tout doux", "أرنب قطيفة ناعم"], s: ["Cuddly and washable, in two sizes.", "Câlin et lavable, en deux tailles.", "ناعم قابل للغسل بحجمين."], l: ["A first cuddly friend with embroidered eyes (no loose parts) and a long-pile fur. Machine washable.", "Un premier compagnon tout doux aux yeux brodés (aucune pièce détachable) et au poil long. Lavable en machine.", "رفيق أول ناعم بعينين مطرزتين (دون أجزاء قابلة للانفصال) ووبر طويل. قابل للغسل."], age: "a0", mat: ["Polyester plush, recycled fill", "Peluche polyester, rembourrage recyclé", "قطيفة بوليستر وحشوة معاد تدويرها"], care: WASH, safety: ["en71", "wash", "oeko"], p: 99, cmp: 0, stock: 0, feat: 1, best: 0, v: [["Small · 25 cm", 99, 30], ["Large · 40 cm", 159, 14]] },
    { cat: 0, slug: "wooden-train-set-30", kind: "train", pal: PAL.train, n: ["Wooden train set, 30 pieces", "Circuit de train en bois, 30 pièces", "طقم قطار خشبي، 30 قطعة"], s: ["Track, bridge and three wagons.", "Rails, pont et trois wagons.", "مسار وجسر وثلاث عربات."], l: ["Compatible with the most popular wooden rail systems. Smooth birch pieces, painted with non-toxic colours.", "Compatible avec les principaux circuits en bois. Pièces en bouleau poncé, peintes avec des couleurs non toxiques.", "متوافق مع أشهر أنظمة السكك الخشبية. قطع من خشب البتولا الأملس بألوان غير سامة."], age: "a3", mat: ["Birch wood, non-toxic paint", "Bouleau, peinture non toxique", "خشب البتولا وطلاء غير سام"], size: "30 pcs", care: WIPE, safety: ["en71", "paint", "smooth"], p: 299, cmp: 0, stock: 22, feat: 0, best: 1, v: [] },
    { cat: 1, slug: "silicone-feeding-set", kind: "feeding", pal: PAL.feeding, n: ["Silicone feeding set, 4 pieces", "Set repas en silicone, 4 pièces", "طقم تغذية من السيليكون 4 قطع"], s: ["Suction bowl, plate, spoon and bib.", "Bol ventouse, assiette, cuillère et bavoir.", "وعاء بقاعدة شفط وطبق وملعقة ومريلة."], l: ["Soft, food-grade silicone that is dishwasher and microwave safe. The suction base keeps the bowl on the tray.", "Silicone alimentaire souple compatible lave-vaisselle et micro-ondes. La ventouse maintient le bol sur la tablette.", "سيليكون غذائي ناعم آمن لغسالة الأطباق والميكروويف. قاعدة الشفط تثبّت الوعاء على الطاولة."], age: "a1", mat: ["Food-grade silicone", "Silicone alimentaire", "سيليكون غذائي"], care: ["Dishwasher and microwave safe", "Lave-vaisselle et micro-ondes", "آمن لغسالة الأطباق والميكروويف"], safety: ["bpa", "en71", "smooth"], p: 169, cmp: 209, stock: 0, feat: 1, best: 1, v: [["Mint", 169, 20], ["Blush", 169, 16], ["Sand", 169, 0]] },
    { cat: 1, slug: "hooded-bath-towel", kind: "towel", pal: PAL.towel, n: ["Hooded bath towel", "Cape de bain à capuche", "منشفة استحمام بقبعة"], s: ["Ultra-soft cotton with bear ears.", "Coton ultra-doux avec oreilles d'ourson.", "قطن ناعم جداً بأذني دب."], l: ["Wraps baby up warm after the bath. Absorbent organic cotton terry with a roomy hood.", "Enveloppe bébé bien au chaud après le bain. Éponge de coton bio absorbante et capuche généreuse.", "تلفّ الطفل بدفء بعد الاستحمام. قطن عضوي ماص وقبعة واسعة."], age: "a0", mat: ["Organic cotton terry", "Éponge de coton bio", "قطن عضوي"], size: "75 × 75 cm", care: WASH, safety: ["oeko", "wash"], p: 119, cmp: 0, stock: 40, feat: 0, best: 0, v: [] },
    { cat: 1, slug: "baby-bottles-2-pack", kind: "bottles", pal: PAL.bottles, n: ["Anti-colic baby bottles, 2-pack", "Biberons anti-coliques, lot de 2", "رضّاعتان مضادتان للمغص"], s: ["240 ml, slow-flow nipple, BPA-free.", "240 ml, tétine à débit lent, sans BPA.", "240 مل بحلمة بطيئة التدفق وبدون BPA."], l: ["Wide-neck bottles with an air-vent system that reduces colic. Includes two slow-flow nipples.", "Biberons à col large avec système d'aération réduisant les coliques. Livrés avec deux tétines à débit lent.", "رضّاعات بعنق واسع ونظام تهوية يقلل المغص. تأتي مع حلمتين بطيئتي التدفق."], age: "a0", mat: ["PP plastic, silicone nipple", "Plastique PP, tétine silicone", "بلاستيك PP وحلمة سيليكون"], size: "2 × 240 ml", care: ["Dishwasher safe, sterilisable", "Lave-vaisselle, stérilisable", "آمن لغسالة الأطباق وقابل للتعقيم"], safety: ["bpa", "en71"], p: 139, cmp: 169, stock: 52, feat: 1, best: 0, v: [] },
    { cat: 2, slug: "organic-onesies-3", kind: "onesie", pal: PAL.onesie, n: ["Organic cotton onesies, 3-pack", "Bodies en coton bio, lot de 3", "ثلاث بدلات قطن عضوي"], s: ["Envelope neck and snap bottoms.", "Col enveloppe et pressions entrejambe.", "رقبة مرنة وأزرار ضغط سفلية."], l: ["Soft, breathable GOTS-certified cotton in white, sage and sand. Easy to dress with the envelope neckline.", "Coton certifié GOTS doux et respirant en blanc, sauge et sable. Faciles à enfiler grâce au col enveloppe.", "قطن معتمد GOTS ناعم ومسامي بالأبيض والمريمي والرملي. سهلة الارتداء بفضل الرقبة المرنة."], age: "a4", mat: ["100% organic cotton", "100 % coton bio", "100٪ قطن عضوي"], care: WASH, safety: ["oeko", "wash"], p: 149, cmp: 189, stock: 0, feat: 1, best: 1, v: [["0–3 months", 149, 24], ["3–6 months", 149, 30], ["6–12 months", 149, 18]] },
    { cat: 2, slug: "toddler-rain-jacket", kind: "jacket", pal: PAL.jacket, n: ["Toddler rain jacket", "Imperméable pour tout-petit", "جاكيت مطر للأطفال"], s: ["Waterproof, fleece-lined, with a roll-away hood.", "Imperméable, doublé polaire, capuche rétractable.", "مضاد للماء ببطانة صوفية وقبعة قابلة للطي."], l: ["Bright and easy to spot. Taped seams keep the rain out and the zip garage protects little chins.", "Colorée et bien visible. Coutures thermocollées contre la pluie et protège-menton pour la fermeture.", "ألوان زاهية سهلة الرؤية. خياطة محكمة ضد المطر وواقٍ للذقن عند السحاب."], age: "a2", mat: ["Polyester, PU coating, fleece lining", "Polyester, enduit PU, doublure polaire", "بوليستر وطلاء PU وبطانة صوفية"], care: WASH, safety: ["water", "oeko"], p: 229, cmp: 289, stock: 0, feat: 1, best: 0, v: [["2 years", 229, 12], ["3 years", 229, 15], ["4 years", 229, 0]] },
    { cat: 3, slug: "foldable-stroller", kind: "stroller", pal: PAL.stroller, n: ["Lightweight foldable stroller", "Poussette légère pliable", "عربة أطفال خفيفة قابلة للطي"], s: ["One-hand fold, 6.8 kg.", "Pliage à une main, 6,8 kg.", "طي بيد واحدة ووزن 6.8 كغ."], l: ["A compact stroller with a reclining seat, large sun hood and a basket that holds a full shopping bag.", "Une poussette compacte avec assise inclinable, grande capote et panier pouvant contenir un sac de courses.", "عربة مدمجة بمقعد قابل للإمالة وغطاء شمس كبير وسلة تتسع لكيس تسوق كامل."], age: "a4", mat: ["Aluminium frame, polyester fabric", "Cadre aluminium, tissu polyester", "هيكل ألمنيوم وقماش بوليستر"], size: "Folded 52 × 28 × 76 cm", care: WIPE, safety: ["en71", "cpsia"], p: 899, cmp: 1090, stock: 0, feat: 1, best: 1, v: [["Navy", 899, 8], ["Grey", 899, 6]] },
    { cat: 3, slug: "moon-night-light", kind: "nightlight", pal: PAL.night, n: ["Moon night light with timer", "Veilleuse lune avec minuterie", "مصباح ليلي بشكل قمر مع مؤقت"], s: ["Warm glow, tap to dim, 30-minute timer.", "Lumière douce, variateur tactile, minuterie 30 min.", "إضاءة دافئة بلمسة للتعتيم ومؤقت 30 دقيقة."], l: ["Soft silicone lamp with a rechargeable battery. Gentle on sleepy eyes and cool to the touch.", "Lampe en silicone doux à batterie rechargeable. Douce pour les yeux fatigués et fraîche au toucher.", "مصباح سيليكون ناعم ببطارية قابلة للشحن. لطيف على العيون الناعسة وبارد عند اللمس."], age: "a4", mat: ["Silicone, ABS base", "Silicone, base ABS", "سيليكون وقاعدة ABS"], size: "Ø 12 cm", care: WIPE, safety: ["bpa", "en71"], p: 149, cmp: 0, stock: 35, feat: 0, best: 1, v: [] },
    { cat: 3, slug: "foam-play-mat", kind: "mat", pal: PAL.mat, n: ["Reversible foam play mat", "Tapis de jeu réversible en mousse", "سجادة لعب قابلة للقلب من الإسفنج"], s: ["150 × 180 cm, wipe-clean and waterproof.", "150 × 180 cm, imperméable et facile à nettoyer.", "150 × 180 سم مضادة للماء وسهلة التنظيف."], l: ["Thick, cushioned foam with a playful pattern on one side and a calm grey on the other. Folds in half for storage.", "Mousse épaisse et moelleuse avec un motif ludique d'un côté et un gris apaisant de l'autre. Se plie en deux pour le rangement.", "إسفنج سميك ومريح بنقشة مرحة من جهة ورمادي هادئ من الأخرى. يُطوى إلى نصفين للتخزين."], age: "a4", mat: ["XPE foam, PU coating", "Mousse XPE, enduit PU", "إسفنج XPE وطلاء PU"], size: "150 × 180 × 1.5 cm", care: WIPE, safety: ["bpa", "en71"], p: 329, cmp: 399, stock: 18, feat: 0, best: 0, v: [] },
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
      const rows = [`${L.age![li]}: ${AGE[p.age]![li]}`, `${L.mat![li]}: ${p.mat[li]}`];
      if (p.size) rows.push(`${L.size![li]}: ${p.size}`);
      if (p.care) rows.push(`${L.care![li]}: ${p.care[li]}`);
      rows.push(`${L.safety![li]}: ${p.safety.map((s) => SAFE[s]![li]).join(", ")}`);
      return rows.join("\n");
    });
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `TNY-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v.length ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `TNY-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [1, "Salma", "Casablanca", 5, "Mon fils de quatre ans passe des heures dessus. Les aimants sont bien fermés, ça rassure."],
    [8, "Karim", "Rabat", 5, "Perfect size and the colour is easy to spot at the school gate. Stays dry in heavy rain."],
    [4, "Imane", "Tanger", 5, "الطقم عملي جداً والسيليكون سهل التنظيف، وصل بحالة ممتازة."],
    [9, "Youssef", "Marrakech", 4, "Poussette légère et facile à plier d'une main. Un peu chère mais vraiment pratique."],
    [7, "Nadia", "Fès", 5, "Les bodies sont très doux, aucune irritation sur la peau de ma fille."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "TINY10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("bunny", PAL.bunny));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
