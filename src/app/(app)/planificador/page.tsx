import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/ui/empty-state/EmptyState";
import { Icon } from "@/ui/icons";

export const metadata: Metadata = { title: "Planificador" };

/** Sección de una fase futura: se puede visitar y explica qué hará (sin botones falsos). */
export default function Page() {
  return (
    <div className="max-w-2xl">
      <h1>Planificador</h1>
      <EmptyState icon={<Icon.calendar size={32} />} title="Llega en la fase 4">
        <p>Planificarás la semana de tu hogar, con quién come cada día y el resumen nutricional de cada persona.</p>
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
