"use client";
import { useTransition } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useToast } from "@/components/toast";
import { recordContact } from "../actions";

/** Opens the WhatsApp link and, at the same time, records the follow-up (status -> contacted, timestamp, counter). */
export function ContactButton({ id, href, label = "WhatsApp", className = "btn btn-primary btn-sm" }: { id: string; href: string; label?: string; className?: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-busy={pending} aria-label={`${label} follow-up`}
      onClick={() => start(async () => { const r = await recordContact(id); if (!r.ok) toast("error", "Couldn't record the follow-up"); })}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <MessageCircle className="size-4" aria-hidden />}
      {label}
    </a>
  );
}
