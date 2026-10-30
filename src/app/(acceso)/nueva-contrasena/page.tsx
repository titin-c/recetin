import type { Metadata } from "next";
import { LinkExpired } from "../LinkExpired";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

/** Destino del enlace de recuperación: Better Auth valida el enlace y redirige aquí con ?token= o ?error=. */
export default async function NewPasswordPage({ searchParams }: PageProps<"/nueva-contrasena">) {
  const { token, error } = await searchParams;
  if (error || typeof token !== "string" || !token) {
    return <LinkExpired retryHref="/recuperar" retryLabel="Pedir un enlace nuevo" />;
  }
  return (
    <>
      <h1 className="mt-8">Nueva contraseña</h1>
      <ResetPasswordForm token={token} />
    </>
  );
}
