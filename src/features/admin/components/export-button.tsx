"use client";
import { useEffect, useState } from "react";
import { Download, Loader2 } from "lucide-react";

/** Outlined "Export CSV" button for list-page toolbars. `count` (when filters are active) adds a subtle "Export 2 orders" label. */
export function ExportButton({ href, count, noun = "row" }: { href: string; count?: number; noun?: string }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!busy) return;
    // the download is a navigation that never unloads the page, so there is no completion event: re-enable shortly after
    const t = setTimeout(() => setBusy(false), 4000);
    return () => clearTimeout(t);
  }, [busy]);
  const label = count != null ? `Export ${count} ${noun}${count === 1 ? "" : "s"}` : "Export CSV";
  return (
    <a href={href} download onClick={(e) => { if (busy) e.preventDefault(); else setBusy(true); }} aria-disabled={busy} aria-busy={busy}
      className={`btn btn-outline btn-sm ${busy ? "pointer-events-none opacity-60" : ""}`}>
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
      <span>{busy ? "Preparing…" : label}</span>
    </a>
  );
}
