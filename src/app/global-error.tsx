"use client";
import { useEffect, useState } from "react";

type Lang = "en" | "fr" | "ar";
const T: Record<Lang, { title: string; sub: string; retry: string; home: string; ref: string }> = {
  en: { title: "We'll be right back", sub: "Something went wrong on our side. Please try again in a moment.", retry: "Try again", home: "Back to home", ref: "Reference" },
  fr: { title: "Nous revenons tout de suite", sub: "Un problème est survenu de notre côté. Réessayez dans un instant.", retry: "Réessayer", home: "Retour à l'accueil", ref: "Référence" },
  ar: { title: "سنعود قريباً", sub: "حدثت مشكلة من جانبنا. حاول مرة أخرى بعد قليل.", retry: "إعادة المحاولة", home: "العودة إلى الرئيسية", ref: "المرجع" },
};
const pick = (c: string): Lang | null => { const x = c.slice(0, 2).toLowerCase(); return x === "fr" || x === "ar" || x === "en" ? x : null; };

const CSS = `
:root{--bg:#fbfaf7;--ink:#1c1917;--muted:#6b6560;--line:#e5e1da;--brand:#0f766e}
@media (prefers-color-scheme:dark){:root{--bg:#141210;--ink:#f5f2ec;--muted:#a8a29a;--line:#2e2a26;--brand:#2dd4bf}}
*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:1rem;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:center}
main{max-width:30rem}h1{margin:.25rem 0 .5rem;font-size:1.75rem}p{margin:.25rem 0;color:var(--muted);line-height:1.6}
.code{font-size:5.5rem;font-weight:800;line-height:1;color:var(--brand);margin:0}
.row{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;margin:1.25rem 0 1rem}
.b{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;padding:.65rem 1.25rem;border-radius:.75rem;border:1px solid var(--line);background:transparent;color:var(--ink);font:inherit;font-weight:700;text-decoration:none;cursor:pointer}
.p{background:var(--brand);border-color:var(--brand);color:var(--bg)}
.b:focus-visible{outline:3px solid var(--brand);outline-offset:2px}.b:active{transform:scale(.97)}
small{display:block;color:var(--muted);font-size:.75rem}`;

/** Replaces the root layout when it crashes (e.g. database unreachable): no app providers, CSS or fonts, so everything is inline. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    const m = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    setLang((m && pick(decodeURIComponent(m[1]!))) || pick(navigator.language || "") || "en");
  }, []);
  const t = T[lang];
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head><meta name="robots" content="noindex" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>{t.title}</title><style dangerouslySetInnerHTML={{ __html: CSS }} /></head>
      <body>
        <main role="alert">
          <p className="code" aria-hidden>503</p>
          <h1>{t.title}</h1>
          <p>{t.sub}</p>
          <div className="row">
            <button className="b p" onClick={reset}>{t.retry}</button>
            <a className="b" href="/">{t.home}</a>
          </div>
          {error.digest && <small dir="ltr">{t.ref}: {error.digest}</small>}
        </main>
      </body>
    </html>
  );
}
