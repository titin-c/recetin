"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";

const COOKIE = "recetin_flash";
const VISIBLE_MS = 6000;

/**
 * Confirmaciones breves (paso 2/7): negro sólido, se anuncian sin mover el foco (role="status"),
 * no desaparecen mientras el ratón o el foco están encima, y no tapan campos ni botones
 * (abajo, por encima de la navegación inferior en móvil).
 * El mensaje llega del servidor (cookie leída en el layout) y aquí se borra la cookie al mostrarlo.
 */
export function Toast({ flash }: { flash: { id: string; message: string } | null }) {
  const [shown, setShown] = useState<{ id: string; message: string } | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Mensaje nuevo del servidor → se muestra y se borra la cookie (sistema externo).
  useEffect(() => {
    if (!flash) return;
    document.cookie = `${COOKIE}=; path=/; max-age=0`;
    const t = setTimeout(() => setShown(flash), 0);
    return () => clearTimeout(t);
  }, [flash]);

  const visible = shown && shown.id !== dismissedId ? shown : null;

  useEffect(() => {
    if (!visible || paused) return;
    timer.current = setTimeout(() => setDismissedId(visible.id), VISIBLE_MS);
    return () => clearTimeout(timer.current);
  }, [visible, paused]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 bottom-[88px] z-[300] flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6"
    >
      {visible && (
        <div
          className="pointer-events-auto flex w-full max-w-sm items-center gap-3 bg-action px-4 py-3.5 text-sm text-on-action"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <Icon.check className="shrink-0" />
          <span className="flex-1">{visible.message}</span>
          <button
            type="button"
            onClick={() => setDismissedId(visible.id)}
            className="-my-2 -mr-2 grid size-10 place-items-center"
            aria-label="Cerrar aviso"
          >
            <Icon.close />
          </button>
        </div>
      )}
    </div>
  );
}
