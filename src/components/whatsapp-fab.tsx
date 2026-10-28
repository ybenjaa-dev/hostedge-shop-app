import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 flex items-center gap-2 rounded-full bg-[#1f7a4a] px-4 py-3 text-sm font-medium text-white shadow-lg transition hover:bg-[#186a3f] lg:bottom-6">
      <MessageCircle className="size-5" aria-hidden /><span className="hidden sm:inline">{label}</span>
    </a>
  );
}
