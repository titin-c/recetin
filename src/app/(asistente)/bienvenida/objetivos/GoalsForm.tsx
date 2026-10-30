"use client";

import { useActionState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { TextField } from "@/ui/text-field/TextField";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { finishOnboardingAction, type OnboardingState } from "../../actions";

export function GoalsForm({ nutrients }: { nutrients: { code: string; label: string; unit: string }[] }) {
  const [state, action] = useActionState<OnboardingState, FormData>(finishOnboardingAction, {});
  return (
    <form action={action} noValidate>
      {state.error && (
        <Alert tone="error" title="Revisa los objetivos." className="mt-6">
          {state.error}
        </Alert>
      )}
      {nutrients.map((n) => (
        <TextField
          key={n.code}
          name={`goal_${n.code}`}
          label={`${n.label} al día (${n.unit})`}
          inputMode="decimal"
          placeholder={n.code === "ENERGY_KCAL" ? "Ej. 2000" : "Ej. 90"}
        />
      ))}
      <p className="mt-3 text-sm text-text-2">Puedes añadir más (fibra, sal…) desde tu perfil.</p>
      <SubmitButton pendingLabel="Guardando…" className="mt-8">
        Terminar
      </SubmitButton>
    </form>
  );
}
