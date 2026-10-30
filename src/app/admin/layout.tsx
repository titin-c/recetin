import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminActor } from "@/app/admin/guard";
import { readFlash } from "@/server/flash";
import { Toast } from "@/ui/toast/Toast";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: { default: "Administración", template: "%s · Administración · RECETÍN" } };

/**
 * Panel de administración: entorno propio con barra lateral (paso 8).
 * Sin el permiso, la ruta no existe (404): no se revela que hay un panel.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminActor();
  const flash = await readFlash();
  return (
    <>
      <a href="#contenido" className="sr-only-focusable fixed left-2 top-2 z-[300] bg-action px-3 py-2 text-sm text-on-action">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-[100] flex h-16 items-center gap-3 border-b border-text bg-bg px-4 md:px-10">
        <Link href="/biblioteca" className="font-display text-[22px] leading-none text-accent no-underline">
          RECETÍN
        </Link>
        <span className="border border-text px-2 text-[13px] font-medium leading-relaxed">Administración</span>
        <Link href="/biblioteca" className="link ml-auto text-sm">
          Volver a la app
        </Link>
      </header>
      <div className="md:flex md:min-h-[calc(100dvh-64px)]">
        <AdminNav />
        <main id="contenido" className="min-w-0 flex-1 px-4 pb-16 pt-6 md:px-10 md:pt-8">
          {children}
        </main>
      </div>
      <Toast flash={flash} />
    </>
  );
}
