import type { UserRole } from "@/types";

export interface NavItem {
  href: string;
  label: string;
  /** Highlight for any path under `href`, not just an exact match. */
  matchPrefix?: boolean;
}

/**
 * The dashboard sidebar's menu, by role — every signed-in member gets the
 * first three, reviewers add the queue, admins add member/reviewer
 * management (see docs/02-features.md, role sections).
 */
export function getDashboardNavItems(role: UserRole): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/settings", label: "Profile" },
    { href: "/dashboard/products", label: "Products", matchPrefix: true },
  ];

  if (role === "reviewer" || role === "admin") {
    items.push({ href: "/staff", label: "Review queue" });
  }

  if (role === "admin") {
    items.push(
      { href: "/staff/users", label: "Users" },
      { href: "/staff/reviewers", label: "Reviewers" },
    );
  }

  return items;
}
