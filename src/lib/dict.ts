import type { Lang } from "./i18n-core";

const en = {
  "nav.home": "Home", "nav.shop": "Shop", "nav.track": "Track order", "nav.search": "Search products", "nav.cart": "Cart", "nav.menu": "Menu", "nav.language": "Language",
  "home.categories": "Shop by category", "home.featured": "Featured", "home.bestsellers": "Best sellers", "home.reviews": "Loved by customers", "home.viewAll": "View all", "home.shopNow": "Shop now",
  "trust.cod": "Pay on delivery", "trust.returns": "Free returns", "trust.delivery": "Fast delivery",
  "shop.title": "All products", "shop.results": "{n} products", "shop.empty": "No products match your filters.", "shop.clear": "Clear filters", "shop.filters": "Filters", "shop.sort": "Sort",
  "shop.sort.new": "Newest", "shop.sort.price_asc": "Price: low to high", "shop.sort.price_desc": "Price: high to low", "shop.sort.popular": "Most popular",
  "shop.category": "Category", "shop.allCategories": "All categories", "shop.price": "Price", "shop.min": "Min", "shop.max": "Max", "shop.inStock": "In stock only", "shop.apply": "Apply", "shop.prev": "Previous", "shop.next": "Next", "shop.page": "Page {p} of {n}", "shop.searchPh": "Search…",
  "p.soldOut": "Sold out", "p.inStock": "In stock", "p.onlyLeft": "Only {n} left", "p.save": "Save {pct}%", "p.reviews": "{n} reviews", "p.noReviews": "No reviews yet", "p.description": "Description", "p.details": "Details", "p.related": "You may also like", "p.qty": "Quantity", "p.select": "Select {opt}", "p.chooseOptions": "Choose an option",
  "p.writeReview": "Write a review", "p.yourName": "Your name", "p.rating": "Rating", "p.yourReview": "Your review", "p.submitReview": "Send review", "p.reviewThanks": "Thank you! Your review will appear after moderation.",
  "cod.orderNow": "Order now — pay on delivery", "cod.orderNowShort": "Order now", "cod.payOnDelivery": "Pay on delivery", "cod.title": "Complete your order", "cod.fullName": "Full name", "cod.phone": "Phone (WhatsApp)", "cod.city": "City", "cod.cityPh": "Search your city…", "cod.address": "Address", "cod.notes": "Notes (optional)", "cod.confirm": "Confirm order", "cod.sending": "Sending…", "cod.close": "Close",
  "cod.subtotal": "Subtotal", "cod.shipping": "Shipping", "cod.free": "Free", "cod.discount": "Discount", "cod.codFee": "Cash on delivery fee", "cod.tax": "Tax", "cod.total": "Total to pay on delivery", "cod.totalPlain": "Total",
  "cod.bundle": "Buy {n}, save {pct}%", "cod.freeShipHint": "Add {amount} more for free shipping", "cod.freeShipOk": "You get free shipping!", "cod.noCod": "Cash on delivery isn't available in this city.", "cod.coupon": "Coupon code", "cod.applyCoupon": "Apply",
  "cod.err.name": "Please enter your full name", "cod.err.phone": "Enter a valid phone number", "cod.err.city": "Choose your city", "cod.err.address": "Please enter your address", "cod.err.generic": "Something went wrong. Please try again.",
  "cod.err.blocked": "We can't process this order. Please contact us.", "cod.err.rate": "Too many attempts. Please try again later.", "cod.err.stock": "Sorry, not enough stock for this quantity.", "cod.err.unavailable": "This product is no longer available.", "cod.err.codcity": "Cash on delivery isn't available in this city.", "cod.err.variant": "Please choose all options",
  "cod.dupe": "We already received your order #{n}. We'll call you soon.", "cod.success": "Order placed!",
  "cart.title": "Your cart", "cart.empty": "Your cart is empty", "cart.continue": "Continue shopping", "cart.add": "Add to cart", "cart.added": "Added to cart", "cart.checkout": "Checkout", "cart.remove": "Remove", "cart.view": "View cart", "cart.payment": "Payment method", "cart.cod": "Cash on delivery", "cart.items": "{n} items",
  "checkout.title": "Checkout", "checkout.summary": "Order summary", "checkout.place": "Place order", "checkout.contact": "Delivery details",
  "done.title": "Thank you, your order is placed!", "done.number": "Order number", "done.pending": "We'll call or WhatsApp you shortly to confirm your order.", "done.total": "Pay on delivery", "done.track": "Track this order", "done.whatsapp": "Confirm on WhatsApp", "done.continue": "Continue shopping", "done.items": "Items",
  "track.title": "Track your order", "track.number": "Order number", "track.phone": "Phone number", "track.find": "Find my order", "track.notfound": "We couldn't find an order with these details.", "track.status": "Status", "track.carrier": "Carrier", "track.tracking": "Tracking number", "track.followCarrier": "Follow on carrier website", "track.history": "History", "track.placed": "Placed on {date}",
  "footer.contact": "Contact", "footer.pages": "Information", "footer.follow": "Follow us", "footer.rights": "All rights reserved.", "footer.hours": "Working hours",
  "common.loading": "Loading…", "common.error": "Something went wrong", "common.retry": "Try again", "common.back": "Back", "common.search": "Search", "common.save": "Save", "common.cancel": "Cancel", "common.whatsapp": "WhatsApp us", "common.call": "Call", "common.skip": "Skip to content", "common.notFound": "Page not found", "common.goHome": "Back to home",
  "how.title": "How it works", "how.s1": "Pick it", "how.s1d": "Choose your product and tap Order now.", "how.s2": "We call you", "how.s2d": "A 20-second confirmation on WhatsApp or phone.", "how.s3": "Pay on delivery", "how.s3d": "Check your parcel, then pay the courier in cash.",
  "p.delivery": "Delivery & payment", "p.deliveryText": "Pay the courier in cash when you receive your order. Delivery in 2–4 days. Not happy? Free returns.", "p.shareWa": "Ask on WhatsApp", "home.hero.cta": "Shop the drop", "shop.all": "All", "home.rank": "Top picks",
} as const;

export type DictKey = keyof typeof en;
type D = Record<DictKey, string>;

const fr: D = {
  "nav.home": "Accueil", "nav.shop": "Boutique", "nav.track": "Suivre ma commande", "nav.search": "Rechercher", "nav.cart": "Panier", "nav.menu": "Menu", "nav.language": "Langue",
  "home.categories": "Acheter par catégorie", "home.featured": "Sélection", "home.bestsellers": "Meilleures ventes", "home.reviews": "Ils nous font confiance", "home.viewAll": "Tout voir", "home.shopNow": "Acheter",
  "trust.cod": "Paiement à la livraison", "trust.returns": "Retours gratuits", "trust.delivery": "Livraison rapide",
  "shop.title": "Tous les produits", "shop.results": "{n} produits", "shop.empty": "Aucun produit ne correspond.", "shop.clear": "Effacer les filtres", "shop.filters": "Filtres", "shop.sort": "Trier",
  "shop.sort.new": "Nouveautés", "shop.sort.price_asc": "Prix croissant", "shop.sort.price_desc": "Prix décroissant", "shop.sort.popular": "Les plus populaires",
  "shop.category": "Catégorie", "shop.allCategories": "Toutes les catégories", "shop.price": "Prix", "shop.min": "Min", "shop.max": "Max", "shop.inStock": "En stock uniquement", "shop.apply": "Appliquer", "shop.prev": "Précédent", "shop.next": "Suivant", "shop.page": "Page {p} sur {n}", "shop.searchPh": "Rechercher…",
  "p.soldOut": "Épuisé", "p.inStock": "En stock", "p.onlyLeft": "Plus que {n}", "p.save": "−{pct}%", "p.reviews": "{n} avis", "p.noReviews": "Pas encore d'avis", "p.description": "Description", "p.details": "Détails", "p.related": "Vous aimerez aussi", "p.qty": "Quantité", "p.select": "Choisir {opt}", "p.chooseOptions": "Choisissez une option",
  "p.writeReview": "Donner un avis", "p.yourName": "Votre nom", "p.rating": "Note", "p.yourReview": "Votre avis", "p.submitReview": "Envoyer", "p.reviewThanks": "Merci ! Votre avis sera publié après modération.",
  "cod.orderNow": "Commander — payer à la livraison", "cod.orderNowShort": "Commander", "cod.payOnDelivery": "Paiement à la livraison", "cod.title": "Finalisez votre commande", "cod.fullName": "Nom complet", "cod.phone": "Téléphone (WhatsApp)", "cod.city": "Ville", "cod.cityPh": "Cherchez votre ville…", "cod.address": "Adresse", "cod.notes": "Remarques (facultatif)", "cod.confirm": "Confirmer la commande", "cod.sending": "Envoi…", "cod.close": "Fermer",
  "cod.subtotal": "Sous-total", "cod.shipping": "Livraison", "cod.free": "Gratuite", "cod.discount": "Remise", "cod.codFee": "Frais de paiement à la livraison", "cod.tax": "Taxe", "cod.total": "Total à payer à la livraison", "cod.totalPlain": "Total",
  "cod.bundle": "Achetez {n}, économisez {pct}%", "cod.freeShipHint": "Ajoutez {amount} pour la livraison gratuite", "cod.freeShipOk": "Livraison gratuite !", "cod.noCod": "Le paiement à la livraison n'est pas disponible dans cette ville.", "cod.coupon": "Code promo", "cod.applyCoupon": "Appliquer",
  "cod.err.name": "Entrez votre nom complet", "cod.err.phone": "Numéro de téléphone invalide", "cod.err.city": "Choisissez votre ville", "cod.err.address": "Entrez votre adresse", "cod.err.generic": "Une erreur est survenue. Réessayez.",
  "cod.err.blocked": "Impossible de traiter cette commande. Contactez-nous.", "cod.err.rate": "Trop de tentatives. Réessayez plus tard.", "cod.err.stock": "Stock insuffisant pour cette quantité.", "cod.err.unavailable": "Ce produit n'est plus disponible.", "cod.err.codcity": "Paiement à la livraison indisponible dans cette ville.", "cod.err.variant": "Choisissez toutes les options",
  "cod.dupe": "Nous avons déjà reçu votre commande n°{n}. Nous vous appellerons bientôt.", "cod.success": "Commande envoyée !",
  "cart.title": "Votre panier", "cart.empty": "Votre panier est vide", "cart.continue": "Continuer mes achats", "cart.add": "Ajouter au panier", "cart.added": "Ajouté au panier", "cart.checkout": "Commander", "cart.remove": "Retirer", "cart.view": "Voir le panier", "cart.payment": "Mode de paiement", "cart.cod": "Paiement à la livraison", "cart.items": "{n} articles",
  "checkout.title": "Commande", "checkout.summary": "Récapitulatif", "checkout.place": "Passer la commande", "checkout.contact": "Informations de livraison",
  "done.title": "Merci, votre commande est enregistrée !", "done.number": "Numéro de commande", "done.pending": "Nous vous appellerons ou vous écrirons sur WhatsApp pour confirmer.", "done.total": "À payer à la livraison", "done.track": "Suivre cette commande", "done.whatsapp": "Confirmer sur WhatsApp", "done.continue": "Continuer mes achats", "done.items": "Articles",
  "track.title": "Suivre ma commande", "track.number": "Numéro de commande", "track.phone": "Numéro de téléphone", "track.find": "Trouver ma commande", "track.notfound": "Aucune commande trouvée avec ces informations.", "track.status": "Statut", "track.carrier": "Transporteur", "track.tracking": "Numéro de suivi", "track.followCarrier": "Suivre chez le transporteur", "track.history": "Historique", "track.placed": "Passée le {date}",
  "footer.contact": "Contact", "footer.pages": "Informations", "footer.follow": "Suivez-nous", "footer.rights": "Tous droits réservés.", "footer.hours": "Horaires",
  "common.loading": "Chargement…", "common.error": "Une erreur est survenue", "common.retry": "Réessayer", "common.back": "Retour", "common.search": "Rechercher", "common.save": "Enregistrer", "common.cancel": "Annuler", "common.whatsapp": "Écrivez-nous sur WhatsApp", "common.call": "Appeler", "common.skip": "Aller au contenu", "common.notFound": "Page introuvable", "common.goHome": "Retour à l'accueil",
  "how.title": "Comment ça marche", "how.s1": "Choisissez", "how.s1d": "Choisissez votre produit et touchez Commander.", "how.s2": "On vous appelle", "how.s2d": "Confirmation en 20 secondes par WhatsApp ou téléphone.", "how.s3": "Payez à la livraison", "how.s3d": "Vérifiez votre colis puis payez le livreur en espèces.", "p.delivery": "Livraison & paiement", "p.deliveryText": "Payez le livreur en espèces à la réception. Livraison en 2 à 4 jours. Pas satisfait ? Retours gratuits.", "p.shareWa": "Poser une question sur WhatsApp", "home.hero.cta": "Voir la sélection", "shop.all": "Tout", "home.rank": "Les plus demandés",
};

const ar: D = {
  "nav.home": "الرئيسية", "nav.shop": "المتجر", "nav.track": "تتبع الطلب", "nav.search": "ابحث عن منتج", "nav.cart": "السلة", "nav.menu": "القائمة", "nav.language": "اللغة",
  "home.categories": "تسوّق حسب الفئة", "home.featured": "منتجات مميزة", "home.bestsellers": "الأكثر مبيعاً", "home.reviews": "آراء عملائنا", "home.viewAll": "عرض الكل", "home.shopNow": "تسوّق الآن",
  "trust.cod": "الدفع عند الاستلام", "trust.returns": "إرجاع مجاني", "trust.delivery": "توصيل سريع",
  "shop.title": "كل المنتجات", "shop.results": "{n} منتج", "shop.empty": "لا توجد منتجات مطابقة.", "shop.clear": "مسح الفلاتر", "shop.filters": "تصفية", "shop.sort": "ترتيب",
  "shop.sort.new": "الأحدث", "shop.sort.price_asc": "السعر: من الأقل", "shop.sort.price_desc": "السعر: من الأعلى", "shop.sort.popular": "الأكثر طلباً",
  "shop.category": "الفئة", "shop.allCategories": "كل الفئات", "shop.price": "السعر", "shop.min": "الأدنى", "shop.max": "الأقصى", "shop.inStock": "المتوفر فقط", "shop.apply": "تطبيق", "shop.prev": "السابق", "shop.next": "التالي", "shop.page": "صفحة {p} من {n}", "shop.searchPh": "ابحث…",
  "p.soldOut": "نفدت الكمية", "p.inStock": "متوفر", "p.onlyLeft": "بقي {n} فقط", "p.save": "وفّر {pct}%", "p.reviews": "{n} تقييم", "p.noReviews": "لا توجد تقييمات بعد", "p.description": "الوصف", "p.details": "التفاصيل", "p.related": "قد يعجبك أيضاً", "p.qty": "الكمية", "p.select": "اختر {opt}", "p.chooseOptions": "اختر خياراً",
  "p.writeReview": "اكتب تقييماً", "p.yourName": "اسمك", "p.rating": "التقييم", "p.yourReview": "رأيك", "p.submitReview": "إرسال", "p.reviewThanks": "شكراً! سيظهر تقييمك بعد المراجعة.",
  "cod.orderNow": "اطلب الآن — الدفع عند الاستلام", "cod.orderNowShort": "اطلب الآن", "cod.payOnDelivery": "الدفع عند الاستلام", "cod.title": "أكمل طلبك", "cod.fullName": "الاسم الكامل", "cod.phone": "رقم الهاتف (واتساب)", "cod.city": "المدينة", "cod.cityPh": "ابحث عن مدينتك…", "cod.address": "العنوان", "cod.notes": "ملاحظات (اختياري)", "cod.confirm": "تأكيد الطلب", "cod.sending": "جارٍ الإرسال…", "cod.close": "إغلاق",
  "cod.subtotal": "المجموع الفرعي", "cod.shipping": "الشحن", "cod.free": "مجاني", "cod.discount": "الخصم", "cod.codFee": "رسوم الدفع عند الاستلام", "cod.tax": "الضريبة", "cod.total": "المبلغ المطلوب عند الاستلام", "cod.totalPlain": "الإجمالي",
  "cod.bundle": "اشترِ {n} ووفّر {pct}%", "cod.freeShipHint": "أضف {amount} للحصول على شحن مجاني", "cod.freeShipOk": "حصلت على شحن مجاني!", "cod.noCod": "الدفع عند الاستلام غير متاح في هذه المدينة.", "cod.coupon": "كود الخصم", "cod.applyCoupon": "تطبيق",
  "cod.err.name": "أدخل اسمك الكامل", "cod.err.phone": "أدخل رقم هاتف صحيح", "cod.err.city": "اختر مدينتك", "cod.err.address": "أدخل عنوانك", "cod.err.generic": "حدث خطأ. حاول مرة أخرى.",
  "cod.err.blocked": "لا يمكن معالجة هذا الطلب. يرجى التواصل معنا.", "cod.err.rate": "محاولات كثيرة. حاول لاحقاً.", "cod.err.stock": "الكمية المطلوبة غير متوفرة.", "cod.err.unavailable": "هذا المنتج لم يعد متوفراً.", "cod.err.codcity": "الدفع عند الاستلام غير متاح في هذه المدينة.", "cod.err.variant": "يرجى اختيار كل الخيارات",
  "cod.dupe": "لقد استلمنا طلبك رقم {n} مسبقاً وسنتصل بك قريباً.", "cod.success": "تم إرسال الطلب!",
  "cart.title": "سلة التسوق", "cart.empty": "سلتك فارغة", "cart.continue": "متابعة التسوق", "cart.add": "أضف إلى السلة", "cart.added": "تمت الإضافة إلى السلة", "cart.checkout": "إتمام الطلب", "cart.remove": "إزالة", "cart.view": "عرض السلة", "cart.payment": "طريقة الدفع", "cart.cod": "الدفع عند الاستلام", "cart.items": "{n} منتجات",
  "checkout.title": "إتمام الطلب", "checkout.summary": "ملخص الطلب", "checkout.place": "تأكيد الطلب", "checkout.contact": "معلومات التوصيل",
  "done.title": "شكراً لك، تم تسجيل طلبك!", "done.number": "رقم الطلب", "done.pending": "سنتصل بك أو نراسلك عبر واتساب قريباً لتأكيد الطلب.", "done.total": "المبلغ عند الاستلام", "done.track": "تتبع هذا الطلب", "done.whatsapp": "أكّد عبر واتساب", "done.continue": "متابعة التسوق", "done.items": "المنتجات",
  "track.title": "تتبع طلبك", "track.number": "رقم الطلب", "track.phone": "رقم الهاتف", "track.find": "ابحث عن طلبي", "track.notfound": "لم نجد طلباً بهذه المعلومات.", "track.status": "الحالة", "track.carrier": "شركة الشحن", "track.tracking": "رقم التتبع", "track.followCarrier": "تتبع على موقع الشركة", "track.history": "السجل", "track.placed": "تم الطلب في {date}",
  "footer.contact": "تواصل معنا", "footer.pages": "معلومات", "footer.follow": "تابعنا", "footer.rights": "جميع الحقوق محفوظة.", "footer.hours": "ساعات العمل",
  "common.loading": "جارٍ التحميل…", "common.error": "حدث خطأ", "common.retry": "إعادة المحاولة", "common.back": "رجوع", "common.search": "بحث", "common.save": "حفظ", "common.cancel": "إلغاء", "common.whatsapp": "راسلنا على واتساب", "common.call": "اتصل", "common.skip": "انتقل إلى المحتوى", "common.notFound": "الصفحة غير موجودة", "common.goHome": "العودة للرئيسية",
  "how.title": "كيف نعمل", "how.s1": "اختر", "how.s1d": "اختر منتجك واضغط اطلب الآن.", "how.s2": "نتصل بك", "how.s2d": "تأكيد في 20 ثانية عبر واتساب أو الهاتف.", "how.s3": "ادفع عند الاستلام", "how.s3d": "افحص طردك ثم ادفع للمندوب نقداً.", "p.delivery": "التوصيل والدفع", "p.deliveryText": "ادفع نقداً للمندوب عند استلام طلبك. التوصيل خلال 2 إلى 4 أيام. غير راضٍ؟ إرجاع مجاني.", "p.shareWa": "اسأل عبر واتساب", "home.hero.cta": "تسوّق الآن", "shop.all": "الكل", "home.rank": "الأكثر طلباً",
};

export const DICT: Record<Lang, D> = { en: en as unknown as D, fr, ar };

export type TFn = (key: DictKey, vars?: Record<string, string | number>) => string;
export function makeT(lang: Lang): TFn {
  const d = DICT[lang];
  return (key, vars) => {
    let s = d[key] ?? DICT.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
