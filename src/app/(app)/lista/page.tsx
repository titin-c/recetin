import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/ui/empty-state/EmptyState";
import { Icon } from "@/ui/icons";

export const metadata: Metadata = { title: "Lista de la compra" };

/** Sección de una fase futura: se puede visitar y explica qué hará (sin botones falsos). */
export default function Page() {
  return (
    <div className="max-w-2xl">
      <h1>Lista de la compra</h1>
      <EmptyState icon={<Icon.cart size={32} />} title="Llega en la fase 5">
        <p>
          La lista se generará sola a partir del menú de tu hogar, agrupada por secciones del súper y compartida con quien vive contigo.
        </p>
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
