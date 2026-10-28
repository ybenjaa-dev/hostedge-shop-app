import { Globe } from "lucide-react";
import { setLang } from "@/features/settings/actions/lang";
import { LANG_LABEL, type Lang } from "@/lib/i18n-core";

/** JS-free language switcher: each option is a tiny form posting a server action. */
export function LangSwitcher({ current, langs, label }: { current: Lang; langs: Lang[]; label: string }) {
  if (langs.length < 2) return null;
  return (
    <details className="group relative">
      <summary aria-label={label} className="btn btn-ghost btn-sm cursor-pointer list-none gap-1.5 [&::-webkit-details-marker]:hidden">
        <Globe className="size-4" aria-hidden />
        <span className="text-xs font-bold uppercase">{current}</span>
      </summary>
      <div className="absolute end-0 top-full z-50 mt-1 min-w-36 lx-pop overflow-hidden border border-line bg-bg p-1 shadow-2xl">
        {langs.map((l) => (
          <form key={l} action={setLang.bind(null, l)}>
            <button className={`flex w-full items-center px-3 py-2 text-start text-sm hover:text-brand ${l === current ? "font-bold text-brand" : ""}`} lang={l}>
              {LANG_LABEL[l]}
            </button>
          </form>
        ))}
      </div>
    </details>
  );
}
