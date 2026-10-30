"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { auth } from "@/server/auth";
import { flash } from "@/server/flash";
import { logger } from "@/server/logger";
import { isGoogleEnabled } from "@/server/env";
import { requireActor } from "@/server/session";
import { DomainError } from "@/lib/errors";
import {
  changePasswordSchema,
  deleteAccountSchema,
  fieldErrors,
  goalsFromForm,
  goalsSchema,
  profileSchema,
  setPasswordSchema,
  type FieldErrors,
} from "@/modules/identity/schemas";
import { deleteOwnAccount, updateProfile } from "@/modules/identity/server";
import {
  deleteHouseholdSchema,
  householdIdSchema,
  householdNameSchema,
  inviteSchema,
  leaveSchema,
  memberRoleSchema,
  memberSchema,
  renameSchema,
} from "@/modules/households/schemas";
import {
  acceptInvitation,
  changeMemberRole,
  createHousehold,
  deleteHousehold,
  inviteMember,
  leaveHousehold,
  removeMember,
  renameHousehold,
  revokeInvitation,
  setActiveHousehold,
} from "@/modules/households/server";

export type ActionState = { ok?: boolean; error?: string; fields?: FieldErrors };

const THEME_COOKIE = "recetin_theme";

/** Convierte errores de negocio en mensajes para el usuario; el resto se registra y se generaliza. */
function toState(e: unknown, event: string): ActionState {
  if (e instanceof DomainError) return e.field ? { fields: { [e.field]: e.message } } : { error: e.message };
  logger.error(event, { error: e });
  return { error: "No se ha podido guardar. Vuelve a intentarlo en unos minutos." };
}

function form(fd: FormData, ...keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, fd.get(k) ?? undefined]));
}

// ─────────────── Hogar activo ───────────────

export async function switchHouseholdAction(fd: FormData) {
  const actor = await requireActor();
  const { householdId } = householdIdSchema.parse(form(fd, "householdId"));
  const name = await setActiveHousehold(actor, householdId);
  await flash(`Ahora estás en «${name}»`);
  revalidatePath("/", "layout");
}

// ─────────────── Perfil › Datos ───────────────

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = profileSchema.safeParse({
    ...form(fd, "name", "units", "theme", "defaultServings"),
    publicProfile: fd.get("publicProfile") === "on",
  });
  const goals = goalsSchema.safeParse(goalsFromForm(fd));
  if (!parsed.success || !goals.success) {
    return {
      fields: { ...(parsed.success ? {} : fieldErrors(parsed.error)), ...(goals.success ? {} : { goals: goals.error.issues[0]?.message }) },
    };
  }
  try {
    await updateProfile(actor, parsed.data, goals.data);
  } catch (e) {
    return toState(e, "update_profile_failed");
  }
  (await cookies()).set(THEME_COOKIE, parsed.data.theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
  await flash("Cambios guardados");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─────────────── Perfil › Seguridad ───────────────

export async function linkGoogleAction() {
  await requireActor();
  if (!isGoogleEnabled) redirect("/perfil/seguridad");
  const res = await auth.api.linkSocialAccount({
    body: { provider: "google", callbackURL: "/perfil/seguridad" },
    headers: await headers(),
  });
  redirect(res.url as never);
}

export async function setPasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireActor();
  const parsed = setPasswordSchema.safeParse(form(fd, "password"));
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await auth.api.setPassword({ body: { newPassword: parsed.data.password }, headers: await headers() });
  } catch (e) {
    if (e instanceof APIError) return { fields: { password: "No se ha podido guardar esa contraseña. Prueba con otra." } };
    return toState(e, "set_password_failed");
  }
  await flash("Contraseña añadida. Ya puedes entrar también con tu email.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePasswordAction(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireActor();
  const parsed = changePasswordSchema.safeParse(form(fd, "currentPassword", "password"));
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await auth.api.changePassword({
      body: { currentPassword: parsed.data.currentPassword, newPassword: parsed.data.password, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (e) {
    if (e instanceof APIError) return { fields: { currentPassword: "La contraseña actual no es correcta." } };
    return toState(e, "change_password_failed");
  }
  await flash("Contraseña cambiada. Hemos cerrado tu sesión en los demás dispositivos.");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function signOutOthersAction() {
  await requireActor();
  await auth.api.revokeOtherSessions({ headers: await headers() });
  await flash("Sesión cerrada en los demás dispositivos");
  revalidatePath("/", "layout");
}

export async function deleteAccountAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const { confirmEmail } = deleteAccountSchema.parse(form(fd, "confirmEmail"));
  try {
    await deleteOwnAccount(actor, confirmEmail);
  } catch (e) {
    return toState(e, "delete_account_failed");
  }
  (await cookies()).delete(THEME_COOKIE);
  redirect("/entrar?aviso=cuenta_eliminada");
}

// ─────────────── Hogares ───────────────

export async function createHouseholdAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = householdNameSchema.safeParse(fd.get("name"));
  if (!parsed.success) return { fields: { name: parsed.error.issues[0]?.message } };
  const h = await createHousehold(actor, parsed.data);
  await flash(`Has creado «${h.name}». Ahora estás en este hogar.`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function renameHouseholdAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = renameSchema.safeParse(form(fd, "householdId", "name"));
  if (!parsed.success) return { fields: { name: parsed.error.issues[0]?.message } };
  try {
    await renameHousehold(actor, parsed.data.householdId, parsed.data.name);
  } catch (e) {
    return toState(e, "rename_household_failed");
  }
  await flash("Nombre del hogar cambiado");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function inviteAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = inviteSchema.safeParse(form(fd, "householdId", "email"));
  if (!parsed.success) return { fields: fieldErrors(parsed.error) };
  try {
    await inviteMember(actor, parsed.data.householdId, parsed.data.email);
  } catch (e) {
    return toState(e, "invite_failed");
  }
  await flash(`Invitación enviada a ${parsed.data.email}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function revokeInvitationAction(fd: FormData) {
  const actor = await requireActor();
  await revokeInvitation(actor, String(fd.get("invitationId")));
  await flash("Invitación anulada");
  revalidatePath("/", "layout");
}

export async function changeMemberRoleAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = memberRoleSchema.safeParse(form(fd, "householdId", "userId", "role"));
  if (!parsed.success) return { error: "Datos no válidos." };
  try {
    await changeMemberRole(actor, parsed.data.householdId, parsed.data.userId, parsed.data.role);
  } catch (e) {
    return toState(e, "change_member_role_failed");
  }
  await flash("Rol cambiado");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMemberAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = memberSchema.safeParse(form(fd, "householdId", "userId"));
  if (!parsed.success) return { error: "Datos no válidos." };
  try {
    await removeMember(actor, parsed.data.householdId, parsed.data.userId);
  } catch (e) {
    return toState(e, "remove_member_failed");
  }
  await flash("Persona quitada del hogar");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function leaveHouseholdAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = leaveSchema.safeParse({ householdId: fd.get("householdId"), transferTo: fd.get("transferTo") || undefined });
  if (!parsed.success) return { error: "Datos no válidos." };
  try {
    await leaveHousehold(actor, parsed.data.householdId, parsed.data.transferTo);
  } catch (e) {
    return toState(e, "leave_household_failed");
  }
  await flash("Has salido del hogar");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteHouseholdAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const actor = await requireActor();
  const parsed = deleteHouseholdSchema.safeParse(form(fd, "householdId", "confirmName"));
  if (!parsed.success) return { error: "Datos no válidos." };
  try {
    await deleteHousehold(actor, parsed.data.householdId, parsed.data.confirmName);
  } catch (e) {
    return toState(e, "delete_household_failed");
  }
  await flash("Hogar borrado");
  revalidatePath("/", "layout");
  return { ok: true };
}

// ─────────────── Invitación ───────────────

export async function acceptInvitationAction(fd: FormData) {
  const actor = await requireActor();
  const token = String(fd.get("token") ?? "");
  try {
    const name = await acceptInvitation(actor, token);
    await flash(`Te has unido a «${name}». Ahora estás en este hogar.`);
  } catch (e) {
    if (e instanceof DomainError) redirect(`/invitacion/${encodeURIComponent(token)}?error=1` as never);
    throw e;
  }
  redirect("/biblioteca");
}
