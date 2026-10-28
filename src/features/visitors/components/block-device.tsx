"use client";
import { useTransition } from "react";
import { Loader2, ShieldBan, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/toast";
import { useConfirm, usePrompt } from "@/components/confirm";
import { blockFingerprint, unblockFingerprint } from "../actions";

/** Block / unblock a visitor (cookie, device, network and phone). Blocking asks for a reason that is kept with the block. */
export function BlockDevice({ visitorId, fp, blocked }: { visitorId: string; fp?: string | null; blocked: boolean }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const ask = useConfirm();
  const prompt = usePrompt();
  const run = (action: typeof blockFingerprint, extra: Record<string, string>) => start(async () => {
    const f = new FormData(); f.set("vid", visitorId); if (fp) f.set("fp", fp); for (const [k, v] of Object.entries(extra)) f.set(k, v);
    const r = await action(undefined, f);
    if (r?.error) toast("error", r.error); else toast("success", r?.message ?? "Done");
  });
  if (blocked) {
    return <button type="button" disabled={pending} className="btn btn-outline btn-sm w-full" onClick={async () => { if (await ask({ title: "Unblock visitor", message: "Allow this visitor to use the shop and place orders again? All their blocked signals are removed.", confirmLabel: "Unblock", danger: false })) run(unblockFingerprint, {}); }}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}Unblock this visitor</button>;
  }
  return <button type="button" disabled={pending} className="btn btn-sm w-full border border-danger/40 bg-danger/5 text-danger hover:bg-danger/10" onClick={async () => {
    const reason = await prompt({ title: "Block this visitor", label: "Reason (only you see it)", placeholder: "e.g. fake orders, abusive calls", confirmLabel: "Block visitor" });
    if (reason === null) return;
    run(blockFingerprint, { reason });
  }}>{pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ShieldBan className="size-4" aria-hidden />}Block this visitor</button>;
}
