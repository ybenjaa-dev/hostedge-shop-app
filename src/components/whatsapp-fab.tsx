import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-3 z-30 flex items-center gap-2 border border-[#128c4a] bg-[#1fa855] px-3.5 py-3 text-sm font-bold text-white shadow-md hover:bg-[#188f47] md:bottom-5">
      <MessageCircle className="size-5" aria-hidden /><span className="hidden sm:inline">{label}</span>
    </a>
  );
}
