/** Admin roles and what each may do. Pure (no server imports) so the menu, pages, server actions and tests share one source of truth. */
export const ROLES = ["owner", "staff", "confirmer", "packer", "accountant"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_INFO: Record<Role, { label: string; blurb: string; color: string }> = {
  owner: { label: "Owner", blurb: "Everything, including settings, team, shipping credentials and backups.", color: "#7c3aed" },
  staff: { label: "Manager", blurb: "Runs the store day to day: orders, products, customers, appearance, reports. No settings, team or backups.", color: "#0d9488" },
  confirmer: { label: "Confirmer", blurb: "Calls customers and confirms, postpones or cancels orders. Sees orders, customers and abandoned carts.", color: "#2563eb" },
  packer: { label: "Packer", blurb: "Prepares and ships confirmed orders: packing slips, carrier, tracking, delivery results.", color: "#d97706" },
  accountant: { label: "Accountant", blurb: "Read-only on orders and customers, manages COD cash, sees the dashboard and team performance.", color: "#475569" },
};

export const PERMISSIONS = [
  "dashboard.view", "orders.view", "orders.confirm", "orders.fulfil", "orders.export", "orders.note",
  "cash.manage", "abandoned.view", "customers.view", "customers.block",
  "products.view", "products.edit", "media.manage", "categories.manage", "coupons.manage", "reviews.moderate",
  "appearance.edit", "pages.edit", "shipping.manage", "activity.view", "performance.view",
] as const;
export type Perm = (typeof PERMISSIONS)[number];

const MANAGER: Perm[] = [...PERMISSIONS];
const BY_ROLE: Record<Role, readonly Perm[]> = {
  owner: PERMISSIONS,
  staff: MANAGER,
  confirmer: ["orders.view", "orders.confirm", "orders.note", "abandoned.view", "customers.view", "customers.block", "products.view"],
  packer: ["orders.view", "orders.fulfil", "orders.note", "products.view"],
  accountant: ["dashboard.view", "orders.view", "orders.export", "cash.manage", "customers.view", "performance.view"],
};

export const isRole = (s: unknown): s is Role => typeof s === "string" && (ROLES as readonly string[]).includes(s);
export const isPerm = (s: string): s is Perm => (PERMISSIONS as readonly string[]).includes(s);
export const can = (role: Role, perm: Perm): boolean => BY_ROLE[role]?.includes(perm) ?? false;

/** Which order statuses a role may move an order *to*. Confirmers handle the phone call, packers the physical flow. */
const STATUS_BY_ROLE: Partial<Record<Role, readonly string[]>> = {
  confirmer: ["pending_confirmation", "confirmed", "no_answer", "postponed", "cancelled"],
  packer: ["ready_to_ship", "shipped", "out_for_delivery", "delivered", "delivery_failed", "returned", "return_received"],
};
export function canSetStatus(role: Role, to: string): boolean {
  if (role === "owner" || role === "staff") return true;
  return STATUS_BY_ROLE[role]?.includes(to) ?? false;
}

/** First admin page a role can open (used when they hit a page they're not allowed to see, or the dashboard). */
export function homeFor(role: Role): string {
  if (can(role, "dashboard.view")) return "/admin";
  if (can(role, "orders.view")) return "/admin/orders";
  return "/admin/team/account";
}
