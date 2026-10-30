import type { Metadata } from "next";
import { ButtonLink } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";
import { getActor } from "@/server/session";
import { LinkExpired } from "../LinkExpired";

export const metadata: Metadata = { title: "Email confirmado" };

/** Destino del enlace de verificación (Better Auth redirige aquí, con ?error=… si el enlace no vale). */
export default async function VerifiedPage({ searchParams }: PageProps<"/verificado">) {
  const { error } = await searchParams;
  const actor = await getActor();
  if (error) {
    return (
      <LinkExpired
        retryHref={actor ? "/mira-tu-correo" : "/entrar"}
        retryLabel={actor ? "Pedir un enlace nuevo" : "Entrar para pedir otro"}
      />
    );
  }
  return (
    <>
      <Icon.check size={40} className="mt-12" />
      <h1 className="mt-4">Email confirmado</h1>
      <p className="mt-3 text-text-2">Ya puedes publicar recetas e invitar a tu hogar.</p>
      <ButtonLink href={actor ? "/biblioteca" : "/entrar"} variant="primary" full className="mt-8">
        {actor ? "Ir a RECETÍN" : "Entrar"}
      </ButtonLink>
    </>
  );
}
