"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

type Opts = { title?: string; message: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type Prompt = { title: string; label?: string; placeholder?: string; initial?: string; confirmLabel?: string };
type State = ({ kind: "confirm" } & Opts | { kind: "prompt" } & Prompt) & { resolve: (v: unknown) => void };

const DANGER = /\b(delete|remove|block|deactivate|clear|cancel|reset|revoke|discard|erase)\b|cannot be undone|can’t be undone/i;
type Ask = (o: string | Opts) => Promise<boolean>;
type Ask2 = (o: Prompt) => Promise<string | null>;
const Ctx = createContext<{ confirm: Ask; prompt: Ask2 } | null>(null);

/** Never use the browser's alert/confirm/prompt: they look foreign, can be switched off by the browser, and don't match the store. */
export const useConfirm = (): Ask => { const c = useContext(Ctx); return c ? c.confirm : async () => false; };
export const usePrompt = (): Ask2 => { const c = useContext(Ctx); return c ? c.prompt : async () => null; };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<State | null>(null);
  const [text, setText] = useState("");
  const confirm = useCallback<Ask>((o) => new Promise((resolve) => { setSt({ kind: "confirm", ...(typeof o === "string" ? { message: o } : o), resolve: resolve as (v: unknown) => void }); }), []);
  const prompt = useCallback<Ask2>((o) => new Promise((resolve) => { setText(o.initial ?? ""); setSt({ kind: "prompt", ...o, resolve: resolve as (v: unknown) => void }); }), []);
  const done = (v: unknown) => { st?.resolve(v); setSt(null); };
  const okRef = useRef<HTMLButtonElement>(null), cancelRef = useRef<HTMLButtonElement>(null), inputRef = useRef<HTMLInputElement>(null);
  const danger = st?.kind === "confirm" && (st.danger ?? DANGER.test(st.message));

  useEffect(() => {
    if (!st) return;
    const prev = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    // a destructive question starts on Cancel so a stray Enter can't delete anything
    (st.kind === "prompt" ? inputRef.current : danger ? cancelRef.current : okRef.current)?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); st.resolve(st.kind === "prompt" ? null : false); setSt(null); }
      if (e.key === "Tab") { // keep focus inside the dialog
        const f = [...document.querySelectorAll<HTMLElement>("[data-confirm] button, [data-confirm] input")]; if (!f.length) return;
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1]!.focus(); } else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0]!.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.documentElement.style.overflow = ""; prev?.focus?.(); };
  }, [st, danger]);

  return (
    <Ctx.Provider value={{ confirm, prompt }}>
      {children}
      {st && (
        <div className="fixed inset-0 z-[130] grid place-items-center bg-black/50 p-4 backdrop-blur-[2px]" onPointerDown={(e) => { if (e.target === e.currentTarget) done(st.kind === "prompt" ? null : false); }}>
          <div data-confirm role={danger ? "alertdialog" : "dialog"} aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-msg"
            className="w-full max-w-sm animate-fade rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl">
            <div className="flex items-start gap-3">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${danger ? "bg-danger/10 text-danger" : "bg-brand-soft text-brand"}`}>{danger ? <AlertTriangle className="size-5" aria-hidden /> : <HelpCircle className="size-5" aria-hidden />}</span>
              <div className="min-w-0 flex-1">
                <h2 id="cf-title" className="display text-base font-extrabold">{st.kind === "prompt" ? st.title : st.title ?? (danger ? "Are you sure?" : "Please confirm")}</h2>
                {st.kind === "confirm" && <p id="cf-msg" className="mt-1 text-sm leading-relaxed text-muted">{st.message}</p>}
                {st.kind === "prompt" && (
                  <form id="cf-msg" className="mt-2" onSubmit={(e) => { e.preventDefault(); done(text.trim() || null); }}>
                    {st.label && <label className="label" htmlFor="cf-input">{st.label}</label>}
                    <input id="cf-input" ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder={st.placeholder} dir="ltr" className="field" />
                  </form>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button ref={cancelRef} type="button" className="btn btn-outline btn-sm" onClick={() => done(st.kind === "prompt" ? null : false)}>{st.kind === "confirm" ? st.cancelLabel ?? "Cancel" : "Cancel"}</button>
              <button ref={okRef} type="button" className={`btn btn-sm ${danger ? "bg-danger text-white hover:opacity-90" : "btn-primary"}`} onClick={() => done(st.kind === "prompt" ? text.trim() || null : true)}>
                {st.kind === "confirm" ? st.confirmLabel ?? (danger ? "Yes, continue" : "Confirm") : st.confirmLabel ?? "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
