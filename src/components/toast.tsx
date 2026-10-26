"use client";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { ClientBoot } from "@/components/boot/client-boot";
import { ConfirmProvider } from "@/components/confirm";
import { DismissMenus } from "@/components/dismiss-menus";

type Toast = { id: number; kind: "success" | "error"; text: string };
const Ctx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x.slice(-3), { id, kind, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <Ctx.Provider value={push}>
      <ConfirmProvider>{children}</ConfirmProvider>
      <ClientBoot />
      <DismissMenus />
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-sm animate-fade items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-white shadow-xl">
            {t.kind === "success" ? <CheckCircle2 className="size-5 shrink-0 text-emerald-400" /> : <AlertCircle className="size-5 shrink-0 text-red-400" />}
            <span>{t.text}</span>
            <button aria-label="Dismiss" className="ms-2 opacity-70 hover:opacity-100" onClick={() => setItems((x) => x.filter((y) => y.id !== t.id))}>
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
