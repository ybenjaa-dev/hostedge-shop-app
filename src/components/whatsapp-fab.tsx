import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

/** Desktop-only floating chat button (phones get the tab bar entry instead). */
export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-6 end-6 z-30 hidden items-center gap-2 border-2 border-ink bg-[#25D366] px-4 py-3 text-sm font-extrabold uppercase text-[#06200f] shadow-[4px_4px_0_var(--ink)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[6px_6px_0_var(--ink)] md:flex">
      <MessageCircle className="size-5" aria-hidden />{label}
    </a>
  );
}
