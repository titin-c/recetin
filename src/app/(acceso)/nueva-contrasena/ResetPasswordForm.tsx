"use client";

import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { PasswordField } from "@/ui/password-field/PasswordField";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { resetPasswordAction, type FormState } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <form action={action} noValidate>
      <input type="hidden" name="token" value={token} />
      {state.error && (
        <Alert tone="error" title={state.error.title} className="mt-6">
          {state.error.detail}
        </Alert>
      )}
      <PasswordField label="Nueva contraseña" isNew error={state.fields?.password} autoFocus />
      <SubmitButton pendingLabel="Guardando…" className="mt-6">
        Guardar contraseña
      </SubmitButton>
      <p className="mt-4 text-xs text-text-2">Al guardarla se cerrará tu sesión en todos los dispositivos y entrarás con la nueva.</p>
    </form>
  );
}
