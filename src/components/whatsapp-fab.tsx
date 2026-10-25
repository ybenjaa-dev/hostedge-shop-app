import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-14 place-items-center rounded-full bg-[#1fa855] text-white shadow-[0_6px_18px_rgba(20,32,63,.35)] ring-2 ring-[#c9a24b] ring-offset-2 ring-offset-[#fbf6ea] transition hover:scale-105 active:scale-95 md:bottom-6">
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}
