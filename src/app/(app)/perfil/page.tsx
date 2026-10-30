import type { Metadata } from "next";
import { requireActor } from "@/server/session";
import { getProfile } from "@/modules/identity/server";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfileDataPage() {
  const actor = await requireActor();
  const profile = await getProfile(actor);
  return <ProfileForm profile={profile} />;
}
