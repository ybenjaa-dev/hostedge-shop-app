/** Tiny user-agent reader: enough for "Chrome on Android · mobile" in the visitor list. Pure. */
export function parseUA(ua: string): { browser: string; os: string; device: "mobile" | "tablet" | "desktop" | "bot" } {
  const u = ua ?? "";
  if (/bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(u) && !/HeadlessChrome/.test(u)) return { browser: "Bot", os: "", device: "bot" };
  const os = /Windows NT/.test(u) ? "Windows" : /Android/.test(u) ? "Android" : /iPhone|iPad|iPod/.test(u) ? "iOS" : /Mac OS X|Macintosh/.test(u) ? "macOS" : /CrOS/.test(u) ? "ChromeOS" : /Linux/.test(u) ? "Linux" : "";
  const browser = /SamsungBrowser/.test(u) ? "Samsung Internet" : /(Edg|EdgA|EdgiOS)\//.test(u) ? "Edge" : /OPR\/|Opera/.test(u) ? "Opera" : /FBAN|FBAV|FB_IAB/.test(u) ? "Facebook app" : /Instagram/.test(u) ? "Instagram app" : /TikTok|musical_ly|BytedanceWebview/.test(u) ? "TikTok app" : /(Chrome|CriOS|HeadlessChrome)\//.test(u) ? "Chrome" : /(Firefox|FxiOS)\//.test(u) ? "Firefox" : /Safari\//.test(u) ? "Safari" : u ? "Other" : "";
  const device = /iPad|Tablet|PlayBook|Silk/.test(u) || (/Android/.test(u) && !/Mobile/.test(u)) ? "tablet" : /Mobi|iPhone|iPod|Android/.test(u) ? "mobile" : "desktop";
  return { browser, os, device };
}
