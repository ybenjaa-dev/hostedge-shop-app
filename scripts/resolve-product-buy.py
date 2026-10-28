#!/usr/bin/env python3
"""Merge helper for themed storefront branches: keep the branch's own class names in product-buy.tsx while taking the base logic
(always-visible form, sticky bar that hides while the form is on screen). Resolves the three known conflict hunks."""
import re,sys
p='src/features/checkout/components/product-buy.tsx'
s=open(p).read()
def cls(line):
    m=re.search(r'className="([^"]*)"',line); return m.group(1) if m else None
def fix(m):
    ours,theirs=m.group(1),m.group(2)   # ours = the branch, theirs = base
    if '<section id="order"' in theirs:
        out=theirs.split('\n')
        oc=cls(ours.split('\n')[1]) if len(ours.split('\n'))>1 else None
        if oc: out[1]=re.sub(r'className="[^"]*"',f'className="{oc}"',out[1],1)
        return '\n'.join(out)
    if '<dialog' in theirs:
        t=theirs.split('\n'); o=ours.split('\n')
        return t[0]+'\n'+o[1]
    if 'fixed inset-x-0 bottom-0' in theirs:
        oc=cls(ours)
        dyn='${formInView || sheetOpen ? "pointer-events-none translate-y-full opacity-0" : ""}'
        return f'      <div aria-hidden={{formInView || sheetOpen}} className={{`{oc} transition duration-200 {dyn}`}}>'
    raise SystemExit('unknown conflict hunk:\n'+ours[:200])
s2=re.sub(r'<<<<<<< [^\n]*\n(.*?)=======\n(.*?)>>>>>>> [^\n]*\n',lambda m:fix(m).rstrip('\n')+'\n',s,flags=re.S)
# the regex consumed the trailing newline of each side; normalise accidental blank lines
open(p,'w').write(s2)
print('resolved product-buy')
