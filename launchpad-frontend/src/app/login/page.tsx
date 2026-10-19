import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { redirectIfAuthenticated } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const target = next?.startsWith("/") ? next : "/";

  await redirectIfAuthenticated(target);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-muted">
            Sign in to vote, comment, and follow.
          </p>

          <LoginForm next={target} />

          <div className="mt-8 flex items-center gap-4 text-sm text-muted">
            <div className="h-px flex-1 bg-hairline" />
            or
            <div className="h-px flex-1 bg-hairline" />
          </div>

          <button
            type="button"
            className="mt-8 w-full rounded-full border border-hairline px-6 py-3 text-sm font-medium transition-colors hover:border-foreground"
          >
            Continue with Google
          </button>

          <p className="mt-8 text-sm text-muted">
            New here?{" "}
            <Link
              href="/signup"
              className="text-foreground underline underline-offset-4 hover:text-gold"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
