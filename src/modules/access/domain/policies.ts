/**
 * Políticas de autorización: funciones puras, sin base de datos ni Next.
 * Cada caso de uso las llama en el servidor con el Actor sacado de la sesión.
 */

export const ROLES = { USER: "USER", ADMIN: "ADMIN" } as const;
export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  USERS_READ: "users.read",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  AUDIT_READ: "audit.read",
  PRIVATE_CONTENT_READ: "private_content.read",
  ADMIN_PANEL: "admin.panel",
} as const;
export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Permisos de cada rol (la semilla los vuelca en la base de datos). */
export const ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  USER: [],
  ADMIN: Object.values(PERMISSIONS),
};

export type HouseholdRoleCode = "OWNER" | "MEMBER";

export type Actor = {
  userId: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roles: RoleCode[];
  permissions: PermissionCode[];
  activeHouseholdId: string | null;
  /** Rol del actor en cada hogar al que pertenece. */
  households: Record<string, HouseholdRoleCode>;
};

export function hasPermission(actor: Actor, permission: PermissionCode): boolean {
  return actor.permissions.includes(permission);
}

export function isAdmin(actor: Actor): boolean {
  return hasPermission(actor, PERMISSIONS.ADMIN_PANEL);
}

export function isHouseholdMember(actor: Actor, householdId: string): boolean {
  return householdId in actor.households;
}

export function isHouseholdOwner(actor: Actor, householdId: string): boolean {
  return actor.households[householdId] === "OWNER";
}

/** Invitar exige ser propietario y tener el email verificado (paso 2). */
export function canInviteToHousehold(actor: Actor, householdId: string): { ok: true } | { ok: false; reason: string } {
  if (!isHouseholdOwner(actor, householdId)) return { ok: false, reason: "Solo la persona propietaria del hogar puede invitar." };
  if (!actor.emailVerified) return { ok: false, reason: "Para invitar, primero verifica tu email." };
  return { ok: true };
}

/**
 * Siempre debe quedar al menos un administrador (paso 2).
 * `adminCount` es el número de administradores ACTIVOS antes del cambio.
 */
export function canRemoveAdminRole(targetIsAdmin: boolean, adminCount: number): boolean {
  return !targetIsAdmin || adminCount > 1;
}
