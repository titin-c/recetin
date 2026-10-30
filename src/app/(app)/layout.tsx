import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { hasCurrentPrivacyConsent } from "@/modules/identity/server";
import { Button } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";
import { signOutAction } from "../(acceso)/actions";

/**
 * Zona con sesión. Entrega 11a: comprobación de sesión y de aviso de privacidad + cabecera mínima.
 * La estructura completa (navegación de 5 secciones, selector de hogar) llega en la entrega 11b.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  if (!(await hasCurrentPrivacyConsent(actor.userId))) redirect("/privacidad");

  return (
    <>
      <a href="#contenido" className="sr-only-focusable fixed left-2 top-2 z-[300] bg-action px-3 py-2 text-sm text-on-action">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-[100] flex h-16 items-center gap-3 border-b border-border bg-bg px-4 sm:px-10">
        <span className="font-display text-[22px] leading-none text-accent">RECETÍN</span>
        <form action={signOutAction} className="ml-auto">
          <Button type="submit" variant="ghost" size="sm" icon={<Icon.logout size={16} />}>
            Salir
          </Button>
        </form>
      </header>
      <main id="contenido" className="px-4 pb-24 pt-6 sm:px-10 sm:pt-8">
        {children}
      </main>
    </>
  );
}
