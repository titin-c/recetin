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

const optionalNumber = (max: number, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0 && v <= max), `${label}: escribe un número mayor que 0 y hasta ${max}.`);

/** Objetivos: un campo por nutriente («goal_ENERGY_KCAL»…). Vacío = sin objetivo. */
export const goalsSchema = z.record(z.string(), optionalNumber(20000, "Objetivo"));

export const preferencesSchema = z.object({
  units: z.enum(["METRIC", "HOUSEHOLD"]),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre.").max(60, "El nombre no puede pasar de 60 caracteres."),
  units: z.enum(["METRIC", "HOUSEHOLD"]),
  theme: z.enum(["SYSTEM", "LIGHT", "DARK"]),
  defaultServings: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine(
      (v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 50),
      "Comensales habituales: un número entero entre 1 y 50, o vacío.",
    ),
  publicProfile: z.boolean(),
});

export const setPasswordSchema = z.object({ password: newPassword });
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Escribe tu contraseña actual."),
  password: newPassword,
});
export const deleteAccountSchema = z.object({ confirmEmail: z.string().trim().toLowerCase() });

/** Lee los campos «goal_<CODIGO>» de un formulario. */
export function goalsFromForm(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (k.startsWith("goal_")) out[k.slice(5)] = String(v);
  return out;
}
