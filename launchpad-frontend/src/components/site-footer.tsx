import { Logo } from "@/components/logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-muted">
        <span className="flex items-center gap-2">
          <Logo className="h-4 w-4" />
          Launchpad
        </span>
        <span>© {year}</span>
      </div>
    </footer>
  );
}
