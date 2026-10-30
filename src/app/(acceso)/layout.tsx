import Link from "next/link";

/** Pantallas sin sesión: una caja (superficie) centrada sobre el fondo claro (UI v2, paso 8). */
export default function AccessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh px-3 py-3 sm:flex sm:items-center sm:justify-center sm:py-12">
      <main id="contenido" className="mx-auto flex w-full max-w-md flex-col border border-border bg-surface px-5 py-7 sm:px-8 sm:py-10">
        <Link href="/entrar" className="self-start font-display text-[28px] leading-none text-accent no-underline">
          RECETÍN
        </Link>
        {children}
      </main>
    </div>
  );
}
