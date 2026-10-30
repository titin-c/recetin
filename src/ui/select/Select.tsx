import type { ComponentProps } from "react";
import { Icon } from "../icons";

/** Desplegable nativo (accesible de serie) con el aspecto de los campos. */
export function Select({
  name,
  label,
  hint,
  options,
  id = `campo-${name}`,
  ...select
}: { name: string; label: string; hint?: string; options: { value: string; label: string }[] } & Omit<ComponentProps<"select">, "name">) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium leading-tight">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          aria-describedby={hint ? `${id}-pista` : undefined}
          className="min-h-12 w-full appearance-none border border-border-field bg-field px-3 py-3 pr-10 text-base text-text"
          {...select}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon.chevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
      </div>
      {hint && (
        <p id={`${id}-pista`} className="mt-1.5 text-sm text-text-2">
          {hint}
        </p>
      )}
    </div>
  );
}
