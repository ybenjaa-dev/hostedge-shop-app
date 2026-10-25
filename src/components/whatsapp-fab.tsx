import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-12 place-items-center rounded-full border border-[var(--gold)] bg-[var(--panel)] text-[var(--gold)] shadow-lg transition hover:bg-[var(--gold)] hover:text-[#1d1418] md:bottom-6">
      <MessageCircle className="size-5" aria-hidden />
    </a>
  );
}
