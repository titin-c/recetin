import "server-only";
import { z } from "zod";

/**
 * Variables de entorno validadas al arrancar. Si falta algo obligatorio, la app
 * no arranca y dice qué falta (en vez de fallar más tarde con un error confuso).
 * Plantilla con todas las variables: .env.example
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "Falta DATABASE_URL (conexión a PostgreSQL)"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),

  // Acceso con Google (opcional mientras no se cree el cliente OAuth).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Email: en producción Resend; en desarrollo, SMTP local (Mailpit) o consola.
  EMAIL_FROM: z.string().default("RECETÍN <no-responder@localhost>"),
  // Forzar un transporte concreto (p. ej. «console» para probar la build de producción en local).
  EMAIL_DRIVER: z.enum(["resend", "smtp", "console"]).optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(1025),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Configuración incompleta. Revisa tu .env:\n${issues}`);
}

export const env = parsed.data;
export const isGoogleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
