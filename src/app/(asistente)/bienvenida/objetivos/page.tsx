import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { getProfile, isOnboardingDone } from "@/modules/identity/server";
import { ProgressSteps } from "@/ui/progress-steps/ProgressSteps";
import { ButtonLink } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { Icon } from "@/ui/icons";
import { skipOnboardingAction } from "../../actions";
import { GoalsForm } from "./GoalsForm";

export const metadata: Metadata = { title: "Bienvenida · objetivos" };

/** Bienvenida, paso 2 de 2: objetivos nutricionales opcionales. */
export default async function WelcomeGoalsPage() {
  const actor = await requireActor();
  if (await isOnboardingDone(actor)) redirect("/biblioteca");
  const { nutrients } = await getProfile(actor);
  const main = nutrients.filter((n) => n.code === "ENERGY_KCAL" || n.code === "PROTEIN");
  return (
    <>
      <div className="flex items-start">
        <ButtonLink href="/bienvenida" variant="ghost" size="sm" className="-ml-2 -mt-3" icon={<Icon.back size={16} />}>
          Atrás
        </ButtonLink>
        <form action={skipOnboardingAction} className="-mt-3 ml-auto">
          <SubmitButton variant="ghost" size="sm" full={false} pendingLabel="Saltando…">
            Saltar
          </SubmitButton>
        </form>
      </div>
      <div className="mt-2">
        <ProgressSteps current={2} total={2} />
      </div>
      <h1 className="mt-8">¿Quieres seguir algún objetivo?</h1>
      <p className="mt-2 text-text-2">Opcional. Solo lo verás tú. No son recomendaciones médicas.</p>
      <GoalsForm nutrients={main} />
    </>
  );
}
