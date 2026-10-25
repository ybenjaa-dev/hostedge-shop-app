import "server-only";
import { getEnv } from "@/lib/env";
import { ensureSchema } from "@/db/ensure-schema";
import { getSettings } from "@/lib/settings";
import { isSampleKey } from "@/lib/photo-match";
import { parseI18n } from "@/lib/i18n-core";

export type PhotoProduct = { id: string; slug: string; sku: string | null; name: string; names: string[]; status: string; image: string | null; count: number; sample: boolean };
export type PhotoCategory = { id: string; slug: string; name: string; image: string | null; sample: boolean };

export async function getPhotoOverview() {
  await ensureSchema();
  const db = getEnv().DB;
  const [prods, cats] = await db.batch([
    db.prepare(`SELECT p.id, p.slug, p.sku, p.name, p.status,
      (SELECT key FROM product_images i WHERE i.product_id = p.id ORDER BY i.position LIMIT 1) AS image,
      (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id) AS count,
      (SELECT COUNT(*) FROM product_images i WHERE i.product_id = p.id AND i.key NOT LIKE 'uploads/sample-%') AS real
      FROM products p ORDER BY p.created_at DESC LIMIT 500`),
    db.prepare("SELECT id, slug, name, image FROM categories ORDER BY position, name"),
  ]);
  const products: PhotoProduct[] = (prods!.results as { id: string; slug: string; sku: string | null; name: string; status: string; image: string | null; count: number; real: number }[]).map((p) => {
    const n = parseI18n(p.name);
    const names = Object.values(n).filter(Boolean) as string[];
    return { id: p.id, slug: p.slug, sku: p.sku, name: n.en || n.fr || n.ar || p.slug, names, status: p.status, image: p.image, count: p.count, sample: p.count === 0 || p.real === 0 };
  });
  const categories: PhotoCategory[] = (cats!.results as { id: string; slug: string; name: string; image: string | null }[]).map((c) => {
    const n = parseI18n(c.name);
    return { id: c.id, slug: c.slug, name: n.en || n.fr || n.ar || c.slug, image: c.image, sample: !c.image || isSampleKey(c.image) };
  });
  return { products, categories };
}

export type ChecklistItem = { id: string; label: string; detail: string; done: boolean; href: string; cta: string };

/** "Make it yours" — what is still placeholder in this store, with a link to where it is fixed. */
export async function getSetupChecklist(): Promise<{ items: ChecklistItem[]; done: number; total: number }> {
  const [s, { products, categories }] = await Promise.all([getSettings(), getPhotoOverview()]);
  const sampleProducts = products.filter((p) => p.sample && p.count > 0).length;
  const noPhoto = products.filter((p) => p.count === 0).length;
  const sampleCats = categories.filter((c) => c.sample).length;
  const heroSample = s.hero.slides.length === 0 || s.hero.slides.every((x) => !x.image || isSampleKey(x.image));
  const items: ChecklistItem[] = [
    { id: "logo", label: "Add your logo", detail: s.branding.logo && !s.branding.logo.startsWith("/brand/") ? "Logo uploaded." : s.branding.logo ? "A sample logo is in use — upload your own when you have one." : "The header shows your store name until you upload a logo.", done: !!s.branding.logo && !s.branding.logo.startsWith("/brand/"), href: "/admin/appearance", cta: "Upload logo" },
    { id: "hero", label: "Replace the hero image", detail: heroSample ? "The big banner on the home page still uses the placeholder illustration." : "Hero image set.", done: !heroSample, href: "/admin/appearance", cta: "Change hero" },
    { id: "categories", label: "Photos for your categories", detail: sampleCats ? `${sampleCats} of ${categories.length} categories still use a placeholder.` : "All categories have photos.", done: categories.length > 0 && sampleCats === 0, href: "/admin/media?tab=products#categories", cta: "Add photos" },
    { id: "products", label: "Photos for your products", detail: sampleProducts + noPhoto ? `${sampleProducts + noPhoto} of ${products.length} products still use a placeholder or have no photo.` : "All products have photos.", done: products.length > 0 && sampleProducts + noPhoto === 0, href: "/admin/media?tab=products", cta: "Add photos" },
    { id: "contact", label: "Phone & WhatsApp", detail: s.store.phones.some(Boolean) || s.store.whatsapp ? "Contact details set." : "Customers need a number to reach you (shown in the footer and the WhatsApp button).", done: s.store.phones.some(Boolean) || !!s.store.whatsapp, href: "/admin/settings", cta: "Add contact" },
  ];
  return { items, done: items.filter((i) => i.done).length, total: items.length };
}
