import Link from "next/link";
import { requireActor } from "@/server/session";
import { isAdmin } from "@/modules/access";
import { Icon } from "@/ui/icons";
import { ProfileTabs } from "./ProfileTabs";

/** Perfil con tres secciones (Datos · Hogares · Seguridad), cada una con su propia dirección. */
export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="flex-1">Perfil</h1>
        {/* En móvil la navegación inferior no tiene sitio para «Admin»: el acceso está aquí. */}
        {isAdmin(actor) && (
          <Link
            href="/admin"
            className="flex min-h-11 items-center gap-2 border border-border-field bg-field px-3 text-sm font-medium no-underline md:hidden"
          >
            <Icon.shield />
            Administración
          </Link>
        )}
      </div>
      <ProfileTabs />
      {children}
    </div>
  );
}
