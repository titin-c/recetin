import "server-only";
import type { Tx } from "@/server/db";
import { personalHouseholdName } from "../domain/household";

/**
 * Crea el hogar propio de un usuario nuevo y lo deja como hogar activo.
 * Idempotente: si ya pertenece a algún hogar, no hace nada.
 */
export async function createPersonalHousehold(tx: Tx, user: { id: string; name: string }) {
  const existing = await tx.householdMember.findFirst({ where: { userId: user.id }, select: { householdId: true } });
  if (existing) return existing.householdId;

  const household = await tx.household.create({
    data: {
      name: personalHouseholdName(user.name),
      createdById: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
    select: { id: true },
  });
  await tx.activeHousehold.upsert({
    where: { userId: user.id },
    create: { userId: user.id, householdId: household.id },
    update: {},
  });
  return household.id;
}
