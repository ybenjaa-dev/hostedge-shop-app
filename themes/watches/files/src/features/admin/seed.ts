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

/* ───────────── Illustrations: restrained vector pieces on a charcoal spotlight ───────────── */
const DEFS = `<defs>
<radialGradient id="bg" cx=".5" cy=".4" r=".78"><stop offset="0" stop-color="#3b362c"/><stop offset=".55" stop-color="#18171a"/><stop offset="1" stop-color="#0b0b0c"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e7ba"/><stop offset=".48" stop-color="#c9a96a"/><stop offset="1" stop-color="#7a5f2e"/></linearGradient>
<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f5f6"/><stop offset=".5" stop-color="#a3a7ad"/><stop offset="1" stop-color="#585c62"/></linearGradient>
<linearGradient id="rose" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dccb"/><stop offset=".5" stop-color="#d8a68b"/><stop offset="1" stop-color="#8b5846"/></linearGradient>
<radialGradient id="glass" cx=".32" cy=".26" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".14"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>
<linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000" flood-opacity=".6"/></filter>
</defs>`;

type Metal = "gold" | "steel" | "rose";
const HAND: Record<Metal, string> = { gold: "#f0dcaa", steel: "#eceef0", rose: "#f5d6c3" };
type W = { metal: Metal; dial: string; ink: string; hand?: string; strap: string; bracelet?: boolean; chrono?: boolean; moon?: boolean; spin?: boolean };

/** A round dress/sport watch, centred on (cx, cy) with a 150px case radius. */
function watchBody(w: W, cx = 300, cy = 300) {
  const pt = (deg: number, r: number) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)] as const;
  const m = `url(#${w.metal})`;
  const hand = w.hand ?? HAND[w.metal];
  const strapTop = `M${cx - 68} ${cy - 120} L${cx - 62} ${cy - 330} L${cx + 62} ${cy - 330} L${cx + 68} ${cy - 120} Z`;
  const strapBot = `M${cx - 68} ${cy + 120} L${cx - 62} ${cy + 330} L${cx + 62} ${cy + 330} L${cx + 68} ${cy + 120} Z`;
  let strap = "";
  if (w.bracelet) {
    strap += `<path d="${strapTop}" fill="url(#steel)"/><path d="${strapBot}" fill="url(#steel)"/>`;
    for (let y = 150; y < 340; y += 24) strap += `<path d="M${cx - 66} ${cy - y}H${cx + 66}M${cx - 66} ${cy + y}H${cx + 66}" stroke="#2a2c30" stroke-opacity=".55" stroke-width="2"/>`;
    strap += `<path d="M${cx} ${cy - 330}V${cy - 120}M${cx} ${cy + 120}V${cy + 330}" stroke="#2a2c30" stroke-opacity=".4" stroke-width="2"/>`;
  } else {
    strap += `<path d="${strapTop}" fill="${w.strap}"/><path d="${strapBot}" fill="${w.strap}"/><path d="${strapTop}" fill="url(#sheen)"/><path d="${strapBot}" fill="url(#sheen)"/>`;
    strap += `<path d="M${cx - 52} ${cy - 130}L${cx - 48} ${cy - 330}M${cx + 52} ${cy - 130}L${cx + 48} ${cy - 330}M${cx - 52} ${cy + 130}L${cx - 48} ${cy + 330}M${cx + 52} ${cy + 130}L${cx + 48} ${cy + 330}" stroke="#d9c08a" stroke-opacity=".55" stroke-width="2" stroke-dasharray="7 6" fill="none"/>`;
    for (let i = 0; i < 5; i++) strap += `<circle cx="${cx}" cy="${cy + 190 + i * 24}" r="4" fill="#000" fill-opacity=".55"/>`;
  }
  let marks = "";
  for (let i = 0; i < 60; i++) {
    const [x1, y1] = pt(i * 6, 119);
    const [x2, y2] = pt(i * 6, i % 5 === 0 ? 107 : 113);
    if (i % 5) marks += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${w.ink}" stroke-opacity=".5" stroke-width="1"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const major = i % 3 === 0;
    marks += `<rect x="${cx - (major ? 3.5 : 2.2)}" y="${cy - 118}" width="${major ? 7 : 4.4}" height="${major ? 24 : 16}" fill="${w.ink}" transform="rotate(${i * 30} ${cx} ${cy})"/>`;
  }
  const subdial = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="30" fill="${w.ink}" fill-opacity=".06" stroke="${w.ink}" stroke-opacity=".55"/><path d="M${x} ${y}L${x + 14} ${y - 12}" stroke="${w.ink}" stroke-width="2" stroke-linecap="round"/>`;
  let face = "";
  if (w.chrono) face += subdial(cx - 48, cy + 8) + subdial(cx + 48, cy + 8) + subdial(cx, cy + 66);
  if (w.moon) {
    face += `<circle cx="${cx}" cy="${cy + 58}" r="32" fill="#0c1233" stroke="${m}" stroke-width="3"/><circle cx="${cx + 4}" cy="${cy + 58}" r="15" fill="#f1e6c8"/><circle cx="${cx + 13}" cy="${cy + 52}" r="13" fill="#0c1233"/>`;
    face += [[-18, 46], [-8, 70], [18, 74], [22, 44]].map(([dx, dy]) => `<circle cx="${cx + dx!}" cy="${cy + dy!}" r="1.4" fill="#f1e6c8"/>`).join("");
  }
  const [hx, hy] = pt(305, 64);
  const [mx, my] = pt(62, 98);
  const sec = `<g ${w.spin ? `class="sec" style="transform-origin:${cx}px ${cy}px"` : `transform="rotate(168 ${cx} ${cy})"`}><path d="M${cx} ${cy + 26}V${cy - 104}" stroke="#b8402e" stroke-width="1.6"/><circle cx="${cx}" cy="${cy}" r="4" fill="#b8402e"/></g>`;
  return `<g filter="url(#sh)">${strap}
<rect x="${cx + 146}" y="${cy - 13}" width="20" height="26" rx="4" fill="${m}"/>
<circle cx="${cx}" cy="${cy}" r="152" fill="${m}"/><circle cx="${cx}" cy="${cy}" r="142" fill="#000" fill-opacity=".28"/><circle cx="${cx}" cy="${cy}" r="138" fill="${m}"/>
<circle cx="${cx}" cy="${cy}" r="126" fill="${w.dial}"/><circle cx="${cx}" cy="${cy}" r="126" fill="url(#sun)"/>
${marks}<text x="${cx}" y="${cy - 56}" text-anchor="middle" font-family="Georgia,serif" font-size="11" letter-spacing="4" fill="${w.ink}" fill-opacity=".9">AURELLE</text>
${w.moon || w.chrono ? "" : `<text x="${cx}" y="${cy + 82}" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" letter-spacing="3" fill="${w.ink}" fill-opacity=".6">AUTOMATIC</text>`}
${face}
<path d="M${cx} ${cy}L${hx.toFixed(1)} ${hy.toFixed(1)}" stroke="${hand}" stroke-width="7" stroke-linecap="round"/>
<path d="M${cx} ${cy}L${mx.toFixed(1)} ${my.toFixed(1)}" stroke="${hand}" stroke-width="4.5" stroke-linecap="round"/>
${sec}<circle cx="${cx}" cy="${cy}" r="7" fill="${m}"/><circle cx="${cx}" cy="${cy}" r="2.6" fill="${w.dial}"/>
<circle cx="${cx}" cy="${cy}" r="126" fill="url(#glass)"/></g>`;
}

function strapBody(color: string, mesh = false) {
  const body = mesh
    ? `<rect x="232" y="108" width="136" height="430" rx="6" fill="url(#steel)"/>${Array.from({ length: 36 }, (_, i) => `<path d="M232 ${116 + i * 12}H368" stroke="#2a2c30" stroke-opacity=".45"/>`).join("")}`
    : `<path d="M232 108H368V500Q368 540 300 560Q232 540 232 500Z" fill="${color}"/><path d="M232 108H368V500Q368 540 300 560Q232 540 232 500Z" fill="url(#sheen)"/><path d="M246 118V500Q246 528 300 546Q354 528 354 500V118" fill="none" stroke="#e0c78f" stroke-opacity=".6" stroke-width="2" stroke-dasharray="8 7"/>${Array.from({ length: 5 }, (_, i) => `<circle cx="300" cy="${360 + i * 28}" r="5.5" fill="#000" fill-opacity=".6"/>`).join("")}`;
  return `<g filter="url(#sh)">${body}<rect x="214" y="66" width="172" height="58" rx="8" fill="none" stroke="url(#gold)" stroke-width="10"/><rect x="294" y="56" width="12" height="104" rx="5" fill="url(#gold)"/></g>`;
}

function walletBody(kind: "bifold" | "cards", color: string) {
  if (kind === "bifold") {
    return `<g filter="url(#sh)"><rect x="176" y="168" width="130" height="70" rx="6" fill="#efe6d2"/><rect x="150" y="196" width="300" height="214" rx="14" fill="${color}"/><rect x="150" y="196" width="300" height="214" rx="14" fill="url(#sheen)"/><path d="M300 196V410" stroke="#000" stroke-opacity=".45" stroke-width="3"/><rect x="164" y="210" width="272" height="186" rx="8" fill="none" stroke="#e0c78f" stroke-opacity=".65" stroke-width="2" stroke-dasharray="7 6"/><rect x="368" y="368" width="48" height="12" rx="2" fill="url(#gold)"/></g>`;
  }
  return `<g filter="url(#sh)"><rect x="196" y="120" width="208" height="340" rx="14" fill="${color}"/><rect x="196" y="120" width="208" height="340" rx="14" fill="url(#sheen)"/>${[210, 260, 310].map((y) => `<path d="M196 ${y}H404" stroke="#000" stroke-opacity=".4" stroke-width="2"/>`).join("")}<rect x="210" y="134" width="180" height="312" rx="8" fill="none" stroke="#e0c78f" stroke-opacity=".6" stroke-width="2" stroke-dasharray="7 6"/><rect x="276" y="410" width="48" height="12" rx="2" fill="url(#gold)"/></g>`;
}

function glassesBody(kind: "aviator" | "round", lens: string) {
  if (kind === "aviator") {
    const L = `M118 262Q112 372 196 392Q270 396 276 316Q282 238 214 224Q142 212 118 262Z`;
    return `<g filter="url(#sh)"><path d="M118 262Q104 246 70 250M482 262Q496 246 530 250" stroke="url(#gold)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${L}" fill="${lens}"/><path d="${L}" fill="url(#glass)"/><path d="${L}" fill="none" stroke="url(#gold)" stroke-width="7"/><g transform="translate(600 0) scale(-1 1)"><path d="${L}" fill="${lens}"/><path d="${L}" fill="url(#glass)"/><path d="${L}" fill="none" stroke="url(#gold)" stroke-width="7"/></g><path d="M276 256Q300 238 324 256M282 280Q300 268 318 280" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/></g>`;
  }
  const ring = (x: number) => `<circle cx="${x}" cy="304" r="80" fill="${lens}"/><circle cx="${x}" cy="304" r="80" fill="url(#glass)"/><circle cx="${x}" cy="304" r="80" fill="none" stroke="#6b4423" stroke-width="15"/><circle cx="${x}" cy="304" r="80" fill="none" stroke="#c28a4c" stroke-opacity=".5" stroke-width="3" stroke-dasharray="14 18"/>`;
  return `<g filter="url(#sh)"><path d="M125 280L70 262M475 280L530 262" stroke="#6b4423" stroke-width="12" stroke-linecap="round"/>${ring(205)}${ring(395)}<path d="M282 290Q300 268 318 290" fill="none" stroke="#6b4423" stroke-width="12" stroke-linecap="round"/></g>`;
}

function cufflinksBody(face: "guilloche" | "onyx", square = false) {
  const one = (cx: number) => {
    const rings = Array.from({ length: 9 }, (_, i) => `<circle cx="${cx}" cy="270" r="${12 + i * 6}" fill="none" stroke="#5c4620" stroke-opacity=".35"/>`).join("");
    const shape = square ? `<rect x="${cx - 68}" y="202" width="136" height="136" rx="16" transform="rotate(0)"` : `<circle cx="${cx}" cy="270" r="70"`;
    const inner = square ? `<rect x="${cx - 52}" y="218" width="104" height="104" rx="8"` : `<circle cx="${cx}" cy="270" r="54"`;
    return `${shape} fill="url(#gold)"/>${inner} fill="${face === "onyx" ? "#0b0b0d" : "url(#gold)"}"/>${face === "guilloche" ? rings : `<ellipse cx="${cx - 12}" cy="248" rx="26" ry="12" fill="#fff" fill-opacity=".12"/>`}<ellipse cx="${cx}" cy="412" rx="46" ry="9" fill="url(#gold)"/><rect x="${cx - 4}" y="340" width="8" height="72" fill="url(#gold)"/>`;
  };
  return `<g filter="url(#sh)">${one(185)}${one(415)}</g>`;
}

function frame(body: string, label?: string, style = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">${style}${DEFS}<rect width="600" height="600" fill="url(#bg)"/><rect x="22" y="22" width="556" height="556" fill="none" stroke="#c9a96a" stroke-opacity=".28"/>${body}${label ? `<text x="300" y="562" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="8" fill="#c9a96a" fill-opacity=".85">${xml(label.toUpperCase())}</text>` : ""}</svg>`;
}

const ART: Record<string, () => string> = {
  meridian: () => watchBody({ metal: "gold", dial: "#efe7d2", ink: "#2a2418", hand: "#2a2418", strap: "#17120d" }),
  nocturne: () => watchBody({ metal: "gold", dial: "#101a3e", ink: "#e9d9a8", strap: "#10141f", moon: true }),
  chrono: () => watchBody({ metal: "steel", dial: "#111214", ink: "#e9eaec", strap: "#3a2a1f", bracelet: true, chrono: true }),
  slim: () => watchBody({ metal: "rose", dial: "#f4efe6", ink: "#3a2a22", hand: "#4a3328", strap: "#8a5a3a" }),
  strap: () => strapBody("#2a1a12"),
  mesh: () => strapBody("", true),
  bifold: () => walletBody("bifold", "#2b1a10"),
  cards: () => walletBody("cards", "#12161f"),
  aviator: () => glassesBody("aviator", "#2c3a2f"),
  round: () => glassesBody("round", "#3a2b20"),
  guilloche: () => cufflinksBody("guilloche"),
  onyx: () => cufflinksBody("onyx", true),
};

/** Category art (kept as `svg` for scripts/repair-sample-images.ts): shape index picks the illustration. */
export function svg(_c1: string, _c2: string, rawLabel: string, shape: number) {
  return frame(ART[["meridian", "strap", "bifold", "aviator", "guilloche"][shape % 5]!]!(), rawLabel);
}

function heroSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><style>@keyframes spin{from{transform:rotate(168deg)}to{transform:rotate(528deg)}}.sec{animation:spin 60s linear infinite}</style>${DEFS}${watchBody({ metal: "gold", dial: "#14130f", ink: "#ecdcae", strap: "#16100b", spin: true }, 400, 400)}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

type L3 = [string, string, string];
const L: Record<string, L3> = {
  movement: ["Movement", "Mouvement", "الحركة"],
  case: ["Case", "Boîtier", "العلبة"],
  water: ["Water resistance", "Étanchéité", "مقاومة الماء"],
  crystal: ["Crystal", "Verre", "الزجاج"],
  strap: ["Strap", "Bracelet", "السوار"],
  material: ["Material", "Matière", "الخامة"],
  size: ["Size", "Dimensions", "المقاس"],
  finish: ["Finish", "Finition", "اللمسة النهائية"],
  lens: ["Lens", "Verres", "العدسات"],
  frame: ["Frame", "Monture", "الإطار"],
  fit: ["Fit", "Fixation", "التثبيت"],
  slots: ["Capacity", "Capacité", "السعة"],
};

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "watches", name: i18n("Timepieces", "Montres", "الساعات"), art: 0 },
    { id: newId(), slug: "straps", name: i18n("Straps & Bracelets", "Bracelets & Bandes", "الأساور والسيور"), art: 1 },
    { id: newId(), slug: "wallets", name: i18n("Leather Goods", "Maroquinerie", "المصنوعات الجلدية"), art: 2 },
    { id: newId(), slug: "sunglasses", name: i18n("Sunglasses", "Lunettes de soleil", "النظارات الشمسية"), art: 3 },
    { id: newId(), slug: "cufflinks", name: i18n("Cufflinks", "Boutons de manchette", "أزرار الأكمام"), art: 4 },
  ];
  type Spec = [string, string, string, string];
  type PD = { cat: number; slug: string; art: string; n: L3; s: L3; story: L3; specs: Spec[]; p: number; cmp: number; stock: number; feat: number; best: number; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 0, slug: "meridian-automatic-40", art: "meridian", n: ["Meridian Automatic 40", "Meridian Automatique 40", "ميريديان أوتوماتيك 40"], s: ["A champagne dial on an 18k gold-tone case, quietly formal.", "Cadran champagne, boîtier doré, d’une élégance discrète.", "ميناء شامبانيا وعلبة ذهبية بأناقة هادئة."],
      story: ["Wound by the movement of your wrist, the Meridian keeps time with a smooth sweeping seconds hand. Its slim case slips under a cuff and belongs just as well at a dinner as a wedding.", "Remontée par le mouvement du poignet, la Meridian égrène le temps d’une trotteuse fluide. Son boîtier fin se glisse sous la manchette, du dîner au mariage.", "تُشحن حركتها بحركة معصمك وتعدّ الوقت بعقرب ثوانٍ انسيابي. علبتها النحيلة تنسجم مع الكُم في العشاء كما في الأعراس."],
      specs: [["movement", "Swiss automatic, 38 h reserve", "Automatique suisse, 38 h de réserve", "أوتوماتيكية سويسرية، احتياطي 38 ساعة"], ["case", "40 mm, 9.5 mm thick, gold-tone steel", "40 mm, 9,5 mm d’épaisseur, acier doré", "40 مم، سماكة 9.5 مم، فولاذ مطلي بالذهب"], ["water", "50 m (5 ATM)", "50 m (5 ATM)", "50 م (5 ATM)"], ["crystal", "Sapphire, anti-reflective", "Saphir, antireflet", "ياقوت، مضاد للانعكاس"], ["strap", "Italian calfskin, 20 mm", "Veau italien, 20 mm", "جلد عجل إيطالي، 20 مم"]], p: 18900, cmp: 0, stock: 6, feat: 1, best: 1, v: [] },
    { cat: 0, slug: "nocturne-moonphase", art: "nocturne", n: ["Nocturne Moonphase", "Nocturne Phase de Lune", "نوكتيرن طور القمر"], s: ["Midnight-blue dial with a hand-set moonphase.", "Cadran bleu nuit et phase de lune.", "ميناء أزرق ليلي مع طور القمر."],
      story: ["A small window follows the moon across a midnight-blue dial finished with a fine sunray brush. A watch for those who still look up.", "Une petite fenêtre suit la lune sur un cadran bleu nuit au soleillage délicat. Une montre pour ceux qui lèvent encore les yeux.", "نافذة صغيرة تتبع القمر على ميناء أزرق ليلي بصقل شعاعي ناعم. ساعة لمن لا يزال يرفع بصره إلى السماء."],
      specs: [["movement", "Swiss automatic with moonphase", "Automatique suisse avec phase de lune", "أوتوماتيكية سويسرية مع طور القمر"], ["case", "41 mm, 11 mm thick, 316L steel", "41 mm, 11 mm d’épaisseur, acier 316L", "41 مم، سماكة 11 مم، فولاذ 316L"], ["water", "50 m (5 ATM)", "50 m (5 ATM)", "50 م (5 ATM)"], ["crystal", "Domed sapphire", "Saphir bombé", "ياقوت مقبّب"], ["strap", "Navy alligator-grain, 20 mm", "Façon alligator marine, 20 mm", "جلد بنقشة التمساح كحلي، 20 مم"]], p: 24500, cmp: 27900, stock: 4, feat: 1, best: 0, v: [] },
    { cat: 0, slug: "chronographe-acier", art: "chrono", n: ["Chronographe Acier 42", "Chronographe Acier 42", "كرونوغراف فولاذ 42"], s: ["Three-register chronograph on a brushed steel bracelet.", "Chronographe à trois compteurs, bracelet acier brossé.", "كرونوغراف بثلاثة عدادات وسوار فولاذي مصقول."],
      story: ["Built for the precise: a black dial, three sub-registers and a steel bracelet with a fold-over clasp. Understated at the wrist, exact in use.", "Conçue pour les précis : cadran noir, trois compteurs et bracelet acier à boucle déployante. Discrète au poignet, exacte à l’usage.", "صُمّمت للدقة: ميناء أسود وثلاثة عدادات وسوار فولاذي بإبزيم قابل للطي. هادئة على المعصم ودقيقة في الاستعمال."],
      specs: [["movement", "Swiss quartz chronograph", "Chronographe quartz suisse", "كرونوغراف كوارتز سويسري"], ["case", "42 mm, 12.5 mm thick, brushed steel", "42 mm, 12,5 mm d’épaisseur, acier brossé", "42 مم، سماكة 12.5 مم، فولاذ مصقول"], ["water", "100 m (10 ATM)", "100 m (10 ATM)", "100 م (10 ATM)"], ["crystal", "Sapphire, anti-reflective", "Saphir, antireflet", "ياقوت، مضاد للانعكاس"], ["strap", "Steel bracelet, 22 mm", "Bracelet acier, 22 mm", "سوار فولاذي، 22 مم"]], p: 32000, cmp: 0, stock: 0, feat: 1, best: 1, v: [["Steel bracelet", 32000, 5], ["Black leather", 29500, 3]] },
    { cat: 0, slug: "slim-dress-36", art: "slim", n: ["Slim Dress 36 Rose", "Slim Dress 36 Rose", "سليم درس 36 روز"], s: ["A 36 mm rose-gold dress watch, 7 mm thin.", "Montre habillée 36 mm en or rose, 7 mm d’épaisseur.", "ساعة رسمية 36 مم بالذهب الوردي وسماكة 7 مم."],
      story: ["An ivory dial, slim batons and a rose-gold case barely thicker than a coin. The watch you forget you are wearing, and are always glad of.", "Cadran ivoire, index fins et boîtier or rose à peine plus épais qu’une pièce. La montre que l’on oublie porter, et dont on est toujours heureux.", "ميناء عاجي ومؤشرات رفيعة وعلبة ذهب وردي بالكاد أسمك من عملة معدنية. ساعة تنساها على معصمك وتسعد بها دائماً."],
      specs: [["movement", "Swiss quartz, ultra-slim", "Quartz suisse ultra-plat", "كوارتز سويسري فائق النحافة"], ["case", "36 mm, 7 mm thick, rose-gold tone", "36 mm, 7 mm d’épaisseur, ton or rose", "36 مم، سماكة 7 مم، بلون الذهب الوردي"], ["water", "30 m (3 ATM)", "30 m (3 ATM)", "30 م (3 ATM)"], ["crystal", "Sapphire", "Saphir", "ياقوت"], ["strap", "Cognac calfskin, 18 mm", "Veau cognac, 18 mm", "جلد عجل كونياك، 18 مم"]], p: 15500, cmp: 0, stock: 8, feat: 1, best: 1, v: [] },
    { cat: 1, slug: "bracelet-cuir-cognac", art: "strap", n: ["Calfskin Strap, Espresso", "Bracelet Veau, Espresso", "سوار جلد عجل إسبريسو"], s: ["Hand-stitched Italian calf, quick-release spring bars.", "Veau italien cousu main, barrettes à dégagement rapide.", "جلد عجل إيطالي بخياطة يدوية وأطراف تركيب سريع."],
      story: ["Vegetable-tanned and hand-stitched, this strap softens and takes on character with every month on the wrist. Fitted with quick-release bars, it changes in seconds.", "Tannage végétal et coutures main : ce bracelet s’assouplit et prend du caractère mois après mois. Barrettes à dégagement rapide, il se change en quelques secondes.", "دباغة نباتية وخياطة يدوية، يلين السوار ويكتسب شخصية مع مرور الأشهر. أطراف التركيب السريع تتيح تبديله في ثوانٍ."],
      specs: [["material", "Vegetable-tanned Italian calf", "Veau italien tannage végétal", "جلد عجل إيطالي بدباغة نباتية"], ["size", "Lug width 20 or 22 mm", "Largeur entre cornes 20 ou 22 mm", "عرض 20 أو 22 مم"], ["fit", "Quick-release spring bars", "Barrettes à dégagement rapide", "أطراف تركيب سريع"], ["finish", "Gold-tone buckle", "Boucle ton or", "إبزيم بلون الذهب"]], p: 1450, cmp: 1900, stock: 0, feat: 1, best: 1, v: [["20 mm", 1450, 14], ["22 mm", 1450, 9]] },
    { cat: 1, slug: "bracelet-milanais", art: "mesh", n: ["Milanese Mesh Bracelet", "Bracelet Milanais", "سوار ميلانو الشبكي"], s: ["Fine steel mesh with a magnetic, tool-free clasp.", "Maille acier fine, fermoir magnétique sans outil.", "شبكة فولاذ ناعمة بإغلاق مغناطيسي بلا أدوات."],
      story: ["A supple woven steel mesh that drapes like fabric and closes magnetically at any point, for a perfect fit without links to remove.", "Une maille acier souple qui tombe comme un tissu et se ferme magnétiquement à n’importe quel point, pour un ajustement parfait.", "شبكة فولاذ مرنة تنسدل كالقماش وتُغلق مغناطيسياً في أي نقطة لمقاس مثالي دون إزالة حلقات."],
      specs: [["material", "316L steel mesh", "Maille acier 316L", "شبكة فولاذ 316L"], ["size", "Lug width 20 mm, up to 21 cm wrist", "Entre cornes 20 mm, poignet jusqu’à 21 cm", "عرض 20 مم، معصم حتى 21 سم"], ["fit", "Magnetic clasp", "Fermoir magnétique", "إغلاق مغناطيسي"]], p: 980, cmp: 0, stock: 20, feat: 0, best: 0, v: [] },
    { cat: 2, slug: "portefeuille-bifold-cuir", art: "bifold", n: ["Bifold Wallet, Dark Brown", "Portefeuille Bifold, Brun Foncé", "محفظة ثنائية، بني داكن"], s: ["Full-grain calf with eight card slots and a deep note pocket.", "Cuir pleine fleur, huit emplacements cartes, poche billets.", "جلد طبيعي كامل بثماني فتحات بطاقات وجيب عميق للنقود."],
      story: ["Cut from a single hide of full-grain calf and edge-painted by hand. It stays slim in a jacket pocket and develops a warm patina with daily use.", "Taillé dans une seule peau de veau pleine fleur, tranches peintes à la main. Fin dans la poche d’une veste, il se patine avec le temps.", "مقصوص من جلد عجل كامل ومطلي الحواف يدوياً. يبقى نحيلاً في جيب السترة ويكتسب لمعة دافئة مع الاستعمال."],
      specs: [["material", "Full-grain calfskin, lined in goat leather", "Veau pleine fleur, doublure chèvre", "جلد عجل كامل، بطانة جلد ماعز"], ["size", "11 × 9 cm, 8 card slots", "11 × 9 cm, 8 emplacements cartes", "11 × 9 سم، 8 فتحات بطاقات"], ["finish", "Hand-painted edges", "Tranches peintes main", "حواف مطلية يدوياً"]], p: 2200, cmp: 2800, stock: 12, feat: 1, best: 1, v: [] },
    { cat: 2, slug: "porte-cartes-marine", art: "cards", n: ["Card Holder, Midnight", "Porte-cartes, Nuit", "حافظة بطاقات، ليلي"], s: ["Slim card holder in navy saffiano, four slots.", "Porte-cartes fin en saffiano marine, quatre fentes.", "حافظة بطاقات نحيلة من الساففيانو الكحلي بأربع فتحات."],
      story: ["Scratch-resistant saffiano leather in a form so slim it disappears into any pocket. Four slots and a central pocket for folded notes.", "Cuir saffiano résistant aux rayures dans un format si fin qu’il se glisse partout. Quatre fentes et une poche centrale pour les billets pliés.", "جلد ساففيانو مقاوم للخدش بشكل نحيل يختفي في أي جيب. أربع فتحات وجيب مركزي للنقود المطوية."],
      specs: [["material", "Saffiano calfskin", "Veau saffiano", "جلد ساففيانو"], ["size", "10 × 7 cm, 4 slots", "10 × 7 cm, 4 fentes", "10 × 7 سم، 4 فتحات"], ["finish", "Gold-tone logo plate", "Plaque logo ton or", "لوحة شعار بلون الذهب"]], p: 1100, cmp: 0, stock: 25, feat: 0, best: 0, v: [] },
    { cat: 3, slug: "lunettes-aviator-or", art: "aviator", n: ["Aviator, Gold & Green", "Aviator, Or & Vert", "أفياتور ذهبي وأخضر"], s: ["Gold-tone metal frame, G-15 mineral lenses.", "Monture métal ton or, verres minéraux G-15.", "إطار معدني ذهبي وعدسات معدنية G-15."],
      story: ["A flight-jacket classic, refined: thin gold-tone wire, adjustable nose pads and mineral glass lenses that keep colours true.", "Un classique d’aviateur affiné : fil doré, plaquettes réglables et verres minéraux qui respectent les couleurs.", "كلاسيكية الطيارين بلمسة راقية: سلك ذهبي رفيع وقطع أنف قابلة للتعديل وعدسات معدنية تحافظ على الألوان."],
      specs: [["frame", "Gold-tone metal, 58 mm", "Métal ton or, 58 mm", "معدن ذهبي، 58 مم"], ["lens", "Mineral G-15, UV400", "Minéral G-15, UV400", "معدنية G-15، UV400"], ["finish", "Includes hard case and cloth", "Étui rigide et chiffon inclus", "مع علبة صلبة وقطعة تنظيف"]], p: 3200, cmp: 3900, stock: 15, feat: 1, best: 1, v: [] },
    { cat: 3, slug: "lunettes-rondes-ecaille", art: "round", n: ["Round Acetate, Tortoise", "Rondes Acétate, Écaille", "نظارة مستديرة بلون السلحفاة"], s: ["Hand-polished Italian acetate, round tortoise frame.", "Acétate italien poli main, monture ronde écaille.", "أسيتات إيطالي مصقول يدوياً بإطار مستدير بلون السلحفاة."],
      story: ["Cut and polished from a thick block of Italian acetate, the frame has the warmth and depth of real tortoiseshell without compromise.", "Taillée et polie dans un bloc d’acétate italien, la monture offre la chaleur et la profondeur de l’écaille véritable.", "منحوتة ومصقولة من كتلة أسيتات إيطالي سميكة، وتمنحك دفء وعمق السلحفاة الحقيقية."],
      specs: [["frame", "Italian acetate, 49 mm", "Acétate italien, 49 mm", "أسيتات إيطالي، 49 مم"], ["lens", "Polarised brown, UV400", "Polarisés marron, UV400", "مستقطبة بنية، UV400"], ["finish", "Includes hard case and cloth", "Étui rigide et chiffon inclus", "مع علبة صلبة وقطعة تنظيف"]], p: 2800, cmp: 0, stock: 0, feat: 0, best: 0, v: [] },
    { cat: 4, slug: "boutons-manchette-guilloche", art: "guilloche", n: ["Guilloché Cufflinks", "Boutons Guillochés", "أزرار أكمام غيوشي"], s: ["Engine-turned gold-tone discs with a swivel post.", "Disques guillochés ton or à tige pivotante.", "أقراص منقوشة بلون الذهب بمحور دوّار."],
      story: ["A fine engine-turned pattern catches the light each time you reach across the table. Supplied in a lined presentation box.", "Un guillochage délicat qui accroche la lumière à chaque geste. Livrés dans un coffret doublé.", "نقش غيوشي دقيق يلتقط الضوء مع كل حركة. تُقدَّم في علبة مبطّنة."],
      specs: [["material", "Gold-plated brass", "Laiton plaqué or", "نحاس مطلي بالذهب"], ["size", "16 mm discs", "Disques de 16 mm", "أقراص 16 مم"], ["fit", "Swivel post", "Tige pivotante", "محور دوّار"]], p: 1250, cmp: 0, stock: 18, feat: 1, best: 0, v: [] },
    { cat: 4, slug: "boutons-manchette-onyx", art: "onyx", n: ["Onyx Square Cufflinks", "Boutons Carrés Onyx", "أزرار أكمام مربعة من الأونيكس"], s: ["Polished black onyx set in a gold-tone square frame.", "Onyx noir poli serti dans un carré ton or.", "أونيكس أسود مصقول في إطار مربع ذهبي."],
      story: ["Deep black onyx, cut and polished, framed in a crisp square. The finishing touch for a white shirt and a dark suit.", "Onyx noir profond, taillé et poli, dans un cadre carré net. La touche finale d’une chemise blanche et d’un costume sombre.", "أونيكس أسود عميق مقصوص ومصقول في إطار مربع أنيق. اللمسة الأخيرة لقميص أبيض وبدلة داكنة."],
      specs: [["material", "Natural onyx, gold-plated brass", "Onyx naturel, laiton plaqué or", "أونيكس طبيعي ونحاس مطلي بالذهب"], ["size", "14 × 14 mm", "14 × 14 mm", "14 × 14 مم"], ["fit", "Swivel post", "Tige pivotante", "محور دوّار"]], p: 1450, cmp: 1750, stock: 10, feat: 0, best: 1, v: [] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg("", "", JSON.parse(c.name).en, c.art));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const cat = cats[p.cat]!;
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, frame(ART[p.art]!()));
    const totalStock = p.v.length ? 0 : p.stock;
    const facts = (k: 0 | 1 | 2) => p.specs.map((sp) => `${L[sp[0]]![k]}: ${sp[k + 1]}`).join("\n");
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]),
        i18n(p.story[0], p.story[1], p.story[2]), i18n(facts(0), facts(1), facts(2)),
        cat.id, `MA-${2400 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 10 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `MA-${2400 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Karim", "Casablanca", 5, "Une finition remarquable, la boîte cadeau est magnifique. Livraison soignée."],
    [3, "Salma", "Rabat", 5, "Offerte à mon mari, il ne la quitte plus. Élégante et très fine au poignet."],
    [1, "Youssef", "Marrakech", 5, "The moonphase is hypnotic. Packaging felt like a proper boutique."],
    [7, "Omar", "Tanger", 4, "ممتاز، الجلد ناعم والتغليف راقٍ، والتوصيل كان سريعاً."],
    [8, "Nadia", "Fès", 5, "Les lunettes sont légères et superbes, avec un étui solide."],
    [10, "Reda", "Agadir", 5, "Parfaits pour un mariage. Le guillochage est très fin."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "WELCOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on featured accessories (straps, leather goods, cufflinks): buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat || p.cat === 0) return;
    for (const [q, f, pop] of [[2, 0.92, 1], [3, 0.85, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));

  // hero slide image: a single large watch with a slowly sweeping seconds hand
  await putSvg(env, "uploads/sample-hero.svg", heroSvg());
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
