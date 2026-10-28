#!/usr/bin/env python3
"""Idempotent: shop layout (themed on every storefront) refuses blocked visitors."""
p = 'src/app/(shop)/layout.tsx'
s = open(p).read()
if 'assertNotBlocked' not in s:
    s = s.replace('import { getT }', 'import { assertNotBlocked } from "@/features/visitors/guard";\nimport { getT }', 1)
    s = s.replace('  if (!s.setupDone) redirect("/setup");', '  if (!s.setupDone) redirect("/setup");\n  await assertNotBlocked();', 1)
    open(p, 'w').write(s); print('patched', p)
