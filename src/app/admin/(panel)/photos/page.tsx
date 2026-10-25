import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { PageHeader, Panel } from "@/features/admin/components/ui";
import { getPhotoOverview } from "@/features/photos/queries";
import { PhotoManager } from "@/features/photos/photo-manager";
import { removeSampleData } from "@/features/photos/actions";
import { ActionButton } from "@/features/settings/components/action-button";

export const metadata = { title: "Photos" };

export default async function PhotosPage() {
  const user = await requireUser();
  const { products, categories } = await getPhotoOverview();
  const hasSample = products.some((p) => p.sample && p.count > 0) || categories.some((c) => c.sample && c.image);
  return (
    <>
      <PageHeader title="Photos" sub="Replace the placeholder illustrations with your own photos — one by one or a whole folder at a time." actions={<Link href="/admin/appearance" className="btn btn-outline btn-sm">Logo & hero image</Link>} />
      <PhotoManager products={products} categories={categories} />
      {user.role === "owner" && hasSample && (
        <Panel title="Start from a clean catalogue" className="mt-8">
          <p className="text-sm text-muted">Done adding your own products? Remove every product that still has only its placeholder illustration, along with its variants, reviews and offers, and the placeholder categories that end up empty. Products that already have orders are hidden instead of deleted. This can’t be undone — download a backup first if unsure.</p>
          <div className="mt-3"><ActionButton action={removeSampleData} confirm="Delete all sample products that only have placeholder illustrations?" className="btn btn-outline btn-sm text-danger"><Trash2 className="size-4" aria-hidden />Remove sample data</ActionButton></div>
        </Panel>
      )}
    </>
  );
}
