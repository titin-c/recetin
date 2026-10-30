"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "../icons";

/**
 * Panel lateral para editar/consultar sin perder la lista (regla de composición: drawer para editar).
 * <dialog> modal nativo: foco dentro, Esc cierra y el foco vuelve a quien lo abrió.
 */
export function Drawer({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="ml-auto mr-0 mt-0 flex h-dvh max-h-dvh w-full max-w-[440px] flex-col border-l border-text bg-bg p-0 text-text backdrop:bg-overlay/50"
    >
      <div className="flex items-center border-b border-text px-6 py-3">
        <h2 id={titleId} className="flex-1 text-xl">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="-mr-3 grid size-12 place-items-center"
          aria-label="Cerrar ficha"
        >
          <Icon.close size={24} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      {footer && <div className="flex flex-wrap gap-2 border-t border-text px-6 py-4">{footer}</div>}
    </dialog>
  );
}
