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

type Kind = "phone" | "earbuds" | "watch" | "powerbank" | "charger" | "speaker" | "keyboard" | "mouse" | "stand" | "hub" | "bulb" | "webcam";
type Pal = { c1: string; c2: string; body: string; glow: string };

/** Dark "studio" tile with a grid, a glow and a flat product silhouette (portrait 4:5). */
export function svg(kind: Kind, pal: Pal) {
  const edge = "#ffffff";
  const S: Record<Kind, string> = {
    phone: `<rect x="215" y="150" width="170" height="360" rx="30" fill="${pal.body}" stroke="${edge}" stroke-opacity=".35" stroke-width="2"/><rect x="226" y="162" width="148" height="336" rx="22" fill="#0a1020"/><rect x="226" y="162" width="148" height="336" rx="22" fill="url(#sc)"/><rect x="278" y="172" width="44" height="12" rx="6" fill="#000"/><circle cx="342" cy="216" r="0" /><rect x="236" y="250" width="128" height="10" rx="5" fill="#fff" opacity=".85"/><rect x="236" y="272" width="86" height="8" rx="4" fill="#fff" opacity=".4"/><rect x="236" y="420" width="128" height="56" rx="14" fill="#fff" opacity=".12"/>`,
    earbuds: `<rect x="190" y="360" width="220" height="150" rx="56" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><path d="M190 420 H410" stroke="#fff" stroke-opacity=".25"/><circle cx="300" cy="400" r="6" fill="${pal.glow}"/><g><ellipse cx="236" cy="290" rx="26" ry="38" fill="#f4f6fb" transform="rotate(-12 236 290)"/><rect x="226" y="316" width="16" height="64" rx="8" fill="#f4f6fb"/></g><g><ellipse cx="364" cy="290" rx="26" ry="38" fill="#f4f6fb" transform="rotate(12 364 290)"/><rect x="358" y="316" width="16" height="64" rx="8" fill="#f4f6fb"/></g>`,
    watch: `<rect x="258" y="130" width="84" height="120" rx="14" fill="#1a2238"/><rect x="258" y="450" width="84" height="120" rx="14" fill="#1a2238"/><rect x="214" y="230" width="172" height="220" rx="46" fill="${pal.body}" stroke="${edge}" stroke-opacity=".35" stroke-width="3"/><rect x="226" y="242" width="148" height="196" rx="36" fill="#05080f"/><circle cx="300" cy="340" r="52" fill="none" stroke="${pal.glow}" stroke-width="10" stroke-dasharray="230 100"/><rect x="278" y="322" width="44" height="12" rx="6" fill="#fff"/><rect x="286" y="344" width="28" height="8" rx="4" fill="#fff" opacity=".5"/><rect x="386" y="318" width="10" height="42" rx="5" fill="${pal.body}"/>`,
    powerbank: `<rect x="190" y="215" width="220" height="320" rx="34" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><rect x="214" y="250" width="172" height="86" rx="12" fill="#05080f"/><text x="300" y="306" text-anchor="middle" font-family="monospace" font-size="42" font-weight="700" fill="${pal.glow}">85%</text><g fill="${pal.glow}">${[0, 1, 2, 3].map((i) => `<rect x="${222 + i * 40}" y="356" width="30" height="10" rx="3" opacity="${i < 3 ? 1 : 0.3}"/>`).join("")}</g><rect x="232" y="470" width="50" height="16" rx="6" fill="#05080f"/><rect x="298" y="470" width="50" height="16" rx="6" fill="#05080f"/>`,
    charger: `<rect x="215" y="270" width="170" height="210" rx="26" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><rect x="262" y="206" width="14" height="70" rx="4" fill="#d6dbe6"/><rect x="324" y="206" width="14" height="70" rx="4" fill="#d6dbe6"/><rect x="238" y="380" width="46" height="22" rx="8" fill="#05080f"/><rect x="298" y="380" width="46" height="22" rx="8" fill="#05080f"/><rect x="238" y="416" width="106" height="18" rx="8" fill="#05080f"/><text x="300" y="344" text-anchor="middle" font-family="monospace" font-size="38" font-weight="700" fill="${pal.glow}">65W</text>`,
    speaker: `<rect x="212" y="215" width="176" height="300" rx="70" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><g fill="#05080f" opacity=".7">${Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) => `<circle cx="${244 + c * 22.5}" cy="${262 + r * 22.5}" r="4.2"/>`).join("")).join("")}</g><circle cx="300" cy="440" r="22" fill="none" stroke="${pal.glow}" stroke-width="5"/><rect x="292" y="432" width="16" height="16" rx="4" fill="${pal.glow}"/>`,
    keyboard: `<rect x="130" y="290" width="340" height="190" rx="22" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><g fill="#0c1424" stroke="${edge}" stroke-opacity=".2">${Array.from({ length: 4 }, (_, r) => Array.from({ length: r === 3 ? 1 : 10 }, (_, c) => r === 3 ? `<rect x="${200}" y="${430}" width="200" height="26" rx="6"/>` : `<rect x="${146 + c * 31}" y="${306 + r * 40}" width="26" height="30" rx="6"/>`).join("")).join("")}</g><g fill="${pal.glow}" opacity=".9"><rect x="146" y="306" width="26" height="4" rx="2"/><rect x="332" y="346" width="26" height="4" rx="2"/></g>`,
    mouse: `<path d="M300 190 C 220 190 200 280 200 340 C 200 440 240 510 300 510 C 360 510 400 440 400 340 C 400 280 380 190 300 190 Z" fill="${pal.body}" stroke="${edge}" stroke-opacity=".35" stroke-width="2"/><path d="M300 190 V300" stroke="#05080f" stroke-opacity=".5" stroke-width="3"/><rect x="288" y="238" width="24" height="46" rx="12" fill="#05080f"/><rect x="294" y="248" width="12" height="16" rx="6" fill="${pal.glow}"/><path d="M214 420 Q300 470 386 420" stroke="${pal.glow}" stroke-width="5" fill="none" opacity=".9"/>`,
    stand: `<path d="M180 500 L260 260 H340 L420 500" fill="none" stroke="${pal.body}" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/><rect x="160" y="500" width="280" height="16" rx="8" fill="${pal.body}"/><rect x="200" y="210" width="200" height="64" rx="12" fill="#e5e9f2" stroke="${edge}" stroke-opacity=".3"/><rect x="240" y="150" width="120" height="70" rx="6" fill="#0a1020" transform="skewX(-6)"/>`,
    hub: `<rect x="140" y="320" width="320" height="110" rx="30" fill="${pal.body}" stroke="${edge}" stroke-opacity=".3" stroke-width="2"/><g fill="#05080f">${Array.from({ length: 6 }, (_, i) => `<rect x="${166 + i * 46}" y="${i < 3 ? 350 : 372}" width="32" height="${i < 3 ? 14 : 12}" rx="3"/>`).join("")}</g><rect x="120" y="360" width="30" height="16" rx="5" fill="${pal.glow}"/><path d="M140 375 Q80 375 70 440 V520" stroke="#cfd6e6" stroke-width="12" fill="none" stroke-linecap="round"/>`,
    bulb: `<circle cx="300" cy="320" r="104" fill="${pal.glow}" opacity=".25" filter="url(#bl)"/><path d="M300 210 C 235 210 200 262 214 318 C 224 356 250 372 258 404 H342 C 350 372 376 356 386 318 C 400 262 365 210 300 210 Z" fill="#f9fbff" fill-opacity=".92" stroke="${edge}" stroke-opacity=".5" stroke-width="2"/><rect x="258" y="404" width="84" height="22" rx="6" fill="${pal.body}"/><rect x="262" y="430" width="76" height="22" rx="6" fill="${pal.body}"/><rect x="276" y="456" width="48" height="16" rx="6" fill="#d6dbe6"/><path d="M270 330 Q300 280 330 330" stroke="${pal.glow}" stroke-width="5" fill="none"/>`,
    webcam: `<rect x="256" y="470" width="88" height="46" rx="10" fill="${pal.body}"/><rect x="230" y="506" width="140" height="14" rx="7" fill="${pal.body}"/><circle cx="300" cy="350" r="118" fill="${pal.body}" stroke="${edge}" stroke-opacity=".35" stroke-width="3"/><circle cx="300" cy="350" r="78" fill="#05080f" stroke="${pal.glow}" stroke-width="5"/><circle cx="300" cy="350" r="42" fill="url(#sc)"/><circle cx="276" cy="326" r="10" fill="#fff" opacity=".6"/><circle cx="376" cy="262" r="7" fill="${pal.glow}"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.c1}"/><stop offset="1" stop-color="${pal.c2}"/></linearGradient><linearGradient id="sc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.glow}" stop-opacity=".55"/><stop offset="1" stop-color="#6d28d9" stop-opacity=".35"/></linearGradient><pattern id="gr" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity=".06"/></pattern><filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="46"/></filter><filter id="bl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="26"/></filter></defs><rect width="600" height="750" fill="url(#g)"/><rect width="600" height="750" fill="url(#gr)"/><circle cx="300" cy="350" r="190" fill="${pal.glow}" opacity=".28" filter="url(#b)"/><ellipse cx="300" cy="590" rx="170" ry="14" fill="#000" opacity=".4" filter="url(#bl)"/>${S[kind]}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  blue: { c1: "#0f1b3d", c2: "#1a2f6b", body: "#223a7a", glow: "#3b82f6" },
  cyan: { c1: "#06222b", c2: "#0e4a5c", body: "#12586d", glow: "#22d3ee" },
  violet: { c1: "#1a1038", c2: "#35206b", body: "#43298a", glow: "#a78bfa" },
  green: { c1: "#08241b", c2: "#0f4a38", body: "#126046", glow: "#34d399" },
  red: { c1: "#2a0e14", c2: "#5a1a26", body: "#7a2233", glow: "#fb7185" },
  slate: { c1: "#10151f", c2: "#252e42", body: "#2c3650", glow: "#60a5fa" },
} satisfies Record<string, Pal>;

/** Spec labels, translated once so each product only lists neutral values. */
const L: Record<string, [string, string, string]> = {
  display: ["Display", "Écran", "الشاشة"], battery: ["Battery", "Batterie", "البطارية"], storage: ["Storage", "Stockage", "التخزين"], camera: ["Camera", "Appareil photo", "الكاميرا"], chip: ["Processor", "Processeur", "المعالج"],
  conn: ["Connectivity", "Connectivité", "الاتصال"], anc: ["Noise cancelling", "Réduction de bruit", "عزل الضوضاء"], play: ["Playtime", "Autonomie", "مدة التشغيل"], water: ["Water resistance", "Étanchéité", "مقاومة الماء"],
  capacity: ["Capacity", "Capacité", "السعة"], output: ["Output", "Puissance", "القدرة"], ports: ["Ports", "Ports", "المنافذ"], switches: ["Switches", "Switchs", "المفاتيح"], sensor: ["Sensor", "Capteur", "المستشعر"],
  material: ["Material", "Matière", "الخامة"], weight: ["Weight", "Poids", "الوزن"], res: ["Resolution", "Résolution", "الدقة"], warranty: ["Warranty", "Garantie", "الضمان"], box: ["In the box", "Dans la boîte", "محتويات العلبة"],
};
const W: [string, string, string] = ["12 months", "12 mois", "12 شهراً"];

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "phones", name: i18n("Phones", "Téléphones", "الهواتف"), kind: "phone" as Kind, pal: PAL.blue },
    { id: newId(), slug: "audio", name: i18n("Audio", "Audio", "الصوتيات"), kind: "earbuds" as Kind, pal: PAL.violet },
    { id: newId(), slug: "wearables", name: i18n("Wearables", "Objets connectés", "الأجهزة القابلة للارتداء"), kind: "watch" as Kind, pal: PAL.cyan },
    { id: newId(), slug: "power", name: i18n("Power & charging", "Énergie & charge", "الطاقة والشحن"), kind: "powerbank" as Kind, pal: PAL.green },
    { id: newId(), slug: "computing", name: i18n("Computing", "Informatique", "الكمبيوتر"), kind: "keyboard" as Kind, pal: PAL.slate },
    { id: newId(), slug: "smart-home", name: i18n("Smart home", "Maison connectée", "المنزل الذكي"), kind: "bulb" as Kind, pal: PAL.red },
  ];
  type PD = { cat: number; slug: string; kind: Kind; pal: Pal; n: [string, string, string]; s: [string, string, string]; l: [string, string, string]; specs: [string, string | [string, string, string]][]; box: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "nova-x-5g", kind: "phone", pal: PAL.blue, n: ["Nova X 5G smartphone", "Smartphone Nova X 5G", "هاتف نوفا إكس 5G"], s: ["6.7″ AMOLED, 50 MP camera, 2-day battery.", "AMOLED 6,7″, capteur 50 Mpx, 2 jours d'autonomie.", "شاشة AMOLED مقاس 6.7 بوصة وكاميرا 50 ميغابكسل وبطارية تدوم يومين."], l: ["Fast 120 Hz AMOLED display, a 50 MP main camera with night mode and a 5000 mAh battery with 33 W fast charging. Dual SIM, 5G.", "Écran AMOLED 120 Hz fluide, capteur principal 50 Mpx avec mode nuit et batterie 5000 mAh avec charge rapide 33 W. Double SIM, 5G.", "شاشة AMOLED سلسة بمعدل 120 هرتز وكاميرا رئيسية 50 ميغابكسل بوضع ليلي وبطارية 5000 مللي أمبير مع شحن سريع 33 واط. شريحتان، 5G."], specs: [["display", "6.7″ AMOLED · 120 Hz"], ["chip", "Octa-core 2.6 GHz"], ["storage", "128 / 256 GB"], ["camera", "50 MP + 8 MP + 2 MP"], ["battery", "5000 mAh · 33 W"], ["conn", "5G · Wi-Fi 6 · NFC"], ["warranty", W]], box: ["Phone, 33 W charger, USB-C cable, case, SIM tool", "Téléphone, chargeur 33 W, câble USB-C, coque, outil SIM", "الهاتف، شاحن 33 واط، كابل USB-C، غطاء، أداة الشريحة"], p: 2990, cmp: 3490, stock: 0, feat: 1, best: 1, v: [["128 GB · Midnight", 2990, 14], ["256 GB · Midnight", 3490, 9], ["128 GB · Glacier", 2990, 11], ["256 GB · Glacier", 3490, 0]] },
    { cat: 1, slug: "airpulse-pro-earbuds", kind: "earbuds", pal: PAL.violet, n: ["AirPulse Pro wireless earbuds", "Écouteurs sans fil AirPulse Pro", "سماعات إيربالس برو اللاسلكية"], s: ["Active noise cancelling, 30 h with the case.", "Réduction de bruit active, 30 h avec le boîtier.", "عزل ضوضاء نشط و30 ساعة مع العلبة."], l: ["Hybrid ANC, transparency mode and a clear 3-mic call system. IPX4 sweat resistance, wireless charging case.", "ANC hybride, mode transparence et système d'appel à 3 micros. Résistant à la transpiration IPX4, boîtier à charge sans fil.", "عزل ضوضاء هجين ووضع الشفافية ونظام مكالمات بثلاثة ميكروفونات. مقاومة العرق IPX4 وعلبة شحن لاسلكي."], specs: [["anc", "Hybrid ANC · up to 35 dB"], ["play", "8 h + 22 h case"], ["conn", "Bluetooth 5.3"], ["water", "IPX4"], ["warranty", W]], box: ["Earbuds, charging case, 3 ear tips, USB-C cable", "Écouteurs, boîtier de charge, 3 embouts, câble USB-C", "السماعات، علبة الشحن، 3 أطراف أذن، كابل USB-C"], p: 449, cmp: 599, stock: 42, feat: 1, best: 1, v: [] },
    { cat: 2, slug: "fitwatch-s2", kind: "watch", pal: PAL.cyan, n: ["FitWatch S2 smartwatch", "Montre connectée FitWatch S2", "ساعة فيت ووتش S2 الذكية"], s: ["AMOLED display, GPS and 14-day battery.", "Écran AMOLED, GPS et 14 jours d'autonomie.", "شاشة AMOLED وGPS وبطارية 14 يوماً."], l: ["Tracks heart rate, sleep and 100+ sport modes with built-in GPS. Calls and notifications on your wrist.", "Suivi de la fréquence cardiaque, du sommeil et plus de 100 modes sport avec GPS intégré. Appels et notifications au poignet.", "تتبّع نبضات القلب والنوم وأكثر من 100 وضع رياضي مع GPS مدمج. مكالمات وإشعارات على معصمك."], specs: [["display", "1.43″ AMOLED"], ["battery", "14 days typical"], ["water", "5 ATM"], ["conn", "Bluetooth 5.2 · GPS"], ["warranty", W]], box: ["Watch, magnetic charger, strap, quick guide", "Montre, chargeur magnétique, bracelet, guide rapide", "الساعة، شاحن مغناطيسي، سوار، دليل سريع"], p: 599, cmp: 0, stock: 0, feat: 1, best: 0, v: [["Black", 599, 18], ["Silver", 599, 10], ["Green", 599, 0]] },
    { cat: 3, slug: "power-bank-20000", kind: "powerbank", pal: PAL.green, n: ["20,000 mAh power bank 65 W", "Batterie externe 20 000 mAh 65 W", "باور بانك 20,000 مللي أمبير 65 واط"], s: ["Charges a laptop and two phones at once.", "Recharge un ordinateur et deux téléphones à la fois.", "يشحن حاسوباً محمولاً وهاتفين في الوقت نفسه."], l: ["Two USB-C and one USB-A port with a live percentage display. 65 W USB-C output for laptops.", "Deux ports USB-C et un USB-A avec affichage du pourcentage. Sortie USB-C 65 W pour ordinateurs portables.", "منفذا USB-C ومنفذ USB-A مع شاشة نسبة الشحن. مخرج USB-C بقدرة 65 واط للحواسيب."], specs: [["capacity", "20,000 mAh · 74 Wh"], ["output", "65 W max (USB-C)"], ["ports", "2× USB-C · 1× USB-A"], ["weight", "420 g"], ["warranty", W]], box: ["Power bank, USB-C cable, pouch", "Batterie externe, câble USB-C, pochette", "الباور بانك، كابل USB-C، حقيبة"], p: 349, cmp: 429, stock: 38, feat: 1, best: 1, v: [] },
    { cat: 3, slug: "gan-charger-65w", kind: "charger", pal: PAL.blue, n: ["65 W GaN charger, 3 ports", "Chargeur GaN 65 W, 3 ports", "شاحن GaN بقدرة 65 واط بثلاثة منافذ"], s: ["Compact GaN charger for laptop, phone and watch.", "Chargeur GaN compact pour ordinateur, téléphone et montre.", "شاحن GaN صغير للحاسوب والهاتف والساعة."], l: ["Smart power sharing across two USB-C ports and one USB-A. Folding plug.", "Répartition intelligente de la puissance entre deux ports USB-C et un USB-A. Fiche pliable.", "توزيع ذكي للطاقة بين منفذي USB-C ومنفذ USB-A. قابس قابل للطي."], specs: [["output", "65 W total"], ["ports", "2× USB-C · 1× USB-A"], ["material", "GaN III"], ["warranty", W]], box: ["Charger, quick guide", "Chargeur, guide rapide", "الشاحن، دليل سريع"], p: 229, cmp: 0, stock: 64, feat: 0, best: 0, v: [] },
    { cat: 1, slug: "boom-mini-speaker", kind: "speaker", pal: PAL.red, n: ["Boom Mini waterproof speaker", "Enceinte étanche Boom Mini", "مكبر صوت بوم ميني المقاوم للماء"], s: ["360° sound, IP67 and 12 h playtime.", "Son 360°, IP67 et 12 h d'autonomie.", "صوت 360° ومقاومة IP67 وتشغيل 12 ساعة."], l: ["Portable Bluetooth speaker with deep bass and a built-in microphone. Floats on water.", "Enceinte Bluetooth portable aux basses profondes et micro intégré. Flotte sur l'eau.", "مكبر صوت بلوتوث محمول بصوت جهير عميق وميكروفون مدمج. يطفو على الماء."], specs: [["output", "20 W"], ["play", "12 h"], ["water", "IP67"], ["conn", "Bluetooth 5.3"], ["warranty", W]], box: ["Speaker, USB-C cable, strap", "Enceinte, câble USB-C, dragonne", "المكبر، كابل USB-C، حزام"], p: 299, cmp: 379, stock: 0, feat: 0, best: 1, v: [["Black", 299, 25], ["Blue", 299, 17], ["Red", 299, 8]] },
    { cat: 4, slug: "mechanical-keyboard-75", kind: "keyboard", pal: PAL.slate, n: ["75% mechanical keyboard", "Clavier mécanique 75 %", "لوحة مفاتيح ميكانيكية 75٪"], s: ["Hot-swappable switches and RGB backlight.", "Switchs interchangeables et rétroéclairage RGB.", "مفاتيح قابلة للتبديل وإضاءة RGB."], l: ["Compact 75% layout with a gasket mount and pre-lubed switches. Wired, Bluetooth and 2.4 GHz.", "Format compact 75 % avec montage gasket et switchs pré-lubrifiés. Filaire, Bluetooth et 2,4 GHz.", "تصميم مضغوط 75٪ بتركيب جاسكيت ومفاتيح مُشحّمة مسبقاً. سلكي وبلوتوث و2.4 جيجاهرتز."], specs: [["switches", "Linear · hot-swappable"], ["conn", "USB-C · BT 5.1 · 2.4 GHz"], ["battery", "4000 mAh"], ["material", "Aluminium case"], ["warranty", W]], box: ["Keyboard, USB-C cable, keycap puller, receiver", "Clavier, câble USB-C, extracteur de touches, récepteur", "لوحة المفاتيح، كابل USB-C، أداة سحب الأزرار، المستقبل"], p: 499, cmp: 599, stock: 27, feat: 0, best: 0, v: [] },
    { cat: 4, slug: "gaming-mouse-26k", kind: "mouse", pal: PAL.violet, n: ["Ultralight gaming mouse", "Souris gaming ultra-légère", "ماوس ألعاب فائق الخفة"], s: ["59 g, 26,000 DPI sensor, 70 h battery.", "59 g, capteur 26 000 DPI, 70 h d'autonomie.", "وزن 59 غ ومستشعر 26,000 DPI وبطارية 70 ساعة."], l: ["Wireless 2.4 GHz mouse with a honeycomb shell and PTFE feet.", "Souris sans fil 2,4 GHz à coque alvéolée et patins PTFE.", "ماوس لاسلكي 2.4 جيجاهرتز بهيكل شبكي وقواعد PTFE."], specs: [["sensor", "26,000 DPI optical"], ["weight", "59 g"], ["battery", "70 h"], ["conn", "2.4 GHz · USB-C"], ["warranty", W]], box: ["Mouse, receiver, USB-C cable, grip tape", "Souris, récepteur, câble USB-C, grip adhésif", "الماوس، المستقبل، كابل USB-C، شريط تثبيت"], p: 249, cmp: 0, stock: 0, feat: 0, best: 0, v: [["Black", 249, 20], ["White", 249, 13]] },
    { cat: 4, slug: "aluminium-laptop-stand", kind: "stand", pal: PAL.slate, n: ["Aluminium laptop stand", "Support d'ordinateur en aluminium", "حامل لابتوب من الألمنيوم"], s: ["Six height positions, folds flat.", "Six hauteurs, se plie à plat.", "ست زوايا ارتفاع ويُطوى بشكل مسطح."], l: ["Ventilated aluminium stand for 10–17″ laptops. Anti-slip silicone pads.", "Support ventilé en aluminium pour ordinateurs de 10 à 17″. Patins antidérapants en silicone.", "حامل ألمنيوم مهوّى للحواسيب من 10 إلى 17 بوصة مع وسادات سيليكون مانعة للانزلاق."], specs: [["material", "Aluminium alloy"], ["weight", "280 g"], ["capacity", "Up to 10 kg"], ["warranty", W]], box: ["Stand, carry pouch", "Support, pochette de transport", "الحامل، حقيبة حمل"], p: 199, cmp: 0, stock: 52, feat: 0, best: 0, v: [] },
    { cat: 4, slug: "usb-c-hub-8-in-1", kind: "hub", pal: PAL.cyan, n: ["USB-C hub 8-in-1", "Hub USB-C 8-en-1", "موزّع USB-C بثمانية منافذ"], s: ["4K HDMI, SD reader and 100 W pass-through.", "HDMI 4K, lecteur SD et charge 100 W.", "HDMI بدقة 4K وقارئ SD وشحن 100 واط."], l: ["One cable adds HDMI, Ethernet, SD/microSD and three USB-A ports to your laptop.", "Un seul câble ajoute HDMI, Ethernet, SD/microSD et trois ports USB-A à votre ordinateur.", "كابل واحد يضيف HDMI وإيثرنت وSD/microSD وثلاثة منافذ USB-A إلى حاسوبك."], specs: [["ports", "HDMI · RJ45 · 3× USB-A · SD · microSD · USB-C PD"], ["res", "4K @ 30 Hz"], ["output", "100 W pass-through"], ["warranty", W]], box: ["Hub, quick guide", "Hub, guide rapide", "الموزّع، دليل سريع"], p: 279, cmp: 349, stock: 31, feat: 0, best: 0, v: [] },
    { cat: 5, slug: "smart-led-bulb-4-pack", kind: "bulb", pal: PAL.red, n: ["Smart RGB LED bulbs, 4-pack", "Ampoules LED connectées RVB, lot de 4", "مصابيح LED ذكية RGB، 4 قطع"], s: ["16 million colours, voice and app control.", "16 millions de couleurs, commande vocale et application.", "16 مليون لون وتحكم صوتي وعبر التطبيق."], l: ["Wi-Fi bulbs with schedules, scenes and music sync. E27 base, 9 W.", "Ampoules Wi-Fi avec programmation, scènes et synchronisation musicale. Culot E27, 9 W.", "مصابيح واي فاي مع جدولة ومشاهد ومزامنة مع الموسيقى. قاعدة E27 بقدرة 9 واط."], specs: [["output", "9 W · 806 lm"], ["conn", "Wi-Fi 2.4 GHz"], ["material", "E27 base"], ["warranty", W]], box: ["4 bulbs, quick guide", "4 ampoules, guide rapide", "4 مصابيح، دليل سريع"], p: 249, cmp: 299, stock: 46, feat: 1, best: 0, v: [] },
    { cat: 4, slug: "uhd-webcam-autofocus", kind: "webcam", pal: PAL.blue, n: ["4K webcam with autofocus", "Webcam 4K avec autofocus", "كاميرا ويب 4K بتركيز تلقائي"], s: ["Sharp video calls with a privacy shutter.", "Appels vidéo nets avec cache de confidentialité.", "مكالمات فيديو واضحة مع غطاء للخصوصية."], l: ["4K sensor with HDR, dual noise-reducing microphones and a magnetic privacy cover.", "Capteur 4K avec HDR, deux micros à réduction de bruit et cache magnétique.", "مستشعر 4K مع HDR وميكروفونان لتقليل الضوضاء وغطاء مغناطيسي للخصوصية."], specs: [["res", "4K @ 30 fps · 1080p @ 60 fps"], ["camera", "Autofocus · HDR"], ["conn", "USB-C"], ["warranty", W]], box: ["Webcam, mount, USB-C cable", "Webcam, support, câble USB-C", "الكاميرا، حامل، كابل USB-C"], p: 599, cmp: 0, stock: 0, feat: 0, best: 0, v: [["Standard", 599, 15]] },
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
    const specLines = [0, 1, 2].map((li) => [...p.specs.map(([k, v]) => `${L[k]![li]}: ${typeof v === "string" ? v : v[li]}`), `${L.box![li]}: ${p.box[li]}`].join("\n"));
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specLines[0]!, specLines[1]!, specLines[2]!),
        cats[p.cat]!.id, `VLT-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.v.length ? 0 : p.stock, p.feat, p.best, p.best ? 18 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) => stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `VLT-${100 + i}-${j}`, price(vp), vs, j)));
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Anas", "Casablanca", 5, "Écran superbe et batterie qui tient deux jours. J'ai vérifié le téléphone devant le livreur avant de payer."],
    [1, "Salma", "Rabat", 5, "The noise cancelling is really good on the train. Fast delivery."],
    [3, "Karim", "Tanger", 5, "شحن لابتوبي وهاتفي معاً بدون مشاكل، جودة ممتازة."],
    [6, "Reda", "Marrakech", 4, "Clavier solide, les switchs sont agréables. Un peu lourd mais top."],
    [10, "Imane", "Fès", 5, "Les ampoules se connectent facilement, l'application est simple."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "VOLT10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on the featured products: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.9, 1], [3, 0.82, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("phone", PAL.blue));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
