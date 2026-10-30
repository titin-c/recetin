import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminActor } from "@/app/admin/guard";
import { getDashboard } from "@/modules/admin/server";

export const metadata: Metadata = { title: "Inicio" };

const nf = new Intl.NumberFormat("es-ES");

/** Inicio del panel: colas de trabajo pendientes y unas pocas cifras útiles (paso 5: sin gráficos). */
export default async function AdminHome() {
  const actor = await requireAdminActor();
  const { stats, queues } = await getDashboard(actor);
  const future = [
    { label: "Denuncias", phase: 6 },
    { label: "Importaciones con error", phase: 2 },
  ];
  return (
    <div className="max-w-5xl">
      <h1>Hola, {actor.name.split(" ")[0]}</h1>
      <h2 className="mt-6 text-xl">Pendiente</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <section className={`flex min-h-36 flex-col gap-2 border bg-surface p-5 ${queues.unverifiedOld ? "border-text" : "border-border"}`}>
          <h3 className="font-body text-sm font-normal text-text-2">Usuarios sin verificar hace más de 7 días</h3>
          <p className={`font-display text-[40px] leading-none ${queues.unverifiedOld ? "" : "text-text-2"}`}>
            {nf.format(queues.unverifiedOld)}
          </p>
          {queues.unverifiedOld > 0 ? (
            <Link href="/admin/usuarios?estado=sin-verificar-7" className="link mt-auto self-start text-sm">
              Revisar<span className="sr-only"> los usuarios sin verificar</span> →
            </Link>
          ) : (
            <p className="mt-auto text-sm text-text-2">Nada pendiente</p>
          )}
        </section>
        {future.map((f) => (
          <section key={f.label} className="flex min-h-36 flex-col gap-2 border border-border bg-surface p-5">
            <h3 className="font-body text-sm font-normal text-text-2">{f.label}</h3>
            <p className="font-display text-[40px] leading-none text-text-2">0</p>
            <span className="mt-auto self-start border border-dashed border-text-2 px-2 text-[13px] text-text-2">Fase {f.phase}</span>
          </section>
        ))}
      </div>

      <h2 className="mt-8 text-xl">En cifras</h2>
      <dl className="mt-4 grid grid-cols-2 border border-border bg-surface md:grid-cols-4">
        {[
          { label: "Usuarios activos (30 días)", value: nf.format(stats.activeUsers), note: `${nf.format(stats.totalUsers)} en total` },
          { label: "Hogares", value: nf.format(stats.households) },
          { label: "Recetas publicadas", value: "—", note: "Fase 2" },
          { label: "Ingredientes con datos", value: "—", note: "Fase 3" },
        ].map((s) => (
          <div key={s.label} className="border-b border-r border-border px-5 py-4">
            <dt className="text-sm text-text-2">{s.label}</dt>
            <dd className="mt-1 font-display text-2xl">{s.value}</dd>
            {s.note && <dd className="text-xs text-text-2">{s.note}</dd>}
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-text-2">Las cifras se actualizan como mucho cada minuto.</p>
    </div>
  );
}
