"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: Route; label: string }[] = [
  { href: "/perfil", label: "Datos" },
  { href: "/perfil/hogares", label: "Hogares" },
  { href: "/perfil/seguridad", label: "Seguridad" },
];

/**
 * Pestañas como navegación entre páginas (cada sección tiene su URL, se puede enlazar y
 * volver atrás). Por eso es una <nav> con aria-current y no el patrón ARIA de tabs.
 */
export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones del perfil" className="mt-4 flex border-b border-text md:mt-6">
      {TABS.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={pathname === t.href ? "page" : undefined}
          className="-mb-px flex min-h-12 items-center border-b-[3px] border-transparent px-4 text-[15px] font-medium text-text-2 no-underline aria-[current]:border-accent aria-[current]:text-accent"
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
