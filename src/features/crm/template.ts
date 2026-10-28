/** Fill {placeholders}; unknown/unset placeholders are removed. */
export function fillTemplate(tpl: string, vars: Record<string, string | undefined>): string {
  return tpl.replace(/\{(\w+)\}/g, (_m, k: string) => vars[k] ?? "").replace(/[ \t]{2,}/g, " ").trim();
}
