#!/usr/bin/env python3
"""Idempotent PageSpeed/a11y patches for the shared and the themed files (run on every branch)."""
import re
def edit(p, fn):
    try: s = open(p).read()
    except FileNotFoundError: return
    n = fn(s)
    if n != s: open(p, 'w').write(n); print('patched', p)

# 1. fonts must not block first paint; brand colour must be readable (WCAG AA) on white
def layout(s):
    if 'data-swap' not in s:
        s = re.sub(r'<link rel="stylesheet" href=\{(googleFontsUrl\([^}]*\))\} />',
                   r'<link rel="stylesheet" href={\1} media="print" data-swap="" suppressHydrationWarning />\n        <noscript><link rel="stylesheet" href={\1} /></noscript>\n        <script dangerouslySetInnerHTML={{ __html: FONT_SWAP }} />', s, 1)
        s = s.replace('const HIDE_CSS =', '''/** Google Fonts load without blocking the first paint (the page shows in a system font, then swaps). */
const FONT_SWAP = `document.querySelectorAll('link[data-swap]').forEach(function(l){function s(){l.media='all'}l.sheet?s():l.addEventListener('load',s)})`;
const HIDE_CSS =''', 1)
    s = s.replace('data-swap="" />', 'data-swap="" suppressHydrationWarning />')  # the swap script flips media before React hydrates
    if 'readableOnWhite' not in s:
        s = s.replace('import { onColor } from "@/lib/color";', 'import { onColor, readableOnWhite } from "@/lib/color";', 1)
        s = s.replace('  const b = s.branding;\n', '  const b = s.branding;\n  const brand = readableOnWhite(b.primary); // darkened just enough for 4.5:1 text contrast in light mode\n', 1)
        s = s.replace('--brand:${b.primary};--brand-ink:${onColor(b.primary)};', '--brand:${brand};--brand-ink:${onColor(brand)};', 1)
        s = s.replace("--font-heading:'${rtl ? b.fontArabic : b.fontLatin}'}`;", "--font-heading:'${rtl ? b.fontArabic : b.fontLatin}'}${brand !== b.primary ? `:root:root[data-theme=\"dark\"]{--brand:${b.primary};--brand-ink:${onColor(b.primary)}}` : \"\"}`;", 1)
        s = s.replace("--font-heading:${lang === \"ar\" ? \"'Reem Kufi'\" : \"'Cormorant Garamond'\"}}`;", "--font-heading:${lang === \"ar\" ? \"'Reem Kufi'\" : \"'Cormorant Garamond'\"}}${brand !== b.primary ? `:root:root[data-theme=\"dark\"]{--brand:${b.primary};--brand-ink:${onColor(b.primary)}}` : \"\"}`;", 1)
    return s
edit('src/app/layout.tsx', layout)

# 2. accessible names
def card(s):
    return re.sub(r'(<Link href=\{`/p/\$\{p\.slug\}`\}[^\n]*?) aria-label=\{name\}>', r'\1>', s)
edit('src/features/catalog/components/product-card.tsx', card)
def stars(s):
    return s.replace('<div className="flex gap-0.5" aria-label=', '<div className="flex gap-0.5" role="img" aria-label=')
edit('src/app/(shop)/page.tsx', stars)
edit('src/app/(shop)/p/[slug]/page.tsx', stars)

# 3. send only the texts the browser needs (the full dictionary was ~25 KB of every page's HTML)
def shoplayout(s):
    if 'clientDict' in s: return s
    s = s.replace('import { DICT } from "@/lib/dict";', 'import { DICT } from "@/lib/dict";\nimport { clientDict } from "@/lib/client-dict";', 1)
    return s.replace('dict: DICT[lang] }', 'dict: clientDict(DICT[lang]) }', 1)
edit('src/app/(shop)/layout.tsx', shoplayout)
