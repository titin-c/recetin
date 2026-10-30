"use client";

import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { TextField } from "@/ui/text-field/TextField";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { Icon } from "@/ui/icons";
import { requestResetAction, type FormState } from "../actions";

export function RequestResetForm() {
  const [state, action] = useActionState<FormState, FormData>(requestResetAction, {});

  if (state.done) {
    // Pantalla 3b: mensaje neutro, igual exista o no la cuenta. El email no viaja en la URL.
    return (
      <div role="status">
        <Icon.mail size={40} className="mt-12" />
        <h1 className="mt-4">Revisa tu correo</h1>
        <p className="mt-3 text-text-2">
          Si {state.values?.email} tiene cuenta en RECETÍN, recibirás un enlace en unos minutos. Caduca en 1 hora.
        </p>
        <p className="mt-3 text-text-2">¿No llega? Mira en la carpeta de spam.</p>
        <form action={action}>
          <input type="hidden" name="email" value={state.values?.email ?? ""} />
          <SubmitButton variant="secondary" pendingLabel="Reenviando…" className="mt-8">
            Reenviar enlace
          </SubmitButton>
        </form>
      </div>
    );
  }

  return (
    <>
      <h1 className="mt-8">Recupera tu contraseña</h1>
      <p className="mt-2 text-text-2">Escribe tu email y te enviaremos un enlace para crear una nueva.</p>
      <form action={action} noValidate>
        {state.error && (
          <Alert tone="error" title={state.error.title} className="mt-6">
            {state.error.detail}
          </Alert>
        )}
        <TextField
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          inputMode="email"
          required
          className="mt-6"
          defaultValue={state.values?.email}
          error={state.fields?.email}
        />
        <SubmitButton pendingLabel="Enviando…" className="mt-6">
          Enviar enlace
        </SubmitButton>
      </form>
    </>
  );
}
