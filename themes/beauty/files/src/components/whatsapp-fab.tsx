import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-14 place-items-center rounded-full bg-[#2fae66] text-white shadow-[0_14px_30px_-10px_rgba(47,174,102,.8)] transition hover:scale-105 active:scale-95 md:bottom-6">
      <MessageCircle className="size-7" aria-hidden strokeWidth={1.7} />
    </a>
  );
}
