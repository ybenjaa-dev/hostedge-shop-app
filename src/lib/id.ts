const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
export function newId(len = 16): string {
  const u = crypto.getRandomValues(new Uint8Array(len));
  let s = "";
  for (const b of u) s += ALPHABET[b % ALPHABET.length];
  return s;
}
export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || newId(6);
}
