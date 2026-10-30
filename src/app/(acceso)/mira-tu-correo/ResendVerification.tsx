"use client";

import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { resendVerificationAction, type FormState } from "../actions";

/** «No me ha llegado, reenviar»: con límite de intentos en el servidor. */
export function ResendVerification() {
  const [state, action] = useActionState<FormState>(resendVerificationAction, {});
  return (
    <form action={action} className="mt-2">
      <SubmitButton variant="ghost" pendingLabel="Reenviando…">
        No me ha llegado, reenviar
      </SubmitButton>
      <div role="status" className="mt-2">
        {state.done && <p className="text-sm">Te lo hemos enviado de nuevo. Puede tardar un par de minutos.</p>}
      </div>
      {state.error && (
        <Alert tone="error" title={state.error.title}>
          {state.error.detail}
        </Alert>
      )}
    </form>
  );
}
