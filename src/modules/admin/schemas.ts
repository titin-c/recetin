import { z } from "zod";

export const USER_STATUS_FILTERS = ["activo", "suspendido", "sin-verificar", "sin-verificar-7"] as const;

/** Filtros de la tabla de usuarios (vienen de la URL: siempre validados). */
export const userListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  estado: z.enum(USER_STATUS_FILTERS).optional().catch(undefined),
  rol: z.enum(["USER", "ADMIN"]).optional().catch(undefined),
  acceso: z.enum(["google", "email"]).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
  usuario: z.uuid().optional().catch(undefined),
});
export type UserListQuery = z.infer<typeof userListQuerySchema>;

export const auditQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  accion: z.string().trim().max(60).optional().catch(undefined),
  desde: z.iso.date().optional().catch(undefined),
  hasta: z.iso.date().optional().catch(undefined),
  /** Cursor «fecha|id» de la última fila vista (paginación por cursor, ARCHITECTURE.md §10.3). */
  tras: z.string().max(80).optional().catch(undefined),
  antes: z.string().max(80).optional().catch(undefined),
});
export type AuditQuery = z.infer<typeof auditQuerySchema>;

const reason = z
  .string()
  .trim()
  .min(3, "Escribe un motivo (queda en la auditoría).")
  .max(500, "El motivo no puede pasar de 500 caracteres.");

export const suspendSchema = z.object({ userId: z.uuid(), reason });
export const reactivateSchema = z.object({ userId: z.uuid() });
export const roleSchema = z.object({ userId: z.uuid(), role: z.enum(["USER", "ADMIN"]) });
export const adminDeleteSchema = z.object({ userId: z.uuid(), reason, confirmEmail: z.string().trim().toLowerCase() });
export const userIdSchema = z.object({ userId: z.uuid() });
