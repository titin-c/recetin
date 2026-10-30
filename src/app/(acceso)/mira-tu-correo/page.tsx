import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";
import { requireActor } from "@/server/session";
import { ResendVerification } from "./ResendVerification";

export const metadata: Metadata = { title: "Mira tu correo" };

export default async function CheckEmailPage() {
  const actor = await requireActor();
  if (actor.emailVerified) redirect("/biblioteca");
  return (
    <>
      <Icon.mail size={40} className="mt-12" />
      <h1 className="mt-4">Mira tu correo</h1>
      <p className="mt-3 text-text-2">
        Te hemos enviado un enlace a <b className="font-medium text-text">{actor.email}</b> para confirmar tu cuenta.
      </p>
      <p className="mt-3 text-text-2">Mientras tanto ya puedes usar RECETÍN. Lo necesitarás para publicar recetas e invitar a tu hogar.</p>
      <ButtonLink href="/bienvenida" variant="primary" full className="mt-8">
        Empezar
      </ButtonLink>
      <ResendVerification />
    </>
  );
}
