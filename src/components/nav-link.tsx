"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Link that marks itself current for the pill nav and the mobile dock. */
export function NavLink({ href, className, match, children, ...rest }: { href: string; className: string; match?: string; children: React.ReactNode } & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  const path = usePathname();
  const base = match ?? href;
  const on = base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);
  return <Link href={href} className={className} aria-current={on ? "page" : undefined} {...rest}>{children}</Link>;
}
