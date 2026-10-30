import type { ReactNode } from "react";

/** Opciones grandes (toda la tarjeta es clicable) con radio nativo: teclado con flechas de serie. */
export function RadioCards({
  name,
  legend,
  options,
  defaultValue,
}: {
  name: string;
  legend: string;
  options: { value: string; label: string; detail?: ReactNode }[];
  defaultValue?: string;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className="mt-2 flex min-h-16 cursor-pointer items-center gap-3 border border-border-field bg-field px-3 py-3 has-[:checked]:border-2 has-[:checked]:border-accent"
        >
          <input type="radio" name={name} value={o.value} defaultChecked={o.value === defaultValue} className="size-5 shrink-0" />
          <span>
            <span className="block font-medium">{o.label}</span>
            {o.detail && <span className="block text-xs text-text-2">{o.detail}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
