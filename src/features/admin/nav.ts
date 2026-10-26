import type { Perm } from "@/lib/permissions";
export type NavItem = { href: string; label: string; icon: string; owner?: boolean; group: string; perm: Perm };
export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", group: "Overview", perm: "dashboard.view" },
  { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", group: "Sales", perm: "orders.view" },
  { href: "/admin/cash", label: "COD cash", icon: "Banknote", group: "Sales", perm: "cash.manage" },
  { href: "/admin/abandoned", label: "Abandoned", icon: "PhoneMissed", group: "Sales", perm: "abandoned.view" },
  { href: "/admin/products", label: "Products", icon: "Package", group: "Catalog", perm: "products.view" },
  { href: "/admin/media", label: "Media", icon: "ImagePlus", group: "Catalog", perm: "media.manage" },
  { href: "/admin/categories", label: "Categories", icon: "Tags", group: "Catalog", perm: "categories.manage" },
  { href: "/admin/coupons", label: "Coupons", icon: "Ticket", group: "Catalog", perm: "coupons.manage" },
  { href: "/admin/reviews", label: "Reviews", icon: "Star", group: "Catalog", perm: "reviews.moderate" },
  { href: "/admin/customers", label: "Customers", icon: "Users", group: "Customers", perm: "customers.view" },
  { href: "/admin/visitors", label: "Visitors", icon: "Radar", group: "Customers", perm: "visitors.view" },
  { href: "/admin/push", label: "Push notifications", icon: "BellRing", group: "Customers", perm: "push.send" },
  { href: "/admin/appearance", label: "Appearance", icon: "Palette", group: "Store", perm: "appearance.edit" },
  { href: "/admin/pages", label: "Pages", icon: "FileText", group: "Store", perm: "pages.edit" },
  { href: "/admin/shipping", label: "Shipping", icon: "Truck", group: "Store", perm: "shipping.manage" },
  { href: "/admin/settings", label: "Settings", icon: "Settings", group: "Store", perm: "dashboard.view", owner: true },
  { href: "/admin/team", label: "Team", icon: "UserCog", group: "Admin", perm: "dashboard.view", owner: true },
  { href: "/admin/performance", label: "Team performance", icon: "Gauge", group: "Admin", perm: "performance.view" },
  { href: "/admin/activity", label: "Activity log", icon: "History", group: "Admin", perm: "activity.view" },
  { href: "/admin/backup", label: "Backup", icon: "DatabaseBackup", group: "Admin", perm: "dashboard.view", owner: true },
];
