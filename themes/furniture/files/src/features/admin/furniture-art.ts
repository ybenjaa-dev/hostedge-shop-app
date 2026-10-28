/** Hand-drawn SVG furniture illustrations for the sample catalogue (800×1000 canvas, art kept inside y 120–880 so it survives 1:1 … 4:5 crops). */

const OAK = "#c9a273", OAK_D = "#a67c4e", WALNUT = "#7a5636", OAT = "#e2d6c0", CREAM = "#f3ece0", CLAY = "#b4573a", CHAR = "#3a3631", SAGE = "#8a9a7b", BRASS = "#b8923f", SAND = "#e9dfcd";

const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * (amt < 0 ? v : 255 - v))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => c(v).toString(16).padStart(2, "0")).join("")}`;
};
const shadow = (cx: number, cy: number, rx: number, ry = 16) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="rgba(70,50,30,.16)"/>`;
const rect = (x: number, y: number, w: number, h: number, fill: string, rx = 0, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;

function scene(wall: string, floor: string, inner: string, opts: { window?: boolean; rug?: string } = {}) {
  const light = opts.window === false ? "" : `<polygon points="520,0 800,0 800,640 380,720" fill="rgba(255,250,235,.28)"/><polygon points="600,0 800,0 800,420 560,520" fill="rgba(255,250,235,.22)"/>`;
  const rug = opts.rug ? `<ellipse cx="400" cy="800" rx="340" ry="46" fill="${opts.rug}"/><ellipse cx="400" cy="800" rx="300" ry="36" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">${rect(0, 0, 800, 1000, wall)}${light}${rect(0, 730, 800, 270, floor)}${rect(0, 726, 800, 5, "rgba(0,0,0,.06)")}${rug}${inner}</svg>`;
}

/** Sofa / loveseat. cx = centre, w = overall width. */
function sofa(cx: number, w: number, fill: string, pillow: string) {
  const x0 = cx - w / 2, n = w > 440 ? 3 : 2, arm = 62, seatW = (w - arm * 2) / n;
  const dk = shade(fill, -0.1), lt = shade(fill, 0.35);
  let s = shadow(cx, 756, w / 2 + 10);
  for (const lx of [x0 + 26, x0 + w - 40]) s += rect(lx, 718, 14, 40, WALNUT, 3);
  s += rect(x0 + arm - 10, 470, w - arm * 2 + 20, 190, dk, 40);
  s += rect(x0, 600, w, 124, fill, 26);
  for (let i = 0; i < n; i++) s += rect(x0 + arm + i * seatW + 3, 484, seatW - 6, 120, lt, 26) + rect(x0 + arm + i * seatW + 2, 598, seatW - 4, 74, fill, 18, 'stroke="rgba(0,0,0,.07)" stroke-width="2"');
  for (const ax of [x0, x0 + w - arm]) s += rect(ax, 540, arm, 184, dk, 30) + rect(ax + 8, 548, arm - 16, 40, shade(dk, 0.12), 20);
  s += `<g transform="rotate(-8 ${x0 + arm + 54} 560)">${rect(x0 + arm + 14, 520, 92, 88, pillow, 14)}${rect(x0 + arm + 14, 520, 92, 88, "none", 14, 'stroke="rgba(255,255,255,.35)" stroke-width="2"')}</g>`;
  return s;
}

function lounge(cx: number, fill: string) {
  const l = cx - 150;
  let s = shadow(cx, 760, 190);
  s += `<polygon points="${l + 30},640 ${l + 8},760 ${l + 30},760 ${l + 52},650" fill="${WALNUT}"/><polygon points="${l + 270},640 ${l + 292},760 ${l + 270},760 ${l + 248},650" fill="${WALNUT}"/>`;
  s += rect(l + 20, 470, 260, 200, shade(fill, -0.1), 70) + rect(l + 50, 490, 200, 170, fill, 50);
  s += rect(l + 10, 610, 280, 70, fill, 24, 'stroke="rgba(0,0,0,.07)" stroke-width="2"');
  s += rect(l - 18, 560, 100, 22, OAK, 11) + rect(l + 218, 560, 100, 22, OAK, 11);
  s += rect(l + 6, 580, 18, 90, OAK_D, 6) + rect(l + 276, 580, 18, 90, OAK_D, 6);
  return s;
}

function diningChair(cx: number, k = 1, fill = OAK) {
  const t = `translate(${cx} 760) scale(${k}) translate(-100 -760)`;
  let s = `<g transform="${t}">`;
  s += rect(46, 460, 108, 16, fill, 6);
  for (let i = 0; i < 4; i++) s += rect(54 + i * 28, 470, 14, 150, shade(fill, -0.05), 6);
  s += rect(44, 450, 14, 320, OAK_D, 5) + rect(142, 450, 14, 320, OAK_D, 5);
  s += rect(38, 612, 124, 22, fill, 8) + rect(30, 630, 140, 14, shade(fill, -0.12), 6);
  s += rect(34, 640, 14, 124, OAK_D, 5) + rect(152, 640, 14, 124, OAK_D, 5);
  s += rect(46, 700, 108, 10, shade(OAK_D, -0.05), 4);
  return s + "</g>";
}

function stool(cx: number) {
  let s = shadow(cx, 762, 120);
  s += `<polygon points="${cx - 74},560 ${cx - 112},760 ${cx - 90},760 ${cx - 52},565" fill="${CHAR}"/><polygon points="${cx + 74},560 ${cx + 112},760 ${cx + 90},760 ${cx + 52},565" fill="${CHAR}"/><polygon points="${cx - 12},565 ${cx - 6},700 ${cx + 6},700 ${cx + 12},565" fill="${shade(CHAR, 0.2)}"/>`;
  s += `<ellipse cx="${cx}" cy="690" rx="82" ry="12" fill="none" stroke="${CHAR}" stroke-width="7"/>`;
  s += `<ellipse cx="${cx}" cy="552" rx="118" ry="34" fill="${OAK_D}"/>` + `<rect x="${cx - 118}" y="520" width="236" height="32" fill="${OAK_D}"/>` + `<ellipse cx="${cx}" cy="520" rx="118" ry="34" fill="${OAK}"/><ellipse cx="${cx - 20}" cy="514" rx="70" ry="16" fill="rgba(255,255,255,.18)"/>`;
  return s;
}

function diningTable() {
  let s = shadow(400, 758, 290);
  s += rect(230, 592, 14, 138, shade(OAK_D, 0.1), 4) + rect(556, 592, 14, 138, shade(OAK_D, 0.1), 4);
  s += rect(118, 560, 564, 32, OAK_D, 6) + rect(118, 560, 564, 22, OAK, 6) + rect(130, 566, 300, 5, "rgba(255,255,255,.22)", 3);
  s += rect(150, 592, 24, 168, OAK_D, 5) + rect(626, 592, 24, 168, OAK_D, 5) + rect(170, 596, 460, 18, shade(OAK_D, -0.05), 4);
  s += `<path d="M300 560 q-10-70 6-140" stroke="${WALNUT}" stroke-width="5" fill="none"/><path d="M306 420 q30 20 28 50 M306 440 q-30 10 -34 40 M303 480 q26 8 26 36" stroke="${SAGE}" stroke-width="8" stroke-linecap="round" fill="none"/>`;
  s += `<path d="M470 560 h120 q-8 -44 -60 -44 q-52 0 -60 44z" fill="${CREAM}"/>`;
  s += `<path d="M258 560 q-4 -52 22 -78 q26 26 22 78z" fill="${CLAY}"/>`;
  return s;
}

function coffeeTable() {
  let s = shadow(400, 764, 250, 20);
  s += `<polygon points="270,640 250,760 266,760 292,650" fill="${WALNUT}"/><polygon points="530,640 550,760 534,760 508,650" fill="${WALNUT}"/><polygon points="330,660 322,744 336,744 346,664" fill="${shade(WALNUT, 0.15)}"/><polygon points="470,660 478,744 464,744 454,664" fill="${shade(WALNUT, 0.15)}"/>`;
  s += `<ellipse cx="400" cy="618" rx="236" ry="46" fill="${OAK_D}"/><rect x="164" y="588" width="472" height="30" fill="${OAK_D}"/><ellipse cx="400" cy="588" rx="236" ry="46" fill="${OAK}"/><ellipse cx="360" cy="580" rx="140" ry="20" fill="rgba(255,255,255,.17)"/>`;
  s += rect(320, 546, 120, 20, CLAY, 3) + rect(330, 530, 100, 18, CREAM, 3) + rect(340, 514, 80, 17, SAGE, 3);
  s += `<path d="M498 566 h50 l-6 -42 h-38z" fill="${CHAR}"/><ellipse cx="523" cy="524" rx="19" ry="5" fill="#6a5846"/>`;
  return s;
}

function nesting() {
  const tbl = (cx: number, cy: number, r: number, h: number, c: string) => {
    const ry = r * 0.22;
    return `${shadow(cx, cy + h + 6, r + 10, 12)}<polygon points="${cx - r * 0.6},${cy + 8} ${cx - r * 0.72},${cy + h} ${cx - r * 0.62},${cy + h} ${cx - r * 0.5},${cy + 12}" fill="${CHAR}"/><polygon points="${cx + r * 0.6},${cy + 8} ${cx + r * 0.72},${cy + h} ${cx + r * 0.62},${cy + h} ${cx + r * 0.5},${cy + 12}" fill="${CHAR}"/><ellipse cx="${cx}" cy="${cy + 10}" rx="${r}" ry="${ry}" fill="${shade(c, -0.18)}"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${ry}" fill="${c}"/><ellipse cx="${cx - r * 0.2}" cy="${cy - 3}" rx="${r * 0.6}" ry="${ry * 0.5}" fill="rgba(255,255,255,.16)"/>`;
  };
  let s = tbl(300, 520, 170, 238, OAK) + tbl(520, 600, 120, 160, CLAY);
  s += `<rect x="520" y="540" width="44" height="46" rx="8" fill="${CREAM}"/><path d="M542 540 q-6-50 12-64 M542 540 q16-34 34-34" stroke="${SAGE}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
  return s;
}

function sideboard() {
  let s = shadow(400, 764, 300);
  s += `<polygon points="170,700 156,760 176,760 190,700" fill="${WALNUT}"/><polygon points="630,700 644,760 624,760 610,700" fill="${WALNUT}"/>`;
  s += rect(110, 500, 580, 206, OAK_D, 8) + rect(120, 510, 560, 186, OAK, 5);
  for (let i = 0; i < 4; i++) s += rect(124 + i * 138, 514, 134, 178, i % 2 ? shade(OAK, -0.04) : OAK, 3, 'stroke="rgba(90,60,30,.35)" stroke-width="2"') + rect(i % 2 ? 132 + i * 138 : 238 + i * 138 - 4, 590, 4, 40, BRASS, 2);
  s += rect(104, 488, 592, 16, shade(OAK_D, -0.05), 4);
  s += `<path d="M520 488 h44 l-4 -64 q-18 -10 -36 0z" fill="${CLAY}"/><path d="M542 428 q-30-60 4-92 M542 430 q34-34 56-24" stroke="${SAGE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += rect(160, 452, 64, 36, CREAM, 4) + rect(176, 424, 64, 30, SAND, 4, 'stroke="rgba(0,0,0,.08)"');
  s += rect(250, 150, 300, 230, "#f6f1e7", 3, `stroke="${WALNUT}" stroke-width="10"`) + `<circle cx="400" cy="250" r="56" fill="${CLAY}"/><path d="M270 360 q130-120 260 0z" fill="${SAGE}" opacity=".85"/>`;
  return s;
}

function bookshelf() {
  let s = shadow(400, 764, 230);
  s += rect(220, 150, 360, 610, OAK_D, 6) + rect(236, 166, 328, 578, "#e7dcc7", 3);
  const palette = [CLAY, CHAR, SAGE, CREAM, OAT, BRASS, WALNUT];
  for (let r = 0; r < 4; r++) {
    const y = 166 + (r + 1) * 144;
    s += rect(228, y - 8, 344, 14, OAK, 3);
    let x = 246;
    for (let i = 0; x < 540 && i < 40; i++) {
      const w = 12 + ((i * 7 + r * 3) % 4) * 5, h = 70 + ((i * 11 + r * 5) % 5) * 12;
      if ((r === 1 && i === 4) || (r === 3 && i === 5)) { s += `<ellipse cx="${x + 28}" cy="${y - 26}" rx="26" ry="26" fill="${r === 1 ? CLAY : BRASS}"/>`; x += 66; continue; }
      if (r === 2 && i >= 5) { s += `<path d="M${x + 10} ${y - 8} h48 l-6-44 h-36z" fill="${SAGE}"/><path d="M${x + 34} ${y - 52} q-24-30 -6-60 M${x + 34} ${y - 52} q22-24 18-52" stroke="${shade(SAGE, -0.3)}" stroke-width="6" fill="none"/>`; break; }
      s += rect(x, y - 8 - h, w, h, palette[(i + r) % palette.length]!, 2);
      x += w + 3;
    }
  }
  s += rect(228, 744, 344, 16, OAK, 3);
  return s;
}

function arcLamp() {
  let s = shadow(260, 764, 110, 14);
  s += `<ellipse cx="260" cy="752" rx="92" ry="16" fill="${CHAR}"/><ellipse cx="260" cy="744" rx="92" ry="16" fill="${shade(CHAR, 0.25)}"/>`;
  s += `<path d="M260 744 V300 Q260 190 420 190" stroke="${BRASS}" stroke-width="9" fill="none" stroke-linecap="round"/>`;
  s += `<polygon points="400,330 270,740 590,740 470,330" fill="rgba(255,230,160,.14)"/>`;
  s += `<path d="M360 200 a80 80 0 0 1 160 0 q0 30 -20 40 h-120 q-20 -10 -20 -40z" fill="${CREAM}" transform="translate(0 0)"/><path d="M360 200 a80 80 0 0 1 160 0" stroke="${CLAY}" stroke-width="10" fill="none"/>`;
  s += `<ellipse cx="440" cy="244" rx="64" ry="9" fill="rgba(255,235,170,.9)"/>`;
  s += rect(500, 650, 200, 76, SAND, 8) + rect(520, 626, 160, 30, CLAY, 8);
  return s;
}

function pendant() {
  let s = `<line x1="400" y1="0" x2="400" y2="330" stroke="${CHAR}" stroke-width="4"/>`;
  s += `<polygon points="330,470 130,740 670,740 470,470" fill="rgba(255,230,160,.16)"/>`;
  s += `<path d="M280 470 q0-140 120-140 q120 0 120 140z" fill="${CLAY}"/><path d="M300 440 q20-90 90-100" stroke="rgba(255,255,255,.28)" stroke-width="8" fill="none" stroke-linecap="round"/><ellipse cx="400" cy="470" rx="120" ry="14" fill="${shade(CLAY, -0.3)}"/><ellipse cx="400" cy="472" rx="84" ry="8" fill="rgba(255,236,176,.95)"/>`;
  s += shadow(400, 760, 220, 18) + rect(190, 690, 420, 20, OAK, 6) + rect(210, 708, 16, 52, WALNUT, 3) + rect(574, 708, 16, 52, WALNUT, 3);
  s += `<path d="M350 690 h60 l-6-58 h-48z" fill="${CREAM}"/><path d="M380 632 q-14-40 4-60" stroke="${SAGE}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  return s;
}

type Art = { wall: string; floor: string; draw: () => string; rug?: string; window?: boolean };
const ART: Record<string, Art> = {
  "fjord-sofa": { wall: "#e6dccb", floor: "#cdb899", rug: "#d8cbb4", draw: () => sofa(400, 560, OAT, CLAY) },
  "skog-loveseat": { wall: "#dfe3d8", floor: "#c9b99b", rug: "#d6d2c0", draw: () => sofa(400, 400, CLAY, CREAM) },
  "vik-lounge-chair": { wall: "#e9ddc9", floor: "#cbb594", rug: "#ddd0b7", draw: () => lounge(400, "#d8c6a6") },
  "oak-dining-chair": { wall: "#e5e0d3", floor: "#cdbb9c", draw: () => diningChair(285, 1.12) + diningChair(525, 1.12, shade(OAK, 0.06)) },
  "lund-bar-stool": { wall: "#d9d3c6", floor: "#bfae92", draw: () => stool(400) },
  "arne-dining-table": { wall: "#e8e1d2", floor: "#cdb899", draw: () => diningTable() },
  "round-coffee-table": { wall: "#e4d8c4", floor: "#c9b391", rug: "#dccfb6", draw: () => coffeeTable() },
  "nesting-side-tables": { wall: "#ddd8cb", floor: "#c4b497", draw: () => nesting() },
  "oak-sideboard": { wall: "#e7dfcf", floor: "#cdb899", draw: () => sideboard() },
  "open-bookshelf": { wall: "#e1d9c8", floor: "#c8b693", draw: () => bookshelf() },
  "arc-floor-lamp": { wall: "#d8cdb9", floor: "#bda98a", rug: "#cfc1a6", draw: () => arcLamp() },
  "dome-pendant": { wall: "#d4cab6", floor: "#baa688", draw: () => pendant() },
};

export const FURNITURE_ART_SLUGS = Object.keys(ART);

export function productArt(slug: string): string {
  const a = ART[slug] ?? ART["fjord-sofa"]!;
  return scene(a.wall, a.floor, a.draw(), { rug: a.rug, window: a.window });
}

const CAT_ART: Record<string, [string, string]> = {
  sofas: ["fjord-sofa", "#dccfb8"],
  chairs: ["vik-lounge-chair", "#d9ccb4"],
  tables: ["round-coffee-table", "#dcd2bd"],
  storage: ["oak-sideboard", "#d7cdb9"],
  lighting: ["arc-floor-lamp", "#cdbfa6"],
};
export function categoryArt(slug: string): string {
  const [art, wall] = CAT_ART[slug] ?? CAT_ART.sofas!;
  const a = ART[art]!;
  return scene(wall, a.floor, a.draw(), { rug: a.rug });
}

/** Living-room hero scene, portrait 1200×1400. */
export function heroArt(): string {
  const g = (x: number, y: number, k: number, body: string) => `<g transform="translate(${x} ${y}) scale(${k})">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1400">${rect(0, 0, 1200, 1400, "#e8ddc9")}<rect x="640" y="150" width="400" height="640" rx="200" fill="#f7f1e3"/><rect x="660" y="170" width="360" height="600" rx="180" fill="#fbf7ec"/><rect x="838" y="170" width="6" height="600" fill="#e8ddc9"/><rect x="660" y="450" width="360" height="6" fill="#e8ddc9"/><polygon points="640,790 1040,790 1200,1180 480,1180" fill="rgba(255,250,235,.38)"/>${rect(0, 1000, 1200, 400, "#cdb797")}${rect(0, 994, 1200, 7, "rgba(0,0,0,.06)")}<ellipse cx="600" cy="1230" rx="560" ry="86" fill="#dccfb4"/><ellipse cx="600" cy="1230" rx="500" ry="68" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="4"/>${rect(130, 330, 250, 330, "#f6f1e7", 3, `stroke="${WALNUT}" stroke-width="12"`)}<circle cx="255" cy="460" r="70" fill="${CLAY}"/><path d="M142 648 q113-150 226 0z" fill="${SAGE}" opacity=".85"/>${g(-20, 394, 1, sofa(400, 560, OAT, CLAY))}${g(540, 398, 1, arcLamp())}${g(280, 705, 0.7, coffeeTable())}</svg>`;
}
