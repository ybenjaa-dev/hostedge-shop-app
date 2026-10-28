// One-off/maintenance: regenerate themes/<name>/ from the shop-* branches, relative to the classic base.
// usage: node scripts/build-overlays.mjs [theme...]   (default: all)
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";

const BASE = process.env.BASE_REF ?? "origin/shop-classic";
const THEMES = ["arabic","auto","beauty","books","electronics","fashion","food","furniture","home","jewelry","kids","perfume","pets","plants","redesign","shoes","sports","supplements","watches"];
const git = (...a) => execFileSync("git", a, { maxBuffer: 1 << 28 });
const only = process.argv.slice(2);
for (const t of only.length ? only : THEMES) {
  const root = join("themes", t);
  rmSync(root, { recursive: true, force: true });
  const lines = git("diff", "--name-status", "--no-renames", "-z", BASE, `origin/shop-${t}`).toString().split("\0").filter(Boolean);
  const deleted = [];
  let n = 0;
  for (let i = 0; i < lines.length; i += 2) {
    const [st, path] = [lines[i], lines[i + 1]];
    if (st === "D") { deleted.push(path); continue; }
    const dest = join(root, "files", path);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, git("show", `origin/shop-${t}:${path}`));
    n++;
  }
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, "deleted.txt"), deleted.sort().join("\n") + (deleted.length ? "\n" : ""));
  console.log(`${t}: ${n} files, ${deleted.length} deleted`);
}
