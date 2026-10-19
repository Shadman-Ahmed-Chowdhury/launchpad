"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { User } from "@/types";

export function UserMenu({
  user,
}: {
  user: Pick<User, "firstName" | "handle">;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const menuItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: `/profile/${user.handle}`, label: "Profile" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-hairline py-1.5 pl-1.5 pr-3 transition-colors hover:border-foreground"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold-fill text-xs font-medium text-background">
          {user.firstName.charAt(0)}
        </span>
        <span className="text-sm font-medium">{user.firstName}</span>
        <svg
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`h-3 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5 6 8 9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-44 rounded-lg border border-hairline bg-background py-2 shadow-sm"
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <div className="my-2 border-t border-hairline" />
          <form action={logoutAction}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2 text-left text-sm text-muted transition-colors hover:text-foreground"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
