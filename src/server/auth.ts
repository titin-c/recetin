import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { v7 as uuidv7 } from "uuid";
import { db } from "./db";
import { env, isGoogleEnabled } from "./env";
import { logger } from "./logger";
import { sendEmailInBackground } from "./email";
import { resetPasswordMessage, verifyEmailMessage } from "./email/templates";
import { isPasswordAcceptable, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/modules/identity";
import { setupNewUser } from "@/modules/identity/server";

const DAY = 60 * 60 * 24;

/** Rutas de Better Auth que reciben una contraseña nueva: aplican nuestras reglas (no solo la longitud). */
const PASSWORD_PATHS = new Set(["/sign-up/email", "/reset-password", "/set-password", "/change-password"]);

export const auth = betterAuth({
  appName: "RECETÍN",
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),

  advanced: {
    database: { generateId: () => uuidv7() },
    cookiePrefix: "recetin",
    useSecureCookies: env.NODE_ENV === "production",
  },

  user: {
    additionalFields: {
      // Solo lectura desde la API de auth: lo cambia el admin con su caso de uso auditado.
      status: { type: "string", input: false, defaultValue: "ACTIVE", returned: true },
    },
  },

  session: {
    expiresIn: 30 * DAY,
    updateAge: DAY,
    // Sin caché de sesión en cookie en Fase 1: una suspensión debe expulsar al momento (ARCHITECTURE.md §10.8).
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    autoSignIn: true,
    requireEmailVerification: false, // se puede usar la app sin verificar; se exige para publicar e invitar
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true, // «se cerrará tu sesión en los demás dispositivos»
    sendResetPassword: async ({ user, url }) => {
      await sendEmailInBackground(user.email, resetPasswordMessage(user.name, url), "reset_password");
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: DAY,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailInBackground(user.email, verifyEmailMessage(user.name, url), "verify_email");
    },
  },

  socialProviders: isGoogleEnabled
    ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET!, prompt: "select_account" } }
    : {},

  account: {
    accountLinking: {
      enabled: true,
      // Google NO se vincula solo a una cuenta de email existente: hay que entrar con la contraseña
      // y vincularlo desde Perfil › Seguridad (paso 2: «escribe tu contraseña una vez para vincular»).
      disableImplicitLinking: true,
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 3 },
      "/send-verification-email": { window: 15 * 60, max: 3 },
      "/reset-password": { window: 15 * 60, max: 5 },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (!PASSWORD_PATHS.has(ctx.path)) return;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const candidate = body.password ?? body.newPassword;
      if (typeof candidate === "string" && !isPasswordAcceptable(candidate)) {
        throw new APIError("BAD_REQUEST", { message: "PASSWORD_NOT_ACCEPTABLE" });
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        // Cuenta nueva (email o Google): preferencias, rol USER y hogar propio.
        after: async (user) => {
          await setupNewUser({ id: user.id, name: user.name });
        },
      },
    },
    session: {
      create: {
        // Una cuenta suspendida no puede abrir sesión, sea con contraseña o con Google.
        before: async (session) => {
          const user = await db.user.findUnique({ where: { id: session.userId }, select: { status: true } });
          if (user?.status === "SUSPENDED") {
            logger.warn("sign_in_blocked_suspended", { userId: session.userId });
            throw new APIError("FORBIDDEN", { message: "ACCOUNT_SUSPENDED" });
          }
        },
      },
    },
  },

  plugins: [nextCookies()], // debe ser el último: permite fijar la cookie desde Server Actions
});

export type Auth = typeof auth;
