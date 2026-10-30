import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminActor } from "@/app/admin/guard";
import { viewPrivateContent } from "@/modules/admin/server";
import { ForbiddenError } from "@/lib/errors";
import { Alert } from "@/ui/alert/Alert";

export const metadata: Metadata = { title: "Contenido privado" };

const UNITS = { METRIC: "Gramos y mililitros", HOUSEHOLD: "Tazas y cucharadas" } as const;

/**
 * Contenido privado de un usuario. CADA carga de esta página queda en la auditoría
 * (se llega solo con una acción explícita desde la ficha, nunca por precarga).
 */
export default async function PrivateContentPage({ params }: PageProps<"/admin/usuarios/[id]/privado">) {
  const actor = await requireAdminActor();
  const { id } = await params;
  let u;
  try {
    u = await viewPrivateContent(actor, id);
  } catch (e) {
    if (e instanceof ForbiddenError) notFound();
    throw e;
  }
  return (
    <div className="max-w-2xl">
      <Link href={`/admin/usuarios?usuario=${id}` as never} prefetch={false} className="link text-sm">
        ← Volver a la ficha
      </Link>
      <h1 className="mt-4">Contenido privado de {u.name}</h1>
      <Alert tone="info" title="Este acceso ha quedado registrado" className="mt-4">
        en la auditoría con tu nombre, la fecha y la hora.
      </Alert>

      <section className="mt-6 border border-border bg-surface p-5">
        <h2 className="text-xl">Preferencias</h2>
        <dl className="mt-3 grid grid-cols-[180px_1fr] gap-y-2 text-sm">
          <dt className="text-text-2">Unidades</dt>
          <dd>{u.preferences ? UNITS[u.preferences.units] : "—"}</dd>
          <dt className="text-text-2">Comensales habituales</dt>
          <dd>{u.preferences?.defaultServings ?? "Sin indicar"}</dd>
          <dt className="text-text-2">Perfil público</dt>
          <dd>{u.preferences?.publicProfile ? "Sí" : "No"}</dd>
        </dl>
      </section>
      <section className="mt-4 border border-border bg-surface p-5">
        <h2 className="text-xl">Objetivos</h2>
        {u.nutritionGoals.length ? (
          <ul className="mt-3 text-sm">
            {u.nutritionGoals.map((g) => (
              <li key={g.nutrient.label}>
                {g.nutrient.label}: {Number(g.target)} {g.nutrient.unit}/día
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-2">Sin objetivos.</p>
        )}
      </section>
      <section className="mt-4 border border-border bg-surface p-5">
        <h2 className="text-xl">Hogares</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {u.memberships.map((m) => (
            <li key={m.household.name}>
              <b className="font-medium">{m.household.name}</b> ({m.role === "OWNER" ? "propietario/a" : "miembro"}) ·{" "}
              {m.household.members.map((x) => x.user.name).join(", ")}
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-4 text-sm text-text-2">Recetas, menús y listas de la compra aparecerán aquí cuando lleguen sus fases.</p>
    </div>
  );
}
