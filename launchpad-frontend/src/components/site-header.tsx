import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteHeader({ nav = true }: { nav?: boolean }) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-6 w-6 text-gold" />
          <span className="font-display text-xl">Launchpad</span>
        </Link>
        {nav && (
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="/products"
              className="text-muted transition-colors hover:text-foreground"
            >
              Products
            </Link>
            <Link
              href="/login"
              className="text-muted transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gold-fill px-4 py-2 font-medium text-background transition-colors hover:bg-gold-fill/90"
            >
              Sign up
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
