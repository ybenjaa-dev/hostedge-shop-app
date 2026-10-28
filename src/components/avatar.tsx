import { fileUrl } from "@/lib/storage";

const SIZES: Record<string, string> = { xs: "size-6 rounded-md text-[0.65rem]", sm: "size-7 rounded-lg text-xs", md: "size-9 rounded-xl text-sm", lg: "size-14 rounded-2xl text-xl", xl: "size-24 rounded-3xl text-4xl" };

/** A person's picture: always a square with soft rounded corners; their initial on the brand colour when there is no photo. */
export function Avatar({ name, src, size = "md", className = "" }: { name: string; src?: string | null; size?: keyof typeof SIZES; className?: string }) {
  const box = `${SIZES[size]} shrink-0 ${className}`;
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={fileUrl(src)} alt="" width={96} height={96} className={`${box} bg-sunken object-cover`} />;
  }
  return <span aria-hidden className={`${box} grid place-items-center bg-brand font-extrabold text-brand-ink`}>{(name.trim().slice(0, 1) || "?").toUpperCase()}</span>;
}
