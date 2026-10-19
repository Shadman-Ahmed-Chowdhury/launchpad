import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { requireUser } from "@/lib/auth";
import { ProfileSettingsForm } from "./profile-settings-form";

export default async function SettingsPage() {
  const user = await requireUser("/settings");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-sm flex-1 px-6 py-16">
        <h1 className="font-display text-3xl tracking-tight">
          Account settings
        </h1>
        <p className="mt-2 text-muted">Edit your public profile.</p>

        <ProfileSettingsForm user={user} />

        {user.authProvider === "password" && (
          <div className="mt-10 border-t border-hairline pt-6">
            <Link
              href="/settings/password"
              className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-gold"
            >
              Change password
            </Link>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
