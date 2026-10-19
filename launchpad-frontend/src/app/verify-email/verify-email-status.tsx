"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { verifyEmailAction } from "@/app/actions/auth";

type Status = "pending" | "success" | "error";

export function VerifyEmailStatus({ token }: { token: string }) {
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
