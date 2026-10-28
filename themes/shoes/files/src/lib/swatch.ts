/** Map a shade/colour name to a display colour. Known beauty/colour words first, otherwise a stable pastel from the name. */
const KNOWN: Record<string, string> = {
  rose: "#d98a96", berry: "#8c2f4f", nude: "#d8a98f", coral: "#f07a68", brick: "#a8493a", red: "#b3202e", pink: "#f2a3b6", plum: "#6b2a4a", peach: "#f6b79a",
  ivory: "#f6e9d7", beige: "#e5c8a6", sand: "#d9b88d", caramel: "#b9824a", mocha: "#7a5238", chocolate: "#4e3023", black: "#1c1717", white: "#fbf7f2", clear: "#e9eef0",
  gold: "#c9a24b", silver: "#c3c6cc", "rose gold": "#d3a193", mauve: "#a4768a", burgundy: "#5e1a2c", wine: "#6a1f35", tan: "#c49a6c", honey: "#d5a35a", porcelain: "#f2dcc9", natural: "#e2bf98",
  navy: "#1f2a44", olive: "#6b6b3a", grey: "#8a8d91", gray: "#8a8d91", blue: "#2f5fd0", brown: "#6b4428", lime: "#c6ff3d", orange: "#ff6a2a", marine: "#1f2a44", gris: "#8a8d91", bleu: "#2f5fd0", marron: "#6b4428", كحلي: "#1f2a44", رمادي: "#8a8d91", أزرق: "#2f5fd0", بني: "#6b4428", زيتي: "#6b6b3a",
  noir: "#1c1717", blanc: "#fbf7f2", rouge: "#b3202e", rose_: "#d98a96", nu: "#d8a98f", بيج: "#e5c8a6", وردي: "#f2a3b6", أحمر: "#b3202e", عنابي: "#6a1f35", نود: "#d8a98f", أسود: "#1c1717",
};

export function swatchColor(name: string): string {
  const n = name.toLowerCase().trim();
  if (KNOWN[n]) return KNOWN[n]!;
  for (const [k, v] of Object.entries(KNOWN)) if (n.includes(k)) return v;
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 42% 72%)`;
}

/** Is this variant set a "shade" picker (names are colours) rather than sizes? */
export function looksLikeShades(names: string[]): boolean {
  if (!names.length) return false;
  const sizeLike = /^\s*\d+([.,]\d+)?\s*(ml|g|l|oz|cl|kg|mg|pcs?|pack)?\s*$/i;
  return names.every((n) => !sizeLike.test(n));
}
