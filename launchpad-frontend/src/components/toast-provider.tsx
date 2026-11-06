"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toasts: ToastItem[];
  push: (type: ToastType, message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

let nextId = 0;

/**
 * Mounted once in the root layout, wrapping the whole app — any client
 * component can call `useToast()` to push a success/error notification,
 * rendered by `<Toaster />` (also mounted once, in the same layout).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toasts, push, dismiss }), [toasts, push, dismiss]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast/useToastContext must be used within a ToastProvider");
  }
  return ctx;
}

/**
 * `const toast = useToast(); toast.success("Saved."); toast.error("...")`
 * — the returned object has a stable reference (memoized against `push`,
 * which never changes identity), so it's safe to list in a `useEffect`
 * dependency array without re-firing on unrelated re-renders. That's the
 * pattern for surfacing a Server Action's `useActionState` result as a
 * toast instead of inline text (see `VoteButton`), and the one to reuse for
 * login/signup success, "product added", etc.
 */
export function useToast() {
  const { push } = useToastContext();

  return useMemo(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
    }),
    [push],
  );
}

/** Internal — consumed by `<Toaster />` to render and dismiss toasts. */
export function useToastList() {
  const { toasts, dismiss } = useToastContext();
  return { toasts, dismiss };
}
