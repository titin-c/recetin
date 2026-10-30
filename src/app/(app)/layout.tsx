import Link from "next/link";
import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { readFlash } from "@/server/flash";
import { hasCurrentPrivacyConsent } from "@/modules/identity/server";
import { householdNames } from "@/modules/households/server";
import { HouseholdSwitcher } from "@/modules/households/ui";
import { Toast } from "@/ui/toast/Toast";
import { switchHouseholdAction } from "./actions";
import { BottomNav, DesktopNav } from "./Navigation";

/**
 * Zona con sesión: cabecera (logo + selector de hogar + navegación en escritorio),
 * navegación inferior en móvil y avisos breves. Comprueba sesión y aviso de privacidad.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const [consented, households, flash] = await Promise.all([hasCurrentPrivacyConsent(actor.userId), householdNames(actor), readFlash()]);
  if (!consented) redirect("/privacidad");

  return (
    <>
      <a href="#contenido" className="sr-only-focusable fixed left-2 top-2 z-[300] bg-action px-3 py-2 text-sm text-on-action">
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-[100] flex h-16 items-center gap-3 border-b border-text bg-bg px-4 md:px-10">
        <Link href="/biblioteca" className="font-display text-[22px] leading-none text-accent no-underline">
          RECETÍN
        </Link>
        <HouseholdSwitcher households={households} activeId={actor.activeHouseholdId} switchAction={switchHouseholdAction} />
        {/* El acceso al panel de administración se activa con la entrega 11c. */}
        <DesktopNav showAdmin={false} />
      </header>
      <main id="contenido" className="px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-8">
        {children}
      </main>
      <BottomNav />
      <Toast flash={flash} />
    </>
  );
}
