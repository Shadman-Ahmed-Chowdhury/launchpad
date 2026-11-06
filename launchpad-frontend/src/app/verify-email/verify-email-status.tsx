"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { verifyEmailAction } from "@/app/actions/auth";

type Status = "pending" | "success" | "error";

const REDIRECT_DELAY_MS = 2000;

export function VerifyEmailStatus({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState("Confirming your email…");
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return;
    ranOnce.current = true;

    verifyEmailAction(token).then((result) => {
      setStatus(result.success ? "success" : "error");
      setMessage(result.message);
    });
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;

    const timer = setTimeout(() => router.push("/login?verified=1"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, router]);

  if (status === "pending") {
    return <p className="mt-2 text-muted">{message}</p>;
  }

  return (
    <>
      <p className={`mt-2 ${status === "success" ? "text-muted" : "text-danger"}`}>
        {message}
      </p>
      <p className="mt-8 text-sm text-muted">
        <Link
          href="/login"
          className="text-foreground underline underline-offset-4 hover:text-gold"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
