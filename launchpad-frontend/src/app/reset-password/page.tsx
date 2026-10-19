import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <>
              <h1 className="font-display text-3xl tracking-tight">
                Invalid link
              </h1>
              <p className="mt-2 text-muted">
                This password reset link is missing its token. Request a new
                one from the forgot password page.
              </p>
            </>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
