import { describe, expect, it } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { db } from "@/server/db";
import { hasCurrentPrivacyConsent, recordPrivacyConsent, setupNewUser } from "./setup";

async function createUser(name = "Javi Pérez") {
  return db.user.create({ data: { id: uuidv7(), name, email: `${uuidv7()}@test.es` } });
}

describe("alta de cuenta (BD real)", () => {
  it("crea preferencias, rol USER y el hogar propio activo", async () => {
    const user = await createUser();
    await setupNewUser(user);

    const full = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      include: {
        preferences: true,
        roles: { include: { role: true } },
        memberships: { include: { household: true } },
        activeHousehold: true,
      },
    });
    expect(full.preferences?.units).toBe("METRIC");
    expect(full.roles.map((r) => r.role.code)).toEqual(["USER"]);
    expect(full.memberships).toHaveLength(1);
    expect(full.memberships[0]).toMatchObject({ role: "OWNER", household: { name: "Casa de Javi" } });
    expect(full.activeHousehold?.householdId).toBe(full.memberships[0].householdId);
  });

  it("es idempotente: llamarla dos veces no duplica nada", async () => {
    const user = await createUser();
    await setupNewUser(user);
    await setupNewUser(user);
    expect(await db.householdMember.count({ where: { userId: user.id } })).toBe(1);
    expect(await db.userRole.count({ where: { userId: user.id } })).toBe(1);
  });

  it("registra el aviso de privacidad una sola vez por versión", async () => {
    const user = await createUser();
    expect(await hasCurrentPrivacyConsent(user.id)).toBe(false);
    await recordPrivacyConsent(user.id);
    await recordPrivacyConsent(user.id);
    expect(await hasCurrentPrivacyConsent(user.id)).toBe(true);
    expect(await db.privacyConsent.count({ where: { userId: user.id } })).toBe(1);
  });

  it("al borrar el usuario se borran en cascada sus datos y su pertenencia a hogares", async () => {
    const user = await createUser();
    await setupNewUser(user);
    await recordPrivacyConsent(user.id);
    await db.user.delete({ where: { id: user.id } });
    expect(await db.userPreferences.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.householdMember.count({ where: { userId: user.id } })).toBe(0);
    expect(await db.privacyConsent.count({ where: { userId: user.id } })).toBe(0);
  });
});
