# Visitor blocking

Blocking a visitor in the admin sends them to https://www.google.com/ (302, no-store) instead of showing the store.
Enforced in `worker.ts` (before the app runs, from an in-memory cache of `blocked_signals`, refreshed every 30 s),
again in the shop layout, in `POST /api/visit` and when placing an order.

What is matched (any one is enough):
- `he_vid` cookie (re-set to the blocked visitor's id on every blocked request, 1 year);
- device fingerprint (`he_fp`, sent by the beacon);
- IP + device class (browser family, OS family, device type), hashed with the install secret. A plain IP is never blocked;
- the phone number the visitor ordered with.

When a blocked fingerprint/cookie shows up with a new cookie or network, the new cookie and IP+device hash are learned
and linked to the same visitor, so the next request is stopped at the edge. An IP+device match alone never teaches anything.

Skipped: `/admin`, `/api`, `/_next`, `/files`, `/setup`, static assets, crawlers (by User-Agent), non-GET requests and
signed-in staff (valid `he_session`), so SEO and the owner's preview are unaffected.

Limits: a person on a brand-new device AND a new network, with a new phone number, cannot be identified. People behind the
same IP using the same browser/OS/device type as a blocked visitor (shared office or mobile NAT) can be caught by the
IP+device signal; unblocking the visitor removes all of its signals. Cache changes reach other isolates within 30 s.
