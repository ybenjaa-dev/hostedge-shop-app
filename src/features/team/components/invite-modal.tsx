"use client";
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Mail, MessageCircle, ShieldAlert, UserPlus, X } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit";
import { useToast } from "@/components/toast";
import { ROLES, ROLE_INFO, type Role } from "@/lib/permissions";
import { inviteUser } from "../actions";

const CAN: Record<Role, string[]> = {
  owner: ["Everything", "Settings", "Team"],
  staff: ["Orders", "Products", "Customers", "Reports"],
  confirmer: ["Confirm orders", "Customers", "Abandoned carts"],
  packer: ["Pack & ship", "Tracking"],
  accountant: ["Reports", "COD cash", "Read-only orders"],
};

/** "Invite teammate" button + dialog: email, role cards, then the one-time link with copy / email / WhatsApp. */
export function InviteModal() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("confirmer");
  const [link, setLink] = useState<{ url: string; email: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [state, action] = useActionState(inviteUser, undefined);
  const lastTs = useRef<number | undefined>(undefined);
  const box = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();
  const titleId = useId();

  const close = useCallback(() => { setOpen(false); if (link) router.refresh(); setLink(null); setCopied(false); }, [link, router]);

  useEffect(() => {
    if (!state || state.ts === lastTs.current) return;
    lastTs.current = state.ts;
    if (state.ok && !state.error && state.fields?.path) { setLink({ url: `${window.location.origin}${state.fields.path}`, email: state.fields.email ?? "" }); setCopied(false); router.refresh(); }
    else if (state.error) toast("error", state.error);
  }, [state, router, toast]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [open, close]);

  const copy = async () => { if (!link) return; try { await navigator.clipboard.writeText(link.url); setCopied(true); } catch { toast("error", "Could not copy — select the link and copy it manually."); } };
  const msg = link ? `You're invited to join the team. Create your account here (valid for 72 hours): ${link.url}` : "";

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)} aria-haspopup="dialog"><UserPlus className="size-4" aria-hidden />Invite teammate</button>
      {open && (
        <div className="fixed inset-0 z-[85] grid place-items-end bg-black/50 backdrop-blur-[2px] sm:place-items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
          <div ref={box} role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex max-h-[92dvh] w-full max-w-xl animate-fade flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 id={titleId} className="display text-xl font-extrabold">{link ? "Invite ready" : "Invite a teammate"}</h2>
                <p className="mt-0.5 text-sm text-muted">{link ? `Share this one-time link with ${link.email}.` : "They get a private link, valid for 72 hours, to create their own password."}</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={close}><X className="size-5" aria-hidden /></button>
            </div>

            {link ? (
              <div className="space-y-4 overflow-y-auto p-5">
                <div role="status" className="flex items-center gap-3 rounded-xl bg-ok/10 p-3 text-sm font-semibold text-ok"><Check className="size-5 shrink-0" aria-hidden />Invite created as {ROLE_INFO[role].label}.</div>
                <div>
                  <label htmlFor="invite-link" className="label">Invite link</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input id="invite-link" readOnly value={link.url} dir="ltr" onFocus={(e) => e.currentTarget.select()} className="field num text-sm" />
                    <button type="button" className="btn btn-primary shrink-0" onClick={copy}>{copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}{copied ? "Copied" : "Copy link"}</button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted"><ShieldAlert className="size-3.5" aria-hidden />Shown only once. If you lose it, revoke the invite and create a new one.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a className="btn btn-outline btn-sm" href={`mailto:${encodeURIComponent(link.email)}?subject=${encodeURIComponent("Your team invite")}&body=${encodeURIComponent(msg)}`}><Mail className="size-4" aria-hidden />Send by email</a>
                  <a className="btn btn-outline btn-sm" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-4" aria-hidden />Share on WhatsApp</a>
                </div>
                <div className="flex justify-end gap-2 border-t border-line pt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => { setLink(null); setCopied(false); }}>Invite another</button>
                  <button type="button" className="btn btn-primary" onClick={close}>Done</button>
                </div>
              </div>
            ) : (
              <form action={action} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-5 overflow-y-auto p-5">
                  {state?.error && <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm font-medium text-danger">{state.error}</p>}
                  <div>
                    <label htmlFor="inv-email" className="label">Email address</label>
                    <input id="inv-email" name="email" type="email" required autoFocus autoComplete="off" dir="ltr" placeholder="name@company.com" className="field" />
                  </div>
                  <fieldset>
                    <legend className="label">Role</legend>
                    <div className="grid gap-2">
                      {ROLES.map((r) => {
                        const info = ROLE_INFO[r], on = role === r;
                        return (
                          <label key={r} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${on ? "border-brand bg-brand/10 ring-1 ring-brand" : "border-line hover:border-ink/30"}`}>
                            <input type="radio" name="role" value={r} checked={on} onChange={() => setRole(r)} className="peer sr-only" />
                            <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: info.color }} aria-hidden />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 text-sm font-extrabold">{info.label}{r === "owner" && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">Full access</span>}</span>
                              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{info.blurb}</span>
                              <span className="mt-1.5 flex flex-wrap gap-1">{CAN[r].map((c) => <span key={c} className="rounded-md bg-sunken px-1.5 py-0.5 text-[11px] font-semibold text-muted">{c}</span>)}</span>
                            </span>
                            <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${on ? "border-brand bg-brand text-brand-ink" : "border-line"} peer-focus-visible:ring-2 peer-focus-visible:ring-brand`} aria-hidden>{on && <Check className="size-3" />}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3">
                  <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
                  <SubmitButton pendingText="Creating…">Create invite link</SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
