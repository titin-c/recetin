"use server";

import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { goalsFromForm, goalsSchema, preferencesSchema } from "@/modules/identity/schemas";
import { completeOnboarding, setUnitsDuringOnboarding } from "@/modules/identity/server";

export type OnboardingState = { error?: string };

export async function saveUnitsAction(fd: FormData) {
  const actor = await requireActor();
  const parsed = preferencesSchema.safeParse({ units: fd.get("units") ?? "METRIC" });
  if (parsed.success) await setUnitsDuringOnboarding(actor, parsed.data.units);
  redirect("/bienvenida/objetivos");
}

export async function finishOnboardingAction(_: OnboardingState, fd: FormData): Promise<OnboardingState> {
  const actor = await requireActor();
  const goals = goalsSchema.safeParse(goalsFromForm(fd));
  if (!goals.success) return { error: goals.error.issues[0]?.message };
  await completeOnboarding(actor, { goals: goals.data });
  redirect("/biblioteca");
}

/** «Saltar»: se da la bienvenida por hecha sin guardar nada más. */
export async function skipOnboardingAction() {
  const actor = await requireActor();
  await completeOnboarding(actor, {});
  redirect("/biblioteca");
}
