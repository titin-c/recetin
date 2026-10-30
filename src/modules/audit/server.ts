import "server-only";
import type { Tx } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";

export const AUDIT_ACTIONS = {
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_REACTIVATED: "USER_REACTIVATED",
  USER_DELETED: "USER_DELETED",
  ROLE_CHANGED: "ROLE_CHANGED",
  PASSWORD_RESET_SENT: "PASSWORD_RESET_SENT",
  VERIFICATION_RESENT: "VERIFICATION_RESENT",
  PRIVATE_CONTENT_VIEWED: "PRIVATE_CONTENT_VIEWED",
} as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export type AuditEntry = {
  actor: { userId: string; name: string };
  action: AuditAction;
  targetType: "USER" | "HOUSEHOLD";
  targetId?: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  reason?: string;
};

/**
 * Escribe una entrada de auditoría. Se llama SIEMPRE con la transacción de la acción
 * auditada (ARCHITECTURE.md §4.5): si la acción falla, no queda rastro falso; si la
 * auditoría falla, la acción no se aplica.
 */
export async function recordAudit(tx: Tx, entry: AuditEntry) {
  await tx.auditLog.create({
    data: {
      actorId: entry.actor.userId,
      actorLabel: entry.actor.name,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      before: entry.before,
      after: entry.after,
      reason: entry.reason,
    },
  });
}
