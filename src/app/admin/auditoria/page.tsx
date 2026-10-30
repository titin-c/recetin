import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminActor } from "@/app/admin/guard";
import { AUDIT_ACTION_LABELS, listAudit } from "@/modules/admin/server";
import { auditQuerySchema, type AuditQuery } from "@/modules/admin/schemas";
import { Select } from "@/ui/select/Select";
import { buttonClasses } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";

export const metadata: Metadata = { title: "Auditoría" };

const fmt = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function detail(r: { action: string; before: unknown; after: unknown; reason: string | null }) {
  if (r.reason) return `Motivo: ${r.reason}`;
  if (r.action === "ROLE_CHANGED") {
    const b = (r.before as { rol?: string } | null)?.rol;
    const a = (r.after as { rol?: string } | null)?.rol;
    const label = (x?: string) => (x === "ADMIN" ? "Administrador" : "Usuario");
    return `${label(b)} → ${label(a)}`;
  }
  if (r.action === "PRIVATE_CONTENT_VIEWED") return "Solo lectura";
  return "—";
}

function urlWith(q: AuditQuery, cursor: { tras?: string; antes?: string }) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, tras: undefined, antes: undefined, ...cursor })) if (v) p.set(k, String(v));
  return `/admin/auditoria?${p.toString()}`;
}

/** Auditoría: quién hizo qué y cuándo. Paginación por cursor, sin total exacto (paso 10). */
export default async function AuditPage({ searchParams }: PageProps<"/admin/auditoria">) {
  const actor = await requireAdminActor();
  const q = auditQuerySchema.parse(await searchParams);
  const { rows, nextCursor, prevCursor } = await listAudit(actor, q);
  const filtered = Boolean(q.q || q.accion || q.desde || q.hasta);

  return (
    <div className="max-w-6xl">
      <h1>Auditoría</h1>
      <form method="get" className="mt-5 flex flex-wrap items-end gap-3" role="search" aria-label="Filtrar la auditoría">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="aq" className="mb-1.5 block text-sm font-medium">
            Buscar
          </label>
          <input
            id="aq"
            name="q"
            type="search"
            defaultValue={q.q}
            placeholder="Persona o motivo"
            className="min-h-12 w-full border border-border-field bg-field px-3 py-3 text-base"
          />
        </div>
        <div className="w-52 [&>div]:mt-0">
          <Select
            name="accion"
            label="Acción"
            defaultValue={q.accion ?? ""}
            options={[{ value: "", label: "Todas" }, ...Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))]}
          />
        </div>
        <div>
          <label htmlFor="desde" className="mb-1.5 block text-sm font-medium">
            Desde
          </label>
          <input
            id="desde"
            name="desde"
            type="date"
            defaultValue={q.desde}
            className="min-h-12 border border-border-field bg-field px-3 text-base"
          />
        </div>
        <div>
          <label htmlFor="hasta" className="mb-1.5 block text-sm font-medium">
            Hasta
          </label>
          <input
            id="hasta"
            name="hasta"
            type="date"
            defaultValue={q.hasta}
            className="min-h-12 border border-border-field bg-field px-3 text-base"
          />
        </div>
        <button type="submit" className={buttonClasses("secondary")}>
          Filtrar
        </button>
        {filtered && (
          <Link href="/admin/auditoria" className={buttonClasses("ghost")}>
            Quitar filtros
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="mt-6 border border-dashed border-border-field bg-surface px-6 py-10 text-center">
          <Icon.clock size={32} className="mx-auto mb-3" />
          <p className="font-medium">{filtered ? "Ninguna acción coincide con estos filtros." : "Todavía no hay acciones registradas."}</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="pb-2 text-left text-[13px] text-text-2">
              Acciones administrativas y accesos a contenido privado, de la más reciente a la más antigua
            </caption>
            <thead>
              <tr>
                {["Cuándo", "Quién", "Acción", "Sobre", "Detalle"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap border-b border-text bg-surface px-3 py-2.5 text-left font-medium text-text-2"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap border-b border-border px-3 py-3">
                    <time dateTime={r.createdAt.toISOString()}>{fmt.format(r.createdAt)}</time>
                  </td>
                  <td className="border-b border-border px-3 py-3">{r.actorLabel}</td>
                  <td className="border-b border-border px-3 py-3">{r.actionLabel}</td>
                  <td className="border-b border-border px-3 py-3">{r.targetLabel}</td>
                  <td className="border-b border-border px-3 py-3">{detail(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav aria-label="Paginación" className="mt-4 flex gap-2">
            {prevCursor ? (
              <Link href={urlWith(q, { antes: prevCursor }) as never} className={buttonClasses("secondary", "sm")}>
                ← Más recientes
              </Link>
            ) : (
              <span />
            )}
            {nextCursor && (
              <Link href={urlWith(q, { tras: nextCursor }) as never} className={`${buttonClasses("secondary", "sm")} ml-auto`}>
                Más antiguas →
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
