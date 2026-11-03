import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { DashboardNav } from "@/components/dashboard-nav";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardNavItems } from "@/lib/nav";

/**
 * Shared shell for every signed-in area (dashboard, profile, products,
 * staff tools) — a role-based sidebar (desktop) / top nav (mobile) plus a
 * slim top bar, replacing the marketing `SiteHeader`/`SiteFooter` these
 * pages used individually before. A page under here still does its own
 * `requireUser`/`requireStaff`/`requireAdmin` check; if that redirects or
 * 404s, it aborts this render too, so there's no duplicate auth logic here.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return children;
  }

  const navItems = getDashboardNavItems(user.role);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline">
        <div className="flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-5 w-5 text-gold" />
            <span className="font-display text-lg">Launchpad</span>
          </Link>
          <UserMenu user={user} />
        </div>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <DashboardNav items={navItems} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
