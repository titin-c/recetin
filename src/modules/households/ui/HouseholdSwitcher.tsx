"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Icon } from "@/ui/icons";

/**
 * Selector de hogar activo (cabecera). Solo se muestra si la persona tiene más de un hogar.
 * Patrón botón + lista: Esc cierra y devuelve el foco; el cambio se anuncia con un toast.
 */
export function HouseholdSwitcher({
  households,
  activeId,
  switchAction,
}: {
  households: { id: string; name: string }[];
  activeId: string | null;
  switchAction: (formData: FormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const listId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const active = households.find((h) => h.id === activeId) ?? households[0];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (households.length < 2) return null;

  return (
    <div ref={boxRef} className="relative ml-auto sm:ml-6">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-busy={pending || undefined}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex min-h-11 max-w-[60vw] items-center gap-2 border border-border-field bg-field px-3 text-sm font-medium"
      >
        <Icon.home className="shrink-0" />
        <span className="truncate">
          <span className="sr-only">Hogar activo: </span>
          {active?.name}
        </span>
        <Icon.chevronDown size={16} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul id={listId} className="absolute right-0 top-[52px] z-[100] w-72 border border-text bg-bg">
          {households.map((h) => (
            <li key={h.id} className="border-b border-border">
              <form
                action={(fd) => {
                  setOpen(false);
                  start(() => switchAction(fd));
                }}
              >
                <input type="hidden" name="householdId" value={h.id} />
                <button
                  type="submit"
                  aria-current={h.id === active?.id ? "true" : undefined}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[15px] hover:bg-surface aria-[current]:font-medium"
                >
                  <Icon.home />
                  <span className="flex-1">{h.name}</span>
                  {h.id === active?.id && <Icon.check />}
                </button>
              </form>
            </li>
          ))}
          <li>
            <Link
              href="/perfil/hogares"
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center gap-3 px-4 text-[15px] no-underline hover:bg-surface"
            >
              <Icon.users />
              Gestionar hogares
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
