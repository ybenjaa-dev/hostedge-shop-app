#!/usr/bin/env python3
"""Idempotently adds the cross-sell / upsell dictionary keys after "offer.unitMany" in each language block of src/lib/dict.ts."""
import re,sys
p='src/lib/dict.ts'
s=open(p).read()
if '"together.title"' in s: print('already'); sys.exit(0)
add={
 'en':'"together.title": "Frequently bought together", "together.this": "this item", "together.total": "Total for {n} items", "together.hint": "Ticked items are added to the same order.", "upsell.kicker": "Your order is placed ✓", "upsell.title": "Add it to your order — one tap", "upsell.sub": "Special price, only right now. You pay on delivery with the rest.", "upsell.add": "Add to my order", "upsell.skip": "No thanks, continue", "upsell.off": "−{pct}%", "upsell.added": "Added! Your new total is {total}.", "upsell.freeShip": "Free delivery unlocked",',
 'fr':'"together.title": "Souvent achetés ensemble", "together.this": "cet article", "together.total": "Total pour {n} articles", "together.hint": "Les articles cochés sont ajoutés à la même commande.", "upsell.kicker": "Commande enregistrée ✓", "upsell.title": "Ajoutez-le à votre commande en un clic", "upsell.sub": "Prix spécial, uniquement maintenant. Vous payez à la livraison avec le reste.", "upsell.add": "Ajouter à ma commande", "upsell.skip": "Non merci, continuer", "upsell.off": "−{pct} %", "upsell.added": "Ajouté ! Nouveau total : {total}.", "upsell.freeShip": "Livraison offerte débloquée",',
 'ar':'"together.title": "يُشترى معاً غالباً", "together.this": "هذا المنتج", "together.total": "المجموع لـ {n} منتجات", "together.hint": "المنتجات المحددة تُضاف إلى نفس الطلب.", "upsell.kicker": "تم تسجيل طلبك ✓", "upsell.title": "أضفه إلى طلبك بضغطة واحدة", "upsell.sub": "سعر خاص الآن فقط. تدفع عند الاستلام مع باقي الطلب.", "upsell.add": "أضف إلى طلبي", "upsell.skip": "لا شكراً، متابعة", "upsell.off": "−{pct}٪", "upsell.added": "تمت الإضافة! المجموع الجديد {total}.", "upsell.freeShip": "تم تفعيل التوصيل المجاني",',
}
m=list(re.finditer(r'"offer\.unitMany": "[^"]*",',s))
assert len(m)==3,len(m)
for lang,mm in zip(['en','fr','ar'],reversed(m)) if False else zip(['ar','fr','en'],reversed(m)):
    s=s[:mm.end()]+' '+add[lang]+s[mm.end():]
open(p,'w').write(s); print('injected')
