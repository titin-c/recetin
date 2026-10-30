import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/ui/empty-state/EmptyState";
import { Icon } from "@/ui/icons";

export const metadata: Metadata = { title: "Recetas" };

/** Sección de una fase futura: se puede visitar y explica qué hará (sin botones falsos). */
export default function Page() {
  return (
    <div className="max-w-2xl">
      <h1>Recetas</h1>
      <EmptyState icon={<Icon.search size={32} />} title="Llega en las fases 2 y 6">
        <p>Buscarás recetas de la comunidad por ingredientes y categorías, y podrás guardarlas en tu biblioteca sin copiarlas.</p>
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
