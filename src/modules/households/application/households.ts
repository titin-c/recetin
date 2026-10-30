import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db, type Tx } from "@/server/db";
import { env } from "@/server/env";
import { sendEmailInBackground } from "@/server/email";
import { householdInvitationMessage } from "@/server/email/templates";
import { DomainError, ForbiddenError } from "@/lib/errors";
import { canInviteToHousehold, isHouseholdMember, isHouseholdOwner, type Actor } from "@/modules/access";
import { canLeaveHousehold, personalHouseholdName } from "../domain/household";

export const INVITATION_DAYS = 7;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function assertMember(actor: Actor, householdId: string) {
  if (!isHouseholdMember(actor, householdId)) throw new ForbiddenError();
}
function assertOwner(actor: Actor, householdId: string) {
  assertMember(actor, householdId);
  if (!isHouseholdOwner(actor, householdId)) throw new DomainError("Solo la persona propietaria del hogar puede hacer esto.");
}

/** Deja como hogar activo uno al que pertenezca; si se ha quedado sin ninguno, le crea su hogar propio. */
async function reassignActiveHousehold(tx: Tx, userId: string) {
  const membership = await tx.householdMember.findFirst({ where: { userId }, orderBy: { joinedAt: "asc" }, select: { householdId: true } });
  let householdId = membership?.householdId;
  if (!householdId) {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } });
    const created = await tx.household.create({
      data: { name: personalHouseholdName(user.name), createdById: userId, members: { create: { userId, role: "OWNER" } } },
      select: { id: true },
    });
    householdId = created.id;
  }
  await tx.activeHousehold.upsert({ where: { userId }, create: { userId, householdId }, update: { householdId } });
}

// ─────────────── Consultas ───────────────

/** Hogares de la persona, con miembros e invitaciones pendientes (solo las ve quien es propietario). */
export async function listMyHouseholds(actor: Actor) {
  const ids = Object.keys(actor.households);
  const households = await db.household.findMany({
    where: { id: { in: ids } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      members: { orderBy: { joinedAt: "asc" }, select: { role: true, user: { select: { id: true, name: true, email: true } } } },
      invitations: {
        where: { status: "PENDING", expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, expiresAt: true },
      },
    },
  });
  return households.map((h) => ({
    ...h,
    myRole: actor.households[h.id],
    isActive: h.id === actor.activeHouseholdId,
    invitations: isHouseholdOwner(actor, h.id) ? h.invitations : [],
  }));
}

/** Nombres de los hogares para el selector de la cabecera (una sola consulta). */
export async function householdNames(actor: Actor) {
  return db.household.findMany({
    where: { id: { in: Object.keys(actor.households) } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true },
  });
}

// ─────────────── Crear, renombrar, activar ───────────────

export async function createHousehold(actor: Actor, name: string) {
  return db.$transaction(async (tx) => {
    const h = await tx.household.create({
      data: { name, createdById: actor.userId, members: { create: { userId: actor.userId, role: "OWNER" } } },
      select: { id: true, name: true },
    });
    await tx.activeHousehold.upsert({
      where: { userId: actor.userId },
      create: { userId: actor.userId, householdId: h.id },
      update: { householdId: h.id },
    });
    return h;
  });
}

export async function renameHousehold(actor: Actor, householdId: string, name: string) {
  assertOwner(actor, householdId);
  await db.household.update({ where: { id: householdId }, data: { name } });
}

export async function setActiveHousehold(actor: Actor, householdId: string) {
  assertMember(actor, householdId);
  const h = await db.household.findUniqueOrThrow({ where: { id: householdId }, select: { name: true } });
  await db.activeHousehold.upsert({
    where: { userId: actor.userId },
    create: { userId: actor.userId, householdId },
    update: { householdId },
  });
  return h.name;
}

// ─────────────── Invitaciones ───────────────

export async function inviteMember(actor: Actor, householdId: string, email: string) {
  assertMember(actor, householdId);
  const allowed = canInviteToHousehold(actor, householdId);
  if (!allowed.ok) throw new DomainError(allowed.reason);
  if (email === actor.email) throw new DomainError("No puedes invitarte a ti mismo.", "email");

  const household = await db.household.findUniqueOrThrow({
    where: { id: householdId },
    select: { name: true, members: { where: { user: { email } }, select: { userId: true } } },
  });
  if (household.members.length) throw new DomainError("Esa persona ya es miembro de este hogar.", "email");

  const token = randomBytes(32).toString("base64url");
  await db.$transaction(async (tx) => {
    // Una invitación viva por email y hogar: la anterior se anula.
    await tx.householdInvitation.updateMany({ where: { householdId, email, status: "PENDING" }, data: { status: "REVOKED" } });
    await tx.householdInvitation.create({
      data: {
        householdId,
        email,
        tokenHash: hashToken(token),
        invitedById: actor.userId,
        expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  });
  const url = `${env.APP_URL}/invitacion/${token}`;
  await sendEmailInBackground(email, householdInvitationMessage(actor.name, household.name, url), "household_invitation");
  return { email };
}

/** Datos públicos de una invitación (para la pantalla /invitacion/[token]). Nunca revela otros datos del hogar. */
export async function getInvitation(token: string) {
  const inv = await db.householdInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      email: true,
      status: true,
      expiresAt: true,
      household: { select: { id: true, name: true } },
      invitedBy: { select: { name: true } },
    },
  });
  if (!inv) return null;
  const usable = inv.status === "PENDING" && inv.expiresAt > new Date();
  return {
    email: inv.email,
    usable,
    householdId: inv.household.id,
    householdName: inv.household.name,
    inviterName: inv.invitedBy?.name ?? "Alguien",
  };
}

export async function acceptInvitation(actor: Actor, token: string) {
  return db.$transaction(async (tx) => {
    const inv = await tx.householdInvitation.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, email: true, status: true, expiresAt: true, householdId: true, household: { select: { name: true } } },
    });
    if (!inv || inv.status !== "PENDING" || inv.expiresAt <= new Date())
      throw new DomainError("Esta invitación ya no vale. Pide otra a quien te invitó.");
    // La invitación es para un email concreto: así un enlace reenviado no sirve a otra persona.
    if (inv.email !== actor.email) throw new DomainError(`Esta invitación es para ${inv.email}. Entra con esa cuenta para aceptarla.`);

    await tx.householdMember.upsert({
      where: { householdId_userId: { householdId: inv.householdId, userId: actor.userId } },
      create: { householdId: inv.householdId, userId: actor.userId, role: "MEMBER" },
      update: {},
    });
    await tx.householdInvitation.update({ where: { id: inv.id }, data: { status: "ACCEPTED" } });
    await tx.activeHousehold.upsert({
      where: { userId: actor.userId },
      create: { userId: actor.userId, householdId: inv.householdId },
      update: { householdId: inv.householdId },
    });
    return inv.household.name;
  });
}

export async function revokeInvitation(actor: Actor, invitationId: string) {
  const inv = await db.householdInvitation.findUnique({ where: { id: invitationId }, select: { householdId: true } });
  if (!inv) throw new ForbiddenError();
  assertOwner(actor, inv.householdId);
  await db.householdInvitation.update({ where: { id: invitationId }, data: { status: "REVOKED" } });
}

// ─────────────── Miembros ───────────────

export async function changeMemberRole(actor: Actor, householdId: string, userId: string, role: "OWNER" | "MEMBER") {
  assertOwner(actor, householdId);
  await db.$transaction(async (tx) => {
    const member = await tx.householdMember.findUnique({ where: { householdId_userId: { householdId, userId } } });
    if (!member) throw new ForbiddenError();
    if (member.role === "OWNER" && role === "MEMBER") {
      const owners = await tx.householdMember.count({ where: { householdId, role: "OWNER" } });
      if (owners <= 1) throw new DomainError("El hogar necesita al menos una persona propietaria.");
    }
    await tx.householdMember.update({ where: { householdId_userId: { householdId, userId } }, data: { role } });
  });
}

export async function removeMember(actor: Actor, householdId: string, userId: string) {
  assertOwner(actor, householdId);
  if (userId === actor.userId) throw new DomainError("Para irte tú, usa «Salir».");
  await db.$transaction(async (tx) => {
    const deleted = await tx.householdMember.deleteMany({ where: { householdId, userId } });
    if (!deleted.count) throw new ForbiddenError();
    const active = await tx.activeHousehold.findUnique({ where: { userId } });
    if (!active || active.householdId === householdId) await reassignActiveHousehold(tx, userId);
  });
}

/**
 * Salir de un hogar. Si eres la última persona propietaria, hay que pasar la propiedad
 * (`transferTo`) o borrar el hogar (paso 2). No puedes salir de tu único hogar.
 */
export async function leaveHousehold(actor: Actor, householdId: string, transferTo?: string) {
  assertMember(actor, householdId);
  if (Object.keys(actor.households).length <= 1) throw new DomainError("Es tu único hogar: crea o únete a otro antes de salir.");
  await db.$transaction(async (tx) => {
    const owners = await tx.householdMember.count({ where: { householdId, role: "OWNER" } });
    const myRole = actor.households[householdId];
    if (!canLeaveHousehold(myRole, owners)) {
      if (!transferTo) throw new DomainError("Eres la única persona propietaria: elige a quién pasar el hogar o bórralo.");
      const updated = await tx.householdMember.updateMany({ where: { householdId, userId: transferTo }, data: { role: "OWNER" } });
      if (!updated.count) throw new DomainError("Esa persona no es miembro del hogar.");
    }
    await tx.householdMember.delete({ where: { householdId_userId: { householdId, userId: actor.userId } } });
    if (actor.activeHouseholdId === householdId) await reassignActiveHousehold(tx, actor.userId);
  });
}

/** Borra el hogar (menú y lista incluidos, desde las fases 4 y 5). Hay que escribir su nombre exacto. */
export async function deleteHousehold(actor: Actor, householdId: string, confirmName: string) {
  assertOwner(actor, householdId);
  if (Object.keys(actor.households).length <= 1) throw new DomainError("Es tu único hogar: crea otro antes de borrarlo.");
  await db.$transaction(async (tx) => {
    const h = await tx.household.findUniqueOrThrow({
      where: { id: householdId },
      select: { name: true, members: { select: { userId: true } } },
    });
    if (confirmName.trim() !== h.name) throw new DomainError(`Escribe «${h.name}» exactamente para confirmar.`, "confirmName");
    const affected = h.members.map((m) => m.userId);
    await tx.household.delete({ where: { id: householdId } });
    for (const userId of affected) {
      const active = await tx.activeHousehold.findUnique({ where: { userId } });
      if (!active) await reassignActiveHousehold(tx, userId);
    }
  });
}
