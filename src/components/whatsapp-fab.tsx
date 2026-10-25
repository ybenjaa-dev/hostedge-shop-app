import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3.5 text-sm font-extrabold text-[#06200f] shadow-[0_10px_24px_-8px_rgba(37,211,102,.8)] ring-2 ring-white transition hover:scale-105 active:scale-95 md:bottom-6">
      <MessageCircle className="size-6" aria-hidden /><span className="hidden sm:inline">{label}</span>
    </a>
  );
}
