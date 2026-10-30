import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isGoogleEnabled } from "@/server/env";
import { getActor } from "@/server/session";
import { safeInternalPath } from "@/lib/safe-redirect";
import { Divider, GoogleButton } from "../GoogleButton";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignUpPage({ searchParams }: PageProps<"/registro">) {
  const { siguiente } = await searchParams;
  const next = siguiente ? safeInternalPath(siguiente, "/biblioteca") : undefined;
  if (await getActor()) redirect((next ?? "/biblioteca") as never);
  return (
    <>
      <h1 className="mt-6">Crea tu cuenta</h1>
      <GoogleButton label="Registrarme con Google" enabled={isGoogleEnabled} next={next} />
      <Divider>o con tu email</Divider>
      <SignUpForm next={next} />
      <p className="mt-4 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href={(next ? `/entrar?siguiente=${encodeURIComponent(next)}` : "/entrar") as never} className="link">
          Entrar
        </Link>
      </p>
    </>
  );
}
