import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/ui/alert/Alert";
import { EmptyState } from "@/ui/empty-state/EmptyState";
import { Icon } from "@/ui/icons";
import { requireActor } from "@/server/session";

export const metadata: Metadata = { title: "Mi biblioteca" };

/** Mi biblioteca llega en la Fase 2: de momento explica qué hará (sin botones falsos). */
export default async function LibraryPage() {
  const actor = await requireActor();
  return (
    <div className="max-w-2xl">
      {!actor.emailVerified && (
        <Alert tone="warning" title="Verifica tu email" className="mb-6">
          para poder publicar recetas e invitar a tu hogar.{" "}
          <Link href="/mira-tu-correo" className="link">
            Reenviar
          </Link>
        </Alert>
      )}
      <h1>Mi biblioteca</h1>
      <EmptyState icon={<Icon.book size={32} />} title="Llega en la fase 2">
        <p>Aquí guardarás tus recetas, las de la comunidad y las que importes de otras webs.</p>
        <p>
          Mientras tanto, puedes{" "}
          <Link href="/perfil" className="link">
            configurar tu perfil
          </Link>{" "}
          e{" "}
          <Link href="/perfil/hogares" className="link">
            invitar a tu hogar
          </Link>
          .
        </p>
      </EmptyState>
    </div>
  );
}
