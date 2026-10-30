"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/ui/icons";

const ITEMS: { href: Route; label: string; Glyph: typeof Icon.list }[] = [
  { href: "/admin", label: "Inicio", Glyph: Icon.list },
  { href: "/admin/usuarios", label: "Usuarios", Glyph: Icon.users },
  { href: "/admin/auditoria", label: "Auditoría", Glyph: Icon.clock },
];
const FUTURE = [
  { label: "Catálogo", phase: 3 },
  { label: "Importaciones", phase: 2 },
  { label: "Denuncias", phase: 6 },
];

/** Barra lateral en escritorio; fila de enlaces en móvil. Las secciones futuras se nombran, sin enlace. */
export function AdminNav() {
  const pathname = usePathname();
  const current = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));
  return (
    <nav
      aria-label="Administración"
      className="border-b border-border bg-surface md:w-[220px] md:shrink-0 md:border-b-0 md:border-r md:py-6"
    >
      <ul className="flex overflow-x-auto md:block">
        {ITEMS.map(({ href, label, Glyph }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={current(href) ? "page" : undefined}
              className="flex min-h-12 items-center gap-3 whitespace-nowrap border-b-[3px] border-transparent px-4 text-[15px] no-underline md:border-b-0 md:border-l-[3px] md:px-6 aria-[current]:border-accent aria-[current]:bg-bg aria-[current]:font-medium aria-[current]:text-accent"
            >
              <Glyph />
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="hidden px-6 pb-2 pt-6 text-xs font-medium uppercase tracking-[.08em] text-text-2 md:block">Próximas fases</p>
      <ul className="hidden md:block">
        {FUTURE.map((f) => (
          <li key={f.label} className="flex min-h-10 items-center justify-between px-6 text-sm text-text-2">
            {f.label} <span className="text-xs">Fase {f.phase}</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
