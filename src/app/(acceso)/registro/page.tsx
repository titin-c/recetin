import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isGoogleEnabled } from "@/server/env";
import { getActor } from "@/server/session";
import { Divider, GoogleButton } from "../GoogleButton";
import { SignUpForm } from "./SignUpForm";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignUpPage() {
  if (await getActor()) redirect("/biblioteca");
  return (
    <>
      <h1 className="mt-6">Crea tu cuenta</h1>
      <GoogleButton label="Registrarme con Google" enabled={isGoogleEnabled} />
      <Divider>o con tu email</Divider>
      <SignUpForm />
      <p className="mt-4 text-center text-sm">
        ¿Ya tienes cuenta?{" "}
        <Link href="/entrar" className="link">
          Entrar
        </Link>
      </p>
    </>
  );
}
