"use client";
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { AdminForm } from "@/features/admin/components/admin-form";
import { Field } from "@/features/admin/components/fields";
import { Avatar } from "@/components/avatar";
import { useToast } from "@/components/toast";
import { saveProfile } from "../actions";

type P = { name: string; email: string; phone: string; jobTitle: string; bio: string; avatar: string };

/** Crops the chosen picture to a centred 320×320 square and re-encodes it as a small WebP before upload. */
async function squareWebp(file: File): Promise<Blob | null> {
  const bmp = await createImageBitmap(file);
  const side = Math.min(bmp.width, bmp.height), out = 320;
  const c = document.createElement("canvas"); c.width = out; c.height = out;
  c.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, out, out);
  bmp.close();
  return new Promise((r) => c.toBlob((b) => r(b), "image/webp", 0.85));
}

export function ProfileForm({ p }: { p: P }) {
  const [avatar, setAvatar] = useState(p.avatar);
  const [name, setName] = useState(p.name);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  async function pick(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await squareWebp(file);
      if (!blob) throw new Error("Could not read that picture.");
      const fd = new FormData(); fd.set("file", new File([blob], "avatar.webp", { type: "image/webp" }));
      const r = await fetch("/api/profile/avatar", { method: "POST", body: fd });
      const j = (await r.json().catch(() => null)) as { ok?: boolean; key?: string; error?: string } | null;
      if (!r.ok || !j?.key) throw new Error(j?.error ?? "Upload failed.");
      setAvatar(j.key);
      toast("success", "Picture ready — press Save profile.");
    } catch (e) { toast("error", e instanceof Error ? e.message : "Upload failed."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return (
    <AdminForm action={saveProfile} submitLabel="Save profile">
      <input type="hidden" name="avatar" value={avatar} />
      <div className="flex items-center gap-4">
        <Avatar name={name} src={avatar} size="xl" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Camera className="size-4" aria-hidden />}{avatar ? "Change picture" : "Add a picture"}</button>
            {avatar && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => setAvatar("")}><Trash2 className="size-4" aria-hidden />Remove</button>}
          </div>
          <p className="text-xs text-muted">Any photo — it is cropped to a square automatically.</p>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Profile picture" onChange={(e) => void pick(e.target.files?.[0])} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="pf-name"><input id="pf-name" name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoComplete="name" className="field" /></Field>
        <Field label="Job title" htmlFor="pf-title" hint="e.g. Order confirmer, Warehouse"><input id="pf-title" name="jobTitle" defaultValue={p.jobTitle} maxLength={60} className="field" /></Field>
        <Field label="Email" htmlFor="pf-email" hint="This is your sign-in. Ask the owner to change it."><input id="pf-email" value={p.email} readOnly dir="ltr" className="field bg-sunken" /></Field>
        <Field label="Phone / WhatsApp" htmlFor="pf-phone"><input id="pf-phone" name="phone" defaultValue={p.phone} inputMode="tel" dir="ltr" maxLength={30} autoComplete="tel" className="field" placeholder="+212 6 12 34 56 78" /></Field>
      </div>
      <Field label="About me" htmlFor="pf-bio" hint="Shown to your teammates. Max 400 characters."><textarea id="pf-bio" name="bio" rows={3} maxLength={400} defaultValue={p.bio} className="field" /></Field>
    </AdminForm>
  );
}
