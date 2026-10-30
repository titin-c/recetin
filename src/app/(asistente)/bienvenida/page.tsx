import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { getProfile, isOnboardingDone } from "@/modules/identity/server";
import { ProgressSteps } from "@/ui/progress-steps/ProgressSteps";
import { RadioCards } from "@/ui/radio-card/RadioCards";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { saveUnitsAction, skipOnboardingAction } from "../actions";

export const metadata: Metadata = { title: "Bienvenida" };

/** Bienvenida, paso 1 de 2: unidades (saltable). El hogar propio ya se creó al registrarse. */
export default async function WelcomeUnitsPage() {
  const actor = await requireActor();
  if (await isOnboardingDone(actor)) redirect("/biblioteca");
  const { preferences } = await getProfile(actor);
  return (
    <>
      <div className="flex items-start">
        <div className="flex-1">
          <ProgressSteps current={1} total={2} />
        </div>
        <form action={skipOnboardingAction} className="-mt-3 ml-4">
          <SubmitButton variant="ghost" size="sm" full={false} pendingLabel="Saltando…">
            Saltar
          </SubmitButton>
        </form>
      </div>
      <h1 className="mt-8">¿Cómo mides en tu cocina?</h1>
      <p className="mt-2 text-text-2">Lo usaremos para mostrarte las cantidades. Puedes cambiarlo en tu perfil.</p>
      <form action={saveUnitsAction}>
        <RadioCards
          name="units"
          legend="Unidades"
          defaultValue={preferences.units}
          options={[
            { value: "METRIC", label: "Gramos y mililitros", detail: "500 g de harina, 250 ml de leche" },
            { value: "HOUSEHOLD", label: "Tazas y cucharadas cuando se pueda", detail: "4 tazas de harina, 1 taza de leche" },
          ]}
        />
        <SubmitButton pendingLabel="Guardando…" className="mt-8">
          Siguiente
        </SubmitButton>
      </form>
    </>
  );
}
