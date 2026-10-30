"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/server/auth";
import { isGoogleEnabled } from "@/server/env";
import { logger } from "@/server/logger";
import { requireActor } from "@/server/session";
import {
  fieldErrors,
  requestResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  type FieldErrors,
} from "@/modules/identity/schemas";
import { recordPrivacyConsent } from "@/modules/identity/server";

export type FormState = {
  /** Mensaje general (arriba del formulario). */
  error?: { title: string; detail: string };
  fields?: FieldErrors;
  /** Valores a conservar si hay error (nunca la contraseña). */
  values?: Record<string, string>;
  done?: boolean;
};

const AFTER_SIGN_IN = "/biblioteca";

function apiErrorCode(e: unknown): string | undefined {
  if (e instanceof APIError) {
    const body = e.body as { code?: string; message?: string } | undefined;
    return body?.message === "ACCOUNT_SUSPENDED" || body?.message === "PASSWORD_NOT_ACCEPTABLE"
      ? body.message
      : (body?.code ?? String(e.status));
  }
  return undefined;
}

const TOO_MANY = { title: "Demasiados intentos.", detail: "Espera unos minutos y vuelve a probar." };
const SUSPENDED = {
  title: "Tu cuenta está suspendida.",
  detail: "Si crees que es un error, escribe a la persona que administra RECETÍN.",
};

// ─────────────── Entrar ───────────────

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: { email: raw.email } };

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (e) {
    const code = apiErrorCode(e);
    if (code === "ACCOUNT_SUSPENDED") return { error: SUSPENDED, values: { email: raw.email } };
    if (code === "TOO_MANY_REQUESTS" || code === "429") return { error: TOO_MANY, values: { email: raw.email } };
    if (!(e instanceof APIError)) logger.error("sign_in_failed", { error: e });
    // Mismo mensaje exista o no la cuenta: no revela qué campo falla (paso 2).
    return {
      error: { title: "No hemos podido entrar.", detail: "El email o la contraseña no son correctos. Revísalos o recupera tu contraseña." },
      values: { email: raw.email },
    };
  }
  redirect(AFTER_SIGN_IN);
}

/** Entrar o registrarse con Google: Better Auth devuelve la URL de Google y redirigimos. */
export async function googleAction(): Promise<void> {
  if (!isGoogleEnabled) redirect("/entrar?error=google_no_configurado");
  const result = await auth.api.signInSocial({
    body: { provider: "google", callbackURL: AFTER_SIGN_IN, newUserCallbackURL: AFTER_SIGN_IN, errorCallbackURL: "/entrar" },
    headers: await headers(),
  });
  if (!result?.url) redirect("/entrar?error=google");
  // URL externa (Google): typedRoutes no la conoce.
  redirect(result.url as never);
}

// ─────────────── Registro ───────────────

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    privacy: formData.get("privacy") ?? undefined,
  };
  const keep = { name: raw.name, email: raw.email };
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: keep };

  let userId: string;
  try {
    const res = await auth.api.signUpEmail({
      body: { name: parsed.data.name, email: parsed.data.email, password: parsed.data.password, callbackURL: "/verificado" },
      headers: await headers(),
    });
    userId = res.user.id;
  } catch (e) {
    const code = apiErrorCode(e);
    if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      return { fields: { email: "YA_EXISTE" }, values: keep };
    }
    if (code === "PASSWORD_NOT_ACCEPTABLE") return { fields: { password: "Esa contraseña es demasiado común. Elige otra." }, values: keep };
    if (code === "TOO_MANY_REQUESTS" || code === "429") return { error: TOO_MANY, values: keep };
    logger.error("sign_up_failed", { error: e });
    return { error: { title: "No hemos podido crear la cuenta.", detail: "Vuelve a intentarlo en unos minutos." }, values: keep };
  }

  await recordPrivacyConsent(userId);
  redirect("/mira-tu-correo");
}

/** Reenvía el email de verificación de la persona que tiene la sesión abierta. */
export async function resendVerificationAction(): Promise<FormState> {
  const actor = await requireActor();
  if (actor.emailVerified) return { done: true };
  try {
    await auth.api.sendVerificationEmail({ body: { email: actor.email, callbackURL: "/verificado" }, headers: await headers() });
  } catch (e) {
    if (apiErrorCode(e) === "TOO_MANY_REQUESTS" || apiErrorCode(e) === "429") return { error: TOO_MANY };
    logger.error("resend_verification_failed", { error: e });
    return { error: { title: "No hemos podido reenviarlo.", detail: "Vuelve a intentarlo en unos minutos." } };
  }
  return { done: true };
}

// ─────────────── Recuperar contraseña ───────────────

export async function requestResetAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = requestResetSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values: raw };
  try {
    await auth.api.requestPasswordReset({ body: { email: parsed.data.email, redirectTo: "/nueva-contrasena" }, headers: await headers() });
  } catch (e) {
    const code = apiErrorCode(e);
    if (code === "TOO_MANY_REQUESTS" || code === "429") return { error: TOO_MANY, values: raw };
    logger.error("request_reset_failed", { error: e });
  }
  // Siempre la misma respuesta, exista o no la cuenta (no revela quién está registrado).
  return { done: true, values: { email: parsed.data.email } };
}

export async function resetPasswordAction(_: FormState, formData: FormData): Promise<FormState> {
  const raw = { token: String(formData.get("token") ?? ""), password: String(formData.get("password") ?? "") };
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await auth.api.resetPassword({ body: { token: parsed.data.token, newPassword: parsed.data.password }, headers: await headers() });
  } catch (e) {
    const code = apiErrorCode(e);
    if (code === "PASSWORD_NOT_ACCEPTABLE") return { fields: { password: "Esa contraseña es demasiado común. Elige otra." } };
    if (code === "INVALID_TOKEN" || code === "BAD_REQUEST") redirect("/nueva-contrasena?error=INVALID_TOKEN");
    logger.error("reset_password_failed", { error: e });
    return { error: { title: "No hemos podido guardarla.", detail: "Vuelve a intentarlo en unos minutos." } };
  }
  redirect("/entrar?aviso=contrasena_cambiada");
}

// ─────────────── Salir ───────────────

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/entrar");
}

// ─────────────── Aviso de privacidad (cuentas creadas con Google) ───────────────

export async function acceptPrivacyAction(): Promise<void> {
  const actor = await requireActor();
  await recordPrivacyConsent(actor.userId);
  redirect(AFTER_SIGN_IN);
}
