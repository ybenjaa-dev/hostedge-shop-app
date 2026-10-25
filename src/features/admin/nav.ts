export type NavItem = { href: string; label: string; icon: string; owner?: boolean; group: string };
export const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", group: "Overview" },
  { href: "/admin/orders", label: "Orders", icon: "ShoppingBag", group: "Sales" },
  { href: "/admin/cash", label: "COD cash", icon: "Banknote", group: "Sales" },
  { href: "/admin/abandoned", label: "Abandoned", icon: "PhoneMissed", group: "Sales" },
  { href: "/admin/products", label: "Products", icon: "Package", group: "Catalog" },
  { href: "/admin/categories", label: "Categories", icon: "Tags", group: "Catalog" },
  { href: "/admin/coupons", label: "Coupons & bundles", icon: "Ticket", group: "Catalog" },
  { href: "/admin/reviews", label: "Reviews", icon: "Star", group: "Catalog" },
  { href: "/admin/customers", label: "Customers", icon: "Users", group: "Customers" },
  { href: "/admin/appearance", label: "Appearance", icon: "Palette", group: "Store" },
  { href: "/admin/pages", label: "Pages", icon: "FileText", group: "Store" },
  { href: "/admin/shipping", label: "Shipping", icon: "Truck", group: "Store" },
  { href: "/admin/settings", label: "Settings", icon: "Settings", group: "Store", owner: true },
  { href: "/admin/team", label: "Team", icon: "UserCog", group: "Admin", owner: true },
  { href: "/admin/activity", label: "Activity log", icon: "History", group: "Admin" },
  { href: "/admin/backup", label: "Backup", icon: "DatabaseBackup", group: "Admin", owner: true },
];
