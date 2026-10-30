import "server-only";
import { unstable_cache } from "next/cache";
import { db, type Tx } from "@/server/db";
import { DomainError, ForbiddenError } from "@/lib/errors";
import { canRemoveAdminRole, hasPermission, PERMISSIONS, ROLES, type Actor, type PermissionCode } from "@/modules/access";
import { AUDIT_ACTIONS, recordAudit } from "@/modules/audit/server";
import type { Prisma } from "@/generated/prisma/client";
import type { AuditQuery, UserListQuery } from "../schemas";
import { decodeCursor, encodeCursor } from "../domain/cursor";

export const USERS_PAGE_SIZE = 20;
export const AUDIT_PAGE_SIZE = 25;
const DAY = 24 * 60 * 60 * 1000;

function require(actor: Actor, permission: PermissionCode) {
  if (!hasPermission(actor, permission)) throw new ForbiddenError();
}
const who = (actor: Actor) => ({ userId: actor.userId, name: actor.name });

// ─────────────── Inicio: colas y cifras ───────────────

/** Cifras del panel: en paralelo y cacheadas 60 s (ARCHITECTURE.md §10.4). No son datos en tiempo real. */
const cachedStats = unstable_cache(
  async () => {
    const since = new Date(Date.now() - 30 * DAY);
    const [activeUsers, households, totalUsers] = await Promise.all([
      db.user.count({ where: { status: "ACTIVE", lastSeenAt: { gte: since } } }),
      db.household.count(),
      db.user.count(),
    ]);
    return { activeUsers, households, totalUsers };
  },
  ["admin-stats"],
  { revalidate: 60 },
);

export async function getDashboard(actor: Actor) {
  require(actor, PERMISSIONS.ADMIN_PANEL);
  const [stats, unverifiedOld] = await Promise.all([
    cachedStats(),
    db.user.count({ where: { emailVerified: false, createdAt: { lt: new Date(Date.now() - 7 * DAY) } } }),
  ]);
  return { stats, queues: { unverifiedOld } };
}

// ─────────────── Usuarios ───────────────

function userWhere(q: UserListQuery): Prisma.UserWhereInput {
  const and: Prisma.UserWhereInput[] = [];
  if (q.q) and.push({ OR: [{ name: { contains: q.q, mode: "insensitive" } }, { email: { contains: q.q, mode: "insensitive" } }] });
  if (q.estado === "activo") and.push({ status: "ACTIVE" });
  if (q.estado === "suspendido") and.push({ status: "SUSPENDED" });
  if (q.estado === "sin-verificar") and.push({ emailVerified: false });
  if (q.estado === "sin-verificar-7") and.push({ emailVerified: false, createdAt: { lt: new Date(Date.now() - 7 * DAY) } });
  if (q.rol) and.push({ roles: { some: { role: { code: q.rol } } } });
  if (q.acceso === "google") and.push({ accounts: { some: { providerId: "google" } } });
  if (q.acceso === "email") and.push({ accounts: { some: { providerId: "credential" } } });
  return and.length ? { AND: and } : {};
}

export async function listUsers(actor: Actor, q: UserListQuery) {
  require(actor, PERMISSIONS.USERS_READ);
  const where = userWhere(q);
  const page = q.pagina ?? 1;
  const [total, rows] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: [{ lastSeenAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      skip: (page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        status: true,
        lastSeenAt: true,
        roles: { select: { role: { select: { code: true } } } },
        accounts: { select: { providerId: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      status: u.status,
      lastSeenAt: u.lastSeenAt,
      isAdmin: u.roles.some((r) => r.role.code === ROLES.ADMIN),
      providers: u.accounts.map((a) => a.providerId),
    })),
  };
}

export async function getUserDetail(actor: Actor, userId: string) {
  require(actor, PERMISSIONS.USERS_READ);
  const u = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      status: true,
      suspendedReason: true,
      createdAt: true,
      lastSeenAt: true,
      roles: { select: { role: { select: { code: true } } } },
      accounts: { select: { providerId: true } },
      memberships: { select: { role: true, household: { select: { name: true } } } },
    },
  });
  if (!u) return null;
  return {
    ...u,
    isAdmin: u.roles.some((r) => r.role.code === ROLES.ADMIN),
    providers: u.accounts.map((a) => a.providerId),
    households: u.memberships.map((m) => ({ name: m.household.name, role: m.role })),
    isSelf: u.id === actor.userId,
  };
}

async function activeAdminCount(tx: Tx) {
  return tx.user.count({ where: { status: "ACTIVE", roles: { some: { role: { code: ROLES.ADMIN } } } } });
}

export async function changeUserRole(actor: Actor, userId: string, role: "USER" | "ADMIN") {
  require(actor, PERMISSIONS.ROLES_MANAGE);
  await db.$transaction(async (tx) => {
    const [admin, user] = await Promise.all([
      tx.role.findUniqueOrThrow({ where: { code: ROLES.ADMIN } }),
      tx.user.findUnique({ where: { id: userId }, select: { id: true, roles: { select: { role: { select: { code: true } } } } } }),
    ]);
    if (!user) throw new ForbiddenError();
    const isAdmin = user.roles.some((r) => r.role.code === ROLES.ADMIN);
    if ((role === "ADMIN") === isAdmin) return;
    if (role === "USER") {
      if (!canRemoveAdminRole(isAdmin, await activeAdminCount(tx))) throw new DomainError("Tiene que quedar al menos un administrador.");
      await tx.userRole.delete({ where: { userId_roleId: { userId, roleId: admin.id } } });
    } else {
      await tx.userRole.create({ data: { userId, roleId: admin.id } });
    }
    await recordAudit(tx, {
      actor: who(actor),
      action: AUDIT_ACTIONS.ROLE_CHANGED,
      targetType: "USER",
      targetId: userId,
      before: { rol: isAdmin ? "ADMIN" : "USER" },
      after: { rol: role },
    });
  });
}

/** Suspender: no puede entrar y se cierran todas sus sesiones al momento. Sus recetas públicas dejan de verse (Fase 6). */
export async function suspendUser(actor: Actor, userId: string, reason: string) {
  require(actor, PERMISSIONS.USERS_MANAGE);
  if (userId === actor.userId) throw new DomainError("No puedes suspender tu propia cuenta.");
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { status: true, roles: { select: { role: { select: { code: true } } } } },
    });
    if (!user) throw new ForbiddenError();
    if (user.status === "SUSPENDED") return;
    const isAdmin = user.roles.some((r) => r.role.code === ROLES.ADMIN);
    if (isAdmin && !canRemoveAdminRole(true, await activeAdminCount(tx)))
      throw new DomainError("Tiene que quedar al menos un administrador activo.");
    await tx.user.update({ where: { id: userId }, data: { status: "SUSPENDED", suspendedReason: reason } });
    await tx.session.deleteMany({ where: { userId } });
    await recordAudit(tx, { actor: who(actor), action: AUDIT_ACTIONS.USER_SUSPENDED, targetType: "USER", targetId: userId, reason });
  });
}

export async function reactivateUser(actor: Actor, userId: string) {
  require(actor, PERMISSIONS.USERS_MANAGE);
  await db.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, status: "SUSPENDED" },
      data: { status: "ACTIVE", suspendedReason: null },
    });
    if (!updated.count) return;
    await recordAudit(tx, { actor: who(actor), action: AUDIT_ACTIONS.USER_REACTIVATED, targetType: "USER", targetId: userId });
  });
}

/** Deja constancia de que el admin ha enviado un email al usuario (el envío lo hace Better Auth en la acción). */
export async function auditEmailSent(actor: Actor, userId: string, kind: "reset" | "verification") {
  require(actor, PERMISSIONS.USERS_MANAGE);
  await db.$transaction((tx) =>
    recordAudit(tx, {
      actor: who(actor),
      action: kind === "reset" ? AUDIT_ACTIONS.PASSWORD_RESET_SENT : AUDIT_ACTIONS.VERIFICATION_RESENT,
      targetType: "USER",
      targetId: userId,
    }),
  );
}

export async function getUserEmail(actor: Actor, userId: string) {
  require(actor, PERMISSIONS.USERS_MANAGE);
  const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true } });
  if (!u) throw new ForbiddenError();
  return u;
}

/**
 * Eliminar una cuenta como admin (paso 2): escribir su email + motivo.
 * Los hogares donde solo estaba se borran; en los compartidos donde era la única persona
 * propietaria, la propiedad pasa al miembro más antiguo (el admin no bloquea por eso).
 */
export async function deleteUserAsAdmin(actor: Actor, userId: string, confirmEmail: string, reason: string) {
  require(actor, PERMISSIONS.USERS_MANAGE);
  if (userId === actor.userId) throw new DomainError("Para eliminar tu propia cuenta, hazlo desde Perfil › Seguridad.");
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
        roles: { select: { role: { select: { code: true } } } },
        memberships: {
          select: {
            role: true,
            household: { select: { id: true, members: { orderBy: { joinedAt: "asc" }, select: { userId: true, role: true } } } },
          },
        },
      },
    });
    if (!user) throw new ForbiddenError();
    if (confirmEmail !== user.email) throw new DomainError(`Escribe ${user.email} exactamente para confirmar.`, "confirmEmail");
    if (user.roles.some((r) => r.role.code === ROLES.ADMIN) && !canRemoveAdminRole(true, await activeAdminCount(tx)))
      throw new DomainError("Tiene que quedar al menos un administrador.");

    for (const m of user.memberships) {
      const others = m.household.members.filter((x) => x.userId !== userId);
      if (others.length === 0) {
        await tx.household.delete({ where: { id: m.household.id } });
      } else if (m.role === "OWNER" && !others.some((x) => x.role === "OWNER")) {
        await tx.householdMember.update({
          where: { householdId_userId: { householdId: m.household.id, userId: others[0].userId } },
          data: { role: "OWNER" },
        });
      }
    }
    await tx.user.delete({ where: { id: userId } });
    await recordAudit(tx, {
      actor: who(actor),
      action: AUDIT_ACTIONS.USER_DELETED,
      targetType: "USER",
      targetId: userId,
      before: { nombre: user.name },
      reason,
    });
  });
}

/**
 * Contenido privado de un usuario (paso 2: el admin puede verlo todo, y cada acceso queda registrado).
 * En la Fase 1 el contenido privado son preferencias, objetivos y hogares; las recetas, menús y
 * listas se añadirán aquí en sus fases.
 */
export async function viewPrivateContent(actor: Actor, userId: string) {
  require(actor, PERMISSIONS.PRIVATE_CONTENT_READ);
  return db.$transaction(async (tx) => {
    const u = await tx.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        preferences: true,
        nutritionGoals: { select: { target: true, nutrient: { select: { label: true, unit: true } } } },
        memberships: {
          select: {
            role: true,
            household: { select: { name: true, members: { select: { role: true, user: { select: { name: true } } } } } },
          },
        },
      },
    });
    if (!u) throw new ForbiddenError();
    await recordAudit(tx, {
      actor: who(actor),
      action: AUDIT_ACTIONS.PRIVATE_CONTENT_VIEWED,
      targetType: "USER",
      targetId: userId,
      after: { secciones: ["preferencias", "objetivos", "hogares"] },
    });
    return u;
  });
}

// ─────────────── Auditoría ───────────────

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: "Suspender cuenta",
  USER_REACTIVATED: "Reactivar cuenta",
  USER_DELETED: "Eliminar cuenta",
  ROLE_CHANGED: "Cambiar rol",
  PASSWORD_RESET_SENT: "Enviar recuperación",
  VERIFICATION_RESENT: "Reenviar verificación",
  PRIVATE_CONTENT_VIEWED: "Ver contenido privado",
};

/** Paginación por cursor, sin total exacto (ARCHITECTURE.md §10.3). */
export async function listAudit(actor: Actor, q: AuditQuery) {
  require(actor, PERMISSIONS.AUDIT_READ);
  const after = decodeCursor(q.tras);
  const before = decodeCursor(q.antes);
  const filters: Prisma.AuditLogWhereInput[] = [];
  if (q.accion && q.accion in AUDIT_ACTION_LABELS) filters.push({ action: q.accion });
  if (q.q)
    filters.push({ OR: [{ actorLabel: { contains: q.q, mode: "insensitive" } }, { reason: { contains: q.q, mode: "insensitive" } }] });
  if (q.desde) filters.push({ createdAt: { gte: new Date(`${q.desde}T00:00:00Z`) } });
  if (q.hasta) filters.push({ createdAt: { lt: new Date(new Date(`${q.hasta}T00:00:00Z`).getTime() + DAY) } });
  if (after) filters.push({ OR: [{ createdAt: { lt: after.createdAt } }, { createdAt: after.createdAt, id: { lt: after.id } }] });
  if (before) filters.push({ OR: [{ createdAt: { gt: before.createdAt } }, { createdAt: before.createdAt, id: { gt: before.id } }] });

  const rows = await db.auditLog.findMany({
    where: { AND: filters },
    orderBy: before ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
    take: AUDIT_PAGE_SIZE + 1,
    select: {
      id: true,
      createdAt: true,
      actorLabel: true,
      action: true,
      targetType: true,
      targetId: true,
      before: true,
      after: true,
      reason: true,
    },
  });
  const hasMore = rows.length > AUDIT_PAGE_SIZE;
  const page = rows.slice(0, AUDIT_PAGE_SIZE);
  if (before) page.reverse();

  // Nombre del usuario afectado (una consulta para toda la página, sin N+1).
  const targetIds = [...new Set(page.filter((r) => r.targetType === "USER" && r.targetId).map((r) => r.targetId!))];
  const targets = await db.user.findMany({ where: { id: { in: targetIds } }, select: { id: true, name: true } });
  const names = new Map(targets.map((t) => [t.id, t.name]));

  const first = page[0];
  const last = page.at(-1);
  return {
    rows: page.map((r) => ({
      ...r,
      actionLabel: AUDIT_ACTION_LABELS[r.action] ?? r.action,
      targetLabel: r.targetId ? (names.get(r.targetId) ?? (r.before as { nombre?: string } | null)?.nombre ?? "Usuario eliminado") : "—",
    })),
    // Hay página siguiente (más antigua) si al ir hacia atrás quedaban más, o si venimos de «Anteriores».
    nextCursor: last && (before ? true : hasMore) ? encodeCursor(last.createdAt, last.id) : null,
    prevCursor: first && (before ? hasMore : Boolean(after)) ? encodeCursor(first.createdAt, first.id) : null,
  };
}
