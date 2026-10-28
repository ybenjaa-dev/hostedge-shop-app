import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-3 z-30 flex items-center gap-2 rounded-full border-2 border-[#1f3d2b] bg-[#25d366] px-3.5 py-3 text-sm font-bold text-[#0b2e1a] shadow-[3px_3px_0_#1f3d2b] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#1f3d2b] md:bottom-5">
      <MessageCircle className="size-5" aria-hidden /><span className="hidden sm:inline">{label}</span>
    </a>
  );
}
