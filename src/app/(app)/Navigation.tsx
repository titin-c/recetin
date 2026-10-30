"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/ui/icons";

const ITEMS: { href: Route; label: string; short: string; Glyph: typeof Icon.search }[] = [
  { href: "/recetas", label: "Recetas", short: "Recetas", Glyph: Icon.search },
  { href: "/biblioteca", label: "Mi biblioteca", short: "Biblioteca", Glyph: Icon.book },
  { href: "/planificador", label: "Planificador", short: "Planificador", Glyph: Icon.calendar },
  { href: "/lista", label: "Lista", short: "Lista", Glyph: Icon.cart },
  { href: "/perfil", label: "Perfil", short: "Perfil", Glyph: Icon.user },
];

const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Navegación principal: arriba en escritorio, abajo en móvil (al alcance del pulgar). */
export function DesktopNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="ml-auto hidden h-full md:flex">
      {ITEMS.map(({ href, label, Glyph }) => (
        <Link
          key={href}
          href={href}
          aria-current={isCurrent(pathname, href) ? "page" : undefined}
          className="flex items-center gap-2 border-b-[3px] border-transparent px-3.5 text-[15px] font-medium no-underline aria-[current]:border-accent aria-[current]:text-accent"
        >
          <Glyph />
          {label}
        </Link>
      ))}
      {showAdmin && (
        <Link href="/admin" className="ml-2 flex items-center gap-2 border-l border-border px-3.5 text-[15px] font-medium no-underline">
          <Icon.shield />
          Admin
        </Link>
      )}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-[100] grid h-[72px] grid-cols-5 border-t border-text bg-bg md:hidden">
      {ITEMS.map(({ href, short, Glyph }) => {
        const current = isCurrent(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className="relative flex flex-col items-center justify-center gap-1 text-xs font-medium no-underline aria-[current]:text-accent"
          >
            {current && <span className="absolute inset-x-[20%] top-0 h-[3px] bg-accent" aria-hidden="true" />}
            <Glyph size={24} />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
