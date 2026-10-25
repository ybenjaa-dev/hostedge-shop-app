import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105 active:scale-95 md:bottom-6">
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
