import type { Metadata } from "next";
import { ButtonLink } from "@/ui/button/Button";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { Alert } from "@/ui/alert/Alert";
import { Icon } from "@/ui/icons";
import { getActor } from "@/server/session";
import { getInvitation } from "@/modules/households/server";
import { acceptInvitationAction } from "../../../(app)/actions";
import { LinkExpired } from "../../LinkExpired";

export const metadata: Metadata = { title: "Invitación a un hogar" };

/** Pantalla 5c: invitación a un hogar. Sirve con o sin sesión (y lleva a registrarse o entrar). */
export default async function InvitationPage({ params }: PageProps<"/invitacion/[token]">) {
  const { token } = await params;
  const [inv, actor] = await Promise.all([getInvitation(token), getActor()]);
  if (!inv || !inv.usable) return <LinkExpired retryHref="/entrar" retryLabel="Ir a RECETÍN" />;

  const here = `/invitacion/${encodeURIComponent(token)}`;
  const alreadyMember = actor ? inv.householdId in actor.households : false;
  const wrongAccount = actor && actor.email !== inv.email;

  return (
    <>
      <Icon.home size={40} className="mt-12" />
      <h1 className="mt-4">
        {inv.inviterName} te invita a «{inv.householdName}»
      </h1>
      <p className="mt-3 text-text-2">
        Compartiréis el menú de la semana y la lista de la compra. Tus recetas y tus objetivos siguen siendo solo tuyos.
      </p>

      {!actor && (
        <>
          <p className="mt-3 text-sm text-text-2">La invitación es para {inv.email}.</p>
          <ButtonLink href={`/registro?siguiente=${encodeURIComponent(here)}` as never} variant="primary" full className="mt-8">
            Crear cuenta y unirme
          </ButtonLink>
          <ButtonLink href={`/entrar?siguiente=${encodeURIComponent(here)}` as never} variant="secondary" full className="mt-3">
            Ya tengo cuenta
          </ButtonLink>
        </>
      )}

      {actor && alreadyMember && (
        <>
          <Alert tone="info" title="Ya eres miembro de este hogar." className="mt-6" />
          <ButtonLink href="/biblioteca" variant="primary" full className="mt-6">
            Ir a RECETÍN
          </ButtonLink>
        </>
      )}

      {actor && !alreadyMember && wrongAccount && (
        <Alert tone="warning" title="Esta invitación es para otra cuenta." className="mt-6">
          Es para {inv.email} y has entrado como {actor.email}. Sal y entra con esa cuenta para aceptarla.
        </Alert>
      )}

      {actor && !alreadyMember && !wrongAccount && (
        <>
          <form action={acceptInvitationAction}>
            <input type="hidden" name="token" value={token} />
            <SubmitButton pendingLabel="Uniéndote…" className="mt-8">
              Unirme a «{inv.householdName}»
            </SubmitButton>
          </form>
          <ButtonLink href="/biblioteca" variant="ghost" className="mt-2 self-start">
            Ahora no
          </ButtonLink>
        </>
      )}
    </>
  );
}
