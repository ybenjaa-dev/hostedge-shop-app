import { ProductGridSkeleton } from "@/features/catalog/components/product-card";
export default function Loading() {
  return <div className="mx-auto max-w-7xl px-4 py-8" aria-busy><div className="skeleton mb-6 h-9 w-56" /><ProductGridSkeleton /></div>;
}
