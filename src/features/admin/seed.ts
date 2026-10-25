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

type Kind = "tee" | "jeans" | "blazer" | "sweater" | "skirt" | "coat" | "hoodie" | "chinos" | "shirt" | "puffer" | "dress" | "socks";
type Bg = { a: string; b: string };

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))));
  return `#${[c((n >> 16) & 255), c((n >> 8) & 255), c(n & 255)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
};

/** Studio-flat garment illustration on a warm neutral backdrop (portrait 4:5). `detail` renders a fabric close-up instead. */
export function svg(kind: Kind, color: string, bg: Bg, detail = false) {
  const dk = shade(color, -0.22), lt = shade(color, 0.18);
  const sleeve = (x: number, y: number, flip = 1) => `<path d="M${x} ${y} l${flip * -64} 70 l${flip * 36} 38 l${flip * 42} -34 Z" fill="${color}" stroke="${dk}" stroke-width="2"/>`;
  const G: Record<Kind, string> = {
    tee: `<path d="M205 220 L120 285 L162 345 L212 312 L212 575 L388 575 L388 312 L438 345 L480 285 L395 220 Q350 262 300 262 Q250 262 205 220 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M250 224 Q300 280 350 224" fill="none" stroke="${dk}" stroke-width="5"/>`,
    jeans: `<path d="M215 215 H385 L412 610 H318 L300 330 L282 610 H188 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><rect x="215" y="215" width="170" height="26" fill="${dk}" opacity=".35"/><path d="M300 241 V330" stroke="${dk}" stroke-width="2"/><path d="M232 270 q16 22 40 6 M368 270 q-16 22 -40 6" fill="none" stroke="${lt}" stroke-width="2"/>`,
    blazer: `<path d="M195 235 L262 215 L300 330 L338 215 L405 235 L430 590 H170 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M262 215 L300 330 L262 390 L240 300 Z M338 215 L300 330 L338 390 L360 300 Z" fill="${dk}" opacity=".5"/><circle cx="300" cy="420" r="6" fill="${dk}"/><circle cx="300" cy="480" r="6" fill="${dk}"/>${sleeve(195, 240)}${sleeve(405, 240, -1)}`,
    sweater: `<path d="M205 225 L112 330 L148 395 L212 350 L212 575 L388 575 L388 350 L452 395 L488 330 L395 225 Q350 262 300 262 Q250 262 205 225 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><g stroke="${dk}" stroke-width="2" opacity=".35">${Array.from({ length: 10 }, (_, i) => `<path d="M${226 + i * 16} 520 V575"/>`).join("")}</g><rect x="212" y="520" width="176" height="6" fill="${dk}" opacity=".35"/>`,
    skirt: `<path d="M232 240 H368 L458 600 H142 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><rect x="232" y="240" width="136" height="26" fill="${dk}" opacity=".4"/><g stroke="${dk}" stroke-width="2" opacity=".4">${Array.from({ length: 7 }, (_, i) => `<path d="M${250 + i * 17} 266 L${178 + i * 41} 600"/>`).join("")}</g>`,
    coat: `<path d="M190 225 L262 212 L300 320 L338 212 L410 225 L440 625 H160 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><rect x="170" y="400" width="260" height="22" fill="${dk}" opacity=".5"/><rect x="288" y="396" width="24" height="30" fill="${lt}"/><path d="M262 212 L300 320 L262 360 Z M338 212 L300 320 L338 360 Z" fill="${dk}" opacity=".45"/>${sleeve(190, 232)}${sleeve(410, 232, -1)}`,
    hoodie: `<path d="M205 240 L112 345 L148 408 L212 362 L212 575 L388 575 L388 362 L452 408 L488 345 L395 240 Q350 270 300 270 Q250 270 205 240 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M232 232 Q300 150 368 232 Q300 292 232 232 Z" fill="${dk}" opacity=".45" stroke="${dk}" stroke-width="2"/><rect x="258" y="470" width="84" height="64" rx="8" fill="${dk}" opacity=".25"/><path d="M285 285 V345 M315 285 V345" stroke="${lt}" stroke-width="4"/>`,
    chinos: `<path d="M218 215 H382 L405 610 H315 L300 340 L285 610 H195 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><rect x="218" y="215" width="164" height="22" fill="${dk}" opacity=".4"/><path d="M232 255 q18 24 44 8 M368 255 q-18 24 -44 8" fill="none" stroke="${dk}" stroke-width="2"/>`,
    shirt: `<path d="M205 222 L112 330 L148 395 L212 350 L212 585 L388 585 L388 350 L452 395 L488 330 L395 222 L350 250 L300 285 L250 250 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M250 250 L300 285 L350 250 L335 222 L300 245 L265 222 Z" fill="${lt}" stroke="${dk}" stroke-width="2"/><path d="M300 285 V585" stroke="${dk}" stroke-width="2"/>${[330, 390, 450, 510].map((y) => `<circle cx="300" cy="${y}" r="4.5" fill="${dk}"/>`).join("")}`,
    puffer: `<path d="M195 225 L112 345 L150 420 L212 372 L212 590 L388 590 L388 372 L450 420 L488 345 L405 225 L350 250 L300 262 L250 250 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><g stroke="${dk}" stroke-width="2" opacity=".5">${[290, 350, 410, 470, 530].map((y) => `<path d="M212 ${y} Q300 ${y + 14} 388 ${y}"/>`).join("")}</g><rect x="270" y="215" width="60" height="30" rx="14" fill="${dk}" opacity=".5"/>`,
    dress: `<path d="M262 215 L250 330 L205 600 H395 L350 330 L338 215 L322 215 L316 300 L284 300 L278 215 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M250 330 Q300 350 350 330" fill="none" stroke="${lt}" stroke-width="2"/>`,
    socks: `<path d="M190 250 H270 V470 Q270 520 320 540 L330 590 Q250 605 200 560 Q170 520 170 470 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><path d="M350 250 H430 V470 Q430 520 480 540 L490 590 Q410 605 360 560 Q330 520 330 470 Z" fill="${color}" stroke="${dk}" stroke-width="2"/><rect x="190" y="250" width="80" height="26" fill="${dk}" opacity=".4"/><rect x="350" y="250" width="80" height="26" fill="${dk}" opacity=".4"/>`,
  };
  const body = detail
    ? `<rect width="600" height="750" fill="${color}"/>${Array.from({ length: 60 }, (_, i) => `<path d="M-20 ${i * 14} L620 ${i * 14 - 60}" stroke="${i % 2 ? dk : lt}" stroke-width="3" opacity=".35"/>`).join("")}<rect x="190" y="300" width="220" height="150" fill="#fff" opacity=".92"/><rect x="214" y="332" width="130" height="10" fill="#111"/><rect x="214" y="356" width="90" height="7" fill="#111" opacity=".5"/><rect x="214" y="378" width="170" height="7" fill="#111" opacity=".35"/><rect x="214" y="398" width="60" height="7" fill="#111" opacity=".35"/>`
    : `<rect width="600" height="750" fill="url(#g)"/><ellipse cx="300" cy="650" rx="190" ry="16" fill="#111" opacity=".12" filter="url(#b)"/><path d="M300 150 V190 M262 190 Q300 160 338 190" fill="none" stroke="#8a867c" stroke-width="5" stroke-linecap="round"/>${G[kind]}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg.a}"/><stop offset="1" stop-color="${bg.b}"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>${body}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const BG: Record<string, Bg> = { stone: { a: "#efece6", b: "#ddd8cd" }, sand: { a: "#f1e9dc", b: "#e1d4bd" }, grey: { a: "#ececec", b: "#d6d6d6" }, sage: { a: "#e8ece4", b: "#d1d9c8" } };

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "women", name: i18n("Women", "Femme", "نساء"), kind: "dress" as Kind, color: "#d8c3a5", bg: BG.sand! },
    { id: newId(), slug: "men", name: i18n("Men", "Homme", "رجال"), kind: "shirt" as Kind, color: "#8aa0b8", bg: BG.grey! },
    { id: newId(), slug: "outerwear", name: i18n("Outerwear", "Vestes & manteaux", "المعاطف والجاكيتات"), kind: "coat" as Kind, color: "#b8a98e", bg: BG.stone! },
    { id: newId(), slug: "essentials", name: i18n("Essentials", "Essentiels", "الأساسيات"), kind: "tee" as Kind, color: "#f2efe9", bg: BG.sage! },
  ];
  const SZ = { top: ["S", "M", "L", "XL"], waist: ["30", "32", "34", "36"], eu: ["34", "36", "38", "40"], three: ["S", "M", "L"], four: ["XS", "S", "M", "L"], one: ["One size"] };
  const COL: Record<string, string> = { White: "#f4f1ea", Black: "#1d1d1f", Sand: "#d3bf9d", Indigo: "#2f4468", "Washed black": "#3a3a3d", Camel: "#b88a56", Cream: "#efe6d2", Olive: "#6b6f45", Sage: "#a3b38f", Stone: "#bdb5a2", Grey: "#9a9a9c", Khaki: "#a89a72", Navy: "#1f2c4a", "Sky blue": "#9db9d6", Champagne: "#dcc8a8" };
  type PD = { cat: number; slug: string; kind: Kind; n: [string, string, string]; s: [string, string, string]; l: [string, string, string]; sizes: string[]; colors: string[]; chart: string; comp: [string, string, string]; p: number; cmp: number; feat: number; best: number; bg: Bg };
  const chart = (rows: [string, number, number][]) => rows.map(([sz, a, b]) => `${sz}: Chest ${a} cm · Length ${b} cm`).join("\n");
  const chartFr = (rows: [string, number, number][]) => rows.map(([sz, a, b]) => `${sz} : Poitrine ${a} cm · Longueur ${b} cm`).join("\n");
  const chartAr = (rows: [string, number, number][]) => rows.map(([sz, a, b]) => `${sz}: الصدر ${a} سم · الطول ${b} سم`).join("\n");
  const rowsTop: [string, number, number][] = [["S", 96, 68], ["M", 102, 70], ["L", 108, 72], ["XL", 114, 74]];
  const rowsW: [string, number, number][] = [["S", 90, 64], ["M", 96, 66], ["L", 102, 68]];
  const rowsW4: [string, number, number][] = [["XS", 84, 100], ["S", 88, 102], ["M", 94, 104], ["L", 100, 106]];
  const products: PD[] = [
    { cat: 3, slug: "oversized-cotton-tee", kind: "tee", n: ["Oversized cotton tee", "T-shirt oversize en coton", "تيشيرت قطن واسع"], s: ["Heavyweight organic cotton, relaxed drop shoulder.", "Coton bio épais, coupe ample et épaule tombante.", "قطن عضوي ثقيل بقصّة واسعة وكتف منسدل."], l: ["Cut from 220 gsm organic cotton jersey. Pre-washed for softness. Machine wash cold, dry flat.", "Jersey de coton bio 220 g/m². Prélavé pour plus de douceur. Lavage en machine à froid, séchage à plat.", "جيرسي قطن عضوي 220 غ/م². مُغسول مسبقاً لنعومة أكبر. غسيل بارد بالغسالة وتجفيف مسطح."], sizes: SZ.top, colors: ["White", "Black", "Sand"], chart: "", comp: ["Composition: 100% organic cotton\nFit: oversized\nCare: wash cold", "Composition : 100 % coton bio\nCoupe : oversize\nEntretien : lavage à froid", "التركيب: 100٪ قطن عضوي\nالقصّة: واسعة\nالعناية: غسيل بارد"], p: 149, cmp: 0, feat: 1, best: 1, bg: BG.stone! },
    { cat: 0, slug: "wide-leg-denim", kind: "jeans", n: ["Wide-leg denim", "Jean jambe large", "جينز واسع الساق"], s: ["High-rise, full-length, rigid denim.", "Taille haute, longueur cheville, denim rigide.", "خصر عالٍ وطول كامل وجينز متين."], l: ["Rigid 12 oz denim with a straight, wide leg. Sits at the natural waist. Length 104 cm.", "Denim rigide 12 oz, coupe droite et large. Taille naturelle. Longueur 104 cm.", "جينز متين 12 أونصة بساق مستقيمة واسعة. يستقر عند الخصر الطبيعي. الطول 104 سم."], sizes: SZ.eu, colors: ["Indigo", "Washed black"], chart: "", comp: ["Composition: 100% cotton\nFit: wide leg\nCare: wash inside out", "Composition : 100 % coton\nCoupe : jambe large\nEntretien : laver à l'envers", "التركيب: 100٪ قطن\nالقصّة: ساق واسعة\nالعناية: اغسله مقلوباً"], p: 349, cmp: 429, feat: 1, best: 1, bg: BG.grey! },
    { cat: 0, slug: "relaxed-blazer", kind: "blazer", n: ["Relaxed blazer", "Blazer décontracté", "بليزر مريح"], s: ["Soft tailoring you can wear every day.", "Une coupe souple à porter tous les jours.", "تفصيل ناعم يُلبس كل يوم."], l: ["Single-breasted blazer in a drapey crepe. Lined, with two flap pockets.", "Blazer droit en crêpe fluide. Doublé, deux poches à rabat.", "بليزر بصف أزرار واحد من الكريب المنسدل. مبطّن وبجيبين."], sizes: SZ.three, colors: ["Black", "Camel"], chart: "", comp: ["Composition: 68% polyester, 28% viscose, 4% elastane\nLining: 100% polyester\nCare: dry clean", "Composition : 68 % polyester, 28 % viscose, 4 % élasthanne\nDoublure : 100 % polyester\nEntretien : nettoyage à sec", "التركيب: 68٪ بوليستر، 28٪ فيسكوز، 4٪ إيلاستان\nالبطانة: 100٪ بوليستر\nالعناية: تنظيف جاف"], p: 599, cmp: 749, feat: 1, best: 0, bg: BG.sand! },
    { cat: 0, slug: "ribbed-knit-sweater", kind: "sweater", n: ["Ribbed knit sweater", "Pull en maille côtelée", "سترة تريكو مضلّعة"], s: ["Soft rib, slightly cropped.", "Maille côtelée douce, légèrement courte.", "تريكو مضلّع ناعم بطول قصير قليلاً."], l: ["Fine-gauge rib knit with a crew neck. Stretches to fit and keeps its shape.", "Maille côtelée fine à col rond. Extensible, garde sa forme.", "تريكو مضلّع رفيع برقبة مستديرة. مطاطي ويحافظ على شكله."], sizes: SZ.three, colors: ["Cream", "Olive"], chart: "", comp: ["Composition: 55% viscose, 27% polyester, 18% polyamide\nCare: hand wash", "Composition : 55 % viscose, 27 % polyester, 18 % polyamide\nEntretien : lavage à la main", "التركيب: 55٪ فيسكوز، 27٪ بوليستر، 18٪ بولي أميد\nالعناية: غسيل يدوي"], p: 279, cmp: 0, feat: 0, best: 1, bg: BG.stone! },
    { cat: 0, slug: "pleated-midi-skirt", kind: "skirt", n: ["Pleated midi skirt", "Jupe midi plissée", "تنورة ميدي مطوية"], s: ["Fluid pleats that move with you.", "Des plis fluides qui suivent le mouvement.", "ثنيات انسيابية تتحرك معك."], l: ["Knife-pleated midi skirt with an elasticated back waist and concealed side zip.", "Jupe midi à plis couteau, taille élastiquée au dos et zip invisible sur le côté.", "تنورة ميدي بثنيات حادة وخصر مطاطي خلفي وسحّاب جانبي مخفي."], sizes: SZ.three, colors: ["Black", "Sage"], chart: "", comp: ["Composition: 100% recycled polyester\nLength: 82 cm\nCare: machine wash 30°", "Composition : 100 % polyester recyclé\nLongueur : 82 cm\nEntretien : machine 30°", "التركيب: 100٪ بوليستر معاد تدويره\nالطول: 82 سم\nالعناية: غسالة 30°"], p: 229, cmp: 289, feat: 0, best: 0, bg: BG.sage! },
    { cat: 2, slug: "classic-trench-coat", kind: "coat", n: ["Classic trench coat", "Trench classique", "معطف ترينش كلاسيكي"], s: ["A water-repellent layer for every season.", "Une couche déperlante pour toutes les saisons.", "طبقة طاردة للماء لكل المواسم."], l: ["Double-breasted trench with a belted waist and storm flap. Water-repellent cotton blend.", "Trench croisé à ceinture et patte d'orage. Coton déperlant.", "معطف ترينش بصفّين من الأزرار وحزام ولسان واقٍ. مزيج قطني طارد للماء."], sizes: SZ.three, colors: ["Stone", "Black"], chart: "", comp: ["Composition: 65% cotton, 35% polyester\nLength: 108 cm\nCare: dry clean", "Composition : 65 % coton, 35 % polyester\nLongueur : 108 cm\nEntretien : nettoyage à sec", "التركيب: 65٪ قطن، 35٪ بوليستر\nالطول: 108 سم\nالعناية: تنظيف جاف"], p: 1190, cmp: 1490, feat: 1, best: 1, bg: BG.stone! },
    { cat: 1, slug: "heavy-hooded-sweatshirt", kind: "hoodie", n: ["Heavyweight hoodie", "Sweat à capuche épais", "هودي ثقيل"], s: ["450 gsm brushed-back fleece.", "Molleton gratté 450 g/m².", "فليس مبطّن بالفرشاة 450 غ/م²."], l: ["Boxy hoodie in dense brushed-back fleece with a double-layer hood and kangaroo pocket.", "Sweat carré en molleton dense gratté, capuche double épaisseur et poche kangourou.", "هودي بقصّة مربعة من فليس كثيف مع قبعة بطبقتين وجيب أمامي."], sizes: SZ.top, colors: ["Grey", "Black"], chart: "", comp: ["Composition: 80% cotton, 20% polyester\nWeight: 450 gsm\nCare: wash cold", "Composition : 80 % coton, 20 % polyester\nPoids : 450 g/m²\nEntretien : lavage à froid", "التركيب: 80٪ قطن، 20٪ بوليستر\nالوزن: 450 غ/م²\nالعناية: غسيل بارد"], p: 399, cmp: 0, feat: 0, best: 1, bg: BG.grey! },
    { cat: 1, slug: "straight-chinos", kind: "chinos", n: ["Straight chinos", "Chino droit", "بنطال شينو مستقيم"], s: ["A clean everyday trouser in stretch twill.", "Un pantalon net pour tous les jours en sergé stretch.", "بنطال أنيق يومي من التويل المطاطي."], l: ["Mid-rise straight chino in cotton twill with a touch of stretch.", "Chino droit taille mi-haute en sergé de coton légèrement stretch.", "شينو مستقيم بخصر متوسط من تويل القطن مع قليل من المطاط."], sizes: SZ.waist, colors: ["Khaki", "Navy"], chart: "", comp: ["Composition: 98% cotton, 2% elastane\nFit: straight\nCare: machine 40°", "Composition : 98 % coton, 2 % élasthanne\nCoupe : droite\nEntretien : machine 40°", "التركيب: 98٪ قطن، 2٪ إيلاستان\nالقصّة: مستقيمة\nالعناية: غسالة 40°"], p: 299, cmp: 369, feat: 0, best: 0, bg: BG.sand! },
    { cat: 1, slug: "washed-linen-shirt", kind: "shirt", n: ["Washed linen shirt", "Chemise en lin lavé", "قميص كتان مغسول"], s: ["Breathable, relaxed, gets softer with every wash.", "Respirante, ample, plus douce à chaque lavage.", "مريح ويتنفّس ويزداد نعومة مع كل غسلة."], l: ["Garment-washed linen shirt with a button-down collar and one chest pocket.", "Chemise en lin lavé en pièce, col boutonné et une poche poitrine.", "قميص كتان مغسول بياقة بأزرار وجيب صدر واحد."], sizes: SZ.top, colors: ["White", "Sky blue"], chart: "", comp: ["Composition: 100% linen\nFit: regular\nCare: wash 30°, iron damp", "Composition : 100 % lin\nCoupe : regular\nEntretien : 30°, repasser humide", "التركيب: 100٪ كتان\nالقصّة: عادية\nالعناية: 30° والكي وهو رطب"], p: 259, cmp: 0, feat: 1, best: 0, bg: BG.stone! },
    { cat: 2, slug: "lightweight-puffer", kind: "puffer", n: ["Lightweight puffer jacket", "Doudoune légère", "جاكيت منفوخ خفيف"], s: ["Packable warmth with a recycled fill.", "Une chaleur compacte avec garnissage recyclé.", "دفء خفيف قابل للطي بحشوة معاد تدويرها."], l: ["Quilted puffer with a recycled-fibre fill, water-repellent shell and zipped pockets.", "Doudoune matelassée à garnissage en fibres recyclées, tissu déperlant et poches zippées.", "جاكيت مبطّن بحشوة ألياف معاد تدويرها وقماش طارد للماء وجيوب بسحّاب."], sizes: SZ.top, colors: ["Black", "Olive"], chart: "", comp: ["Shell: 100% nylon\nFill: 100% recycled polyester\nCare: machine 30°", "Extérieur : 100 % nylon\nGarnissage : 100 % polyester recyclé\nEntretien : machine 30°", "الخارج: 100٪ نايلون\nالحشوة: 100٪ بوليستر معاد تدويره\nالعناية: غسالة 30°"], p: 699, cmp: 899, feat: 1, best: 1, bg: BG.sage! },
    { cat: 0, slug: "satin-slip-dress", kind: "dress", n: ["Satin slip dress", "Robe nuisette en satin", "فستان ساتان رفيع الحمالات"], s: ["Bias-cut satin with adjustable straps.", "Satin coupé en biais, bretelles réglables.", "ساتان مقصوص بالزاوية وحمالات قابلة للتعديل."], l: ["Midi slip dress cut on the bias in a fluid satin. Adjustable straps.", "Robe nuisette midi coupée en biais dans un satin fluide. Bretelles réglables.", "فستان ميدي بقصّة مائلة من ساتان انسيابي. حمالات قابلة للتعديل."], sizes: SZ.four, colors: ["Champagne", "Black"], chart: "", comp: ["Composition: 100% recycled polyester\nLength: 112 cm\nCare: hand wash", "Composition : 100 % polyester recyclé\nLongueur : 112 cm\nEntretien : lavage à la main", "التركيب: 100٪ بوليستر معاد تدويره\nالطول: 112 سم\nالعناية: غسيل يدوي"], p: 329, cmp: 0, feat: 0, best: 0, bg: BG.sand! },
    { cat: 3, slug: "cotton-socks-3-pack", kind: "socks", n: ["Cotton socks, 3-pack", "Chaussettes en coton, lot de 3", "جوارب قطن، 3 قطع"], s: ["Cushioned everyday socks.", "Des chaussettes confortables pour tous les jours.", "جوارب مريحة لكل يوم."], l: ["Three pairs of ribbed cotton-blend crew socks with a cushioned sole.", "Trois paires de chaussettes côtelées en coton mélangé, semelle amortissante.", "ثلاثة أزواج من الجوارب المضلّعة من قطن مخلوط بنعل مبطّن."], sizes: SZ.one, colors: ["White", "Black"], chart: "", comp: ["Composition: 80% cotton, 18% polyamide, 2% elastane\nFits: EU 39–45", "Composition : 80 % coton, 18 % polyamide, 2 % élasthanne\nPointures : 39–45", "التركيب: 80٪ قطن، 18٪ بولي أميد، 2٪ إيلاستان\nالمقاسات: 39–45"], p: 89, cmp: 0, feat: 0, best: 0, bg: BG.grey! },
  ];
  const chartFor = (pd: PD): [string, string, string] => {
    const rows = pd.sizes === SZ.top ? rowsTop : pd.sizes === SZ.three ? rowsW : pd.sizes === SZ.four ? rowsW4 : null;
    return rows ? [chart(rows), chartFr(rows), chartAr(rows)] : ["", "", ""];
  };

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.kind, c.color, c.bg));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const k1 = `uploads/sample-${p.slug}.svg`, k2 = `uploads/sample-${p.slug}-detail.svg`;
    await putSvg(env, k1, svg(p.kind, COL[p.colors[0]!]!, p.bg));
    await putSvg(env, k2, svg(p.kind, COL[p.colors[0]!]!, p.bg, true));
    const ch = chartFor(p);
    const specs = [0, 1, 2].map((li) => [ch[li], p.comp[li]].filter(Boolean).join("\n"));
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,0,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(specs[0]!, specs[1]!, specs[2]!),
        cats[p.cat]!.id, `AT-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, p.feat, p.best, p.best ? 16 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, k1, p.n[0]),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,1)").bind(newId(), id, k2, `${p.n[0]} — detail`),
    );
    let j = 0;
    for (const col of p.colors) for (const sz of p.sizes) {
      const stock = (i * 7 + j * 5) % 11 === 0 ? 0 : 3 + ((i + j * 3) % 9);
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, `${sz} / ${col}`, JSON.stringify({ Size: sz, Color: col }), `AT-${100 + i}-${j}`, price(p.p), stock, j));
      j++;
    }
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Coupe parfaite, le coton est épais et doux. Livré en 2 jours."],
    [1, "Youssef", "Rabat", 5, "Great denim, true to size. Paying on delivery let me try it first."],
    [5, "Lina", "Tanger", 4, "Beau manteau, la ceinture est solide. Je recommande."],
    [8, "Omar", "Marrakech", 5, "La doudoune est légère et chaude, exactement comme sur la photo."],
    [3, "Nadia", "Fès", 5, "Pull très doux, taille normale."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "ATELIER10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // quantity offers on the featured products: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  products.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.9, 1], [3, 0.82, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg("coat", "#b8a98e", BG.stone!));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
