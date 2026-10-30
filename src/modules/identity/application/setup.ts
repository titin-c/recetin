import "server-only";
import { db } from "@/server/db";
import { createPersonalHousehold } from "@/modules/households/server";
import { ROLES } from "@/modules/access";

/** Versión vigente del aviso de privacidad (cambiarla obliga a aceptarlo de nuevo). */
export const PRIVACY_VERSION = "2026-10-30";

/**
 * Prepara una cuenta recién creada (email o Google): preferencias, rol USER y hogar propio.
 * Idempotente: se puede volver a llamar sin duplicar nada.
 */
export async function setupNewUser(user: { id: string; name: string }) {
  await db.$transaction(async (tx) => {
    await tx.userPreferences.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
    const role = await tx.role.findUniqueOrThrow({ where: { code: ROLES.USER }, select: { id: true } });
    await tx.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
    await createPersonalHousehold(tx, user);
  });
}

export async function recordPrivacyConsent(userId: string) {
  await db.privacyConsent.upsert({
    where: { userId_version: { userId, version: PRIVACY_VERSION } },
    create: { userId, version: PRIVACY_VERSION },
    update: {},
  });
}

export async function hasCurrentPrivacyConsent(userId: string): Promise<boolean> {
  const row = await db.privacyConsent.findUnique({
    where: { userId_version: { userId, version: PRIVACY_VERSION } },
    select: { id: true },
  });
  return Boolean(row);
}
