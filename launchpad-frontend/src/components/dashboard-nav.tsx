"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/lib/nav";

/**
 * Doubles as the desktop sidebar (vertical, left column) and the mobile nav
 * (horizontal, scrollable) — same links, same markup, just reflowed by the
 * `md:` breakpoint so there's one nav to keep in sync, not two.
 */
export function DashboardNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-hairline p-4 md:w-56 md:shrink-0 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:p-6">
      {items.map((item) => {
        const active = item.matchPrefix
          ? pathname.startsWith(item.href)
          : pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm transition-colors md:rounded-lg ${
              active
                ? "bg-gold-fill text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
