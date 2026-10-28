/** Consistent JSON error body for API routes: { error: { code, message } }. */
export function apiError(status: number, code: string, message: string, headers?: HeadersInit) {
  return Response.json({ error: { code, message } }, { status, headers });
}
