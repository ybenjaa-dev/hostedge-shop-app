/** A stable, non-secret device signature built from browser traits. Client only; used after consent. */
async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canvasTrait(): string {
  try {
    const c = document.createElement("canvas");
    c.width = 200; c.height = 40;
    const g = c.getContext("2d");
    if (!g) return "";
    g.textBaseline = "top"; g.font = "14px Arial"; g.fillStyle = "#f60"; g.fillRect(10, 5, 80, 20);
    g.fillStyle = "#069"; g.fillText("HostEdge fp 😀 ٣٤", 4, 12);
    return c.toDataURL().slice(-80);
  } catch { return ""; }
}

function glTrait(): string {
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (!gl) return "";
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? `${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)}|${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}` : String(gl.getParameter(gl.VERSION));
  } catch { return ""; }
}

export async function deviceFingerprint(): Promise<string> {
  const n = navigator as Navigator & { deviceMemory?: number };
  const traits = [
    n.userAgent, n.language, (n.languages ?? []).join(","), n.platform, n.hardwareConcurrency, n.deviceMemory,
    screen.width, screen.height, screen.colorDepth, window.devicePixelRatio, Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(), n.maxTouchPoints, canvasTrait(), glTrait(),
  ].join("¦");
  return (await sha256(traits)).slice(0, 40);
}

export const getFp = (() => { let p: Promise<string> | null = null; return () => (p ??= deviceFingerprint()); })();
