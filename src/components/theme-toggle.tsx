"use client";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "btn btn-ghost btn-sm" }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className={className}
      onClick={() => {
        const el = document.documentElement;
        const next = el.dataset.theme === "dark" ? "light" : "dark";
        el.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch {}
      }}
    >
      <Moon className="size-4 dark:hidden" aria-hidden />
      <Sun className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}
