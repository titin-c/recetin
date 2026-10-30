import { redirect } from "next/navigation";
import { requireActor } from "@/server/session";
import { hasCurrentPrivacyConsent } from "@/modules/identity/server";

/** Bienvenida: con sesión, pero sin la navegación de la app (una caja centrada, como el acceso). */
export default async function AssistantLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  if (!(await hasCurrentPrivacyConsent(actor.userId))) redirect("/privacidad");
  return (
    <div className="min-h-dvh px-3 py-3 sm:flex sm:items-center sm:justify-center sm:py-12">
      <main id="contenido" className="mx-auto flex w-full max-w-md flex-col border border-border bg-surface px-5 py-7 sm:px-8 sm:py-10">
        {children}
      </main>
    </div>
  );
}
