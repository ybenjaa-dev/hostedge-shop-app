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
    ["about", ["About us", "À propos", "من نحن"], ["We are an independent bookshop delivering well-chosen books to your door, with payment on delivery.", "Nous sommes une librairie indépendante qui livre des livres soigneusement choisis chez vous, avec paiement à la livraison.", "نحن مكتبة مستقلة توصل إليك كتباً مختارة بعناية إلى باب بيتك مع الدفع عند الاستلام."]],
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

export function svg(c1: string, c2: string, rawLabel: string, shape: number) {
  const label = xml(rawLabel);
  const shapes = [
    `<circle cx="300" cy="300" r="150" fill="rgba(255,255,255,.22)"/><circle cx="300" cy="300" r="90" fill="rgba(255,255,255,.35)"/>`,
    `<rect x="170" y="170" width="260" height="260" rx="40" fill="rgba(255,255,255,.25)" transform="rotate(12 300 300)"/>`,
    `<path d="M300 150 L440 410 L160 410 Z" fill="rgba(255,255,255,.28)"/>`,
    `<rect x="150" y="230" width="300" height="140" rx="70" fill="rgba(255,255,255,.28)"/>`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/>${shapes[shape % 4]}<text x="300" y="520" text-anchor="middle" font-family="sans-serif" font-size="34" font-weight="700" fill="rgba(255,255,255,.9)">${label}</text></svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

type Pal = [string, string, string]; // paper/background, ink, accent

/** Hand-drawn style cover art, 600x900. `motif` picks one of 12 illustrations; palette + title block do the rest. */
export function bookCover(rawTitle: string, rawAuthor: string, [bg, ink, ac]: Pal, motif: number) {
  const words = rawTitle.toUpperCase().split(" ");
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + w).length <= 13) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  const size = lines.some((l) => l.length > 11) ? 44 : 52;
  const ty = 640 - ((lines.length - 1) * (size + 8)) / 2;
  const title = lines.map((l, i) => `<text x="300" y="${ty + i * (size + 10)}" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="${size}" font-weight="700" letter-spacing="3" fill="${ink}">${xml(l)}</text>`).join("");
  const o = (n: number) => n.toFixed(2);
  const art: string[] = [
    // 0 sun over dunes
    `<circle cx="300" cy="250" r="125" fill="${ac}"/>${[0, 1, 2, 3].map((i) => `<path d="M60 ${340 + i * 38} Q180 ${300 + i * 38} 300 ${340 + i * 38} T540 ${340 + i * 38}" fill="none" stroke="${ink}" stroke-width="${3 - i * 0.4}"/>`).join("")}`,
    // 1 waves
    `<circle cx="430" cy="160" r="52" fill="${ac}"/>${Array.from({ length: 9 }, (_, i) => `<path d="M60 ${230 + i * 28} q40 -26 80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="${ink}" stroke-width="2.6" opacity="${o(1 - i * 0.07)}"/>`).join("")}`,
    // 2 mountains
    `<circle cx="150" cy="150" r="44" fill="${ac}"/><path d="M40 440 L230 170 L330 320 L410 230 L560 440Z" fill="${ink}" opacity=".9"/><path d="M40 440 L190 300 L290 440Z" fill="${ac}" opacity=".85"/><path d="M230 170 L262 218 L238 210 L222 232 L205 205Z" fill="${bg}"/>`,
    // 3 crescent moon + stars
    `<circle cx="300" cy="240" r="130" fill="${ac}"/><circle cx="350" cy="214" r="116" fill="${bg}"/>${[[110, 120], [470, 110], [420, 360], [150, 330], [520, 250], [90, 240]].map(([x, y], i) => `<path d="M${x} ${y! - 12} L${x! + 3.5} ${y! - 3.5} L${x! + 12} ${y} L${x! + 3.5} ${y! + 3.5} L${x} ${y! + 12} L${x! - 3.5} ${y! + 3.5} L${x! - 12} ${y} L${x! - 3.5} ${y! - 3.5}Z" fill="${i % 2 ? ink : ac}"/>`).join("")}`,
    // 4 botanical leaves
    `<path d="M300 470 V210" stroke="${ink}" stroke-width="4"/>${Array.from({ length: 7 }, (_, i) => { const y = 440 - i * 38; const d = i % 2 ? 1 : -1; return `<ellipse cx="${300 + d * 52}" cy="${y}" rx="52" ry="19" fill="${i % 3 === 0 ? ac : ink}" opacity=".92" transform="rotate(${d * -28} ${300 + d * 52} ${y})"/>`; }).join("")}<circle cx="300" cy="196" r="26" fill="${ac}"/>`,
    // 5 skyline
    `<circle cx="420" cy="150" r="48" fill="${ac}"/>${[[70, 220], [130, 300], [190, 180], [250, 260], [310, 330], [370, 230], [430, 290], [490, 200]].map(([x, h]) => `<rect x="${x}" y="${470 - h!}" width="52" height="${h}" fill="${ink}"/>${Array.from({ length: Math.floor(h! / 46) }, (_, k) => `<rect x="${x! + 12}" y="${486 - h! + k * 40}" width="9" height="14" fill="${bg}" opacity=".8"/><rect x="${x! + 30}" y="${486 - h! + k * 40}" width="9" height="14" fill="${bg}" opacity=".8"/>`).join("")}`).join("")}`,
    // 6 rings
    `${[150, 118, 88, 60, 34].map((r, i) => `<circle cx="300" cy="270" r="${r}" fill="${i % 2 ? ink : ac}" ${i % 2 ? `opacity=".92"` : ""}/>`).join("")}<circle cx="300" cy="270" r="12" fill="${bg}"/>`,
    // 7 diagonal stripes + disc
    `<g stroke="${ink}" stroke-width="3">${Array.from({ length: 16 }, (_, i) => `<line x1="${50 + i * 32}" y1="460" x2="${200 + i * 32}" y2="100" opacity="${o(0.25 + (i % 4) * 0.2)}"/>`).join("")}</g><circle cx="300" cy="270" r="92" fill="${ac}"/>`,
    // 8 arch / doorway
    `<path d="M170 470 V250 a130 130 0 0 1 260 0 V470Z" fill="${ink}"/><path d="M215 470 V260 a85 85 0 0 1 170 0 V470Z" fill="${ac}"/><path d="M262 470 V280 a38 38 0 0 1 76 0 V470Z" fill="${bg}"/><circle cx="300" cy="106" r="18" fill="${ac}"/>`,
    // 9 open book
    `<path d="M300 200 C230 160 140 170 80 195 V430 C140 405 230 400 300 440Z" fill="${ink}"/><path d="M300 200 C370 160 460 170 520 195 V430 C460 405 370 400 300 440Z" fill="${ac}"/><path d="M300 200 V440" stroke="${bg}" stroke-width="4"/>${[0, 1, 2, 3].map((i) => `<path d="M105 ${235 + i * 30} q80 -22 170 8" fill="none" stroke="${bg}" stroke-width="2" opacity=".6"/>`).join("")}`,
    // 10 birds
    `<circle cx="300" cy="330" r="120" fill="${ac}" opacity=".9"/>${[[150, 160, 1.3], [300, 110, 1.8], [440, 190, 1.1], [230, 260, 1], [380, 300, 1.5], [120, 330, 0.8]].map(([x, y, k]) => `<path d="M${x! - 34 * k!} ${y! - 8 * k!} Q${x! - 14 * k!} ${y! - 6 * k!} ${x} ${y} Q${x! + 14 * k!} ${y! - 6 * k!} ${x! + 34 * k!} ${y! - 8 * k!}" fill="none" stroke="${ink}" stroke-width="${3.4 * k!}" stroke-linecap="round"/>`).join("")}`,
    // 11 zellige star tiles
    `${Array.from({ length: 12 }, (_, i) => { const x = 130 + (i % 3) * 170, y = 130 + Math.floor(i / 3) * 105; return `<g transform="translate(${x} ${y})"><rect x="-44" y="-44" width="88" height="88" fill="${i % 2 ? ink : ac}" transform="rotate(45)"/><rect x="-44" y="-44" width="88" height="88" fill="${i % 2 ? ac : ink}" opacity=".85"/><circle r="12" fill="${bg}"/></g>`; }).join("")}`,
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900"><rect width="600" height="900" fill="${bg}"/><rect x="24" y="24" width="552" height="852" fill="none" stroke="${ink}" stroke-width="2"/><rect x="34" y="34" width="532" height="832" fill="none" stroke="${ac}" stroke-width="1"/><g transform="translate(0 70)">${art[motif % 12]}</g><path d="M200 ${ty - size - 22} H400" stroke="${ac}" stroke-width="3"/>${title}<text x="300" y="800" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="26" fill="${ink}">${xml(rawAuthor)}</text><path d="M270 828 h60" stroke="${ac}" stroke-width="2"/></svg>`;
}

/** Hero backdrop: a wall of book spines on warm shelves, dimmed so the lead cover stands out. */
function libraryWall() {
  const cols = ["#7a1f2e", "#b8893a", "#2f4a3d", "#1f3a5a", "#d8c7a1", "#4a2c3a", "#a5522f", "#e9dcc0", "#3b3b4f"];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1a14"/><stop offset="1" stop-color="#140d0a"/></linearGradient><radialGradient id="l" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient></defs><rect width="1600" height="900" fill="url(#v)"/>`;
  for (let row = 0; row < 4; row++) {
    const base = 215 + row * 215;
    let x = -10;
    while (x < 1610) {
      const w = 34 + rnd() * 46, h = 120 + rnd() * 70, c = cols[Math.floor(rnd() * cols.length)]!;
      out += `<rect x="${o2(x)}" y="${o2(base - h)}" width="${o2(w)}" height="${o2(h)}" fill="${c}"/><rect x="${o2(x)}" y="${o2(base - h)}" width="3" height="${o2(h)}" fill="#fff" opacity=".18"/><rect x="${o2(x + 5)}" y="${o2(base - h + 22)}" width="${o2(w - 10)}" height="3" fill="#fff" opacity=".35"/><rect x="${o2(x + 5)}" y="${o2(base - 34)}" width="${o2(w - 10)}" height="2" fill="#fff" opacity=".25"/>`;
      x += w + 1.5;
    }
    out += `<rect x="0" y="${base}" width="1600" height="16" fill="#5b3c25"/><rect x="0" y="${base + 16}" width="1600" height="6" fill="#000" opacity=".35"/>`;
  }
  return out + `<rect width="1600" height="900" fill="url(#l)"/><rect width="1600" height="900" fill="#1d1814" opacity=".38"/></svg>`;
}
const o2 = (n: number) => n.toFixed(1);

type BookData = {
  cat: number; slug: string; n: [string, string, string]; a: string; p: number; cmp: number; stock: number; feat: number; best: number;
  pages: number; hard: 0 | 1; year: number; pal: Pal; motif: number; d: [string, string, string]; v: [string, number, number][];
};

const BOOKS: BookData[] = [
  { cat: 0, slug: "the-salt-orchard", n: ["The Salt Orchard", "Le Verger de sel", "بستان الملح"], a: "Nadia Belkacem", p: 98, cmp: 120, stock: 40, feat: 1, best: 1, pages: 342, hard: 0, year: 2024, pal: ["#efe2c6", "#2b1a17", "#a3342f"], motif: 4,
    d: ["On the morning her grandmother's orchard turns white with salt, Selma returns to a village that never forgave her for leaving. A slow, luminous novel about land, inheritance and the stories families choose not to tell.\n\nThe first pages arrive like a held breath: the dust, the sea wind, a door left unlocked for thirty years.", "Le matin où le verger de sa grand-mère blanchit sous le sel, Selma revient dans un village qui ne lui a jamais pardonné son départ. Un roman lent et lumineux sur la terre, l'héritage et les histoires que les familles choisissent de taire.\n\nLes premières pages s'ouvrent comme un souffle retenu : la poussière, le vent marin, une porte restée ouverte pendant trente ans.", "في صباح يبيضّ فيه بستان جدّتها بالملح، تعود سلمى إلى قرية لم تغفر لها رحيلها. رواية بطيئة مضيئة عن الأرض والميراث والحكايات التي تختار العائلات ألّا ترويها.\n\nتبدأ الصفحات الأولى كأنفاس محبوسة: الغبار، ريح البحر، وبابٌ تُرك مفتوحاً ثلاثين عاماً."], v: [] },
  { cat: 0, slug: "letters-to-tangier", n: ["Letters to Tangier", "Lettres à Tanger", "رسائل إلى طنجة"], a: "Karim Laaroussi", p: 85, cmp: 0, stock: 25, feat: 1, best: 0, pages: 288, hard: 0, year: 2023, pal: ["#1f3a4d", "#f1e6cc", "#e0a458"], motif: 1,
    d: ["Forty letters, three decades and one harbour city. A translator in Paris answers the mail her father never sent, and slowly pieces together who he was.\n\nTangier, 1987: the ferry horn, the smell of orange blossom, and a handwriting she has never seen before.", "Quarante lettres, trois décennies et une ville de port. À Paris, une traductrice répond au courrier que son père n'a jamais envoyé et reconstitue peu à peu qui il était.\n\nTanger, 1987 : la corne du ferry, l'odeur de fleur d'oranger, et une écriture qu'elle n'a jamais vue.", "أربعون رسالة وثلاثة عقود ومدينة مرفأ. في باريس، تردّ مترجمة على البريد الذي لم يرسله أبوها، وتعيد بناء صورته شيئاً فشيئاً.\n\nطنجة، 1987: صفّارة العبّارة، رائحة زهر البرتقال، وخطّ يدٍ لم ترَه من قبل."], v: [] },
  { cat: 0, slug: "the-last-lighthouse", n: ["The Last Lighthouse", "Le Dernier Phare", "المنارة الأخيرة"], a: "Elena Marchetti", p: 110, cmp: 135, stock: 0, feat: 0, best: 0, pages: 410, hard: 1, year: 2022, pal: ["#e8ddc7", "#14202e", "#c9583c"], motif: 2,
    d: ["When the coast guard automates the final lighthouse, its keeper refuses to leave. An epic of storms, solitude and the small mercies of strangers.\n\nThe lamp turned for the last time at dusk, and nobody on the quay looked up.", "Quand les garde-côtes automatisent le dernier phare, son gardien refuse de partir. Une épopée de tempêtes, de solitude et de petites bontés d'inconnus.\n\nLa lampe a tourné une dernière fois au crépuscule, et personne sur le quai n'a levé les yeux.", "حين تؤتمت خفر السواحل آخر منارة، يرفض حارسها المغادرة. ملحمة عن العواصف والعزلة ولطف الغرباء الصغير.\n\nدار المصباح دورته الأخيرة عند الغروب، ولم يرفع أحد على الرصيف نظره."], v: [] },
  { cat: 1, slug: "midnight-in-the-medina", n: ["Midnight in the Medina", "Minuit dans la médina", "منتصف الليل في المدينة القديمة"], a: "Samir Idrissi", p: 89, cmp: 109, stock: 35, feat: 1, best: 1, pages: 326, hard: 0, year: 2024, pal: ["#16161d", "#f0e2c0", "#d1a23a"], motif: 3,
    d: ["A rug merchant is found dead in a locked riad, and the only witness is a cat. Inspector Amrani has one night, a cold mint tea and the whole labyrinth of the old city to untangle.\n\nThe lanterns went out one by one, as if someone were counting.", "Un marchand de tapis est retrouvé mort dans un riad verrouillé, et le seul témoin est un chat. L'inspecteur Amrani a une nuit, un thé à la menthe froid et tout le labyrinthe de la vieille ville à démêler.\n\nLes lanternes s'éteignaient une à une, comme si quelqu'un comptait.", "يُعثر على تاجر سجاد ميتاً في رياض مغلق، والشاهد الوحيد قطّة. أمام المفتش العمراني ليلة واحدة وكأس نعناع بارد ومتاهة المدينة القديمة كلها.\n\nكانت الفوانيس تنطفئ واحداً تلو الآخر، كأن أحداً يعدّها."], v: [] },
  { cat: 1, slug: "the-cartographers-ledger", n: ["The Cartographer's Ledger", "Le Registre du cartographe", "دفتر رسّام الخرائط"], a: "Julia Weston", p: 120, cmp: 0, stock: 0, feat: 1, best: 1, pages: 454, hard: 0, year: 2023, pal: ["#e6d9bd", "#3a2411", "#2f6b5e"], motif: 9,
    d: ["Every map in the archive has been quietly corrected, and every correction points to one missing island. A literary thriller for readers who love old paper and older secrets.\n\nShe unrolled the chart. In the margin, in her own handwriting, was a date three weeks away.", "Chaque carte des archives a été discrètement corrigée, et chaque correction mène à une île manquante. Un thriller littéraire pour qui aime le vieux papier et les secrets plus vieux encore.\n\nElle déroula la carte. Dans la marge, de sa propre écriture, figurait une date dans trois semaines.", "كل خريطة في الأرشيف صُحّحت بهدوء، وكل تصحيح يشير إلى جزيرة مفقودة. تشويق أدبي لعشّاق الورق القديم والأسرار الأقدم.\n\nفرَدت الخريطة. وعلى الهامش، بخطّ يدها، تاريخٌ بعد ثلاثة أسابيع."],
    v: [["Paperback", 120, 18], ["Hardcover", 175, 9]] },
  { cat: 1, slug: "a-quiet-poison", n: ["A Quiet Poison", "Un poison discret", "سمّ هادئ"], a: "Anouk Verhaegen", p: 79, cmp: 99, stock: 22, feat: 0, best: 0, pages: 264, hard: 0, year: 2021, pal: ["#2c3a2e", "#ecdfc2", "#b5473a"], motif: 7,
    d: ["A dinner for six, a recipe that has been in the family for generations, and one guest who will not leave the table alive. A crisp, clever country-house mystery.\n\nNobody noticed the sugar bowl had been moved.", "Un dîner pour six, une recette de famille transmise depuis des générations, et un convive qui ne quittera pas la table vivant. Une enquête de manoir vive et ingénieuse.\n\nPersonne n'avait remarqué que le sucrier avait changé de place.", "عشاء لستة أشخاص، ووصفة عائلية توارثتها الأجيال، وضيفٌ لن يغادر المائدة حيّاً. لغز ريفي أنيق وذكي.\n\nلم يلاحظ أحد أن السكّرية قد تغيّر مكانها."], v: [] },
  { cat: 2, slug: "the-slow-morning", n: ["The Slow Morning", "Le Matin lent", "الصباح الهادئ"], a: "Dr. Hana Rahmouni", p: 95, cmp: 0, stock: 50, feat: 1, best: 1, pages: 218, hard: 0, year: 2024, pal: ["#f1e4cc", "#3d2b22", "#d98b4a"], motif: 0,
    d: ["A physician's gentle case for the first hour of the day: no phone, no rush, one cup of tea. Twelve small rituals, each tested on real, tired people.\n\nYou do not need a new life. You need a quieter first hour.", "Le plaidoyer tout en douceur d'une médecin pour la première heure du jour : pas de téléphone, pas de hâte, une tasse de thé. Douze petits rituels testés sur de vraies personnes fatiguées.\n\nVous n'avez pas besoin d'une nouvelle vie. Il vous faut une première heure plus calme.", "دعوة هادئة من طبيبة إلى الساعة الأولى من اليوم: بلا هاتف ولا استعجال، فنجان شاي واحد. اثنا عشر طقساً صغيراً جُرّبت على أناس حقيقيين متعبين.\n\nلا تحتاج إلى حياة جديدة، بل إلى ساعة أولى أكثر هدوءاً."], v: [] },
  { cat: 2, slug: "small-habits-big-years", n: ["Small Habits, Big Years", "Petites habitudes, grandes années", "عادات صغيرة وسنوات كبيرة"], a: "Thomas Ferrand", p: 105, cmp: 130, stock: 30, feat: 1, best: 0, pages: 256, hard: 0, year: 2022, pal: ["#223a5a", "#f5ead0", "#f2b134"], motif: 6,
    d: ["Why five minutes a day outlasts five-hour resolutions. Clear, warm and free of jargon, with a one-page plan at the end of every chapter.\n\nStart so small it feels ridiculous. That is the whole secret.", "Pourquoi cinq minutes par jour durent plus longtemps que cinq heures de bonnes résolutions. Clair, chaleureux et sans jargon, avec un plan d'une page à la fin de chaque chapitre.\n\nCommencez si petit que cela paraît ridicule. C'est tout le secret.", "لماذا تدوم خمس دقائق يومياً أكثر من قرارات الخمس ساعات. أسلوب واضح ودافئ بلا مصطلحات، مع خطة من صفحة واحدة في نهاية كل فصل.\n\nابدأ صغيراً حتى يبدو الأمر مضحكاً. هذا هو السرّ كله."], v: [] },
  { cat: 3, slug: "the-fox-who-collected-stars", n: ["The Fox Who Collected Stars", "Le Renard qui collectionnait les étoiles", "الثعلب الذي جمع النجوم"], a: "Lina Ouazzani", p: 70, cmp: 85, stock: 60, feat: 1, best: 1, pages: 40, hard: 1, year: 2024, pal: ["#16294a", "#fbe9c8", "#f08a3c"], motif: 10,
    d: ["Every night the little fox climbs the hill and tucks a fallen star into his jar. A bedtime picture book about generosity, with lantern-lit illustrations. Ages 3 to 7.\n\nOne night, the jar was full, and the sky was not.", "Chaque nuit, le petit renard grimpe sur la colline et glisse une étoile filante dans son bocal. Un album du soir sur la générosité, aux illustrations éclairées à la lanterne. De 3 à 7 ans.\n\nUn soir, le bocal était plein, et le ciel ne l'était plus.", "كل ليلة يتسلق الثعلب الصغير التلّة ويضع نجمة ساقطة في برطمانه. كتاب مصوّر لما قبل النوم عن الكرم، برسومات تضيئها الفوانيس. من 3 إلى 7 سنوات.\n\nفي ليلةٍ امتلأ البرطمان، وفرغت السماء."], v: [] },
  { cat: 3, slug: "milo-and-the-moon-train", n: ["Milo and the Moon Train", "Milo et le train de la lune", "ميلو وقطار القمر"], a: "Yassine Bennani", p: 65, cmp: 0, stock: 45, feat: 0, best: 0, pages: 48, hard: 1, year: 2023, pal: ["#f0d9a8", "#2a2f5e", "#d04a5c"], motif: 5,
    d: ["Milo cannot sleep, so the moon sends a train. Twelve stops, twelve sleepy animals and a lullaby you will know by heart. Ages 2 to 6.\n\nChoo-choo, whispered the moon, and the rails turned silver.", "Milo n'arrive pas à dormir, alors la lune envoie un train. Douze arrêts, douze animaux endormis et une berceuse que vous saurez par cœur. De 2 à 6 ans.\n\nTchou-tchou, murmura la lune, et les rails devinrent d'argent.", "ميلو لا يستطيع النوم، فيرسل القمر قطاراً. اثنتا عشرة محطة واثنا عشر حيواناً ناعساً وتهويدة ستحفظها عن ظهر قلب. من 2 إلى 6 سنوات.\n\nتشو تشو، همس القمر، فصارت القضبان فضّية."], v: [] },
  { cat: 4, slug: "what-the-sea-keeps", n: ["What the Sea Keeps", "Ce que garde la mer", "ما يحتفظ به البحر"], a: "Mariam Haddad", p: 75, cmp: 0, stock: 28, feat: 1, best: 0, pages: 120, hard: 0, year: 2023, pal: ["#d7e0d6", "#14343b", "#c4673f"], motif: 8,
    d: ["Sixty poems about salt, distance and the people who wait on shores. Spare, musical lines that reward being read aloud.\n\nWhat the sea keeps, it keeps for us.", "Soixante poèmes sur le sel, la distance et ceux qui attendent sur les rivages. Des vers dépouillés et musicaux, à lire à voix haute.\n\nCe que la mer garde, elle le garde pour nous.", "ستون قصيدة عن الملح والمسافة وأولئك الذين ينتظرون على الشواطئ. أبيات مقتصدة موسيقية تستحق أن تُقرأ بصوت عالٍ.\n\nما يحتفظ به البحر، يحتفظ به لأجلنا."], v: [] },
  { cat: 4, slug: "a-year-in-zellige", n: ["A Year in Zellige", "Une année de zellige", "سنة من الزليج"], a: "Atelier Fès", p: 180, cmp: 220, stock: 14, feat: 0, best: 0, pages: 196, hard: 1, year: 2024, pal: ["#1b4d4a", "#f3e8cf", "#e0b04a"], motif: 11,
    d: ["Twelve months, twelve patterns: a large-format art book following master tile-makers from clay pit to courtyard. Over 150 colour photographs.\n\nEvery tile is a small decision that someone made with their hands.", "Douze mois, douze motifs : un beau livre grand format qui suit les maîtres zelligeurs de la carrière d'argile à la cour intérieure. Plus de 150 photographies en couleur.\n\nChaque carreau est une petite décision prise à la main.", "اثنا عشر شهراً واثنا عشر نقشاً: كتاب فني كبير القطع يتتبّع معلّمي الزليج من حفرة الطين إلى الصحن. أكثر من 150 صورة ملوّنة.\n\nكل قطعة قرار صغير اتخذته يدٌ ما."], v: [] },
];

const CATS: { slug: string; name: [string, string, string]; c: [string, string] }[] = [
  { slug: "fiction", name: ["Fiction", "Romans", "روايات"], c: ["#7a1f2e", "#c4673f"] },
  { slug: "mystery", name: ["Mystery & Thriller", "Polar & Thriller", "غموض وتشويق"], c: ["#1d1814", "#5b3c25"] },
  { slug: "mind", name: ["Mind & Habits", "Esprit & Habitudes", "الفكر والعادات"], c: ["#2f4a3d", "#b8893a"] },
  { slug: "children", name: ["Children", "Jeunesse", "كتب الأطفال"], c: ["#223a5a", "#f2b134"] },
  { slug: "poetry-art", name: ["Poetry & Art", "Poésie & Art", "شعر وفنون"], c: ["#1b4d4a", "#e0b04a"] },
];

const META_LABELS: Record<"en" | "fr" | "ar", { pages: string; format: string; year: string; paper: string; hard: string }> = {
  en: { pages: "Pages", format: "Format", year: "Published", paper: "Paperback", hard: "Hardcover" },
  fr: { pages: "Pages", format: "Format", year: "Publié en", paper: "Broché", hard: "Relié" },
  ar: { pages: "الصفحات", format: "الغلاف", year: "سنة النشر", paper: "غلاف ورقي", hard: "غلاف مقوّى" },
};

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = CATS.map((c) => ({ ...c, id: newId(), name: i18n(...c.name) }));
  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.c[0], c.c[1], CATS[i]!.name[0], i));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of BOOKS.entries()) {
    const id = newId();
    pids.push(id);
    const cat = cats[p.cat]!;
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, bookCover(p.n[0], p.a, p.pal, p.motif));
    const totalStock = p.v.length ? 0 : p.stock;
    const meta = (l: "en" | "fr" | "ar") => { const m = META_LABELS[l]; return `\n\n::${m.pages}: ${p.pages}\n::${m.format}: ${p.hard ? m.hard : m.paper}\n::${m.year}: ${p.year}`; };
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.a, p.a, p.a),
        i18n(p.d[0] + meta("en"), p.d[1] + meta("fr"), p.d[2] + meta("ar")),
        cat.id, `BK-${1000 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 10 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, `${p.n[0]} — ${p.a}`),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Format: name }), `BK-${1000 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [0, "Salma", "Casablanca", 5, "Un roman qui sent la terre et la mer. Je l'ai fini en deux soirées, livraison rapide."],
    [3, "Youssef", "Rabat", 5, "Couldn't put it down — I guessed wrong until the very last chapter. Paid the courier, no fuss."],
    [6, "Fatima", "Marrakech", 4, "كتاب لطيف وهادئ، غيّر طريقة بدايتي لليوم. الغلاف جميل جداً."],
    [8, "Omar", "Tanger", 5, "Mes enfants réclament l'histoire du renard chaque soir. Les illustrations sont magnifiques."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "WELCOME10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  // "buy 2 or 3 books" offers on the featured titles: buy 1 at the normal price, 2 or 3 at a fixed (lower) total
  BOOKS.forEach((p, i) => {
    if (!p.feat) return;
    for (const [q, f, pop] of [[2, 0.92, 1], [3, 0.85, 0]] as const) stmts.push(db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, price, label, popular, active) VALUES (?,?,?,0,?,NULL,?,1)").bind(newId(), pids[i]!, q, price(Math.round(p.p * q * f)), pop));
  });
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));

  // hero backdrop
  await putSvg(env, "uploads/sample-hero.svg", libraryWall());
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
