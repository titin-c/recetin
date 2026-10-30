"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { Button } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { TextField } from "@/ui/text-field/TextField";
import { Modal } from "@/ui/modal/Modal";
import { Icon } from "@/ui/icons";
import {
  changeMemberRoleAction,
  deleteHouseholdAction,
  inviteAction,
  leaveHouseholdAction,
  removeMemberAction,
  renameHouseholdAction,
  revokeInvitationAction,
  switchHouseholdAction,
  type ActionState,
} from "../../actions";

type Household = {
  id: string;
  name: string;
  myRole: "OWNER" | "MEMBER";
  isActive: boolean;
  members: { role: "OWNER" | "MEMBER"; user: { id: string; name: string; email: string } }[];
  invitations: { id: string; email: string; expiresAt: Date }[];
};

const roleLabel = (r: "OWNER" | "MEMBER") => (r === "OWNER" ? "Propietario/a" : "Miembro");
const daysLeft = (d: Date) => Math.max(1, Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000));

/** Una acción con useActionState que se cierra sola al terminar bien. */
function useClosingAction(fn: (s: ActionState, fd: FormData) => Promise<ActionState>, onOk: () => void) {
  return useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await fn(prev, fd);
    if (r.ok) onOk();
    return r;
  }, {});
}

export function HouseholdCard({
  household: h,
  me,
  isOnlyHousehold,
}: {
  household: Household;
  me: { id: string; emailVerified: boolean };
  isOnlyHousehold: boolean;
}) {
  const owner = h.myRole === "OWNER";
  const owners = h.members.filter((m) => m.role === "OWNER");
  const iAmLastOwner = owner && owners.length === 1;
  const others = h.members.filter((m) => m.user.id !== me.id);
  const [modal, setModal] = useState<null | "leave" | "delete" | { remove: Household["members"][number] }>(null);
  const close = () => setModal(null);
  const [invite, inviteFormAction] = useActionState<ActionState, FormData>(inviteAction, {});
  const [renameOpen, setRenameOpen] = useState(false);
  const [rename, renameFormAction] = useClosingAction(renameHouseholdAction, () => setRenameOpen(false));
  const [leave, leaveFormAction] = useClosingAction(leaveHouseholdAction, close);
  const [del, deleteFormAction] = useClosingAction(deleteHouseholdAction, close);
  const [removal, removeFormAction] = useClosingAction(removeMemberAction, close);
  const [roleState, roleFormAction] = useActionState<ActionState, FormData>(changeMemberRoleAction, {});

  return (
    <section className="mt-4 border border-border bg-surface p-4" aria-labelledby={`h-${h.id}`}>
      <div className="flex items-center gap-3">
        <h2 id={`h-${h.id}`} className="flex-1 text-xl">
          {h.name}
        </h2>
        {h.isActive && <span className="border border-text px-2 text-[13px] font-medium leading-relaxed">Activo</span>}
      </div>
      <p className="mt-1 text-xs text-text-2">
        {owner ? "Eres propietario/a" : "Eres miembro"} · {h.members.length} {h.members.length === 1 ? "miembro" : "miembros"}
      </p>
      {roleState.error && (
        <Alert tone="error" title="No se ha cambiado." className="mt-3">
          {roleState.error}
        </Alert>
      )}

      <ul className="mt-2">
        {h.members.map((m) => (
          <li key={m.user.id} className="flex items-center gap-3 border-b border-border py-3">
            <span className="grid size-9 shrink-0 place-items-center border border-text text-sm font-medium" aria-hidden="true">
              {m.user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              {m.user.name}
              {m.user.id === me.id && " (tú)"}
              <small className="block text-[13px] text-text-2">{roleLabel(m.role)}</small>
            </span>
            {owner && m.user.id !== me.id && (
              <details className="relative">
                <summary className="min-h-10 cursor-pointer list-none px-2 py-2 text-sm font-medium text-accent underline underline-offset-[3px]">
                  Gestionar<span className="sr-only"> a {m.user.name}</span>
                </summary>
                <div className="absolute right-0 z-10 mt-1 w-60 border border-text bg-bg p-2">
                  <form action={roleFormAction}>
                    <input type="hidden" name="householdId" value={h.id} />
                    <input type="hidden" name="userId" value={m.user.id} />
                    <input type="hidden" name="role" value={m.role === "OWNER" ? "MEMBER" : "OWNER"} />
                    <SubmitButton variant="ghost" pendingLabel="Cambiando…" className="justify-start">
                      {m.role === "OWNER" ? "Pasar a miembro" : "Hacer propietario/a"}
                    </SubmitButton>
                  </form>
                  <Button variant="ghost" full className="justify-start text-error" onClick={() => setModal({ remove: m })}>
                    Quitar del hogar…
                  </Button>
                </div>
              </details>
            )}
          </li>
        ))}
        {h.invitations.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 border-b border-border py-3">
            <span className="grid size-9 shrink-0 place-items-center border border-dashed border-text-2 text-sm" aria-hidden="true">
              ?
            </span>
            <span className="min-w-0 flex-1 break-all">
              {inv.email}
              <small className="block text-[13px] text-text-2">Invitación pendiente · caduca en {daysLeft(inv.expiresAt)} días</small>
            </span>
            <form action={revokeInvitationAction}>
              <input type="hidden" name="invitationId" value={inv.id} />
              <SubmitButton variant="ghost" size="sm" full={false} pendingLabel="Anulando…">
                Anular<span className="sr-only"> la invitación a {inv.email}</span>
              </SubmitButton>
            </form>
          </li>
        ))}
      </ul>

      {owner && (
        <form action={inviteFormAction} noValidate className="mt-2">
          <input type="hidden" name="householdId" value={h.id} />
          <label htmlFor={`invitar-${h.id}`} className="mt-4 block text-sm font-medium">
            Invitar por email
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id={`invitar-${h.id}`}
              name="email"
              type="email"
              autoComplete="off"
              placeholder="email@ejemplo.es"
              disabled={!me.emailVerified}
              aria-invalid={invite.fields?.email ? true : undefined}
              aria-describedby={`invitar-${h.id}-ayuda`}
              className="min-h-12 min-w-0 flex-1 border border-border-field bg-field px-3 text-base aria-invalid:border-2 aria-invalid:border-error-border"
            />
            <SubmitButton variant="secondary" full={false} pendingLabel="Enviando…" disabled={!me.emailVerified}>
              Invitar
            </SubmitButton>
          </div>
          <p
            id={`invitar-${h.id}-ayuda`}
            className={`mt-1.5 text-sm ${invite.fields?.email || invite.error ? "text-error" : "text-text-2"}`}
          >
            {!me.emailVerified
              ? "Para invitar, primero verifica tu email."
              : (invite.fields?.email ?? invite.error ?? "Le llegará un enlace válido durante 7 días.")}
          </p>
        </form>
      )}

      {owner && renameOpen && (
        <form action={renameFormAction} className="mt-4" noValidate>
          <input type="hidden" name="householdId" value={h.id} />
          <TextField
            name="name"
            label="Nombre del hogar"
            defaultValue={h.name}
            autoFocus
            maxLength={60}
            error={rename.fields?.name ?? rename.error}
          />
          <div className="mt-3 flex gap-3">
            <SubmitButton variant="secondary" full={false} pendingLabel="Guardando…">
              Guardar nombre
            </SubmitButton>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!h.isActive && (
          <form action={switchHouseholdAction}>
            <input type="hidden" name="householdId" value={h.id} />
            <SubmitButton variant="secondary" size="sm" full={false} pendingLabel="Cambiando…">
              Cambiar a este hogar
            </SubmitButton>
          </form>
        )}
        {owner && !renameOpen && (
          <Button size="sm" variant="ghost" onClick={() => setRenameOpen(true)}>
            Cambiar nombre
          </Button>
        )}
        {!isOnlyHousehold && (
          <Button size="sm" variant="ghost" onClick={() => setModal("leave")} icon={<Icon.logout size={16} />}>
            Salir…
          </Button>
        )}
        {owner && !isOnlyHousehold && (
          <Button size="sm" variant="danger" onClick={() => setModal("delete")}>
            Borrar hogar…
          </Button>
        )}
      </div>
      {isOnlyHousehold && <p className="mt-2 text-xs text-text-2">Es tu único hogar: para salir o borrarlo, crea o únete antes a otro.</p>}

      {/* ── Salir ── */}
      <Modal
        open={modal === "leave"}
        onClose={close}
        title={iAmLastOwner && others.length ? `Antes de salir de «${h.name}»` : `¿Salir de «${h.name}»?`}
      >
        <form action={leaveFormAction}>
          <input type="hidden" name="householdId" value={h.id} />
          {iAmLastOwner && others.length > 0 ? (
            <fieldset className="mt-2">
              <legend className="text-sm text-text-2">
                Eres la única persona propietaria. Elige quién se queda a cargo, o borra el hogar.
              </legend>
              {others.map((m, i) => (
                <label
                  key={m.user.id}
                  className="mt-2 flex min-h-12 cursor-pointer items-center gap-3 border border-border-field bg-field px-3 has-[:checked]:border-2 has-[:checked]:border-accent"
                >
                  <input type="radio" name="transferTo" value={m.user.id} defaultChecked={i === 0} className="size-5" />
                  {m.user.name}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="mt-2 text-sm">Dejarás de ver su menú y su lista de la compra. Podrán volver a invitarte.</p>
          )}
          {leave.error && (
            <Alert tone="error" title="No has salido." className="mt-4">
              {leave.error}
            </Alert>
          )}
          <SubmitButton pendingLabel="Saliendo…" className="mt-6">
            {iAmLastOwner && others.length ? `Pasar a la persona elegida y salir` : "Salir del hogar"}
          </SubmitButton>
          {iAmLastOwner && (
            <Button variant="danger" full className="mt-2" onClick={() => setModal("delete")}>
              Borrar el hogar…
            </Button>
          )}
          <Button variant="ghost" full className="mt-2" onClick={close}>
            Cancelar
          </Button>
        </form>
      </Modal>

      {/* ── Borrar ── */}
      <Modal open={modal === "delete"} onClose={close} title={`¿Borrar «${h.name}»?`}>
        <form action={deleteFormAction} noValidate>
          <input type="hidden" name="householdId" value={h.id} />
          <p className="mt-2 text-sm">
            Se borrarán para siempre su menú y su lista de la compra.{" "}
            {h.members.length > 1 ? `Los ${h.members.length} miembros dejarán de verlo.` : ""} Las recetas de cada uno no se tocan.
          </p>
          <TextField
            name="confirmName"
            label={`Escribe «${h.name}» para confirmar`}
            autoComplete="off"
            required
            error={del.fields?.confirmName ?? del.error}
          />
          <SubmitButton variant="danger-solid" pendingLabel="Borrando…" className="mt-6">
            Borrar el hogar
          </SubmitButton>
          <Button variant="ghost" full className="mt-2" onClick={close}>
            Cancelar
          </Button>
        </form>
      </Modal>

      {/* ── Quitar miembro ── */}
      <Modal
        open={typeof modal === "object" && modal !== null}
        onClose={close}
        title={`¿Quitar a ${typeof modal === "object" && modal ? modal.remove.user.name : ""} del hogar?`}
      >
        {typeof modal === "object" && modal && (
          <form action={removeFormAction}>
            <input type="hidden" name="householdId" value={h.id} />
            <input type="hidden" name="userId" value={modal.remove.user.id} />
            <p className="mt-2 text-sm">
              Dejará de ver el menú y la lista de «{h.name}». Sus recetas no se tocan. Puedes volver a invitarle cuando quieras.
            </p>
            {removal.error && (
              <Alert tone="error" title="No se ha quitado." className="mt-4">
                {removal.error}
              </Alert>
            )}
            <SubmitButton variant="danger-solid" pendingLabel="Quitando…" className="mt-6">
              Quitar del hogar
            </SubmitButton>
            <Button variant="ghost" full className="mt-2" onClick={close}>
              Cancelar
            </Button>
          </form>
        )}
      </Modal>
    </section>
  );
}
