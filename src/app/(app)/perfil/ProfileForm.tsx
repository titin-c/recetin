"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/ui/alert/Alert";
import { TextField } from "@/ui/text-field/TextField";
import { Select } from "@/ui/select/Select";
import { Checkbox } from "@/ui/checkbox/Checkbox";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { updateProfileAction, type ActionState } from "../actions";

type Profile = {
  name: string;
  email: string;
  emailVerified: boolean;
  preferences: { units: string; defaultServings: number | null; theme: string; publicProfile: boolean };
  goals: Record<string, number>;
  nutrients: { code: string; label: string; unit: string }[];
};

const MAIN_GOALS = ["ENERGY_KCAL", "PROTEIN", "FIBER"];

/** Perfil › Datos. «Guardar» fijo al pie (paso 7: formularios largos). Avisa de cambios sin guardar. */
export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfileAction, {});
  const [dirty, setDirty] = useState(false);
  const p = profile.preferences;
  const goal = (code: string) => (profile.goals[code] !== undefined ? String(profile.goals[code]) : "");
  const main = profile.nutrients.filter((n) => MAIN_GOALS.includes(n.code));
  const more = profile.nutrients.filter((n) => !MAIN_GOALS.includes(n.code));

  return (
    <form
      action={async (fd) => {
        await action(fd);
        setDirty(false);
      }}
      onChange={() => setDirty(true)}
      noValidate
      className="pb-24"
    >
      {state.error && (
        <Alert tone="error" title="No se ha guardado." className="mt-6">
          {state.error}
        </Alert>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="border border-border bg-surface px-5 pb-6 md:px-6" aria-labelledby="tu">
          <h2 id="tu" className="mt-5 text-xl">
            Tú
          </h2>
          <TextField
            name="name"
            label="Nombre"
            autoComplete="given-name"
            required
            maxLength={60}
            defaultValue={profile.name}
            error={state.fields?.name}
          />
          <TextField
            name="email"
            label="Email"
            defaultValue={profile.email}
            readOnly
            hint={profile.emailVerified ? "Verificado." : "Sin verificar: revisa tu correo o pide otro enlace desde Mi biblioteca."}
          />
          <Select
            name="units"
            label="Unidades"
            defaultValue={p.units}
            options={[
              { value: "METRIC", label: "Gramos y mililitros" },
              { value: "HOUSEHOLD", label: "Tazas y cucharadas cuando se pueda" },
            ]}
          />
          <TextField
            name="defaultServings"
            label="Comensales habituales"
            optional
            inputMode="numeric"
            defaultValue={p.defaultServings ?? ""}
            hint="Las recetas se abrirán para este número. Vacío: para las raciones de la receta original."
            error={state.fields?.defaultServings}
          />
          <Select
            name="theme"
            label="Tema"
            defaultValue={p.theme}
            options={[
              { value: "SYSTEM", label: "Como el sistema" },
              { value: "LIGHT", label: "Claro" },
              { value: "DARK", label: "Oscuro" },
            ]}
          />
        </section>

        <section className="border border-border bg-surface px-5 pb-6 md:px-6" aria-labelledby="objetivos">
          <h2 id="objetivos" className="mt-5 text-xl">
            Objetivos <span className="font-body text-sm font-normal text-text-2">· opcional, solo tú</span>
          </h2>
          {state.fields?.goals && (
            <Alert tone="error" title="Revisa los objetivos." className="mt-4">
              {state.fields.goals}
            </Alert>
          )}
          {main.map((n) => (
            <TextField
              key={n.code}
              name={`goal_${n.code}`}
              label={`${n.label} al día (${n.unit})`}
              inputMode="decimal"
              defaultValue={goal(n.code)}
              placeholder="Sin objetivo"
            />
          ))}
          <details className="mt-4">
            <summary className="min-h-12 cursor-pointer py-3 text-sm font-medium text-accent underline underline-offset-[3px]">
              Más objetivos
            </summary>
            {more.map((n) => (
              <TextField
                key={n.code}
                name={`goal_${n.code}`}
                label={`${n.label} al día (${n.unit})`}
                inputMode="decimal"
                defaultValue={goal(n.code)}
                placeholder="Sin objetivo"
              />
            ))}
          </details>
          <p className="mt-3 text-sm text-text-2">Son referencias personales, no recomendaciones médicas.</p>
          <Checkbox name="publicProfile" defaultChecked={p.publicProfile}>
            Mostrar mi perfil público con mis recetas publicadas (a partir de la fase 6)
          </Checkbox>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-[72px] z-[90] flex items-center gap-3 border-t border-text bg-bg px-4 py-3 md:bottom-0 md:px-10">
        <span className="text-sm text-text-2" aria-live="polite">
          {dirty ? "Tienes cambios sin guardar" : ""}
        </span>
        <SubmitButton pendingLabel="Guardando…" full={false} className="ml-auto">
          Guardar cambios
        </SubmitButton>
      </div>
    </form>
  );
}
