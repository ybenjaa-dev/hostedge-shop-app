#!/usr/bin/env python3
"""Generates the storefront logos (horizontal lockup + square icon) as self-contained SVGs: text is converted to paths, so no web font is needed.
Usage: python3 scripts/brand/gen-logos.py [outDir]   (needs: pip install fonttools)"""
import math, os, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

F = {
  "inter-x": "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf",
  "inter-b": "/usr/share/fonts/opentype/inter/Inter-Bold.otf",
  "inter-l": "/usr/share/fonts/opentype/inter/Inter-Light.otf",
  "inter-k": "/usr/share/fonts/opentype/inter/Inter-Black.otf",
  "serif": "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf",
  "serif-b": "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
  "serif-i": "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf",
  "dj-serif-b": "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
  "dj-sans-b": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "free-sans-b": "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
}
_cache = {}
def font(k):
    if k not in _cache: _cache[k] = TTFont(F[k])
    return _cache[k]

def text_path(fk, text, size, track=0.0, skew=0.0):
    """-> (svg path d, width, cap height) with the baseline at y=0, y growing downwards."""
    f = font(fk); gs = f.getGlyphSet(); cmap = f.getBestCmap(); upm = f["head"].unitsPerEm
    s = size / upm; x = 0.0; out = []
    for ch in text:
        g = cmap.get(ord(ch))
        if g is None: x += size * 0.3; continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, skew * s, -s, x, 0)))   # flip y, optional italic skew
        out.append(pen.getCommands())
        x += gs[g].width * s + track * size
    cap = getattr(f["OS/2"], "sCapHeight", upm * 0.7) * s
    return " ".join(out), x - track * size, cap

def lockup(name, mark, mark_w, fk, size, fill, track=0.0, upper=False, skew=0.0, gap=14, sub=None, sub_fill=None, text2=None, pad=4):
    t = name.upper() if upper else name
    d, w, cap = text_path(fk, t, size, track, skew)
    H = 64
    ty = H / 2 + cap / 2
    body = f'<g>{mark}</g>' if mark else ""
    x0 = (mark_w + gap) if mark else 0
    extra = ""
    h = H
    if sub:
        sd, sw, scap = text_path("inter-b", sub.upper(), size * 0.2, 0.22)
        ty = H / 2 + cap / 2 - 5
        extra = f'<path transform="translate({x0:.1f} {ty + scap + 9:.1f})" d="{sd}" fill="{sub_fill or fill}" opacity=".75"/>'
        w = max(w, sw)
    total = x0 + w
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad} {-pad} {total + 2 * pad:.1f} {h + 2 * pad}" width="{(total + 2 * pad) * 2:.0f}" height="{(h + 2 * pad) * 2}" role="img" aria-label="{name.replace("&", "&amp;")}">'
            f'{body}<path transform="translate({x0:.1f} {ty:.1f})" d="{d}" fill="{fill}"/>{extra}</svg>')

def icon(inner, bg, radius=14):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256" role="img"><rect width="64" height="64" rx="{radius}" fill="{bg}"/>{inner}</svg>')

def star(cx, cy, r, n=4, inner=0.38, rot=-90):
    pts = []
    for i in range(n * 2):
        a = math.radians(rot + i * 180 / n); rr = r if i % 2 == 0 else r * inner
        pts.append(f"{cx + rr * math.cos(a):.2f},{cy + rr * math.sin(a):.2f}")
    return "M" + " L".join(pts) + "Z"

# ---- marks: every one is drawn in a 64×64 box, with the background tile included in `tile` and the glyph in `glyph` ----
def M_nova(c):  return f'<path d="{star(32,32,23,4,0.3)}" fill="#fff"/><circle cx="48" cy="17" r="4.5" fill="{c["accent"]}"/>'
def M_sahara(c):return f'<path d="{star(32,32,24,8,0.62,-90)}" fill="{c["accent"]}"/><circle cx="32" cy="32" r="8" fill="{c["bg"]}"/>'
def M_heritage(c): return f'<path d="M16 14h9v14h14V14h9v36h-9V36H25v14h-9z" fill="#fff"/><path d="M16 53h32" stroke="{c["accent"]}" stroke-width="4" stroke-linecap="round"/>'
def M_lumiere(c):
    petals = "".join(f'<ellipse cx="32" cy="19" rx="7.5" ry="14" fill="{c["accent"] if i%2 else "#fff"}" opacity="{.95 if i%2 else .9}" transform="rotate({a} 32 32)"/>' for i, a in enumerate(range(0, 360, 60)))
    return petals + f'<circle cx="32" cy="32" r="5" fill="{c["bg"]}"/>'
def M_vitalis(c): return f'<path d="M14 36c0-14 10-22 26-22 4 0 8 .6 10 1.4C49 33 41 46 26 46c-4 0-8-1-12-3z" fill="{c["accent"]}"/><path d="M14 50C22 38 30 31 42 24" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none"/>'
def M_nordique(c): return f'<path d="M18 48V16l28 32V16" stroke="#fff" stroke-width="4.5" fill="none" stroke-linejoin="miter"/><rect x="14" y="53" width="36" height="2.5" fill="{c["accent"]}"/>'
def M_voltix(c): return f'<path d="M36 8 16 36h14l-4 20 22-30H34z" fill="#fff"/><path d="M36 8 16 36h14l-4 20" fill="none"/><circle cx="50" cy="14" r="4" fill="{c["accent"]}"/>'
def M_aurelle(c): return f'<path d="M26 12h12v7l-2 3c8 2 13 8 13 16 0 9-7 15-17 15S15 47 15 38c0-8 5-14 13-16l-2-3z" fill="none" stroke="{c["accent"]}" stroke-width="3" stroke-linejoin="round"/><rect x="24" y="8" width="16" height="6" rx="1.5" fill="{c["accent"]}"/><path d="M32 30c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" fill="{c["accent"]}"/>'
def M_hearth(c): return f'<path d="M10 32 32 12l22 20" stroke="#fff" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 30v22h32V30" stroke="#fff" stroke-width="4.5" fill="none" stroke-linejoin="round"/><path d="M32 49c-6 0-9-4-9-8 0-5 5-7 6-13 3 3 12 6 12 13 0 4-3 8-9 8z" fill="{c["accent"]}"/>'
def M_pantry(c): return f'<rect x="20" y="9" width="24" height="8" rx="3" fill="{c["accent2"]}"/><path d="M18 20h28v30c0 4-3 7-7 7H25c-4 0-7-3-7-7z" fill="#fff"/><path d="M32 49c-7-1-10-6-10-12 6 0 11 3 10 12zm0 0c7-1 10-6 10-12-6 0-11 3-10 12z" fill="{c["accent"]}"/>'
def M_tiny(c): return (f'<circle cx="20" cy="26" r="11" fill="{c["accent"]}"/><circle cx="44" cy="26" r="11" fill="#fff"/><circle cx="32" cy="42" r="11" fill="{c["accent2"]}"/>'
    f'<circle cx="17" cy="24" r="1.6" fill="{c["ink"]}"/><circle cx="23" cy="24" r="1.6" fill="{c["ink"]}"/><circle cx="41" cy="24" r="1.6" fill="{c["ink"]}"/><circle cx="47" cy="24" r="1.6" fill="{c["ink"]}"/><circle cx="29" cy="40" r="1.6" fill="{c["ink"]}"/><circle cx="35" cy="40" r="1.6" fill="{c["ink"]}"/>'
    f'<path d="M17 29q3 3 6 0M41 29q3 3 6 0M29 45q3 3 6 0" stroke="{c["ink"]}" stroke-width="1.6" fill="none" stroke-linecap="round"/>')
def M_aurum(c): return f'<path d="M18 10h28l10 14-24 32L8 24z" fill="none" stroke="{c["accent"]}" stroke-width="3" stroke-linejoin="round"/><path d="M8 24h48M24 10l8 14 8-14M32 24 32 56" stroke="{c["accent"]}" stroke-width="2.2" fill="none" stroke-linejoin="round" opacity=".9"/>'
def M_stride(c): return f'<path d="M20 12h22l-12 40H8z" fill="#0d0d0d"/><path d="M40 12h14L42 52H30z" fill="#0d0d0d" opacity=".55"/>'
def M_torque(c): return (f'<circle cx="32" cy="32" r="19" fill="none" stroke="#fff" stroke-width="5"/><circle cx="32" cy="32" r="6" fill="{c["accent"]}"/>'
    + "".join(f'<rect x="29.5" y="6" width="5" height="9" rx="1.5" fill="#fff" transform="rotate({a} 32 32)"/>' for a in range(0, 360, 45)) + f'<path d="M32 32 44 22" stroke="{c["accent"]}" stroke-width="3" stroke-linecap="round"/>')
def M_paw(c): return f'<ellipse cx="32" cy="43" rx="13" ry="11" fill="{c["accent"]}"/><ellipse cx="14" cy="30" rx="5.5" ry="7.5" fill="#fff" transform="rotate(-20 14 30)"/><ellipse cx="25" cy="18" rx="5.5" ry="8" fill="#fff" transform="rotate(-8 25 18)"/><ellipse cx="39" cy="18" rx="5.5" ry="8" fill="#fff" transform="rotate(8 39 18)"/><ellipse cx="50" cy="30" rx="5.5" ry="7.5" fill="#fff" transform="rotate(20 50 30)"/>'

BRANDS = [
  # slug, name, mark, bg(tile), colors, font, size, tracking, upper, skew, subtitle
  dict(slug="nova",      branch="redesign",     name="Nova",         mark=M_nova,     bg="#ff4f1f", c=dict(accent="#ffd93d"), ink="#111111", font="inter-x", size=40, track=-0.02),
  dict(slug="sahara",    branch="arabic",       name="Sahara",       mark=M_sahara,   bg="#14203f", c=dict(accent="#d4a72c"), ink="#14203f", font="dj-serif-b", size=36, track=0.0),
  dict(slug="heritage",  branch="classic",      name="Heritage",     mark=M_heritage, bg="#232f3e", c=dict(accent="#ffb703"), ink="#232f3e", font="serif-b", size=40, track=0.0),
  dict(slug="lumiere",   branch="beauty",       name="Lumière",      mark=M_lumiere,  bg="#7a2e46", c=dict(accent="#e7b9a6"), ink="#7a2e46", font="serif-i", size=46, track=0.0),
  dict(slug="vitalis",   branch="supplements",  name="Vitalis",      mark=M_vitalis,  bg="#188a4e", c=dict(accent="#c6f432"), ink="#0c3b2a", font="inter-b", size=38, track=-0.01),
  dict(slug="nordique",  branch="fashion",      name="Nordique",     mark=M_nordique, bg="#111111", c=dict(accent="#c9b79c"), ink="#111111", font="inter-l", size=30, track=0.22, upper=True),
  dict(slug="voltix",    branch="electronics",  name="Voltix",       mark=M_voltix,   bg="#2563ff", c=dict(accent="#22d3ee"), ink="#0b1220", font="inter-x", size=40, track=-0.02),
  dict(slug="aurelle",   branch="perfume",      name="Aurelle",      mark=M_aurelle,  bg="#4b1d3f", c=dict(accent="#d2a96a"), ink="#4b1d3f", font="serif", size=34, track=0.2, upper=True),
  dict(slug="hearth",    branch="home",         name="Hearth & Co",  mark=M_hearth,   bg="#b4532a", c=dict(accent="#f2c14e"), ink="#2f3a2a", font="dj-serif-b", size=32, track=-0.01),
  dict(slug="pantry-lane", branch="food",       name="Pantry Lane",  mark=M_pantry,   bg="#2f6b3a", c=dict(accent="#7fc48a", accent2="#f2b632"), ink="#1f2a1c", font="serif-b", size=40, track=0.0),
  dict(slug="tiny-tribe", branch="kids",        name="Tiny Tribe",   mark=M_tiny,     bg="#ff6b57", c=dict(accent="#ffc933", accent2="#7ad0ff", ink="#1e2a4a"), ink="#1e2a4a", font="dj-sans-b", size=34, track=0.0),
  dict(slug="aurum",     branch="jewelry",      name="Aurum",        mark=M_aurum,    bg="#111111", c=dict(accent="#b89b5e"), ink="#111111", font="serif", size=34, track=0.28, upper=True),
  dict(slug="stride",    branch="shoes",        name="Stride",       mark=M_stride,   bg="#c6ff3d", c=dict(accent="#0d0d0d"), ink="#ffffff", dark=True, font="inter-x", size=40, track=0.0, skew=0.2, upper=True),
  dict(slug="torque",    branch="auto",         name="Torque",       mark=M_torque,   bg="#e11d2e", c=dict(accent="#12161c"), ink="#ffffff", dark=True, font="inter-x", size=38, track=0.02, skew=0.14, upper=True),
  dict(slug="pawfect",   branch="pets",         name="Pawfect",      mark=M_paw,      bg="#0f766e", c=dict(accent="#ff8a1f"), ink="#2b2118", font="dj-sans-b", size=36, track=0.0),
]

def build(b):
    col = dict(b["c"]); col["bg"] = b["bg"]; col.setdefault("accent2", col["accent"]); col.setdefault("ink", b["ink"])
    inner = b["mark"](col)
    tile = f'<rect width="64" height="64" rx="15" fill="{b["bg"]}"/>' + inner
    lock = lockup(b["name"], tile, 64, b["font"], b["size"], b["ink"], b.get("track", 0), b.get("upper", False), b.get("skew", 0))
    return lock, icon(inner, b["bg"], 15)

if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "public/brand"
    os.makedirs(out, exist_ok=True)
    for b in BRANDS:
        lock, ic = build(b)
        open(f"{out}/{b['slug']}.svg", "w").write(lock)
        open(f"{out}/{b['slug']}-icon.svg", "w").write(ic)
    print(f"{len(BRANDS)} logos -> {out}")
