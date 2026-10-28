/** Groups of texts only server-rendered pages use. They are left out of the data sent to the browser (saves ~25 KB of HTML per page). */
export const SERVER_ONLY_PREFIXES = ["nav.", "home.", "trust.", "footer.", "how.", "goal.", "faq.", "privacy.", "push.", "pwa.", "search.", "shop.", "track."] as const;

export function clientDict<T extends Record<string, string>>(dict: T): T {
  return Object.fromEntries(Object.entries(dict).filter(([k]) => !SERVER_ONLY_PREFIXES.some((p) => k.startsWith(p)))) as T;
}
