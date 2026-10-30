import type { Metadata } from "next";
import { ButtonLink } from "@/ui/button/Button";
import { Icon } from "@/ui/icons";
import { RequestResetForm } from "./RequestResetForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RequestResetPage() {
  return (
    <>
      <ButtonLink href="/entrar" variant="ghost" size="sm" className="-ml-2 mt-6 self-start" icon={<Icon.back size={16} />}>
        Volver a entrar
      </ButtonLink>
      <RequestResetForm />
    </>
  );
}
