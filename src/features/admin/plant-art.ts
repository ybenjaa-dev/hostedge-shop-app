/** Hand-built sticker-style SVG illustrations for the sample plant catalogue (chunky dark outline, flat fills, hard offset shadow). */
const INK = "#1f3d2b";
const st = (w: number) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const S = st(7);
const GREEN = "#4fa86b";
const GREEN2 = "#2f8452";
const LIME = "#9bd36a";
const SUN = "#ffc83d";
const CORAL = "#ff6b4a";
const CREAM = "#fffdf6";

export type ArtKind = "monstera" | "snake" | "pothos" | "rosette" | "cactus" | "aloe" | "pots" | "hanging" | "can" | "tools" | "herbs" | "wildflowers";
export const ART_BG: Record<ArtKind, [string, string]> = {
  monstera: ["#cfe6c3", "#eaf5df"], snake: ["#d3e8cf", "#eff8e9"], pothos: ["#dcebc2", "#f3f9e1"],
  rosette: ["#fde9a8", "#fff5cf"], cactus: ["#fbe0a0", "#fff2c6"], aloe: ["#fcebb0", "#fff6d3"],
  pots: ["#ffd1c2", "#ffe9e1"], hanging: ["#ffd8c8", "#ffeee6"],
  can: ["#c9e4f0", "#e6f4fa"], tools: ["#cde3ec", "#e8f4f8"],
  herbs: ["#f6d6e8", "#fdeaf4"], wildflowers: ["#f3d9f0", "#fbeefa"],
};

const leaf = (x: number, y: number, rot: number, s: number, fill = GREEN) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0C30 -44 104 -44 140 0C104 44 30 44 0 0Z" fill="${fill}" ${S}/><path d="M12 0H118" fill="none" ${st(4)}/></g>`;
const heart = (x: number, y: number, rot: number, s: number, fill = GREEN) =>
  `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0C-40 -40 -30 -95 20 -90C50 -88 70 -60 0 0Z M0 0C40 -40 30 -95 -20 -90C-50 -88 -70 -60 0 0Z" fill="${fill}" ${S}/></g>`;
const pot = (cx: number, top: number, w: number, h: number, fill = "#e8825c", band = "#f4a07c") =>
  `<path d="M${cx - w / 2} ${top} h${w} l${-w * 0.12} ${h} q0 14 -14 14 h${-(w * 0.76 - 28)} q-14 0 -14 -14z" fill="${fill}" ${S}/>` +
  `<rect x="${cx - w / 2 - 12}" y="${top - 22}" width="${w + 24}" height="38" rx="14" fill="${band}" ${S}/>`;
const spark = (x: number, y: number, r = 14, fill = SUN) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
const stem = (d: string) => `<path d="${d}" fill="none" ${S}/>`;
const ground = `<ellipse cx="300" cy="548" rx="190" ry="16" fill="${INK}" opacity=".16"/>`;

function monstera() {
  return ground + stem("M300 400C290 330 240 280 190 250") + stem("M300 400C300 320 300 250 300 190") + stem("M300 400C310 330 360 280 420 240") +
    heart(190, 255, -35, 1.5, GREEN) + heart(300, 195, 0, 1.75, LIME) + heart(420, 245, 38, 1.5, GREEN2) +
    heart(240, 330, -70, 1.1, LIME) + heart(360, 335, 68, 1.1, GREEN) + pot(300, 400, 200, 130) + spark(115, 170) + spark(500, 130, 10, CORAL);
}
function snake() {
  const blade = (x: number, rot: number, h: number, fill: string) =>
    `<g transform="translate(${x} 410) rotate(${rot})"><path d="M0 0C-34 -${h * 0.3} -30 -${h * 0.8} 0 -${h}C30 -${h * 0.8} 34 -${h * 0.3} 0 0Z" fill="${fill}" ${S}/><path d="M-14 -${h * 0.25}Q0 -${h * 0.3} 14 -${h * 0.25}M-18 -${h * 0.5}Q0 -${h * 0.55} 18 -${h * 0.5}M-12 -${h * 0.75}Q0 -${h * 0.8} 12 -${h * 0.75}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
  return ground + blade(235, -18, 300, GREEN2) + blade(365, 18, 290, GREEN2) + blade(268, -7, 360, GREEN) + blade(334, 8, 345, GREEN) + blade(300, 0, 400, LIME) + pot(300, 400, 210, 135, CORAL, "#ff8e72") + spark(130, 150) + spark(485, 190, 11, CORAL);
}
function pothos() {
  const hs = (pts: [number, number, number][]) => pts.map(([x, y, r]) => heart(x, y, r, 0.55, Math.abs(r) > 100 ? LIME : GREEN)).join("");
  return ground + stem("M300 360C220 300 150 330 140 420C135 470 150 500 160 520") + stem("M300 360C380 300 450 330 462 410C468 460 450 495 440 520") + stem("M300 360C300 310 290 280 270 250") +
    hs([[225, 322, -60], [168, 345, -90], [138, 410, 180], [148, 470, 170], [162, 512, 160], [372, 325, 60], [440, 345, 90], [462, 405, 180], [452, 465, 190], [440, 508, 200], [272, 258, -20], [320, 300, 20]]) + pot(300, 360, 190, 120, "#f4c95d", "#ffd980") + spark(110, 150) + spark(510, 140, 10, CORAL);
}
function rosette() {
  const ring = (n: number, r: number, len: number, fill: string, off = 0) =>
    Array.from({ length: n }, (_, i) => `<g transform="translate(300 330) rotate(${(360 / n) * i + off})"><path d="M0 -${r}C-${len * 0.5} -${r + len * 0.3} -${len * 0.4} -${r + len} 0 -${r + len}C${len * 0.4} -${r + len} ${len * 0.5} -${r + len * 0.3} 0 -${r}Z" fill="${fill}" ${st(6)}/></g>`).join("");
  return ground + ring(9, 20, 120, "#7fc28f") + ring(7, 10, 88, "#a5d99a", 20) + ring(5, 0, 54, "#d6f0b8", 10) + `<circle cx="300" cy="330" r="12" fill="${CORAL}" stroke="${INK}" stroke-width="5"/>` + pot(300, 430, 180, 100, "#a9c8e8", "#c7dcf2") + spark(125, 190) + spark(480, 150, 10, CORAL);
}
function cactus() {
  const one = (cx: number, h: number, w: number, fill: string) =>
    `<rect x="${cx - w / 2}" y="${430 - h}" width="${w}" height="${h}" rx="${w / 2}" fill="${fill}" ${S}/>` +
    `<path d="M${cx} ${430 - h + 24}V${420}M${cx - w * 0.22} ${430 - h + 40}V${400}M${cx + w * 0.22} ${430 - h + 40}V${400}" stroke="${INK}" stroke-width="4" stroke-linecap="round" opacity=".5"/>`;
  return ground + one(300, 260, 100, GREEN) +
    `<path d="M252 330H215Q192 330 192 300V260" fill="none" ${st(30)}/><path d="M252 330H215Q192 330 192 300V260" fill="none" stroke="${GREEN}" stroke-width="16" stroke-linecap="round"/>` +
    `<path d="M348 300H380Q405 300 405 270V230" fill="none" ${st(30)}/><path d="M348 300H380Q405 300 405 270V230" fill="none" stroke="${GREEN}" stroke-width="16" stroke-linecap="round"/>` +
    one(165, 100, 56, LIME) + one(440, 130, 62, GREEN2) +
    `<circle cx="300" cy="162" r="22" fill="${CORAL}" stroke="${INK}" stroke-width="5"/><circle cx="300" cy="162" r="7" fill="${SUN}"/>` + pot(300, 430, 340, 90, "#f3b6a2", "#f9cdbd") + spark(105, 180) + spark(505, 160, 10, CORAL);
}
function aloe() {
  const b = (rot: number, h: number, fill: string) => `<g transform="translate(300 420) rotate(${rot})"><path d="M-30 0C-34 -${h * 0.5} -14 -${h * 0.85} 0 -${h}C14 -${h * 0.85} 34 -${h * 0.5} 30 0Z" fill="${fill}" ${S}/><path d="M-20 -${h * 0.35}l-9 -4M-14 -${h * 0.6}l-9 -5M20 -${h * 0.35}l9 -4M14 -${h * 0.6}l9 -5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>`;
  return ground + b(-62, 250, GREEN2) + b(62, 250, GREEN2) + b(-34, 310, GREEN) + b(34, 310, GREEN) + b(0, 340, LIME) + pot(300, 415, 200, 125, "#ffd980", "#ffe7a8") + spark(120, 160) + spark(495, 190, 11, CORAL);
}
function pots() {
  const p = (cx: number, top: number, w: number, h: number, f: string, b: string, sprout = true) =>
    (sprout ? stem(`M${cx} ${top}V${top - 40}`) + leaf(cx, top - 38, -140, 0.42, LIME) + leaf(cx, top - 38, -40, 0.42, GREEN) : "") + pot(cx, top, w, h, f, b);
  return ground + p(170, 380, 140, 110, "#e8825c", "#f4a07c") + p(440, 395, 130, 100, "#f4c95d", "#ffd980") + p(305, 330, 190, 165, "#ff6b4a", "#ff8e72") +
    `<path d="M240 400q65 25 130 0" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" opacity=".8"/>` + spark(100, 160) + spark(510, 170, 10, SUN);
}
function hanging() {
  return `<path d="M300 40V130M300 130L215 310M300 130L385 310" fill="none" ${st(5)}/><circle cx="300" cy="40" r="14" fill="${SUN}" ${st(5)}/>` +
    stem("M250 330C200 380 175 440 190 520") + stem("M350 330C410 390 425 450 410 520") + stem("M300 330C305 400 290 460 305 510") +
    [[195, 440, 120], [188, 505, 150], [412, 440, 60], [410, 505, 30], [302, 410, 100], [308, 500, 80]].map(([x, y, r]) => heart(x!, y!, r!, 0.5, r! > 90 ? LIME : GREEN)).join("") +
    heart(260, 320, -30, 0.6, GREEN) + heart(345, 320, 30, 0.6, LIME) +
    `<path d="M200 305h200q0 90 -100 95q-100 -5 -100 -95z" fill="#f3b6a2" ${S}/><path d="M215 335q85 25 170 0" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round"/>` + spark(110, 220) + spark(500, 220, 10, CORAL);
}
function can() {
  return ground +
    `<path d="M400 340L505 250" fill="none" ${st(26)}/><path d="M400 340L505 250" fill="none" stroke="#7bbcd8" stroke-width="12" stroke-linecap="round"/><path d="M490 220l50 50l-26 26l-50 -50z" fill="#7bbcd8" ${S}/>` +
    `<path d="M200 300Q120 300 120 380Q120 440 200 440" fill="none" ${st(26)}/><path d="M200 300Q120 300 120 380Q120 440 200 440" fill="none" stroke="#7bbcd8" stroke-width="12" stroke-linecap="round"/>` +
    `<path d="M190 290H410L420 500Q420 530 390 530H210Q180 530 180 500Z" fill="#7bbcd8" ${S}/><ellipse cx="300" cy="290" rx="110" ry="22" fill="#a9d6ea" ${S}/><rect x="180" y="380" width="240" height="40" fill="${SUN}" stroke="${INK}" stroke-width="6"/>` +
    `<path d="M268 410l32-26l32 26" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    [[520, 330], [550, 365], [495, 360], [560, 310]].map(([x, y]) => `<path d="M${x} ${y! - 14}Q${x! + 10} ${y} ${x} ${y! + 10}Q${x! - 10} ${y} ${x} ${y! - 14}Z" fill="#7bbcd8" stroke="${INK}" stroke-width="4"/>`).join("") + spark(110, 150);
}
function tools() {
  return ground +
    `<g transform="rotate(-28 300 300)"><rect x="268" y="330" width="64" height="170" rx="30" fill="${CORAL}" ${S}/><rect x="285" y="270" width="30" height="80" fill="#cfd6d3" ${S}/><path d="M300 90C230 140 235 250 300 275C365 250 370 140 300 90Z" fill="#dfe6e3" ${S}/><path d="M300 120V250" stroke="${INK}" stroke-width="4" stroke-linecap="round"/></g>` +
    `<g transform="rotate(28 300 300)"><rect x="268" y="330" width="64" height="170" rx="30" fill="${SUN}" ${S}/><rect x="285" y="250" width="30" height="100" fill="#cfd6d3" ${S}/><path d="M250 250V130M300 250V110M350 250V130" stroke="${INK}" stroke-width="22" stroke-linecap="round"/><path d="M250 250V130M300 250V110M350 250V130" stroke="#dfe6e3" stroke-width="10" stroke-linecap="round"/><path d="M245 255H355" stroke="${INK}" stroke-width="12" stroke-linecap="round"/></g>` + spark(95, 170) + spark(505, 150, 10, CORAL);
}
function packet(x: number, y: number, rot: number, fill: string, label: string, inner: string) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M-95 -150H95V150H-95Z" fill="${fill}" ${S}/><path d="M-95 -150L-80 -170H80L95 -150" fill="${fill}" ${S}/><path d="M-80 -168V-150M-60 -168V-150M-40 -168V-150M-20 -168V-150M0 -168V-150M20 -168V-150M40 -168V-150M60 -168V-150M80 -168V-150" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-30" r="68" fill="${CREAM}" ${st(6)}/><g transform="translate(0 -30)">${inner}</g><rect x="-62" y="62" width="124" height="46" rx="23" fill="${CREAM}" stroke="${INK}" stroke-width="5"/><text x="0" y="94" text-anchor="middle" font-family="Fredoka,Arial Rounded MT Bold,sans-serif" font-size="26" font-weight="700" fill="${INK}">${label}</text></g>`;
}
function herbs() {
  return ground + packet(215, 330, -9, "#9bd36a", "BASIL", `<g transform="scale(.8)">${leaf(0, 40, -150, 0.5, GREEN2)}${leaf(0, 40, -30, 0.5, GREEN)}${leaf(0, 40, -90, 0.55, LIME)}</g>`) +
    packet(385, 345, 9, "#ffc83d", "MINT", `<g transform="scale(.8)">${leaf(0, 40, -130, 0.45, GREEN)}${leaf(0, 40, -50, 0.45, GREEN2)}${leaf(0, 40, -90, 0.5, LIME)}</g>`) + spark(105, 150) + spark(505, 130, 10, CORAL);
}
function wildflowers() {
  const flower = (fill: string, c: string) => Array.from({ length: 6 }, (_, i) => `<ellipse cx="0" cy="-30" rx="14" ry="22" transform="rotate(${i * 60})" fill="${fill}" stroke="${INK}" stroke-width="4"/>`).join("") + `<circle r="12" fill="${c}" stroke="${INK}" stroke-width="4"/>`;
  return ground + packet(215, 330, -9, "#ff9d84", "WILD", flower(CORAL, SUN)) + packet(385, 345, 9, "#b9a4f0", "MIX", flower("#b9a4f0", SUN)) + spark(105, 150) + spark(505, 130, 10, SUN);
}

const DRAW: Record<ArtKind, () => string> = { monstera, snake, pothos, rosette, cactus, aloe, pots, hanging, can, tools, herbs, wildflowers };

/** 600x600 product / category picture. */
export function plantArt(kind: ArtKind): string {
  const [a, b] = ART_BG[kind];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><rect width="600" height="600" fill="${a}"/><path d="M300 36C440 20 570 120 566 290C562 450 450 572 300 566C150 560 38 470 40 300C42 160 150 52 300 36Z" fill="${b}" stroke="${INK}" stroke-width="6" stroke-dasharray="2 14" stroke-linecap="round"/>${DRAW[kind]()}</svg>`;
}

/** 900x900 hero picture (fills the blob on the home page). */
export function heroArt(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><rect width="900" height="900" fill="#ffe9a6"/><circle cx="640" cy="230" r="150" fill="${SUN}" stroke="${INK}" stroke-width="8"/>` +
    `<path d="M0 640C150 590 300 700 450 650S760 600 900 660V900H0Z" fill="#9bd36a" stroke="${INK}" stroke-width="8"/>` +
    `<g transform="translate(-90 150) scale(1.2)">${monstera()}</g>` +
    `<g transform="translate(430 330) scale(.78)">${snake()}</g>` +
    `<g transform="translate(540 560) scale(.55)">${rosette()}</g>` +
    `<g transform="translate(-40 600) scale(.5)">${cactus()}</g>` +
    spark(120, 120, 22) + spark(780, 480, 16, CORAL) + spark(380, 90, 14, CORAL) + `</svg>`;
}

export const CAT_ART: Record<string, ArtKind> = { indoor: "monstera", succulents: "rosette", pots: "pots", tools: "tools", seeds: "herbs" };
