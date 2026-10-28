import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requirePerm } from "@/lib/auth";
import { PageHeader, Panel } from "@/features/admin/components/ui";
import { getPhotoOverview } from "@/features/photos/queries";
import { PhotoManager } from "@/features/photos/photo-manager";
import { removeSampleData } from "@/features/photos/actions";
import { Tabs } from "@/features/settings/components/tabs";
import { MediaLibrary } from "@/features/media/media-library";
import { listMedia } from "@/features/media/server";
import { ActionButton } from "@/features/settings/components/action-button";

export const metadata = { title: "Media" };

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requirePerm("media.manage");
  const tab = (await searchParams).tab === "products" ? "products" : "library";
  const library = tab === "library" ? await listMedia({ limit: 60 }) : null;
  const overview = tab === "products" ? await getPhotoOverview() : null;
  const hasSample = !!overview && (overview.products.some((p) => p.sample && p.count > 0) || overview.categories.some((c) => c.sample && c.image));
  return (
    <>
      <PageHeader title="Media" sub="Every picture you have uploaded, in one place. Pictures are compressed to WebP with small thumbnails, and the same file is never stored twice." actions={<Link href="/admin/appearance" className="btn btn-outline btn-sm">Logo & hero image</Link>} />
      <Tabs base="/admin/media" current={tab} items={[{ id: "library", label: "Library" }, { id: "products", label: "Match photos to products" }]} />
      {library && <MediaLibrary mode="page" initial={library} />}
      {overview && <PhotoManager products={overview.products} categories={overview.categories} />}
      {user.role === "owner" && hasSample && (
        <Panel title="Start from a clean catalogue" className="mt-8">
          <p className="text-sm text-muted">Done adding your own products? Remove every product that still has only its placeholder illustration, along with its variants, reviews and offers, and the placeholder categories that end up empty. Products that already have orders are hidden instead of deleted. This can’t be undone — download a backup first if unsure.</p>
          <div className="mt-3"><ActionButton action={removeSampleData} confirm="Delete all sample products that only have placeholder illustrations?" className="btn btn-outline btn-sm text-danger"><Trash2 className="size-4" aria-hidden />Remove sample data</ActionButton></div>
        </Panel>
      )}
    </>
  );
}
