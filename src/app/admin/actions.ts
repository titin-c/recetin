"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { flash } from "@/server/flash";
import { logger } from "@/server/logger";
import { requireActor } from "@/server/session";
import { DomainError } from "@/lib/errors";
import { fieldErrors, type FieldErrors } from "@/modules/identity/schemas";
import { adminDeleteSchema, reactivateSchema, roleSchema, suspendSchema, userIdSchema } from "@/modules/admin/schemas";
import { auditEmailSent, changeUserRole, deleteUserAsAdmin, getUserEmail, reactivateUser, suspendUser } from "@/modules/admin/server";

/** `values`: lo que se escribió, para volver a pintarlo si hay error (React vacía el formulario tras cada envío). */
export type AdminState = { ok?: boolean; error?: string; fields?: FieldErrors; values?: Record<string, string> };

function toState(e: unknown, event: string): AdminState {
  if (e instanceof DomainError) return e.field ? { fields: { [e.field]: e.message } } : { error: e.message };
  logger.error(event, { error: e });
  return { error: "No se ha podido completar. Vuelve a intentarlo en unos minutos." };
}
const get = (fd: FormData, ...keys: string[]) => Object.fromEntries(keys.map((k) => [k, fd.get(k) ?? undefined]));
const typed = (fd: FormData, ...keys: string[]) => Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
const withValues = (st: AdminState, values: Record<string, string>): AdminState => (st.ok ? st : { ...st, values });

export async function changeRoleAction(_: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireActor();
  const parsed = roleSchema.safeParse(get(fd, "userId", "role"));
  if (!parsed.success) return { error: "Datos no válidos." };
  try {
    await changeUserRole(actor, parsed.data.userId, parsed.data.role);
  } catch (e) {
    return toState(e, "admin_change_role_failed");
  }
  await flash("Rol cambiado");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function suspendAction(_: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireActor();
  const values = typed(fd, "reason");
  const parsed = suspendSchema.safeParse(get(fd, "userId", "reason"));
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  try {
    await suspendUser(actor, parsed.data.userId, parsed.data.reason);
  } catch (e) {
    return withValues(toState(e, "admin_suspend_failed"), values);
  }
  await flash("Cuenta suspendida");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function reactivateAction(fd: FormData) {
  const actor = await requireActor();
  const { userId } = reactivateSchema.parse(get(fd, "userId"));
  await reactivateUser(actor, userId);
  await flash("Cuenta reactivada");
  revalidatePath("/admin", "layout");
}

export async function sendResetAction(fd: FormData) {
  const actor = await requireActor();
  const { userId } = userIdSchema.parse(get(fd, "userId"));
  const { email } = await getUserEmail(actor, userId);
  await auth.api.requestPasswordReset({ body: { email, redirectTo: "/nueva-contrasena" }, headers: await headers() });
  await auditEmailSent(actor, userId, "reset");
  await flash("Email de recuperación enviado");
  revalidatePath("/admin", "layout");
}

export async function resendVerificationAction(fd: FormData) {
  const actor = await requireActor();
  const { userId } = userIdSchema.parse(get(fd, "userId"));
  const { email, emailVerified } = await getUserEmail(actor, userId);
  if (!emailVerified) {
    await auth.api.sendVerificationEmail({ body: { email, callbackURL: "/verificado" }, headers: await headers() });
    await auditEmailSent(actor, userId, "verification");
  }
  await flash(emailVerified ? "Ese email ya está verificado" : "Email de verificación reenviado");
  revalidatePath("/admin", "layout");
}

export async function deleteUserAction(_: AdminState, fd: FormData): Promise<AdminState> {
  const actor = await requireActor();
  const values = typed(fd, "reason", "confirmEmail");
  const parsed = adminDeleteSchema.safeParse(get(fd, "userId", "reason", "confirmEmail"));
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  try {
    await deleteUserAsAdmin(actor, parsed.data.userId, parsed.data.confirmEmail, parsed.data.reason);
  } catch (e) {
    return withValues(toState(e, "admin_delete_failed"), values);
  }
  await flash("Cuenta eliminada");
  redirect("/admin/usuarios");
}

/** Abrir el contenido privado solo con una acción explícita (nunca por precarga de un enlace). La página lo audita. */
export async function openPrivateContentAction(fd: FormData) {
  await requireActor();
  const { userId } = userIdSchema.parse(get(fd, "userId"));
  redirect(`/admin/usuarios/${userId}/privado` as never);
}
