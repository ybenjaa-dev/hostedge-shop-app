#!/usr/bin/env python3
"""Idempotent: the storefront uses the owner's brand colour exactly as chosen (no automatic darkening)."""
import re
p = 'src/app/layout.tsx'
s = open(p).read()
n = re.sub(r"  const brand = readableOnWhite\(b\.primary\);[^\n]*\n", "  const brand = b.primary; // the owner's colour, exactly as chosen\n", s)
n = n.replace('import { onColor, readableOnWhite } from "@/lib/color";', 'import { onColor } from "@/lib/color";')
if n != s:
    open(p, 'w').write(n); print('patched', p)
