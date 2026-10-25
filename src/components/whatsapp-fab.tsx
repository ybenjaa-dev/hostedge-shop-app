import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/phone";

export function WhatsAppFab({ number, label }: { number: string; label: string }) {
  if (!number) return null;
  return (
    <a href={whatsappLink(number)} target="_blank" rel="noopener noreferrer" aria-label={label}
      className="fixed bottom-24 end-4 z-30 grid size-12 place-items-center border border-ink bg-bg text-ink shadow-md transition hover:bg-ink hover:text-bg md:bottom-6">
      <MessageCircle className="size-6" aria-hidden strokeWidth={1.5} />
    </a>
  );
}
