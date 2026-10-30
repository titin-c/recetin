import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { db } from "./db";
import type { Actor, HouseholdRoleCode, PermissionCode, RoleCode } from "@/modules/access";

const LAST_SEEN_THROTTLE_MS = 60 * 60 * 1000;

/**
 * Quién hace la petición. Una sola consulta para roles, permisos y hogares, memorizada
 * durante la petición con `cache()` (ARCHITECTURE.md §10.1): cualquier componente o
 * acción puede llamarla sin repetir consultas.
 * Devuelve null si no hay sesión o la cuenta está suspendida.
 */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      status: true,
      lastSeenAt: true,
      roles: { select: { role: { select: { code: true, permissions: { select: { permission: { select: { code: true } } } } } } } },
      memberships: { select: { householdId: true, role: true } },
      activeHousehold: { select: { householdId: true } },
    },
  });
  if (!user || user.status === "SUSPENDED") return null;

  // «Último acceso» para el admin, como mucho una escritura por hora y usuario.
  if (!user.lastSeenAt || Date.now() - user.lastSeenAt.getTime() > LAST_SEEN_THROTTLE_MS) {
    await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  }

  const roles = user.roles.map((r) => r.role.code as RoleCode);
  const permissions = [...new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code as PermissionCode)))];
  const households = Object.fromEntries(user.memberships.map((m) => [m.householdId, m.role as HouseholdRoleCode]));
  const active = user.activeHousehold?.householdId;

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    roles,
    permissions,
    households,
    activeHouseholdId: active && active in households ? active : (user.memberships[0]?.householdId ?? null),
  };
});

/** Igual que getActor, pero manda a /entrar si no hay sesión (para páginas y acciones protegidas). */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/entrar");
  return actor;
}
