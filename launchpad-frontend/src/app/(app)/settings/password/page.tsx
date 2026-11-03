import { requireUser } from "@/lib/auth";
import { ChangePasswordForm } from "../change-password-form";

export default async function ChangePasswordPage() {
  const user = await requireUser("/settings/password");

  return (
    <div className="mx-auto w-full max-w-[80%] px-6 py-16">
      <h1 className="font-display text-3xl tracking-tight">
        Change password
      </h1>

      {user.authProvider === "google" ? (
        <p className="mt-2 text-muted">
          You signed up with Google, so there&apos;s no password to change
          here.
        </p>
      ) : (
        <>
          <p className="mt-2 text-muted">
            Choose a new password for your account.
          </p>
          <ChangePasswordForm />
        </>
      )}
    </div>
  );
}
