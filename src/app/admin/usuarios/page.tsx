import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminActor } from "@/app/admin/guard";
import { getUserDetail, listUsers, USERS_PAGE_SIZE } from "@/modules/admin/server";
import { userListQuerySchema, type UserListQuery } from "@/modules/admin/schemas";
import { Pagination } from "@/ui/data-table/Pagination";
import { Select } from "@/ui/select/Select";
import { buttonClasses } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";
import { UserDrawer } from "./UserDrawer";

export const metadata: Metadata = { title: "Usuarios" };

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "short" });
function lastSeen(d: Date | null) {
  if (!d) return "Nunca";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 30) return `Hace ${days} días`;
  return dateFmt.format(d);
}

/** URL de la tabla conservando los filtros (la tabla funciona sin JavaScript: filtros por GET). */
function urlWith(q: UserListQuery, changes: Partial<Record<keyof UserListQuery, string | number | undefined>>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...changes })) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return `/admin/usuarios${s ? `?${s}` : ""}`;
}

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const actor = await requireAdminActor();
  const q = userListQuerySchema.parse(await searchParams);
  const [list, detail] = await Promise.all([listUsers(actor, q), q.usuario ? getUserDetail(actor, q.usuario) : null]);
  const filtered = Boolean(q.q || q.estado || q.rol || q.acceso);
  const from = (list.page - 1) * USERS_PAGE_SIZE + 1;

  return (
    <div className="max-w-6xl">
      <h1>Usuarios</h1>
      <form method="get" className="mt-5 flex flex-wrap items-end gap-3" role="search" aria-label="Buscar y filtrar usuarios">
        <div className="min-w-[240px] flex-1">
          <label htmlFor="q" className="mb-1.5 block text-sm font-medium">
            Buscar
          </label>
          <div className="relative">
            <Icon.search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-2" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q.q}
              placeholder="Nombre o email"
              className="min-h-12 w-full border border-border-field bg-field py-3 pl-10 pr-3 text-base"
            />
          </div>
        </div>
        <div className="w-44 [&>div]:mt-0">
          <Select
            name="estado"
            label="Estado"
            defaultValue={q.estado ?? ""}
            options={[
              { value: "", label: "Todos" },
              { value: "activo", label: "Activo" },
              { value: "suspendido", label: "Suspendido" },
              { value: "sin-verificar", label: "Sin verificar" },
              { value: "sin-verificar-7", label: "Sin verificar > 7 días" },
            ]}
          />
        </div>
        <div className="w-36 [&>div]:mt-0">
          <Select
            name="rol"
            label="Rol"
            defaultValue={q.rol ?? ""}
            options={[
              { value: "", label: "Todos" },
              { value: "USER", label: "Usuario" },
              { value: "ADMIN", label: "Administrador" },
            ]}
          />
        </div>
        <div className="w-36 [&>div]:mt-0">
          <Select
            name="acceso"
            label="Acceso"
            defaultValue={q.acceso ?? ""}
            options={[
              { value: "", label: "Todos" },
              { value: "email", label: "Email" },
              { value: "google", label: "Google" },
            ]}
          />
        </div>
        <button type="submit" className={buttonClasses("secondary")}>
          Filtrar
        </button>
        {filtered && (
          <Link href="/admin/usuarios" className={buttonClasses("ghost")}>
            Quitar filtros
          </Link>
        )}
      </form>

      {list.total === 0 ? (
        <div className="mt-6 border border-dashed border-border-field bg-surface px-6 py-10 text-center">
          <Icon.search size={32} className="mx-auto mb-3" />
          <p className="font-medium">Ningún usuario coincide con estos filtros.</p>
          <Link href="/admin/usuarios" className={`${buttonClasses("secondary", "sm")} mt-4`}>
            Quitar filtros
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <caption className="pb-2 text-left text-[13px] text-text-2">
              {list.total} {list.total === 1 ? "usuario" : "usuarios"} · ordenados por último acceso
            </caption>
            <thead>
              <tr>
                {["Usuario", "Rol", "Estado", "Acceso"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="whitespace-nowrap border-b border-text bg-surface px-3 py-2.5 text-left font-medium text-text-2"
                  >
                    {h}
                  </th>
                ))}
                <th
                  scope="col"
                  aria-sort="descending"
                  className="whitespace-nowrap border-b border-text bg-surface px-3 py-2.5 text-left font-medium text-text-2"
                >
                  Último acceso ↓
                </th>
              </tr>
            </thead>
            <tbody>
              {list.users.map((u) => (
                <tr key={u.id} className={u.id === q.usuario ? "bg-surface" : ""}>
                  <td className="border-b border-border px-3 py-3">
                    <Link
                      href={urlWith(q, { usuario: u.id }) as never}
                      scroll={false}
                      className="font-medium text-accent underline underline-offset-[3px]"
                    >
                      {u.name}
                    </Link>
                    <span className="block text-[13px] text-text-2">{u.email}</span>
                  </td>
                  <td className="border-b border-border px-3 py-3">{u.isAdmin ? "Administrador" : "Usuario"}</td>
                  <td className="border-b border-border px-3 py-3">
                    {u.status === "SUSPENDED" ? (
                      <span className="border border-error-border px-2 font-medium text-error">Suspendido</span>
                    ) : !u.emailVerified ? (
                      <span className="border border-warning px-2 font-medium text-warning">Sin verificar</span>
                    ) : (
                      <span className="border border-text px-2 font-medium">Activo</span>
                    )}
                  </td>
                  <td className="border-b border-border px-3 py-3">
                    {u.providers.map((p) => (p === "google" ? "Google" : "Email")).join(" + ") || "—"}
                  </td>
                  <td className="border-b border-border px-3 py-3">{lastSeen(u.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={list.page}
            pages={list.pages}
            total={list.total}
            from={from}
            to={from + list.users.length - 1}
            href={(p) => urlWith({ ...q, usuario: undefined }, { pagina: p === 1 ? undefined : p })}
          />
        </div>
      )}

      {detail && <UserDrawer user={detail} closeHref={urlWith(q, { usuario: undefined })} />}
    </div>
  );
}
