import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader nav={false} />

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />

          <p className="mt-8 text-sm text-muted">
            <Link
              href="/login"
              className="text-foreground underline underline-offset-4 hover:text-gold"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
