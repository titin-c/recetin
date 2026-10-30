import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, isPasswordAcceptable } from "./domain/password";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Escribe tu email.")
  .pipe(z.email("Escribe un email válido, por ejemplo nombre@correo.es."));

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `La contraseña necesita al menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(PASSWORD_MAX_LENGTH, `La contraseña no puede pasar de ${PASSWORD_MAX_LENGTH} caracteres.`)
  .refine(isPasswordAcceptable, "Esa contraseña es demasiado común. Elige otra.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre.").max(60, "El nombre no puede pasar de 60 caracteres."),
  email,
  password: newPassword,
  privacy: z.literal("on", { error: "Necesitamos que aceptes el aviso de privacidad para crear la cuenta." }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña."),
});

export const requestResetSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: newPassword,
});

export type FieldErrors = Partial<Record<string, string>>;

/** Primer error de cada campo, listo para pintar bajo el campo. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
