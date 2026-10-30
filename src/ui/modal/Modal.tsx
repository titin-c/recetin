"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "../icons";

/**
 * Diálogo modal SOLO para confirmaciones destructivas (regla de composición del design system).
 * Usa <dialog> nativo: foco dentro, Esc cierra y el foco vuelve al botón que lo abrió (paso 7).
 */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-32px)] max-w-[480px] border border-text bg-bg p-6 text-text backdrop:bg-overlay"
    >
      <div className="flex items-start gap-3">
        <h2 id={titleId} className="flex-1 text-xl">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="-mr-3 -mt-3 grid size-12 place-items-center" aria-label="Cerrar">
          <Icon.close size={24} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
