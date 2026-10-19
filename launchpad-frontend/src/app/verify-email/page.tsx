import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VerifyEmailStatus } from "./verify-email-status";

export default async function VerifyEmailPage({
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
          <h1 className="font-display text-3xl tracking-tight">
            Verify your email
          </h1>
          {token ? (
            <VerifyEmailStatus token={token} />
          ) : (
            <p className="mt-2 text-danger">
              This verification link is missing its token.
            </p>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
