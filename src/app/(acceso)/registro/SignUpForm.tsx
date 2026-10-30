"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { TextField } from "@/ui/text-field/TextField";
import { PasswordField } from "@/ui/password-field/PasswordField";
import { Checkbox } from "@/ui/checkbox/Checkbox";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { signUpAction, type FormState } from "../actions";

export function SignUpForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const emailTaken = state.fields?.email === "YA_EXISTE";
  return (
    <form action={action} noValidate>
      {next && <input type="hidden" name="siguiente" value={next} />}
      {state.error && (
        <Alert tone="error" title={state.error.title} className="mt-6">
          {state.error.detail}
        </Alert>
      )}
      <TextField
        name="name"
        label="Nombre"
        autoComplete="given-name"
        required
        maxLength={60}
        defaultValue={state.values?.name}
        error={state.fields?.name}
      />
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={emailTaken ? "Ya hay una cuenta con este email." : state.fields?.email}
        hint={
          emailTaken ? (
            <>
              <Link href="/entrar" className="link">
                Entra
              </Link>{" "}
              o{" "}
              <Link href="/recuperar" className="link">
                recupera tu contraseña
              </Link>
              .
            </>
          ) : undefined
        }
      />
      <PasswordField isNew error={state.fields?.password} />
      <Checkbox name="privacy" required error={state.fields?.privacy}>
        He leído el{" "}
        <Link href="/privacidad" className="link" target="_blank">
          aviso de privacidad
        </Link>
        . Entiendo que los administradores pueden acceder a mi contenido para mantener la app y que cada acceso queda registrado.
      </Checkbox>
      <SubmitButton pendingLabel="Creando tu cuenta…" className="mt-6">
        Crear cuenta
      </SubmitButton>
    </form>
  );
}
