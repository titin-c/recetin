import "server-only";
import { db } from "@/server/db";
import { DomainError } from "@/lib/errors";
import type { Actor } from "@/modules/access";

export async function getProfile(actor: Actor) {
  const [user, nutrients, sessions] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: actor.userId },
      select: {
        name: true,
        email: true,
        emailVerified: true,
        preferences: true,
        nutritionGoals: { select: { target: true, nutrient: { select: { code: true } } } },
        accounts: { select: { providerId: true } },
      },
    }),
    db.nutrient.findMany({ orderBy: { sortBy: "asc" }, select: { id: true, code: true, label: true, unit: true } }),
    db.session.count({ where: { userId: actor.userId, expiresAt: { gt: new Date() } } }),
  ]);
  const goals = Object.fromEntries(user.nutritionGoals.map((g) => [g.nutrient.code, Number(g.target)]));
  return {
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    preferences: user.preferences ?? {
      units: "METRIC" as const,
      defaultServings: null,
      theme: "SYSTEM" as const,
      publicProfile: false,
      onboardingDone: false,
    },
    goals,
    nutrients,
    hasPassword: user.accounts.some((a) => a.providerId === "credential"),
    hasGoogle: user.accounts.some((a) => a.providerId === "google"),
    activeSessions: sessions,
  };
}

/** Guarda los objetivos: crea/actualiza los que tienen valor y borra los vacíos. Solo nutrientes del catálogo. */
async function saveGoals(userId: string, goals: Record<string, number | null>) {
  const nutrients = await db.nutrient.findMany({ where: { code: { in: Object.keys(goals) } }, select: { id: true, code: true } });
  await db.$transaction(
    nutrients.map((n) =>
      goals[n.code] === null
        ? db.nutritionGoal.deleteMany({ where: { userId, nutrientId: n.id } })
        : db.nutritionGoal.upsert({
            where: { userId_nutrientId: { userId, nutrientId: n.id } },
            create: { userId, nutrientId: n.id, target: goals[n.code]! },
            update: { target: goals[n.code]! },
          }),
    ),
  );
}

export async function updateProfile(
  actor: Actor,
  data: {
    name: string;
    units: "METRIC" | "HOUSEHOLD";
    theme: "SYSTEM" | "LIGHT" | "DARK";
    defaultServings: number | null;
    publicProfile: boolean;
  },
  goals: Record<string, number | null>,
) {
  await db.user.update({
    where: { id: actor.userId },
    data: {
      name: data.name,
      preferences: {
        upsert: {
          create: { units: data.units, theme: data.theme, defaultServings: data.defaultServings, publicProfile: data.publicProfile },
          update: { units: data.units, theme: data.theme, defaultServings: data.defaultServings, publicProfile: data.publicProfile },
        },
      },
    },
  });
  await saveGoals(actor.userId, goals);
}

/** Bienvenida: guarda lo que se haya elegido (todo opcional) y la da por hecha. */
export async function completeOnboarding(actor: Actor, data: { units?: "METRIC" | "HOUSEHOLD"; goals?: Record<string, number | null> }) {
  await db.userPreferences.upsert({
    where: { userId: actor.userId },
    create: { userId: actor.userId, units: data.units ?? "METRIC", onboardingDone: true },
    update: { ...(data.units ? { units: data.units } : {}), onboardingDone: true },
  });
  if (data.goals) await saveGoals(actor.userId, data.goals);
}

export async function setUnitsDuringOnboarding(actor: Actor, units: "METRIC" | "HOUSEHOLD") {
  await db.userPreferences.upsert({ where: { userId: actor.userId }, create: { userId: actor.userId, units }, update: { units } });
}

export async function isOnboardingDone(actor: Actor) {
  const p = await db.userPreferences.findUnique({ where: { userId: actor.userId }, select: { onboardingDone: true } });
  return Boolean(p?.onboardingDone);
}

export async function getTheme(userId: string) {
  const p = await db.userPreferences.findUnique({ where: { userId }, select: { theme: true } });
  return p?.theme ?? "SYSTEM";
}

/**
 * La persona elimina su propia cuenta (paso 2). Antes:
 *  - si es la única propietaria de un hogar con más miembros, debe pasar la propiedad;
 *  - los hogares donde solo está ella se borran con la cuenta.
 */
export async function deleteOwnAccount(actor: Actor, confirmEmail: string) {
  if (confirmEmail !== actor.email) throw new DomainError("Escribe tu email exactamente para confirmar.", "confirmEmail");
  await db.$transaction(async (tx) => {
    const memberships = await tx.householdMember.findMany({
      where: { userId: actor.userId },
      select: { role: true, household: { select: { id: true, name: true, members: { select: { userId: true, role: true } } } } },
    });
    const blocking = memberships.filter(
      (m) => m.role === "OWNER" && m.household.members.length > 1 && m.household.members.filter((x) => x.role === "OWNER").length === 1,
    );
    if (blocking.length) {
      throw new DomainError(
        `Antes de eliminar tu cuenta, pasa la propiedad de ${blocking.map((b) => `«${b.household.name}»`).join(", ")} a otra persona (Perfil › Hogares).`,
      );
    }
    const soloHouseholds = memberships.filter((m) => m.household.members.length === 1).map((m) => m.household.id);
    await tx.household.deleteMany({ where: { id: { in: soloHouseholds } } });
    await tx.user.delete({ where: { id: actor.userId } });
  });
}
