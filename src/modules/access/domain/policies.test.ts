import { describe, expect, it } from "vitest";
import { canInviteToHousehold, canRemoveAdminRole, hasPermission, isAdmin, PERMISSIONS, type Actor } from "./policies";

const actor = (over: Partial<Actor> = {}): Actor => ({
  userId: "u1",
  name: "Marta",
  email: "marta@correo.es",
  emailVerified: true,
  roles: ["USER"],
  permissions: [],
  activeHouseholdId: "h1",
  households: { h1: "OWNER", h2: "MEMBER" },
  ...over,
});

describe("políticas de acceso", () => {
  it("un usuario normal no entra en el panel de administración", () => {
    expect(isAdmin(actor())).toBe(false);
  });

  it("un administrador tiene el permiso de leer contenido privado", () => {
    const admin = actor({ roles: ["ADMIN"], permissions: [PERMISSIONS.ADMIN_PANEL, PERMISSIONS.PRIVATE_CONTENT_READ] });
    expect(isAdmin(admin)).toBe(true);
    expect(hasPermission(admin, PERMISSIONS.PRIVATE_CONTENT_READ)).toBe(true);
  });

  it("solo la persona propietaria y verificada puede invitar", () => {
    expect(canInviteToHousehold(actor(), "h1")).toEqual({ ok: true });
    expect(canInviteToHousehold(actor(), "h2").ok).toBe(false);
    expect(canInviteToHousehold(actor(), "h-ajeno").ok).toBe(false);
    const sinVerificar = canInviteToHousehold(actor({ emailVerified: false }), "h1");
    expect(sinVerificar).toEqual({ ok: false, reason: "Para invitar, primero verifica tu email." });
  });

  it("siempre queda al menos un administrador", () => {
    expect(canRemoveAdminRole(true, 1)).toBe(false);
    expect(canRemoveAdminRole(true, 2)).toBe(true);
    expect(canRemoveAdminRole(false, 1)).toBe(true);
  });
});
