import type { ComponentProps, ReactNode } from "react";
import { FieldError } from "../text-field/TextField";

/** Casilla nativa (accesible de serie) a 24 px, en el color de acento; toda la etiqueta es clicable. */
export function Checkbox({
  name,
  children,
  error,
  id = `casilla-${name}`,
  ...input
}: { name: string; children: ReactNode; error?: string } & Omit<ComponentProps<"input">, "type" | "name">) {
  return (
    <div className="mt-4">
      <div className="flex items-start gap-3 text-sm leading-normal">
        <input
          id={id}
          name={name}
          type="checkbox"
          className="mt-0.5 size-6 shrink-0 cursor-pointer"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...input}
        />
        <label htmlFor={id} className="cursor-pointer">
          {children}
        </label>
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
