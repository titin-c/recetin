import type { ComponentProps, ReactNode } from "react";
import { Icon } from "../icons";

export const fieldBoxClasses =
  "w-full min-h-12 bg-field text-text text-base px-3 py-3 border border-border-field placeholder:text-text-2 " +
  "aria-invalid:border-2 aria-invalid:border-error-border";

/** Error bajo el campo: icono + texto, asociado con aria-describedby. */
export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm leading-snug text-error">
      <Icon.alert size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Campo de texto: etiqueta SIEMPRE visible encima (nunca solo placeholder), pista opcional
 * y error debajo. Etiqueta, pista y error quedan asociados al input.
 */
export function TextField({
  name,
  label,
  hint,
  error,
  optional,
  id = `campo-${name}`,
  className = "",
  ...input
}: {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
} & Omit<ComponentProps<"input">, "name">) {
  const hintId = hint ? `${id}-pista` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`mt-4 ${className}`}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium leading-tight">
        {label} {optional && <span className="font-normal text-text-2">(opcional)</span>}
      </label>
      <input
        id={id}
        name={name}
        className={fieldBoxClasses}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(" ") || undefined}
        {...input}
      />
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm leading-snug text-text-2">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}
