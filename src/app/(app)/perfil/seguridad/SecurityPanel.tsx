"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { Button } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { PasswordField } from "@/ui/password-field/PasswordField";
import { TextField } from "@/ui/text-field/TextField";
import { Modal } from "@/ui/modal/Modal";
import { Icon } from "@/ui/icons";
import { signOutAction } from "../../../(acceso)/actions";
import {
  changePasswordAction,
  deleteAccountAction,
  linkGoogleAction,
  setPasswordAction,
  signOutOthersAction,
  type ActionState,
} from "../../actions";

export function SecurityPanel({
  email,
  hasPassword,
  hasGoogle,
  googleEnabled,
  activeSessions,
  googleError,
}: {
  email: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  googleEnabled: boolean;
  activeSessions: number;
  googleError?: string;
}) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwd, pwdAction] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await (hasPassword ? changePasswordAction : setPasswordAction)(prev, fd);
    if (r.ok) setPasswordOpen(false);
    return r;
  }, {});
  const [del, delAction] = useActionState<ActionState, FormData>(deleteAccountAction, {});

  return (
    <div className="max-w-2xl">
      {googleError && (
        <Alert tone="error" title="No se ha podido vincular Google." className="mt-6">
          {googleError === "email_doesn't_match" || googleError.includes("email")
            ? "La cuenta de Google tiene un email distinto al de RECETÍN. Usa la cuenta de Google con tu mismo email."
            : "Vuelve a intentarlo en unos minutos."}
        </Alert>
      )}

      <h2 className="mt-6 text-xl">Formas de entrar</h2>
      <ul className="mt-2">
        <li className="flex items-center gap-3 border-b border-border py-3">
          <Icon.user />
          <span className="flex-1">
            Google
            <small className="block text-[13px] text-text-2">
              {hasGoogle ? email : googleEnabled ? "Sin vincular" : "El acceso con Google aún no está configurado"}
            </small>
          </span>
          {hasGoogle ? (
            <span className="border border-text px-2 text-[13px] font-medium leading-relaxed">Vinculada</span>
          ) : (
            googleEnabled && (
              <form action={linkGoogleAction}>
                <SubmitButton variant="ghost" size="sm" full={false} pendingLabel="Abriendo Google…">
                  Vincular
                </SubmitButton>
              </form>
            )
          )}
        </li>
        <li className="flex items-center gap-3 border-b border-border py-3">
          <Icon.key />
          <span className="flex-1">
            Contraseña
            <small className="block text-[13px] text-text-2">
              {hasPassword ? "Puedes entrar con tu email y contraseña" : "Aún no tienes"}
            </small>
          </span>
          {!passwordOpen && (
            <Button variant="ghost" size="sm" onClick={() => setPasswordOpen(true)}>
              {hasPassword ? "Cambiar" : "Añadir"}
            </Button>
          )}
        </li>
      </ul>

      {passwordOpen && (
        <form action={pwdAction} className="mt-4 border border-border bg-surface p-4" noValidate>
          <h3 className="text-lg">{hasPassword ? "Cambiar contraseña" : "Añadir contraseña"}</h3>
          {hasPassword && <PasswordField name="currentPassword" label="Contraseña actual" error={pwd.fields?.currentPassword} autoFocus />}
          <PasswordField
            label={hasPassword ? "Nueva contraseña" : "Contraseña"}
            isNew
            error={pwd.fields?.password}
            autoFocus={!hasPassword}
          />
          {pwd.error && (
            <Alert tone="error" title="No se ha guardado." className="mt-4">
              {pwd.error}
            </Alert>
          )}
          {hasPassword && <p className="mt-3 text-sm text-text-2">Al cambiarla se cerrará tu sesión en los demás dispositivos.</p>}
          <div className="mt-4 flex gap-3">
            <SubmitButton pendingLabel="Guardando…" full={false}>
              Guardar contraseña
            </SubmitButton>
            <Button variant="ghost" onClick={() => setPasswordOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <h2 className="mt-8 text-xl">Sesiones</h2>
      <p className="mt-2 text-sm text-text-2">
        Tienes la sesión abierta en {activeSessions} {activeSessions === 1 ? "dispositivo" : "dispositivos"}.
      </p>
      {activeSessions > 1 && (
        <form action={signOutOthersAction}>
          <SubmitButton variant="secondary" pendingLabel="Cerrando…" className="mt-3">
            <Icon.logout />
            Cerrar sesión en los demás
          </SubmitButton>
        </form>
      )}
      <form action={signOutAction}>
        <SubmitButton variant="ghost" pendingLabel="Saliendo…" className="mt-2">
          Cerrar sesión aquí
        </SubmitButton>
      </form>

      <h2 className="mt-10 text-xl">Tu cuenta</h2>
      <Button variant="danger" full className="mt-3" onClick={() => setDeleteOpen(true)}>
        Eliminar mi cuenta…
      </Button>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="¿Eliminar tu cuenta?">
        <form action={delAction} noValidate>
          <p className="mt-2 text-sm">
            Se borran tus datos personales, tus preferencias y objetivos, y los hogares donde solo estás tú. Si compartes un hogar donde
            eres la única persona propietaria, antes tendrás que pasar la propiedad. <b className="font-medium">No se puede deshacer.</b>
          </p>
          <TextField
            name="confirmEmail"
            label={`Escribe ${email} para confirmar`}
            autoComplete="off"
            required
            error={del.fields?.confirmEmail}
          />
          {del.error && (
            <Alert tone="error" title="No se ha eliminado." className="mt-4">
              {del.error}
            </Alert>
          )}
          <SubmitButton variant="danger-solid" pendingLabel="Eliminando…" className="mt-6">
            Eliminar mi cuenta
          </SubmitButton>
          <Button variant="ghost" full className="mt-2" onClick={() => setDeleteOpen(false)}>
            Cancelar
          </Button>
        </form>
      </Modal>
    </div>
  );
}
