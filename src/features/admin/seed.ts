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

type Kind = "bottle" | "tub" | "pouch" | "jar";
type Pal = { bg1: string; bg2: string; body: string; cap: string; label: string };

/** Clean product illustration (portrait 4:5): mint backdrop, soft circle, packaging silhouette + loose capsules. */
export function svg(pal: Pal, kind: Kind) {
  const caps = `<g transform="rotate(-24 120 640)"><rect x="95" y="628" width="70" height="28" rx="14" fill="${pal.cap}"/><rect x="130" y="628" width="35" height="28" rx="14" fill="#fff" opacity=".9"/></g><g transform="rotate(18 470 660)"><rect x="440" y="648" width="64" height="26" rx="13" fill="${pal.label}"/><rect x="472" y="648" width="32" height="26" rx="13" fill="#fff" opacity=".9"/></g><circle cx="500" cy="590" r="14" fill="${pal.cap}" opacity=".85"/>`;
  const label = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#fff"/><rect x="${x}" y="${y}" width="${w}" height="${h * 0.3}" rx="14" fill="${pal.label}"/><rect x="${x}" y="${y + h * 0.18}" width="${w}" height="${h * 0.12}" fill="${pal.label}"/><rect x="${x + 18}" y="${y + h * 0.5}" width="${w * 0.6}" height="10" rx="5" fill="${pal.cap}"/><rect x="${x + 18}" y="${y + h * 0.66}" width="${w * 0.42}" height="8" rx="4" fill="${pal.cap}" opacity=".5"/><circle cx="${x + w - 34}" cy="${y + h * 0.78}" r="12" fill="${pal.label}" opacity=".8"/>`;
  const shapes: Record<Kind, string> = {
    bottle: `<rect x="222" y="268" width="156" height="76" rx="16" fill="${pal.cap}"/><rect x="238" y="338" width="124" height="24" fill="${pal.cap}" opacity=".85"/><rect x="198" y="356" width="204" height="290" rx="38" fill="${pal.body}"/><rect x="214" y="380" width="22" height="240" rx="11" fill="#fff" opacity=".3"/>${label(222, 420, 164, 170)}`,
    tub: `<rect x="168" y="318" width="264" height="74" rx="20" fill="${pal.cap}"/><rect x="178" y="386" width="244" height="262" rx="30" fill="${pal.body}"/><rect x="194" y="408" width="20" height="220" rx="10" fill="#fff" opacity=".28"/>${label(214, 440, 196, 168)}`,
    pouch: `<path d="M190 300 H410 L430 640 Q430 666 404 666 H196 Q170 666 170 640 Z" fill="${pal.body}"/><rect x="190" y="300" width="220" height="30" rx="6" fill="${pal.cap}"/><rect x="196" y="338" width="208" height="6" rx="3" fill="#fff" opacity=".6"/><rect x="204" y="364" width="18" height="260" rx="9" fill="#fff" opacity=".25"/>${label(226, 420, 172, 176)}`,
    jar: `<rect x="160" y="352" width="280" height="72" rx="22" fill="${pal.cap}"/><rect x="170" y="418" width="260" height="232" rx="44" fill="${pal.body}"/><rect x="190" y="438" width="20" height="190" rx="10" fill="#fff" opacity=".3"/>${label(222, 462, 186, 148)}`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.bg1}"/><stop offset="1" stop-color="${pal.bg2}"/></linearGradient><filter id="b" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="30"/></filter></defs><rect width="600" height="750" fill="url(#g)"/><circle cx="300" cy="440" r="250" fill="#fff" opacity=".55"/><circle cx="480" cy="150" r="90" fill="${pal.label}" opacity=".16" filter="url(#b)"/><ellipse cx="300" cy="672" rx="160" ry="16" fill="#0c3b2a" opacity=".16" filter="url(#b)"/>${shapes[kind]}${caps}</svg>`;
}

async function putSvg(env: Env, key: string, body: string) {
  await env.FILES.put(key, body, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public, max-age=31536000, immutable" } });
}

const PAL = {
  orange: { bg1: "#fff1de", bg2: "#ffd9a8", body: "#f59e2a", cap: "#7a3f06", label: "#e8710a" },
  green: { bg1: "#e6f6ea", bg2: "#bfe8cb", body: "#2f9e5b", cap: "#0e4a2b", label: "#1f8a4c" },
  indigo: { bg1: "#e9e9fb", bg2: "#c9caf2", body: "#5b5fc7", cap: "#23266b", label: "#4448b5" },
  blue: { bg1: "#e3f0fb", bg2: "#b9d8f3", body: "#2f7fc4", cap: "#0f3c66", label: "#1d6bb3" },
  teal: { bg1: "#e1f6f3", bg2: "#b3e6df", body: "#1fa59a", cap: "#0a4a44", label: "#12877d" },
  amber: { bg1: "#fdf3d6", bg2: "#f6df9c", body: "#e2b02c", cap: "#6a4a06", label: "#c4900f" },
} satisfies Record<string, Pal>;

export async function seedSampleData(env: Env, currency: string) {
  const dec = 10 ** decimalsOf(currency);
  const price = (major: number) => Math.round(major * dec);
  const db = env.DB;
  const has = await db.prepare("SELECT 1 FROM products LIMIT 1").first();
  if (has) return;

  const cats = [
    { id: newId(), slug: "energy", name: i18n("Energy & focus", "Énergie & concentration", "الطاقة والتركيز"), pal: PAL.orange, kind: "bottle" as Kind },
    { id: newId(), slug: "immunity", name: i18n("Immunity", "Immunité", "المناعة"), pal: PAL.green, kind: "bottle" as Kind },
    { id: newId(), slug: "sleep", name: i18n("Sleep & stress", "Sommeil & stress", "النوم والتوتر"), pal: PAL.indigo, kind: "jar" as Kind },
    { id: newId(), slug: "muscle", name: i18n("Muscle & sport", "Muscle & sport", "العضلات والرياضة"), pal: PAL.blue, kind: "tub" as Kind },
    { id: newId(), slug: "digestion", name: i18n("Digestion", "Digestion", "الهضم"), pal: PAL.teal, kind: "pouch" as Kind },
    { id: newId(), slug: "joints", name: i18n("Joints & skin", "Articulations & peau", "المفاصل والبشرة"), pal: PAL.amber, kind: "pouch" as Kind },
  ];
  type PD = { cat: number; slug: string; n: [string, string, string]; s: [string, string, string]; l: [string, string, string]; f: [string, string, string]; p: number; cmp: number; stock: number; feat: number; best: number; pal: Pal; kind: Kind; v: [string, number, number][] };
  const products: PD[] = [
    { cat: 1, slug: "vitamin-d3-k2", n: ["Vitamin D3 + K2", "Vitamine D3 + K2", "فيتامين د3 + ك2"], s: ["Daily support for bones and immune function.", "Un soutien quotidien pour les os et l'immunité.", "دعم يومي للعظام والمناعة."], l: ["Take one softgel a day with a meal containing fat. Vitamin K2 (MK-7) helps direct calcium where the body needs it.", "Prendre une capsule par jour au cours d'un repas contenant des graisses. La vitamine K2 (MK-7) contribue à bien orienter le calcium.", "تناول كبسولة واحدة يومياً مع وجبة تحتوي على دهون. يساعد فيتامين ك2 (MK-7) على توجيه الكالسيوم إلى مكانه."], f: ["Serving size: 1 softgel\nServings per container: 60\nVitamin D3: 50 µg (2000 IU)\nVitamin K2 (MK-7): 100 µg\nOther ingredients: olive oil, softgel shell", "Portion : 1 capsule\nPortions par boîte : 60\nVitamine D3 : 50 µg (2000 UI)\nVitamine K2 (MK-7) : 100 µg\nAutres ingrédients : huile d'olive, enveloppe de la capsule", "الحصة: كبسولة واحدة\nعدد الحصص في العلبة: 60\nفيتامين د3: 50 ميكروغرام (2000 وحدة)\nفيتامين ك2 (MK-7): 100 ميكروغرام\nمكونات أخرى: زيت الزيتون، غلاف الكبسولة"], p: 149, cmp: 189, stock: 0, feat: 1, best: 1, pal: PAL.green, kind: "bottle", v: [["60 softgels", 149, 40], ["120 softgels", 249, 22]] },
    { cat: 1, slug: "vitamin-c-1000", n: ["Vitamin C 1000 mg", "Vitamine C 1000 mg", "فيتامين ج 1000 ملغ"], s: ["High-strength vitamin C with rose hips.", "Vitamine C dosée avec églantier.", "فيتامين ج بتركيز عالٍ مع ثمر الورد البري."], l: ["One tablet a day with water. Contributes to the normal function of the immune system.", "Un comprimé par jour avec de l'eau. Contribue au fonctionnement normal du système immunitaire.", "قرص واحد يومياً مع الماء. يساهم في الأداء الطبيعي لجهاز المناعة."], f: ["Serving size: 1 tablet\nServings per container: 90\nVitamin C: 1000 mg\nRose hip extract: 25 mg", "Portion : 1 comprimé\nPortions par boîte : 90\nVitamine C : 1000 mg\nExtrait d'églantier : 25 mg", "الحصة: قرص واحد\nعدد الحصص في العلبة: 90\nفيتامين ج: 1000 ملغ\nمستخلص ثمر الورد البري: 25 ملغ"], p: 99, cmp: 0, stock: 75, feat: 0, best: 0, pal: PAL.orange, kind: "bottle", v: [] },
    { cat: 1, slug: "zinc-picolinate", n: ["Zinc picolinate 25 mg", "Zinc picolinate 25 mg", "زنك بيكولينات 25 ملغ"], s: ["A well-absorbed form of zinc.", "Une forme de zinc bien assimilée.", "صيغة من الزنك سهلة الامتصاص."], l: ["One capsule a day with food. Zinc contributes to normal immune function.", "Une gélule par jour pendant un repas. Le zinc contribue au fonctionnement normal du système immunitaire.", "كبسولة واحدة يومياً مع الطعام. يساهم الزنك في وظيفة المناعة الطبيعية."], f: ["Serving size: 1 capsule\nServings per container: 120\nZinc (picolinate): 25 mg", "Portion : 1 gélule\nPortions par boîte : 120\nZinc (picolinate) : 25 mg", "الحصة: كبسولة واحدة\nعدد الحصص في العلبة: 120\nزنك (بيكولينات): 25 ملغ"], p: 79, cmp: 99, stock: 60, feat: 0, best: 0, pal: PAL.teal, kind: "bottle", v: [] },
    { cat: 2, slug: "magnesium-glycinate", n: ["Magnesium glycinate 400", "Magnésium glycinate 400", "مغنيسيوم غليسينات 400"], s: ["Gentle magnesium for calm evenings.", "Un magnésium doux pour des soirées sereines.", "مغنيسيوم لطيف لمساء هادئ."], l: ["Two capsules in the evening with water. Magnesium contributes to reduced tiredness and normal psychological function.", "Deux gélules le soir avec de l'eau. Le magnésium contribue à réduire la fatigue et au fonctionnement psychologique normal.", "كبسولتان مساءً مع الماء. يساهم المغنيسيوم في تقليل التعب وفي الوظيفة النفسية الطبيعية."], f: ["Serving size: 2 capsules\nServings per container: 30\nMagnesium (bisglycinate): 400 mg\nOther ingredients: vegetable capsule", "Portion : 2 gélules\nPortions par boîte : 30\nMagnésium (bisglycinate) : 400 mg\nAutres ingrédients : gélule végétale", "الحصة: كبسولتان\nعدد الحصص في العلبة: 30\nمغنيسيوم (بيسغليسينات): 400 ملغ\nمكونات أخرى: كبسولة نباتية"], p: 129, cmp: 159, stock: 0, feat: 1, best: 1, pal: PAL.indigo, kind: "jar", v: [["60 capsules", 129, 34], ["120 capsules", 219, 20]] },
    { cat: 2, slug: "ashwagandha-root", n: ["Ashwagandha root extract", "Extrait de racine d'ashwagandha", "مستخلص جذر الأشواغاندا"], s: ["A traditional adaptogen for daily balance.", "Un adaptogène traditionnel pour l'équilibre au quotidien.", "نبتة تقليدية تساعد على التوازن اليومي."], l: ["One capsule twice a day with meals. Not recommended during pregnancy or with thyroid conditions.", "Une gélule deux fois par jour pendant les repas. Déconseillé pendant la grossesse ou en cas de trouble thyroïdien.", "كبسولة مرتين يومياً مع الوجبات. لا يُنصح به أثناء الحمل أو مع اضطرابات الغدة الدرقية."], f: ["Serving size: 1 capsule\nServings per container: 60\nAshwagandha root extract: 600 mg", "Portion : 1 gélule\nPortions par boîte : 60\nExtrait de racine d'ashwagandha : 600 mg", "الحصة: كبسولة واحدة\nعدد الحصص في العلبة: 60\nمستخلص جذر الأشواغاندا: 600 ملغ"], p: 169, cmp: 0, stock: 41, feat: 0, best: 0, pal: PAL.indigo, kind: "jar", v: [] },
    { cat: 2, slug: "night-calm-blend", n: ["Night calm blend", "Complexe nuit sereine", "تركيبة الليل الهادئ"], s: ["Lemon balm and valerian for wind-down time.", "Mélisse et valériane pour bien finir la journée.", "الميليسا والناردين لنهاية يوم هادئة."], l: ["Take two capsules 30 minutes before bed. Do not drive after taking.", "Prendre deux gélules 30 minutes avant le coucher. Ne pas conduire après la prise.", "تناول كبسولتين قبل النوم بـ 30 دقيقة. لا تقد السيارة بعد تناولها."], f: ["Serving size: 2 capsules\nServings per container: 30\nLemon balm extract: 300 mg\nValerian root: 200 mg\nMagnesium (citrate): 100 mg", "Portion : 2 gélules\nPortions par boîte : 30\nExtrait de mélisse : 300 mg\nRacine de valériane : 200 mg\nMagnésium (citrate) : 100 mg", "الحصة: كبسولتان\nعدد الحصص في العلبة: 30\nمستخلص الميليسا: 300 ملغ\nجذر الناردين: 200 ملغ\nمغنيسيوم (سترات): 100 ملغ"], p: 139, cmp: 179, stock: 36, feat: 1, best: 0, pal: PAL.indigo, kind: "bottle", v: [] },
    { cat: 3, slug: "whey-protein-isolate", n: ["Whey protein isolate", "Whey protéine isolate", "بروتين الواي أيزوليت"], s: ["25 g of protein per scoop, low sugar.", "25 g de protéines par dose, peu de sucre.", "25 غ بروتين في كل مغرفة وقليل السكر."], l: ["Mix one scoop with 250 ml of water or milk after training or between meals.", "Mélanger une dose avec 250 ml d'eau ou de lait après l'entraînement ou entre les repas.", "اخلط مغرفة واحدة مع 250 مل ماء أو حليب بعد التمرين أو بين الوجبات."], f: ["Serving size: 1 scoop (30 g)\nServings per container: 30\nProtein: 25 g\nCarbohydrates: 1.5 g\nFat: 0.8 g\nEnergy: 112 kcal", "Portion : 1 dose (30 g)\nPortions par boîte : 30\nProtéines : 25 g\nGlucides : 1,5 g\nLipides : 0,8 g\nÉnergie : 112 kcal", "الحصة: مغرفة واحدة (30 غ)\nعدد الحصص في العلبة: 30\nبروتين: 25 غ\nكربوهيدرات: 1.5 غ\nدهون: 0.8 غ\nالطاقة: 112 سعرة"], p: 329, cmp: 399, stock: 0, feat: 1, best: 1, pal: PAL.blue, kind: "tub", v: [["Chocolate 900 g", 329, 25], ["Vanilla 900 g", 329, 18], ["Strawberry 900 g", 329, 0], ["Chocolate 2 kg", 649, 12]] },
    { cat: 3, slug: "creatine-monohydrate", n: ["Creatine monohydrate", "Créatine monohydrate", "كرياتين مونوهيدرات"], s: ["Pure micronised creatine, unflavoured.", "Créatine micronisée pure, sans arôme.", "كرياتين نقي مطحون ناعماً بدون نكهة."], l: ["Take 3 to 5 g a day, any time, with water. Stay well hydrated.", "Prendre 3 à 5 g par jour, à tout moment, avec de l'eau. Bien s'hydrater.", "تناول من 3 إلى 5 غ يومياً في أي وقت مع الماء. احرص على شرب كمية كافية من الماء."], f: ["Serving size: 1 scoop (5 g)\nServings per container: 60\nCreatine monohydrate: 5 g", "Portion : 1 dose (5 g)\nPortions par boîte : 60\nCréatine monohydrate : 5 g", "الحصة: مغرفة واحدة (5 غ)\nعدد الحصص في العلبة: 60\nكرياتين مونوهيدرات: 5 غ"], p: 189, cmp: 0, stock: 0, feat: 0, best: 1, pal: PAL.blue, kind: "tub", v: [["300 g", 189, 28], ["500 g", 289, 15]] },
    { cat: 3, slug: "bcaa-2-1-1", n: ["BCAA 2:1:1 powder", "BCAA 2:1:1 en poudre", "BCAA بنسبة 2:1:1"], s: ["Amino acids to sip during training.", "Des acides aminés à siroter pendant l'effort.", "أحماض أمينية للشرب أثناء التمرين."], l: ["Mix one scoop in 300 ml of water and sip before or during training.", "Mélanger une dose dans 300 ml d'eau et boire avant ou pendant l'entraînement.", "اخلط مغرفة في 300 مل ماء واشربها قبل التمرين أو أثناءه."], f: ["Serving size: 1 scoop (10 g)\nServings per container: 30\nL-Leucine: 3.3 g\nL-Isoleucine: 1.7 g\nL-Valine: 1.7 g", "Portion : 1 dose (10 g)\nPortions par boîte : 30\nL-Leucine : 3,3 g\nL-Isoleucine : 1,7 g\nL-Valine : 1,7 g", "الحصة: مغرفة واحدة (10 غ)\nعدد الحصص في العلبة: 30\nإل-ليوسين: 3.3 غ\nإل-إيزوليوسين: 1.7 غ\nإل-فالين: 1.7 غ"], p: 199, cmp: 249, stock: 0, feat: 0, best: 0, pal: PAL.teal, kind: "tub", v: [["Lemon", 199, 20], ["Tropical", 199, 14]] },
    { cat: 4, slug: "probiotic-10-billion", n: ["Probiotic 10 billion", "Probiotiques 10 milliards", "بروبيوتيك 10 مليار"], s: ["10 strains for everyday digestive comfort.", "10 souches pour le confort digestif au quotidien.", "10 سلالات للراحة الهضمية اليومية."], l: ["One capsule a day before breakfast. Store in a cool, dry place.", "Une gélule par jour avant le petit-déjeuner. Conserver au frais et au sec.", "كبسولة واحدة يومياً قبل الإفطار. يحفظ في مكان بارد وجاف."], f: ["Serving size: 1 capsule\nServings per container: 30\nProbiotic blend (10 strains): 10 billion CFU\nInulin (prebiotic): 100 mg", "Portion : 1 gélule\nPortions par boîte : 30\nMélange probiotique (10 souches) : 10 milliards UFC\nInuline (prébiotique) : 100 mg", "الحصة: كبسولة واحدة\nعدد الحصص في العلبة: 30\nخليط بروبيوتيك (10 سلالات): 10 مليار وحدة\nإينولين (بريبيوتيك): 100 ملغ"], p: 219, cmp: 0, stock: 0, feat: 1, best: 0, pal: PAL.teal, kind: "pouch", v: [["30 capsules", 219, 26], ["60 capsules", 379, 14]] },
    { cat: 5, slug: "marine-collagen", n: ["Marine collagen peptides", "Peptides de collagène marin", "ببتيدات الكولاجين البحري"], s: ["Unflavoured powder for skin and joints.", "Poudre neutre pour la peau et les articulations.", "مسحوق بدون نكهة للبشرة والمفاصل."], l: ["Dissolve one scoop in a hot or cold drink every day.", "Diluer une dose dans une boisson chaude ou froide chaque jour.", "أذب مغرفة واحدة في مشروب ساخن أو بارد كل يوم."], f: ["Serving size: 1 scoop (10 g)\nServings per container: 30\nHydrolysed marine collagen: 10 g\nVitamin C: 80 mg", "Portion : 1 dose (10 g)\nPortions par boîte : 30\nCollagène marin hydrolysé : 10 g\nVitamine C : 80 mg", "الحصة: مغرفة واحدة (10 غ)\nعدد الحصص في العلبة: 30\nكولاجين بحري مُحلَّل: 10 غ\nفيتامين ج: 80 ملغ"], p: 259, cmp: 319, stock: 31, feat: 1, best: 1, pal: PAL.amber, kind: "pouch", v: [] },
    { cat: 5, slug: "omega-3-fish-oil", n: ["Omega-3 fish oil", "Oméga-3 huile de poisson", "أوميغا 3 زيت السمك"], s: ["EPA and DHA from purified fish oil.", "EPA et DHA issus d'huile de poisson purifiée.", "EPA وDHA من زيت سمك منقّى."], l: ["Two softgels a day with a meal. EPA and DHA contribute to normal heart function.", "Deux capsules par jour pendant un repas. L'EPA et le DHA contribuent au fonctionnement normal du cœur.", "كبسولتان يومياً مع وجبة. يساهم EPA وDHA في الأداء الطبيعي للقلب."], f: ["Serving size: 2 softgels\nServings per container: 45\nFish oil: 2000 mg\nEPA: 360 mg\nDHA: 240 mg", "Portion : 2 capsules\nPortions par boîte : 45\nHuile de poisson : 2000 mg\nEPA : 360 mg\nDHA : 240 mg", "الحصة: كبسولتان\nعدد الحصص في العلبة: 45\nزيت السمك: 2000 ملغ\nEPA: 360 ملغ\nDHA: 240 ملغ"], p: 179, cmp: 229, stock: 48, feat: 0, best: 0, pal: PAL.amber, kind: "bottle", v: [] },
    { cat: 0, slug: "b-complex-energy", n: ["B-complex energy", "Complexe B énergie", "فيتامينات ب المركبة للطاقة"], s: ["All eight B vitamins in active forms.", "Les huit vitamines B sous formes actives.", "كل فيتامينات ب الثمانية بصيغ نشطة."], l: ["One capsule a day with breakfast. B vitamins contribute to reducing tiredness and fatigue.", "Une gélule par jour au petit-déjeuner. Les vitamines B contribuent à réduire la fatigue.", "كبسولة واحدة يومياً مع الإفطار. تساهم فيتامينات ب في تقليل التعب والإرهاق."], f: ["Serving size: 1 capsule\nServings per container: 60\nVitamin B1: 10 mg\nVitamin B2: 10 mg\nVitamin B6: 10 mg\nVitamin B12: 100 µg\nFolate: 400 µg", "Portion : 1 gélule\nPortions par boîte : 60\nVitamine B1 : 10 mg\nVitamine B2 : 10 mg\nVitamine B6 : 10 mg\nVitamine B12 : 100 µg\nFolates : 400 µg", "الحصة: كبسولة واحدة\nعدد الحصص في العلبة: 60\nفيتامين ب1: 10 ملغ\nفيتامين ب2: 10 ملغ\nفيتامين ب6: 10 ملغ\nفيتامين ب12: 100 ميكروغرام\nحمض الفوليك: 400 ميكروغرام"], p: 109, cmp: 0, stock: 55, feat: 1, best: 0, pal: PAL.orange, kind: "bottle", v: [] },
  ];

  const stmts: D1PreparedStatement[] = [];
  for (const [i, c] of cats.entries()) {
    const key = `uploads/sample-cat-${c.slug}.svg`;
    await putSvg(env, key, svg(c.pal, c.kind));
    stmts.push(db.prepare("INSERT INTO categories (id, slug, name, image, position, active) VALUES (?,?,?,?,?,1)").bind(c.id, c.slug, c.name, key, i));
  }
  const now = Date.now();
  const pids: string[] = [];
  for (const [i, p] of products.entries()) {
    const id = newId();
    pids.push(id);
    const key = `uploads/sample-${p.slug}.svg`;
    await putSvg(env, key, svg(p.pal, p.kind));
    const totalStock = p.v.length ? 0 : p.stock;
    stmts.push(
      db.prepare("INSERT INTO products (id, slug, name, short_desc, long_desc, specs, category_id, sku, price, compare_at, stock, track_stock, status, featured, bestseller, sold_count, seo_title, seo_desc, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'published',?,?,?,'{}','{}',?,?)").bind(
        id, p.slug, i18n(p.n[0], p.n[1], p.n[2]), i18n(p.s[0], p.s[1], p.s[2]), i18n(p.l[0], p.l[1], p.l[2]), i18n(p.f[0], p.f[1], p.f[2]),
        cats[p.cat]!.id, `SUP-${100 + i}`, price(p.p), p.cmp ? price(p.cmp) : null, totalStock, p.feat, p.best, p.best ? 14 + i : 0, now - i * 3600_000, now,
      ),
      db.prepare("INSERT INTO product_images (id, product_id, key, alt, position) VALUES (?,?,?,?,0)").bind(newId(), id, key, p.n[0]),
    );
    p.v.forEach(([name, vp, vs], j) =>
      stmts.push(db.prepare("INSERT INTO product_variants (id, product_id, name, options, sku, price, stock, position) VALUES (?,?,?,?,?,?,?,?)").bind(newId(), id, name, JSON.stringify({ Option: name }), `SUP-${100 + i}-${j}`, price(vp), vs, j)),
    );
  }
  const reviews: [number, string, string, number, string][] = [
    [6, "Mehdi", "Casablanca", 5, "Goût chocolat très correct, se mélange sans grumeaux. Livraison en 2 jours."],
    [3, "Sara", "Rabat", 5, "Since I started taking it in the evening I fall asleep faster. Pay on delivery was easy."],
    [10, "Hamza", "Tanger", 4, "منتج ممتاز وتغليف نظيف، وصلني بسرعة."],
    [0, "Nadia", "Marrakech", 5, "Bon rapport qualité-prix, je recommande."],
    [11, "Omar", "Agadir", 5, "Great B-complex, no stomach upset when taken with breakfast."],
  ];
  for (const [pi, name, city, rating, body] of reviews)
    stmts.push(db.prepare("INSERT INTO reviews (id, product_id, name, city, rating, body, status, created_at) VALUES (?,?,?,?,?,?, 'approved', ?)").bind(newId(), pids[pi]!, name, city, rating, body, now));
  stmts.push(
    db.prepare("INSERT INTO coupons (id, code, type, value, min_subtotal, active) VALUES (?,?,?,?,?,1)").bind(newId(), "VITAL10", "percent", 10, 0),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,2,10,1)").bind(newId()),
    db.prepare("INSERT INTO bundles (id, product_id, min_qty, percent, active) VALUES (?,NULL,3,15,1)").bind(newId()),
  );
  for (let i = 0; i < stmts.length; i += 40) await db.batch(stmts.slice(i, i + 40));
  await putSvg(env, "uploads/sample-hero.svg", svg(PAL.green, "tub"));
}

export function countryCurrency(country: string) {
  return COUNTRIES.find((c) => c.code === country)?.currency ?? "USD";
}
