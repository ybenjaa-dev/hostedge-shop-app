// Proves each theme reproduces its original branch exactly: base + overlay === origin/shop-<theme> (same files, same bytes).
//   node scripts/verify-themes.mjs [theme...]
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const sh = (cmd, cwd) => execFileSync("sh", ["-c", cmd], { cwd, maxBuffer: 1 << 28 }).toString();
const all = sh("node scripts/apply-theme.mjs --list").trim().split("\n");
const want = process.argv.slice(2).length ? process.argv.slice(2) : all;
const ref = (t) => (t === "classic" ? "origin/shop-classic" : `origin/shop-${t}`);
const manifest = (cmd, cwd) => Object.fromEntries(sh(cmd, cwd).trim().split("\n").filter(Boolean).map((l) => { const [h, p] = [l.slice(0, 40), l.slice(41)]; return [p, h]; }));
let bad = 0;
for (const t of want) {
  const dir = mkdtempSync(join(tmpdir(), `theme-${t}-`));
  try {
    sh(`git archive HEAD | tar -x -C ${dir}`);
    sh(`THEME=${t} node scripts/apply-theme.mjs`, dir);
    // hash every file in the built tree and in the branch
    const built = manifest(`find . -type f -not -path './.theme-state.json' -not -path './themes/*' -not -path './scripts/apply-theme.mjs' -not -path './scripts/verify-themes.mjs' -not -path './scripts/build-overlays.mjs' | sed 's#^\\./##' | while read f; do printf '%s %s\\n' "$(git hash-object "$f")" "$f"; done`, dir);
    const branch = manifest(`git ls-tree -r ${ref(t)} | awk '{print $3" "$4}'`, process.cwd());
    for (const p of ["scripts/apply-theme.mjs", "scripts/verify-themes.mjs", "scripts/build-overlays.mjs"]) delete branch[p];
    for (const p of Object.keys(branch)) if (p.startsWith("themes/")) delete branch[p];
    const diff = [...new Set([...Object.keys(built), ...Object.keys(branch)])].filter((p) => built[p] !== branch[p]);
    console.log(`${diff.length ? "FAIL" : "ok  "} ${t}${diff.length ? "  " + diff.slice(0, 5).join(", ") : ""}`);
    if (diff.length) bad++;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
process.exit(bad ? 1 : 0);
