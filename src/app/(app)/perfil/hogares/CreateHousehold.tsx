"use client";

import { useActionState, useState } from "react";
import { Button } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { TextField } from "@/ui/text-field/TextField";
import { Icon } from "@/ui/icons";
import { createHouseholdAction, type ActionState } from "../../actions";

export function CreateHousehold() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<ActionState, FormData>(async (prev, fd) => {
    const r = await createHouseholdAction(prev, fd);
    if (r.ok) setOpen(false);
    return r;
  }, {});
  if (!open)
    return (
      <Button full className="mt-4" icon={<Icon.home />} onClick={() => setOpen(true)}>
        Crear un hogar
      </Button>
    );
  return (
    <form action={action} className="mt-4 border border-border bg-surface p-4" noValidate>
      <h2 className="text-xl">Nuevo hogar</h2>
      <TextField
        name="name"
        label="Nombre del hogar"
        placeholder="Por ejemplo, Piso de la playa"
        autoFocus
        required
        maxLength={60}
        error={state.fields?.name}
      />
      <div className="mt-4 flex gap-3">
        <SubmitButton pendingLabel="Creando…" full={false}>
          Crear
        </SubmitButton>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
