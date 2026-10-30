import type { Route } from "next";
import { ButtonLink } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";

/** «Este enlace ya no vale» (pantalla 3d): sirve para la verificación de email y para la recuperación. */
export function LinkExpired({ retryHref, retryLabel }: { retryHref: Route; retryLabel: string }) {
  return (
    <>
      <Icon.clock size={40} className="mt-12 text-warning-icon" />
      <h1 className="mt-4">Este enlace ya no vale</h1>
      <p className="mt-3 text-text-2">Ha caducado o ya se usó. Pide uno nuevo; tarda un minuto.</p>
      <ButtonLink href={retryHref} variant="primary" full className="mt-8">
        {retryLabel}
      </ButtonLink>
      <ButtonLink href="/entrar" variant="ghost" className="mt-2 self-start">
        Volver a entrar
      </ButtonLink>
    </>
  );
}
