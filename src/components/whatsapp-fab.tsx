import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-12 place-items-center rounded-full border-2 border-ink bg-[#25d366] text-[#052e16] shadow-[3px_3px_0_var(--ink)] transition hover:-translate-y-0.5 md:bottom-6">
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
