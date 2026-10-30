import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth";

// Única ruta API de la Fase 1: la gestiona Better Auth (OAuth de Google, verificación,
// enlaces de recuperación). El resto de mutaciones van por Server Actions + casos de uso.
export const { GET, POST } = toNextJsHandler(auth);
