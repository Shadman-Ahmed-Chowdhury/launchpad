"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { getAuthToken, setAuthToken, clearAuthToken } from "@/lib/session";
import { fieldErrors, errorMessage, type AuthFormState } from "@/lib/action-state";

export type { AuthFormState };

interface AuthPayload {
  user: unknown;
  token: string;
}

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") ? value : "/";
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    const { data } = await apiFetch<{ data: AuthPayload }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password"),
        password_confirmation: formData.get("passwordConfirmation"),
      }),
    });

    await setAuthToken(data.token);
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong creating your account.") };
  }

  redirect("/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const next = safeNext(formData.get("next"));

  try {
    const { data } = await apiFetch<{ data: AuthPayload }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    await setAuthToken(data.token);
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong signing you in.") };
  }

  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const token = await getAuthToken();

  if (token) {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Token may already be invalid/expired — clearing the cookie below is
      // what actually signs the browser out either way.
    }
  }

  await clearAuthToken();
  redirect("/");
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await apiFetch("/api/auth/password/forgot", {
      method: "POST",
      body: JSON.stringify({ email: formData.get("email") }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong. Try again.") };
  }

  return { message: "sent" };
}

export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  try {
    await apiFetch("/api/auth/password/reset", {
      method: "POST",
      body: JSON.stringify({
        token: formData.get("token"),
        password: formData.get("password"),
        password_confirmation: formData.get("passwordConfirmation"),
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong. Try again.") };
  }

  return { message: "reset" };
}

export async function verifyEmailAction(token: string): Promise<{ success: boolean; message: string }> {
  try {
    await apiFetch("/api/auth/email/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    return { success: true, message: "Email verified." };
  } catch (error) {
    return { success: false, message: errorMessage(error, "This verification link is invalid or has expired.") };
  }
}

export async function resendVerificationAction(
  // useActionState requires this signature; the button has nothing to submit.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prevState: AuthFormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    const { message } = await apiFetch<{ message: string | null }>("/api/auth/email/verify/resend", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    return { message: message ?? "Verification email sent." };
  } catch (error) {
    return { message: errorMessage(error, "Something went wrong. Try again.") };
  }
}

export async function changePasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  try {
    await apiFetch("/api/auth/password", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        current_password: formData.get("currentPassword"),
        password: formData.get("password"),
        password_confirmation: formData.get("passwordConfirmation"),
      }),
    });
  } catch (error) {
    const errors = fieldErrors(error);
    if (errors) return { errors };
    return { message: errorMessage(error, "Something went wrong. Try again.") };
  }

  return { message: "changed" };
}
