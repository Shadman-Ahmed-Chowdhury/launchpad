"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

type PasswordInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "type">;

/**
 * A password field with a show/hide toggle. Drop-in replacement for
 * `<input type="password">` — every other prop (id, name, required,
 * placeholder, className, ...) passes straight through.
 */
export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-9`} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-2 text-muted transition-colors hover:text-foreground"
      >
        {visible ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}
