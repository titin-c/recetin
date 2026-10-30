"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Drawer } from "@/ui/drawer/Drawer";
import { Modal } from "@/ui/modal/Modal";
import { Alert } from "@/ui/alert/Alert";
import { Button } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { TextField, FieldError } from "@/ui/text-field/TextField";
import { Icon } from "@/ui/icons";
import {
  changeRoleAction,
  deleteUserAction,
  openPrivateContentAction,
  reactivateAction,
  resendVerificationAction,
  sendResetAction,
  suspendAction,
  type AdminState,
} from "../actions";

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  status: "ACTIVE" | "SUSPENDED";
  suspendedReason: string | null;
  createdAt: Date;
  lastSeenAt: Date | null;
  isAdmin: boolean;
  isSelf: boolean;
  providers: string[];
  households: { name: string; role: "OWNER" | "MEMBER" }[];
};

const fmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" });

export function UserDrawer({ user: u, closeHref }: { user: User; closeHref: string }) {
  const router = useRouter();
  const [modal, setModal] = useState<null | "suspend" | "delete" | "private">(null);
  const close = () => setModal(null);
  const closing = (fn: (s: AdminState, fd: FormData) => Promise<AdminState>) => async (s: AdminState, fd: FormData) => {
    const r = await fn(s, fd);
    if (r.ok) close();
    return r;
  };
  const [role, roleAction] = useActionState<AdminState, FormData>(changeRoleAction, {});
  const [sus, susAction] = useActionState<AdminState, FormData>(closing(suspendAction), {});
  const [del, delAction] = useActionState<AdminState, FormData>(deleteUserAction, {});

  return (
    <Drawer
      title={u.name}
      onClose={() => router.push(closeHref as never, { scroll: false })}
      footer={
        <>
          {!u.emailVerified && (
            <form action={resendVerificationAction}>
              <input type="hidden" name="userId" value={u.id} />
              <SubmitButton variant="secondary" size="sm" full={false} pendingLabel="Enviando…">
                <Icon.mail size={16} /> Reenviar verificación
              </SubmitButton>
            </form>
          )}
          {u.providers.includes("credential") && (
            <form action={sendResetAction}>
              <input type="hidden" name="userId" value={u.id} />
              <SubmitButton variant="secondary" size="sm" full={false} pendingLabel="Enviando…">
                <Icon.key size={16} /> Enviar recuperación
              </SubmitButton>
            </form>
          )}
          {!u.isSelf &&
            (u.status === "ACTIVE" ? (
              <Button variant="danger" size="sm" icon={<Icon.ban size={16} />} onClick={() => setModal("suspend")}>
                Suspender…
              </Button>
            ) : (
              <form action={reactivateAction}>
                <input type="hidden" name="userId" value={u.id} />
                <SubmitButton variant="secondary" size="sm" full={false} pendingLabel="Reactivando…">
                  Reactivar
                </SubmitButton>
              </form>
            ))}
          {!u.isSelf && (
            <Button variant="ghost" size="sm" className="text-error" onClick={() => setModal("delete")}>
              Eliminar cuenta…
            </Button>
          )}
        </>
      }
    >
      <p>
        {u.status === "SUSPENDED" ? (
          <span className="border border-error-border px-2 text-[13px] font-medium text-error">Suspendido</span>
        ) : !u.emailVerified ? (
          <span className="border border-warning px-2 text-[13px] font-medium text-warning">Sin verificar</span>
        ) : (
          <span className="border border-text px-2 text-[13px] font-medium">Activo</span>
        )}
        {u.isSelf && <span className="ml-2 text-sm text-text-2">(eres tú)</span>}
      </p>
      {u.status === "SUSPENDED" && u.suspendedReason && <p className="mt-2 text-sm text-text-2">Motivo: {u.suspendedReason}</p>}
      <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-3 gap-y-2.5 text-sm">
        <dt className="text-text-2">Email</dt>
        <dd className="break-all">{u.email}</dd>
        <dt className="text-text-2">Alta</dt>
        <dd>{fmt.format(new Date(u.createdAt))}</dd>
        <dt className="text-text-2">Último acceso</dt>
        <dd>{u.lastSeenAt ? fmt.format(new Date(u.lastSeenAt)) : "Nunca"}</dd>
        <dt className="text-text-2">Acceso</dt>
        <dd>{u.providers.map((p) => (p === "google" ? "Google" : "Email")).join(" + ") || "—"}</dd>
        <dt className="text-text-2">Hogares</dt>
        <dd>{u.households.map((h) => `${h.name} (${h.role === "OWNER" ? "propietario/a" : "miembro"})`).join(", ") || "—"}</dd>
      </dl>

      <form action={roleAction} className="mt-6">
        <input type="hidden" name="userId" value={u.id} />
        <label htmlFor="rol" className="mb-1.5 block text-sm font-medium">
          Rol
        </label>
        <div className="flex gap-2">
          <select
            id="rol"
            name="role"
            defaultValue={u.isAdmin ? "ADMIN" : "USER"}
            className="min-h-12 flex-1 border border-border-field bg-field px-3 text-base"
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <SubmitButton variant="secondary" full={false} pendingLabel="Guardando…">
            Cambiar rol
          </SubmitButton>
        </div>
        <FieldError id="rol-error">{role.error}</FieldError>
      </form>

      <h3 className="mt-8 font-body text-base font-medium">Contenido privado</h3>
      <p className="mt-1.5 text-sm text-text-2">
        Abrir sus preferencias, objetivos y hogares (y, más adelante, recetas, menús y listas) queda registrado en la auditoría.
      </p>
      <Button size="sm" className="mt-3" icon={<Icon.eye size={16} />} onClick={() => setModal("private")}>
        Ver contenido privado…
      </Button>

      <Modal open={modal === "private"} onClose={close} title={`¿Ver el contenido privado de ${u.name}?`}>
        <form action={openPrivateContentAction}>
          <input type="hidden" name="userId" value={u.id} />
          <p className="mt-2 text-sm">
            Quedará registrado en la auditoría con tu nombre, la fecha y la hora. Hazlo solo para mantener la app o resolver un problema.
          </p>
          <SubmitButton pendingLabel="Abriendo…" className="mt-6">
            Ver y registrarlo
          </SubmitButton>
          <Button variant="ghost" full className="mt-2" onClick={close}>
            Cancelar
          </Button>
        </form>
      </Modal>

      <Modal open={modal === "suspend"} onClose={close} title={`Suspender a ${u.name}`}>
        <form action={susAction} noValidate>
          <input type="hidden" name="userId" value={u.id} />
          <p className="mt-2 text-sm">
            No podrá entrar y se cerrarán sus sesiones al momento. Sus recetas publicadas dejarán de verse en la comunidad; quien las guardó
            las conserva. Podrás reactivarlo cuando quieras.
          </p>
          <TextField
            name="reason"
            label="Motivo (queda en la auditoría)"
            required
            error={sus.fields?.reason}
            defaultValue={sus.values?.reason}
            autoComplete="off"
          />
          {sus.error && (
            <Alert tone="error" title="No se ha suspendido." className="mt-4">
              {sus.error}
            </Alert>
          )}
          <SubmitButton variant="danger-solid" pendingLabel="Suspendiendo…" className="mt-6">
            Suspender
          </SubmitButton>
          <Button variant="ghost" full className="mt-2" onClick={close}>
            Cancelar
          </Button>
        </form>
      </Modal>

      <Modal open={modal === "delete"} onClose={close} title={`¿Eliminar la cuenta de ${u.name}?`}>
        <form action={delAction} noValidate>
          <input type="hidden" name="userId" value={u.id} />
          <p className="mt-2 text-sm">
            Se borran sus datos personales y los hogares donde solo está esa persona. En los hogares compartidos donde era la única
            propietaria, la propiedad pasa al miembro más antiguo. <b className="font-medium">No se puede deshacer.</b>
          </p>
          <TextField
            name="reason"
            label="Motivo"
            required
            error={del.fields?.reason}
            defaultValue={del.values?.reason}
            autoComplete="off"
          />
          <TextField
            name="confirmEmail"
            label={`Escribe ${u.email} para confirmar`}
            required
            error={del.fields?.confirmEmail}
            defaultValue={del.values?.confirmEmail}
            autoComplete="off"
          />
          {del.error && (
            <Alert tone="error" title="No se ha eliminado." className="mt-4">
              {del.error}
            </Alert>
          )}
          <SubmitButton variant="danger-solid" pendingLabel="Eliminando…" className="mt-6">
            <Icon.trash size={16} /> Eliminar cuenta
          </SubmitButton>
          <Button variant="ghost" full className="mt-2" onClick={close}>
            Cancelar
          </Button>
        </form>
      </Modal>
    </Drawer>
  );
}
