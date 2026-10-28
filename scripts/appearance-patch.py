#!/usr/bin/env python3
"""Idempotent: the root layout applies the owner's look & feel options (roundness, width, background, text size, cases)."""
p = 'src/app/layout.tsx'
s = open(p).read()
if 'getExtra' not in s:
    s = s.replace('import { LangMetaProvider }', 'import { extraCss } from "@/\u006cib/appearance-extra";\nimport { getExtra } from "@/lib/appearance-extra-server";\nimport { LangMetaProvider }', 1)
    s = s.replace('  const ui = await getLangUi();', '  const ui = await getLangUi();\n  const extra = extraCss(await getExtra());', 1)
    s = s.replace('<style dangerouslySetInnerHTML={{ __html: HIDE_CSS }} />', '<style dangerouslySetInnerHTML={{ __html: HIDE_CSS }} />\n        {extra && <style dangerouslySetInnerHTML={{ __html: extra }} />}', 1)
    open(p, 'w').write(s); print('patched', p)
