import type { Metadata } from "next";
import { requireActor } from "@/server/session";
import { isGoogleEnabled } from "@/server/env";
import { getProfile } from "@/modules/identity/server";
import { SecurityPanel } from "./SecurityPanel";

export const metadata: Metadata = { title: "Seguridad" };

export default async function SecurityPage({ searchParams }: PageProps<"/perfil/seguridad">) {
  const actor = await requireActor();
  const profile = await getProfile(actor);
  const { error } = await searchParams;
  return (
    <SecurityPanel
      email={profile.email}
      hasPassword={profile.hasPassword}
      hasGoogle={profile.hasGoogle}
      googleEnabled={isGoogleEnabled}
      activeSessions={profile.activeSessions}
      googleError={typeof error === "string" ? error : undefined}
    />
  );
}
