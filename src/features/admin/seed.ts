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

type Kind = "seat" | "wheel" | "mats" | "mount" | "dashcam" | "charger" | "inflator" | "jumper" | "wiper" | "bulb" | "vacuum" | "towels";
type Pal = { body: string; accent: string; glow: string };

/** Garage-style tile: carbon-weave backdrop, a coloured under-glow and a flat product silhouette with a highlight edge (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const { body, accent, glow } = pal;
  const edge = `stroke="#fff" stroke-opacity=".28" stroke-width="2"`;
  const S: Record<Kind, string> = {
    seat: `<path d="M230 170 C 230 140 370 140 370 170 L 392 380 H 208 Z" fill="${body}" ${edge}/><path d="M200 380 H400 C 420 380 430 400 430 420 V 470 C 430 500 410 520 380 520 H220 C 190 520 170 500 170 470 V 420 C 170 400 180 380 200 380 Z" fill="${body}" ${edge}/><path d="M250 200 V 350 M300 200 V 350 M350 200 V 350" stroke="${accent}" stroke-width="5" stroke-dasharray="14 10"/><rect x="236" y="104" width="128" height="40" rx="18" fill="${body}" ${edge}/>`,
    wheel: `<circle cx="300" cy="390" r="170" fill="none" stroke="${body}" stroke-width="40"/><circle cx="300" cy="390" r="170" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/><path d="M130 390 H 220 M380 390 H470 M300 560 V 480" stroke="${body}" stroke-width="40" stroke-linecap="round"/><circle cx="300" cy="390" r="48" fill="${body}" ${edge}/><path d="M178 300 A 170 170 0 0 1 260 232" stroke="${accent}" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    mats: `<path d="M170 210 H430 L460 540 H140 Z" fill="${body}" ${edge}/><path d="M200 240 H400 L424 510 H176 Z" fill="none" stroke="${accent}" stroke-width="5" stroke-dasharray="12 9"/><rect x="262" y="440" width="76" height="40" rx="8" fill="${accent}" opacity=".9"/><g stroke="#fff" stroke-opacity=".12" stroke-width="3">${Array.from({ length: 9 }, (_, i) => `<path d="M${210 + i * 20} 260 V 400"/>`).join("")}</g>`,
    mount: `<rect x="190" y="150" width="220" height="360" rx="34" fill="#0c0f13" ${edge}/><rect x="204" y="166" width="192" height="328" rx="24" fill="#1c2430"/><circle cx="300" cy="570" r="40" fill="${body}" ${edge}/><rect x="284" y="510" width="32" height="40" fill="${body}"/><path d="M110 640 H 490" stroke="${accent}" stroke-width="10" stroke-linecap="round"/><path d="M250 640 V 590" stroke="${body}" stroke-width="14"/>`,
    dashcam: `<rect x="150" y="270" width="300" height="190" rx="30" fill="${body}" ${edge}/><circle cx="300" cy="365" r="64" fill="#0c0f13" stroke="#fff" stroke-opacity=".4" stroke-width="4"/><circle cx="300" cy="365" r="34" fill="#1c2c46"/><circle cx="288" cy="352" r="10" fill="#fff" opacity=".5"/><circle cx="420" cy="300" r="9" fill="${accent}"/><rect x="270" y="210" width="60" height="64" rx="8" fill="${body}"/><path d="M220 210 H380" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`,
    charger: `<rect x="215" y="260" width="170" height="250" rx="34" fill="${body}" ${edge}/><rect x="248" y="180" width="104" height="90" rx="12" fill="#0c0f13"/><g fill="#0c0f13"><circle cx="264" cy="350" r="22"/><circle cx="336" cy="350" r="22"/></g><circle cx="264" cy="350" r="9" fill="${accent}"/><circle cx="336" cy="350" r="9" fill="${accent}"/><rect x="250" y="420" width="100" height="14" rx="7" fill="${accent}"/><path d="M300 180 V 120" stroke="#9aa3ad" stroke-width="14" stroke-linecap="round"/>`,
    inflator: `<rect x="170" y="250" width="260" height="250" rx="40" fill="${body}" ${edge}/><rect x="210" y="290" width="180" height="90" rx="14" fill="#0c0f13"/><text x="300" y="352" text-anchor="middle" font-family="monospace" font-weight="700" font-size="54" fill="${accent}">36</text><circle cx="250" cy="440" r="22" fill="#0c0f13"/><circle cx="350" cy="440" r="22" fill="#0c0f13"/><path d="M430 400 C 520 400 520 520 440 560" stroke="#9aa3ad" stroke-width="14" fill="none" stroke-linecap="round"/><rect x="428" y="550" width="52" height="34" rx="8" fill="${accent}"/>`,
    jumper: `<rect x="160" y="280" width="280" height="200" rx="32" fill="${body}" ${edge}/><rect x="190" y="310" width="140" height="60" rx="10" fill="#0c0f13"/><g fill="${accent}"><rect x="200" y="322" width="20" height="36" rx="3"/><rect x="226" y="322" width="20" height="36" rx="3"/><rect x="252" y="322" width="20" height="36" rx="3"/></g><circle cx="380" cy="340" r="28" fill="${accent}" opacity=".9"/><path d="M386 322 l-14 22 h14 l-8 20" stroke="#0c0f13" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M190 280 C 160 200 120 180 100 150 M410 280 C 440 200 480 180 500 150" stroke="#e11d2e" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="100" cy="146" r="18" fill="#e11d2e"/><circle cx="500" cy="146" r="18" fill="#111"/>`,
    wiper: `<path d="M110 480 C 220 420 380 420 490 480" stroke="${body}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M110 500 C 220 440 380 440 490 500" stroke="#0c0f13" stroke-width="8" fill="none" stroke-linecap="round"/><rect x="274" y="380" width="52" height="56" rx="10" fill="${body}" ${edge}/><path d="M300 380 V 300" stroke="${body}" stroke-width="20" stroke-linecap="round"/><g stroke="${accent}" stroke-width="4" opacity=".7" stroke-linecap="round"><path d="M180 250 l30 -30 M260 220 l30 -30 M340 220 l30 -30 M420 250 l30 -30"/></g>`,
    bulb: `<path d="M300 150 C 220 150 190 220 220 290 C 236 326 252 336 252 380 H 348 C 348 336 364 326 380 290 C 410 220 380 150 300 150 Z" fill="${glow}" opacity=".28"/><path d="M300 190 C 250 190 232 238 252 284 C 262 306 272 314 272 340 H 328 C 328 314 338 306 348 284 C 368 238 350 190 300 190 Z" fill="#fff" opacity=".9"/><path d="M280 300 V 250 M300 300 V 230 M320 300 V 250" stroke="${accent}" stroke-width="6" stroke-linecap="round"/><rect x="262" y="380" width="76" height="40" rx="6" fill="${body}"/><rect x="262" y="420" width="76" height="60" rx="6" fill="#0c0f13" ${edge}/><path d="M280 480 V 520 M320 480 V 520" stroke="#9aa3ad" stroke-width="8"/>`,
    vacuum: `<rect x="250" y="150" width="100" height="320" rx="46" fill="${body}" ${edge}/><rect x="262" y="190" width="76" height="110" rx="18" fill="#0c0f13"/><circle cx="300" cy="350" r="22" fill="${accent}"/><path d="M300 470 L 300 520 L 200 570 H 120 C 100 570 100 540 120 540 H 180" stroke="${body}" stroke-width="30" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M110 560 H 160" stroke="${accent}" stroke-width="10" stroke-linecap="round"/>`,
    towels: `<rect x="150" y="440" width="300" height="70" rx="12" fill="${accent}"/><rect x="156" y="372" width="288" height="70" rx="12" fill="${body}" ${edge}/><rect x="150" y="306" width="300" height="70" rx="12" fill="#dfe5ec"/><rect x="160" y="240" width="280" height="70" rx="12" fill="${body}" ${edge}/><g stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="3 9">${[270, 340, 410, 475].map((y) => `<path d="M170 ${y} H430"/>`).join("")}</g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><pattern id="cw" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#fff" opacity=".04"/><rect x="6" y="6" width="6" height="6" fill="#fff" opacity=".04"/></pattern><radialGradient id="gl" cx=".5" cy=".62" r=".55"><stop offset="0" stop-color="${glow}" stop-opacity=".55"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient></defs><rect width="600" height="750" fill="#12161c"/><rect width="600" height="750" fill="url(#cw)"/><rect width="600" height="750" fill="url(#gl)"/><path d="M0 640 H600" stroke="#fff" stroke-opacity=".1"/><ellipse cx="300" cy="610" rx="200" ry="16" fill="#000" opacity=".5"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  red: { body: "#3a3f48", accent: "#e11d2e", glow: "#e11d2e" },
  steel: { body: "#4a5260", accent: "#cfd6df", glow: "#60a5fa" },
  amber: { body: "#3a3f48", accent: "#f5a30b", glow: "#f5a30b" },
  green: { body: "#33403a", accent: "#34d399", glow: "#34d399" },
  blue: { body: "#2c3a52", accent: "#60a5fa", glow: "#3b82f6" },
  white: { body: "#e4e8ee", accent: "#e11d2e", glow: "#cfd6df" },
} satisfies Record<string, Pal>;

type T3 = [string, string, string];
const L: Record<string, T3> = {
  fits: ["Compatibility", "Compatibilité", "التوافق"], mat: ["Material", "Matière", "الخامة"], power: ["Power", "Puissance", "القدرة"], dim: ["Dimensions", "Dimensions", "الأبعاد"], warranty: ["Warranty", "Garantie", "الضمان"], install: ["Installation", "Installation", "التركيب"], res: ["Resolution", "Résolution", "الدقة"], cap: ["Capacity", "Capacité", "السعة"], len: ["Length", "Longueur", "الطول"],
};
const UNI: T3 = ["Universal", "Universel", "عالمي"];
const W12: T3 = ["12 months", "12 mois", "12 شهراً"];
const PLUG: T3 = ["Plug and play, no tools", "Prêt à brancher, sans outils", "جاهز للتوصيل دون أدوات"];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "interior", name: i18n("Interior", "Intérieur", "المقصورة"), kind: "seat" as Kind, pal: PAL.red },
    { id: newId(), slug: "electronics", name: i18n("Electronics", "Électronique", "الإلكترونيات"), kind: "dashcam" as Kind, pal: PAL.blue },
    { id: newId(), slug: "tools-emergency", name: i18n("Tools & emergency", "Outils & urgence", "الأدوات والطوارئ"), kind: "jumper" as Kind, pal: PAL.amber },
    { id: newId(), slug: "exterior-care", name: i18n("Exterior & care", "Extérieur & entretien", "الخارج والعناية"), kind: "wiper" as Kind, pal: PAL.steel },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: T3; s: T3; l: T3; fits: string | T3; specs: [string, T3 | string][]; p: number; cmp: number; stock: number; feat: number; best: number; v?: [string, number, number][]; vkey?: string };
  const products: PD[] = [
    { cat: 0, slug: "universal-seat-covers", kind: "seat", pal: PAL.red, n: ["Universal seat cover set", "Housses de siège universelles", "طقم أغطية مقاعد عالمي"], s: ["Full set for 5 seats, breathable leatherette.", "Jeu complet 5 places en similicuir respirant.", "طقم كامل لـ5 مقاعد من جلد صناعي مسامي."], l: ["Front and rear covers with elastic straps and hooks. Fits most hatchbacks, saloons and SUVs, with airbag-safe seams.", "Housses avant et arrière avec sangles élastiques et crochets. S'adapte à la plupart des citadines, berlines et SUV, coutures compatibles airbag.", "أغطية أمامية وخلفية بأشرطة مطاطية وخطاطيف. تناسب معظم السيارات الصغيرة والسيدان والـSUV بخياطة آمنة للوسائد الهوائية."], fits: UNI, specs: [["mat", ["Perforated leatherette", "Similicuir perforé", "جلد صناعي مثقّب"]], ["install", ["20 minutes, no tools", "20 minutes, sans outils", "20 دقيقة دون أدوات"]], ["warranty", W12]], p: 449, cmp: 549, stock: 36, feat: 1, best: 1 },
    { cat: 0, slug: "leather-steering-cover", kind: "wheel", pal: PAL.red, n: ["Leather steering wheel cover", "Couvre-volant en cuir", "غطاء مقود جلدي"], s: ["Non-slip grip, stitched by hand.", "Prise antidérapante, cousu main.", "قبضة غير قابلة للانزلاق بخياطة يدوية."], l: ["A snug stitch-on-style cover that adds grip and keeps the wheel cool in summer. Three sizes.", "Un couvre-volant ajusté qui améliore la prise et reste frais l'été. Trois tailles.", "غطاء محكم يزيد القبضة ويبقى بارداً صيفاً. بثلاثة مقاسات."], fits: UNI, specs: [["mat", ["Genuine leather", "Cuir véritable", "جلد طبيعي"]], ["dim", "Ø 37–39 cm"], ["install", ["Slip-on, 5 minutes", "À enfiler, 5 minutes", "يُركّب في 5 دقائق"]]], p: 129, cmp: 0, stock: 0, feat: 1, best: 0, v: [["S · 36–38 cm", 129, 20], ["M · 38–40 cm", 129, 26], ["L · 40–42 cm", 139, 0]], vkey: "Size" },
    { cat: 0, slug: "rubber-floor-mats", kind: "mats", pal: PAL.red, n: ["Custom-fit rubber floor mats", "Tapis de sol en caoutchouc sur mesure", "دعاسات أرضية مطاطية مفصّلة"], s: ["Deep-tray set of 4, cut for your model.", "Jeu de 4 à bords relevés, coupé pour votre modèle.", "طقم من 4 قطع بحواف عميقة مقصوص لطرازك."], l: ["Laser-measured rubber mats with a raised edge that traps water and mud. Pick your car below.", "Tapis en caoutchouc mesurés au laser avec bord relevé qui retient eau et boue. Choisissez votre voiture.", "دعاسات مطاطية مقاسة بالليزر بحافة مرتفعة تحبس الماء والطين. اختر سيارتك."], fits: "Dacia Logan, Dacia Sandero, Renault Clio, Peugeot 208, Toyota Yaris", specs: [["mat", ["TPE rubber", "Caoutchouc TPE", "مطاط TPE"]], ["install", ["Drop in, anchored by clips", "À poser, fixés par clips", "تُوضع وتُثبّت بمشابك"]], ["warranty", ["24 months", "24 mois", "24 شهراً"]]], p: 399, cmp: 499, stock: 0, feat: 1, best: 1, v: [["Dacia Logan", 399, 14], ["Dacia Sandero", 399, 11], ["Renault Clio", 399, 9], ["Peugeot 208", 399, 0], ["Toyota Yaris", 429, 7]], vkey: "Car" },
    { cat: 0, slug: "magnetic-phone-mount", kind: "mount", pal: PAL.steel, n: ["Magnetic vent phone mount", "Support téléphone magnétique", "حامل هاتف مغناطيسي"], s: ["Clips to the air vent, one-hand use.", "Se fixe à l'aération, utilisable d'une main.", "يُثبّت على فتحة التهوية ويُستخدم بيد واحدة."], l: ["Strong N52 magnets hold any phone with the included plate. The hook clip is gentle on louvres.", "Aimants N52 puissants avec plaque incluse pour tout téléphone. La pince à crochet ménage les ailettes.", "مغناطيس N52 قوي مع لوحة مرفقة لأي هاتف. المشبك لطيف على فتحات التهوية."], fits: UNI, specs: [["mat", ["ABS and aluminium", "ABS et aluminium", "ABS وألمنيوم"]], ["install", PLUG], ["warranty", W12]], p: 99, cmp: 129, stock: 80, feat: 0, best: 1 },
    { cat: 1, slug: "dash-cam-1080p", kind: "dashcam", pal: PAL.blue, n: ["1080p dash cam with night vision", "Dashcam 1080p avec vision nocturne", "كاميرا داشكام 1080p برؤية ليلية"], s: ["Loop recording, G-sensor and 24 h parking mode.", "Enregistrement en boucle, G-sensor et mode parking 24 h.", "تسجيل متواصل وحساس صدمات ووضع ركن 24 ساعة."], l: ["A discreet 170° wide-angle camera that records every trip. Locks clips on impact and supports cards up to 128 GB.", "Une caméra discrète grand angle 170° qui enregistre chaque trajet. Verrouille les vidéos en cas de choc et accepte les cartes jusqu'à 128 Go.", "كاميرا أنيقة بزاوية 170° تسجّل كل رحلة. تحمي المقاطع عند الصدمة وتدعم بطاقات حتى 128 غ."], fits: UNI, specs: [["res", "1080p @ 30 fps · 170°"], ["power", ["12 V cigarette lighter", "12 V allume-cigare", "12 فولت قابس الولاعة"]], ["cap", ["microSD up to 128 GB (not included)", "microSD jusqu'à 128 Go (non incluse)", "microSD حتى 128 غ (غير مرفقة)"]], ["install", PLUG], ["warranty", W12]], p: 549, cmp: 699, stock: 0, feat: 1, best: 1, v: [["Front only", 549, 22], ["Front + rear", 799, 13]], vkey: "Kit" },
    { cat: 1, slug: "dual-usb-c-car-charger", kind: "charger", pal: PAL.blue, n: ["45 W dual USB-C car charger", "Chargeur voiture double USB-C 45 W", "شاحن سيارة 45 واط بمنفذين USB-C"], s: ["Charges a phone and a tablet at once.", "Recharge un téléphone et une tablette en même temps.", "يشحن هاتفاً ولوحياً في الوقت نفسه."], l: ["Two USB-C ports with Power Delivery and a smart chip that protects your devices. Low-profile metal body.", "Deux ports USB-C Power Delivery et une puce intelligente qui protège vos appareils. Boîtier métal discret.", "منفذان USB-C مع Power Delivery ورقاقة ذكية تحمي أجهزتك. هيكل معدني منخفض."], fits: UNI, specs: [["power", "45 W total (30 W + 15 W)"], ["mat", ["Aluminium alloy", "Alliage d'aluminium", "سبائك ألمنيوم"]], ["install", PLUG], ["warranty", W12]], p: 119, cmp: 149, stock: 90, feat: 1, best: 0 },
    { cat: 2, slug: "tyre-inflator-12v", kind: "inflator", pal: PAL.amber, n: ["Digital tyre inflator 12 V", "Gonfleur de pneus numérique 12 V", "منفخ إطارات رقمي 12 فولت"], s: ["Set the pressure, it stops by itself.", "Réglez la pression, il s'arrête tout seul.", "اضبط الضغط ويتوقف تلقائياً."], l: ["Inflates a car tyre in under four minutes with a clear digital gauge, LED light and auto shut-off.", "Gonfle un pneu de voiture en moins de quatre minutes avec manomètre numérique, lampe LED et arrêt automatique.", "ينفخ إطار سيارة في أقل من أربع دقائق بمقياس رقمي واضح ومصباح LED وإيقاف تلقائي."], fits: UNI, specs: [["power", "12 V · 120 W"], ["cap", "Up to 10 bar (150 psi)"], ["len", "3 m cable"], ["install", PLUG], ["warranty", W12]], p: 249, cmp: 299, stock: 41, feat: 1, best: 0 },
    { cat: 2, slug: "jump-starter-12000", kind: "jumper", pal: PAL.amber, n: ["Jump starter 12,000 mAh", "Booster de démarrage 12 000 mAh", "جهاز تشغيل طارئ 12,000 مللي أمبير"], s: ["Starts petrol engines up to 4.5 L, and charges your phone.", "Démarre les moteurs essence jusqu'à 4,5 L et recharge votre téléphone.", "يشغّل محركات البنزين حتى 4.5 لتر ويشحن هاتفك."], l: ["Compact lithium booster with smart clamps, reverse-polarity protection and a built-in torch.", "Booster lithium compact avec pinces intelligentes, protection inversion de polarité et lampe intégrée.", "جهاز ليثيوم مدمج بمشابك ذكية وحماية من عكس القطبية ومصباح مدمج."], fits: UNI, specs: [["cap", "12,000 mAh · 600 A peak"], ["power", ["Petrol up to 4.5 L · Diesel up to 2.5 L", "Essence jusqu'à 4,5 L · Diesel jusqu'à 2,5 L", "بنزين حتى 4.5 لتر · ديزل حتى 2.5 لتر"]], ["install", ["Clamp on the battery", "Pinces sur la batterie", "مشابك على البطارية"]], ["warranty", W12]], p: 599, cmp: 749, stock: 0, feat: 1, best: 1, v: [["600 A", 599, 12], ["1000 A", 849, 8]], vkey: "Peak" },
    { cat: 3, slug: "all-season-wiper-blades", kind: "wiper", pal: PAL.steel, n: ["All-season wiper blades", "Balais d'essuie-glace toutes saisons", "شفرات مساحات لكل الفصول"], s: ["Streak-free silicone, universal arm adapters.", "Silicone sans traces, adaptateurs de bras universels.", "سيليكون بلا خطوط مع محوّلات أذرع عالمية."], l: ["Flat beam blades that hug the curve of the windscreen. Includes adapters for most arm types.", "Balais plats qui épousent la courbure du pare-brise. Adaptateurs inclus pour la plupart des bras.", "شفرات مسطحة تلتصق بانحناء الزجاج الأمامي. تأتي مع محوّلات لمعظم أنواع الأذرع."], fits: UNI, specs: [["mat", ["Silicone rubber, steel frame", "Caoutchouc silicone, armature acier", "مطاط سيليكون وهيكل فولاذي"]], ["install", ["Clip-on, 5 minutes", "Fixation par clip, 5 minutes", "تركيب بمشبك في 5 دقائق"]], ["warranty", W12]], p: 119, cmp: 0, stock: 0, feat: 0, best: 0, v: [["18″ / 45 cm", 99, 25], ["20″ / 50 cm", 109, 31], ["22″ / 55 cm", 119, 18], ["24″ / 60 cm", 129, 0], ["26″ / 65 cm", 139, 14]], vkey: "Length" },
    { cat: 3, slug: "led-headlight-bulbs-h7", kind: "bulb", pal: PAL.white, n: ["LED headlight bulbs H7 (pair)", "Ampoules LED H7 (paire)", "مصباحا LED طراز H7 (زوج)"], s: ["6000 K white light, plug-in H7 fitting.", "Lumière blanche 6000 K, culot H7 à brancher.", "ضوء أبيض 6000 كلفن بقاعدة H7."], l: ["A bright, cool-white upgrade for halogen H7 headlights. Check that your car uses H7 — the list below shows tested models.", "Une mise à niveau lumineuse blanc froid pour les phares halogènes H7. Vérifiez que votre voiture utilise du H7 — la liste ci-dessous indique les modèles testés.", "ترقية ساطعة بلون أبيض بارد لمصابيح H7 الهالوجينية. تأكد أن سيارتك تستخدم H7 — القائمة أدناه تعرض الطرازات المختبرة."], fits: "Dacia Logan, Dacia Sandero, Dacia Duster, Renault Clio, Renault Megane, Peugeot 208, Peugeot 301, Citroën C3, Toyota Corolla, Hyundai Accent, Volkswagen Polo, Volkswagen Golf, Fiat Tipo, Ford Focus, Kia Rio", specs: [["power", "2 × 35 W · 8,000 lm"], ["mat", ["Aluminium heat sink, CANbus-ready", "Dissipateur aluminium, compatible CANbus", "مشتت حراري ألمنيوم ومتوافق مع CANbus"]], ["install", ["Plug-in, 15 minutes", "À brancher, 15 minutes", "تركيب في 15 دقيقة"]], ["warranty", ["24 months", "24 mois", "24 شهراً"]]], p: 249, cmp: 329, stock: 48, feat: 0, best: 1 },
    { cat: 3, slug: "cordless-car-vacuum", kind: "vacuum", pal: PAL.green, n: ["Cordless car vacuum cleaner", "Aspirateur de voiture sans fil", "مكنسة سيارة لاسلكية"], s: ["8,000 Pa suction, 3 attachments.", "Aspiration 8 000 Pa, 3 embouts.", "شفط 8,000 باسكال مع 3 ملحقات."], l: ["A compact handheld that reaches under seats and into door pockets. USB-C rechargeable.", "Un aspirateur compact qui atteint le dessous des sièges et les vide-poches. Rechargeable en USB-C.", "مكنسة يدوية صغيرة تصل أسفل المقاعد وجيوب الأبواب. قابلة للشحن عبر USB-C."], fits: UNI, specs: [["power", "8,000 Pa · 120 W"], ["cap", ["30 min runtime", "30 min d'autonomie", "30 دقيقة تشغيل"]], ["install", ["No install", "Aucune installation", "لا يحتاج تركيباً"]], ["warranty", W12]], p: 279, cmp: 349, stock: 33, feat: 1, best: 0 },
    { cat: 3, slug: "microfibre-towels-6", kind: "towels", pal: PAL.white, n: ["Microfibre cloths, 6-pack", "Chiffons microfibre, lot de 6", "6 مناشف مايكروفايبر"], s: ["Scratch-free for paint, glass and interior.", "Sans rayures pour peinture, vitres et intérieur.", "لا تخدش الطلاء والزجاج والمقصورة."], l: ["Six 350 gsm cloths in colour-coded pairs for paint, glass and interior. Machine washable.", "Six chiffons 350 g/m² en paires de couleurs pour carrosserie, vitres et intérieur. Lavables en machine.", "ست مناشف 350 غ/م² بأزواج ملوّنة للهيكل والزجاج والمقصورة. قابلة للغسل بالغسالة."], fits: UNI, specs: [["mat", ["Microfibre 350 gsm", "Microfibre 350 g/m²", "مايكروفايبر 350 غ/م²"]], ["dim", "40 × 40 cm"], ["warranty", W12]], p: 79, cmp: 99, stock: 120, feat: 0, best: 0 },
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
    const specLines = [0, 1, 2].map((li) => [`${L.fits![li]}: ${typeof p.fits === "string" ? p.fits : p.fits[li]}`, ...p.specs.map(([k, v]) => `${L[k]![li]}: ${typeof v === "string" ? v : v[li]}`)].join("\n"));
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `TRQ-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v?.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ [p.vkey ?? "Option"]: name }), `TRQ-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [3, "Karim", "Casablanca", 5, "Tapis parfaitement ajustés à ma Logan, aucune pièce ne bouge. Ils retiennent bien l'eau."],
    [4, "Salma", "Rabat", 5, "The dash cam footage is sharp even at night and the parking mode is a real peace of mind."],
    [8, "Youssef", "Tanger", 5, "المساحات صامتة ولا تترك خطوطاً، تركيبها كان سهلاً."],
    [9, "Imane", "Marrakech", 4, "Ampoules LED bien plus lumineuses que mes halogènes. Montage en 10 minutes sur ma Clio."],
    [7, "Nadia", "Fès", 5, "Le booster m'a dépannée deux fois cet hiver, très compact."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "TORQUE10", "percent", 10, 0),
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
  await putSvg(env, "uploads/sample-hero.svg", svg("dashcam", PAL.red));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
