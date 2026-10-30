"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { TextField } from "@/ui/text-field/TextField";
import { PasswordField } from "@/ui/password-field/PasswordField";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { signInAction, type FormState } from "../actions";

export function SignInForm() {
  const [state, action] = useActionState<FormState, FormData>(signInAction, {});
  return (
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
        placeholder="tu@email.es"
        defaultValue={state.values?.email}
        error={state.fields?.email}
      />
      <PasswordField error={state.fields?.password} autoFocus={Boolean(state.error)} />
      <Link href="/recuperar" className="link mt-3 inline-block text-sm">
        ¿Olvidaste tu contraseña?
      </Link>
      <SubmitButton pendingLabel="Entrando…" className="mt-6">
        Entrar
      </SubmitButton>
    </form>
  );
}
