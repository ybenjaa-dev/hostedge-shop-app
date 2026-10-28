#!/usr/bin/env python3
"""Idempotently adds groups of dictionary keys (search / PWA / privacy / push / filters) after "upsell.freeShip" in each language block of src/lib/dict.ts."""
import re,sys
p='src/lib/dict.ts'
s=open(p).read()
G={
 'shop.filter.active':{
  'en':{'shop.filter.active':'Active filters','shop.filter.clearAll':'Clear all','search.suggest.products':'Products','search.suggest.categories':'Categories','search.suggest.all':'See all results for “{q}”','search.suggest.recent':'Recent searches','search.suggest.none':'No match — try another word','search.suggest.clear':'Clear'},
  'fr':{'shop.filter.active':'Filtres actifs','shop.filter.clearAll':'Tout effacer','search.suggest.products':'Produits','search.suggest.categories':'Catégories','search.suggest.all':'Voir tous les résultats pour « {q} »','search.suggest.recent':'Recherches récentes','search.suggest.none':'Aucun résultat — essayez un autre mot','search.suggest.clear':'Effacer'},
  'ar':{'shop.filter.active':'الفلاتر المفعّلة','shop.filter.clearAll':'مسح الكل','search.suggest.products':'المنتجات','search.suggest.categories':'الفئات','search.suggest.all':'عرض كل النتائج لـ «{q}»','search.suggest.recent':'عمليات البحث الأخيرة','search.suggest.none':'لا نتائج — جرّب كلمة أخرى','search.suggest.clear':'مسح'}},
 'pwa.install':{
  'en':{'pwa.install':'Install the app','pwa.installSub':'Faster, works offline, one tap from your home screen.','pwa.iosHint':'Tap Share, then “Add to Home Screen”.','pwa.later':'Not now','pwa.offline.title':'You are offline','pwa.offline.sub':'Check your connection — pages you already visited are still available.','pwa.offline.retry':'Try again'},
  'fr':{'pwa.install':"Installer l'application",'pwa.installSub':"Plus rapide, fonctionne hors ligne, à un clic depuis votre écran d'accueil.",'pwa.iosHint':"Touchez Partager puis « Sur l'écran d'accueil ».",'pwa.later':'Plus tard','pwa.offline.title':'Vous êtes hors ligne','pwa.offline.sub':'Vérifiez votre connexion — les pages déjà visitées restent disponibles.','pwa.offline.retry':'Réessayer'},
  'ar':{'pwa.install':'ثبّت التطبيق','pwa.installSub':'أسرع، يعمل بدون إنترنت، بنقرة واحدة من شاشتك الرئيسية.','pwa.iosHint':'اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».','pwa.later':'لاحقاً','pwa.offline.title':'أنت غير متصل','pwa.offline.sub':'تحقق من اتصالك — الصفحات التي زرتها ما تزال متاحة.','pwa.offline.retry':'إعادة المحاولة'}},
 'privacy.title':{
  'en':{'privacy.title':'Your privacy','privacy.text':'We keep anonymous visit data — country, city and device — to keep the shop safe, stop fake orders and show the offers you ask for. Nothing is sold.','privacy.accept':'Accept','privacy.decline':'Decline','push.ask':'Get order updates & offers','push.askSub':'A quiet notification when your order moves or a deal drops. Turn it off any time.','push.on':'Turn on','push.thanks':"You're in — we'll keep it useful.",'push.denied':'Notifications are blocked in your browser settings.'},
  'fr':{'privacy.title':'Votre vie privée','privacy.text':"Nous conservons des données de visite anonymes — pays, ville et appareil — pour sécuriser la boutique, éviter les fausses commandes et afficher les offres demandées. Rien n'est vendu.",'privacy.accept':'Accepter','privacy.decline':'Refuser','push.ask':'Recevoir le suivi de commande et les offres','push.askSub':"Une notification discrète quand votre commande avance ou qu'une offre arrive. Désactivable à tout moment.",'push.on':'Activer','push.thanks':"C'est activé — on reste utile.",'push.denied':'Les notifications sont bloquées dans les réglages de votre navigateur.'},
  'ar':{'privacy.title':'خصوصيتك','privacy.text':'نحتفظ ببيانات زيارة مجهولة — الدولة والمدينة والجهاز — لتأمين المتجر ومنع الطلبات الوهمية وعرض العروض التي تطلبها. لا نبيع أي شيء.','privacy.accept':'موافق','privacy.decline':'رفض','push.ask':'احصل على تحديثات الطلب والعروض','push.askSub':'إشعار هادئ عند تحرّك طلبك أو نزول عرض. يمكنك الإيقاف في أي وقت.','push.on':'تفعيل','push.thanks':'تم التفعيل — سنرسل ما يفيدك فقط.','push.denied':'الإشعارات محظورة في إعدادات المتصفح.'}},
}
def lit(k,v): return f'"{k}": "{v.replace(chr(34),chr(92)+chr(34))}"'
anchors=list(re.finditer(r'"upsell\.freeShip": "[^"]*",',s))
assert len(anchors)==3,len(anchors)
changed=False
for marker,langs in G.items():
    if f'"{marker}"' in s: continue
    anchors=list(re.finditer(r'"upsell\.freeShip": "[^"]*",',s))
    for lang,mm in zip(['ar','fr','en'],reversed(anchors)):
        add=' '+', '.join(lit(k,v) for k,v in langs[lang].items())+','
        s=s[:mm.end()]+add+s[mm.end():]
    changed=True
open(p,'w').write(s); print('injected' if changed else 'already')
