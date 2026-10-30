import type { Metadata } from "next";
import { getActor } from "@/server/session";
import { hasCurrentPrivacyConsent, PRIVACY_VERSION } from "@/modules/identity/server";
import { SubmitButton } from "@/ui/button/SubmitButton";
import { acceptPrivacyAction } from "../actions";

export const metadata: Metadata = { title: "Aviso de privacidad" };

const PRIVACY_DATE = new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(PRIVACY_VERSION));

/**
 * Aviso de privacidad. Si llega alguien con sesión que aún no lo ha aceptado (cuentas creadas
 * con Google), se le pide aceptarlo antes de usar la app.
 * NOTA: texto redactado para un uso privado entre conocidos; revisar con alguien de legal
 * antes de abrir la app al público.
 */
export default async function PrivacyPage() {
  const actor = await getActor();
  const mustAccept = actor ? !(await hasCurrentPrivacyConsent(actor.userId)) : false;

  return (
    <>
      <h1 className="mt-8">Aviso de privacidad</h1>
      <p className="mt-2 text-sm text-text-2">Versión del {PRIVACY_DATE}</p>
      <div className="mt-6 space-y-4 text-base leading-relaxed">
        <section>
          <h2 className="text-xl">Qué guardamos</h2>
          <p className="mt-2">
            Tu nombre, tu email, tus preferencias (unidades, comensales, objetivos nutricionales si los pones), los hogares a los que
            perteneces y, más adelante, tus recetas, menús y listas de la compra. Si entras con Google, Google nos da tu nombre y tu email;
            nada más.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Para qué</h2>
          <p className="mt-2">
            Solo para que RECETÍN funcione. No hay anuncios, no vendemos ni cedemos datos y no enviamos emails comerciales.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Quién puede verlo</h2>
          <p className="mt-2">
            Tus recetas privadas, tus objetivos y tus datos los ves tú. El menú y la lista de un hogar los ven sus miembros. Las personas
            administradoras de RECETÍN pueden acceder a todo el contenido para mantener la app y resolver problemas;{" "}
            <b className="font-medium">cada vez que lo hacen queda registrado</b> en un historial de auditoría.
          </p>
        </section>
        <section>
          <h2 className="text-xl">Dónde</h2>
          <p className="mt-2">En servidores de la Unión Europea siempre que el proveedor lo permite.</p>
        </section>
        <section>
          <h2 className="text-xl">Tus derechos</h2>
          <p className="mt-2">
            Puedes cambiar tus datos desde tu perfil y eliminar tu cuenta cuando quieras. Al eliminarla se borran tus datos personales.
          </p>
        </section>
      </div>

      {mustAccept && (
        <form action={acceptPrivacyAction} className="mt-8 border-t border-border pt-6">
          <p className="text-sm">Para usar RECETÍN necesitamos que aceptes este aviso.</p>
          <SubmitButton pendingLabel="Guardando…" className="mt-4">
            Acepto el aviso de privacidad
          </SubmitButton>
        </form>
      )}
    </>
  );
}
