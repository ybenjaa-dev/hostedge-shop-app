// Applies a storefront theme on top of the shared base: copies themes/<name>/files/** over the tree and removes the
// files listed in themes/<name>/deleted.txt. "classic" is the base itself (nothing to apply).
//
//   THEME=fashion node scripts/apply-theme.mjs      (or: node scripts/apply-theme.mjs fashion)
//   node scripts/apply-theme.mjs --reset            (local dev only: put the base back using git)
//   node scripts/apply-theme.mjs --list
//
// A build runs this once before `opennextjs-cloudflare build`. Never commit while a theme is applied.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";

const root = process.cwd();
const STATE = join(root, ".theme-state.json");
const themes = () => ["classic", ...readdirSync(join(root, "themes")).filter((d) => existsSync(join(root, "themes", d, "files")))].sort();
const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });

const arg = process.argv[2];
if (arg === "--list") { console.log(themes().join("\n")); process.exit(0); }

if (arg === "--reset") {
  if (!existsSync(STATE)) { console.log("No theme applied."); process.exit(0); }
  const s = JSON.parse(readFileSync(STATE, "utf8"));
  for (const p of s.added) rmSync(join(root, p), { force: true });
  const restore = [...s.modified, ...s.deleted];
  if (restore.length) execFileSync("git", ["checkout", "HEAD", "--", ...restore], { stdio: "inherit" });
  rmSync(STATE);
  console.log(`Reset: base restored (was ${s.theme}).`);
  process.exit(0);
}

const theme = (arg ?? process.env.THEME ?? "classic").trim();
if (existsSync(STATE)) {
  const prev = JSON.parse(readFileSync(STATE, "utf8"));
  if (prev.theme === theme) { console.log(`Theme "${theme}" already applied.`); process.exit(0); }
  console.error(`Theme "${prev.theme}" is already applied. Run: node scripts/apply-theme.mjs --reset`); process.exit(1);
}
if (theme === "classic") { console.log('Theme "classic" (base): nothing to apply.'); process.exit(0); }
const dir = join(root, "themes", theme);
if (!existsSync(join(dir, "files"))) { console.error(`Unknown theme "${theme}". Available: ${themes().join(", ")}`); process.exit(1); }

const added = [], modified = [], deleted = [];
for (const f of walk(join(dir, "files"))) {
  const rel = relative(join(dir, "files"), f);
  (existsSync(join(root, rel)) ? modified : added).push(rel);
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  cpSync(f, join(root, rel));
}
const del = join(dir, "deleted.txt");
if (existsSync(del)) {
  for (const rel of readFileSync(del, "utf8").split("\n").filter(Boolean)) {
    if (existsSync(join(root, rel))) { rmSync(join(root, rel), { force: true }); deleted.push(rel); }
  }
}
writeFileSync(STATE, JSON.stringify({ theme, added, modified, deleted }, null, 1));
console.log(`Theme "${theme}" applied: ${modified.length} replaced, ${added.length} added, ${deleted.length} removed.`);
