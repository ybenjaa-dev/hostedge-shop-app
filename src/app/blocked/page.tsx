import { ShieldOff } from "lucide-react";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Access restricted", robots: { index: false, follow: false } };

export default async function BlockedPage() {
  const s = await getSettings();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-center text-ink">
      <div className="max-w-sm">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-danger/10 text-danger"><ShieldOff className="size-8" aria-hidden /></span>
        <h1 className="display mt-5 text-2xl font-extrabold">Access restricted</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">This device can’t use {s.store.name} right now. If you think this is a mistake, please contact the store.</p>
        {s.store.whatsapp && <a href={`https://wa.me/${s.store.whatsapp.replace(/\D/g, "")}`} className="btn btn-outline mt-5" rel="noopener noreferrer">Contact the store</a>}
      </div>
    </main>
  );
}
