import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="cut fixed bottom-24 end-4 z-30 grid size-12 place-items-center bg-[var(--lime)] text-[#0d0d0d] shadow-lg transition hover:scale-105 md:bottom-6">
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
