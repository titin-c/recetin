import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/ui/alert/Alert";
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
      <div className="mt-4 border border-dashed border-border-field bg-surface px-6 py-10 text-center">
        <Icon.book size={32} className="mx-auto mb-3" />
        <h2 className="text-xl">Llega en la próxima fase</h2>
        <p className="mt-2 text-sm text-text-2">Aquí guardarás tus recetas, las de la comunidad y las que importes de otras webs.</p>
      </div>
    </div>
  );
}
