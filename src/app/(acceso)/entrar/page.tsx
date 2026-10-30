import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Alert } from "@/ui/alert/Alert";
import { isGoogleEnabled } from "@/server/env";
import { getActor } from "@/server/session";
import { Divider, GoogleButton } from "../GoogleButton";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Entrar" };

/** Avisos que pueden llegar por la URL (vuelta de Google, contraseña cambiada). Solo códigos, nunca datos. */
function Notice({ error, aviso }: { error?: string; aviso?: string }) {
  if (aviso === "contrasena_cambiada")
    return (
      <Alert tone="info" title="Contraseña cambiada." className="mt-6">
        Ya puedes entrar con la nueva. Hemos cerrado tu sesión en los demás dispositivos.
      </Alert>
    );
  if (!error) return null;
  if (error === "account_not_linked")
    return (
      <Alert tone="info" title="Ya tienes cuenta con ese email." announce className="mt-6">
        Entra con tu contraseña. Después podrás vincular Google desde Perfil › Seguridad para usarlo la próxima vez.
      </Alert>
    );
  if (error === "ACCOUNT_SUSPENDED" || error.includes("suspend"))
    return (
      <Alert tone="error" title="Tu cuenta está suspendida." className="mt-6">
        Si crees que es un error, escribe a la persona que administra RECETÍN.
      </Alert>
    );
  if (error === "google_no_configurado")
    return (
      <Alert tone="info" title="Google aún no está configurado." announce className="mt-6">
        Entra con tu email y contraseña.
      </Alert>
    );
  return (
    <Alert tone="error" title="No hemos podido entrar con Google." className="mt-6">
      Vuelve a intentarlo o entra con tu email.
    </Alert>
  );
}

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  if (await getActor()) redirect("/biblioteca");
  const { error, aviso } = await searchParams;
  return (
    <>
      <h1 className="mt-8">Entra en tu cocina</h1>
      <p className="mt-2 text-text-2">Tus recetas, tu menú y tu lista de la compra.</p>
      <Notice error={typeof error === "string" ? error : undefined} aviso={typeof aviso === "string" ? aviso : undefined} />
      <GoogleButton label="Continuar con Google" enabled={isGoogleEnabled} />
      <Divider>o con tu email</Divider>
      <SignInForm />
      <p className="mt-6 text-center text-sm">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="link">
          Crear cuenta
        </Link>
      </p>
    </>
  );
}
