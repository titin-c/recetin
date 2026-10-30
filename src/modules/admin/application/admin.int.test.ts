import { describe, expect, it } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { db } from "@/server/db";
import { setupNewUser } from "@/modules/identity/server";
import { PERMISSIONS, ROLE_PERMISSIONS, type Actor } from "@/modules/access";
import { changeUserRole, deleteUserAsAdmin, listAudit, listUsers, reactivateUser, suspendUser, viewPrivateContent } from "./admin";

async function newUser(name: string, opts: { admin?: boolean; verified?: boolean; createdDaysAgo?: number } = {}) {
  const u = await db.user.create({
    data: {
      id: uuidv7(),
      name,
      email: `${name.toLowerCase()}-${uuidv7()}@test.es`,
      emailVerified: opts.verified ?? true,
      createdAt: new Date(Date.now() - (opts.createdDaysAgo ?? 0) * 86_400_000),
    },
  });
  await setupNewUser(u);
  if (opts.admin) {
    const role = await db.role.findUniqueOrThrow({ where: { code: "ADMIN" } });
    await db.userRole.create({ data: { userId: u.id, roleId: role.id } });
  }
  return u;
}

const adminActor = (u: { id: string; name: string; email: string }): Actor => ({
  userId: u.id,
  name: u.name,
  email: u.email,
  emailVerified: true,
  roles: ["ADMIN"],
  permissions: ROLE_PERMISSIONS.ADMIN,
  households: {},
  activeHouseholdId: null,
});
const userActor = (u: { id: string; name: string; email: string }): Actor => ({ ...adminActor(u), roles: ["USER"], permissions: [] });

describe("administración (BD real)", () => {
  it("un usuario normal no puede usar ningún caso de uso de admin", async () => {
    const pepe = await newUser("Pepe");
    const a = userActor(pepe);
    await expect(listUsers(a, {})).rejects.toThrow(/No existe o no tienes acceso/);
    await expect(suspendUser(a, pepe.id, "motivo")).rejects.toThrow(/No existe o no tienes acceso/);
    await expect(listAudit(a, {})).rejects.toThrow(/No existe o no tienes acceso/);
    await expect(viewPrivateContent(a, pepe.id)).rejects.toThrow(/No existe o no tienes acceso/);
  });

  it("suspender cierra todas sus sesiones, queda en la auditoría con el motivo, y se puede reactivar", async () => {
    const toni = await newUser("Toni", { admin: true });
    const pepe = await newUser("Pepe");
    await db.session.create({ data: { id: uuidv7(), token: uuidv7(), userId: pepe.id, expiresAt: new Date(Date.now() + 86_400_000) } });

    await suspendUser(adminActor(toni), pepe.id, "spam en recetas");
    expect((await db.user.findUniqueOrThrow({ where: { id: pepe.id } })).status).toBe("SUSPENDED");
    expect(await db.session.count({ where: { userId: pepe.id } })).toBe(0);
    const log = await db.auditLog.findFirstOrThrow({ where: { action: "USER_SUSPENDED", targetId: pepe.id } });
    expect(log).toMatchObject({ actorId: toni.id, actorLabel: "Toni", reason: "spam en recetas" });

    await reactivateUser(adminActor(toni), pepe.id);
    expect((await db.user.findUniqueOrThrow({ where: { id: pepe.id } })).status).toBe("ACTIVE");
  });

  it("no puede suspenderse a sí mismo ni quitar el rol al último administrador", async () => {
    const toni = await newUser("Toni", { admin: true });
    await expect(suspendUser(adminActor(toni), toni.id, "prueba")).rejects.toThrow(/propia cuenta/);
    await expect(changeUserRole(adminActor(toni), toni.id, "USER")).rejects.toThrow(/al menos un administrador/);
    const ana = await newUser("Ana");
    await changeUserRole(adminActor(toni), ana.id, "ADMIN");
    await changeUserRole(adminActor(toni), toni.id, "USER"); // ahora sí: queda Ana
    const log = await db.auditLog.findMany({ where: { action: "ROLE_CHANGED" }, orderBy: { createdAt: "asc" } });
    expect(log.map((l) => l.after)).toEqual([{ rol: "ADMIN" }, { rol: "USER" }]);
  });

  it("ver contenido privado deja SIEMPRE una entrada en la auditoría", async () => {
    const toni = await newUser("Toni", { admin: true });
    const javi = await newUser("Javi");
    const content = await viewPrivateContent(adminActor(toni), javi.id);
    expect(content.memberships).toHaveLength(1);
    await viewPrivateContent(adminActor(toni), javi.id);
    expect(await db.auditLog.count({ where: { action: "PRIVATE_CONTENT_VIEWED", targetId: javi.id, actorId: toni.id } })).toBe(2);
  });

  it("eliminar como admin: exige el email, pasa la propiedad de hogares compartidos y conserva la auditoría", async () => {
    const toni = await newUser("Toni", { admin: true });
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const casa = (await db.householdMember.findFirstOrThrow({ where: { userId: marta.id } })).householdId;
    await db.householdMember.create({ data: { householdId: casa, userId: javi.id, role: "MEMBER" } });

    await expect(deleteUserAsAdmin(adminActor(toni), marta.id, "otro@test.es", "lo pidió")).rejects.toThrow(/exactamente/);
    await deleteUserAsAdmin(adminActor(toni), marta.id, marta.email, "lo pidió por email");

    expect(await db.user.count({ where: { id: marta.id } })).toBe(0);
    expect(
      (await db.householdMember.findUniqueOrThrow({ where: { householdId_userId: { householdId: casa, userId: javi.id } } })).role,
    ).toBe("OWNER");
    const { rows } = await listAudit(adminActor(toni), { accion: "USER_DELETED" });
    expect(rows[0]).toMatchObject({ targetLabel: "Marta", reason: "lo pidió por email", actorLabel: "Toni" });
  });

  it("filtra usuarios por estado, rol y búsqueda, con total y páginas", async () => {
    const toni = await newUser("Toni", { admin: true });
    await newUser("Pepito", { verified: false, createdDaysAgo: 10 });
    await newUser("Lucía", { verified: false, createdDaysAgo: 1 });
    const a = adminActor(toni);
    expect((await listUsers(a, { estado: "sin-verificar-7" })).users.map((u) => u.name)).toEqual(["Pepito"]);
    expect((await listUsers(a, { estado: "sin-verificar" })).total).toBe(2);
    expect((await listUsers(a, { rol: "ADMIN" })).users.map((u) => u.name)).toEqual(["Toni"]);
    expect((await listUsers(a, { q: "LUC" })).users.map((u) => u.name)).toEqual(["Lucía"]);
    expect((await listUsers(a, {})).pages).toBe(1);
  });

  it("la auditoría pagina por cursor sin saltarse ni repetir filas", async () => {
    const toni = await newUser("Toni", { admin: true });
    const pepe = await newUser("Pepe");
    const a = adminActor(toni);
    for (let i = 0; i < 30; i++) await viewPrivateContent(a, pepe.id);
    const p1 = await listAudit(a, {});
    expect(p1.rows).toHaveLength(25);
    expect(p1.prevCursor).toBeNull();
    const p2 = await listAudit(a, { tras: p1.nextCursor! });
    expect(p2.rows).toHaveLength(5);
    expect(p2.nextCursor).toBeNull();
    const ids = new Set([...p1.rows, ...p2.rows].map((r) => r.id));
    expect(ids.size).toBe(30);
    const back = await listAudit(a, { antes: p2.prevCursor! });
    expect(back.rows.map((r) => r.id)).toEqual(p1.rows.map((r) => r.id));
  });

  it("los permisos del admin incluyen todo lo que usa el panel", () => {
    expect(ROLE_PERMISSIONS.ADMIN).toEqual(expect.arrayContaining(Object.values(PERMISSIONS)));
  });
});
