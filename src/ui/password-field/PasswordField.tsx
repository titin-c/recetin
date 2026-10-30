"use client";

import { useId, useState } from "react";
import { checkPassword } from "@/modules/identity";
import { FieldError, fieldBoxClasses } from "../text-field/TextField";
import { Icon } from "../icons";

/**
 * Contraseña con «Mostrar / Ocultar» (estado anunciado) y, para contraseñas nuevas, los
 * requisitos visibles ANTES de escribir y marcados en directo (paso 7). Se puede pegar y
 * funciona con gestores de contraseñas (autocomplete correcto).
 */
export function PasswordField({
  name = "password",
  label = "Contraseña",
  error,
  isNew = false,
  autoFocus,
}: {
  name?: string;
  label?: string;
  error?: string;
  isNew?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const checks = isNew ? checkPassword(value) : [];
  const reqId = `${id}-requisitos`;
  const errorId = `${id}-error`;

  return (
    <div className="mt-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium leading-tight">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={isNew ? "new-password" : "current-password"}
          required
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${fieldBoxClasses} pr-24`}
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : "", isNew ? reqId : ""].filter(Boolean).join(" ") || undefined}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
          aria-controls={id}
          className="absolute right-1 top-1 min-h-10 px-3 text-sm font-medium underline underline-offset-[3px]"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {isNew && (
        <ul id={reqId} className="mt-2 text-sm" aria-live="polite">
          {checks.map((c) => (
            <li key={c.id} className={`flex items-center gap-2 py-0.5 ${c.ok ? "text-text" : "text-text-2"}`}>
              {c.ok ? <Icon.check size={16} /> : <Icon.pending size={16} />}
              {c.label}
              <span className="sr-only">{c.ok ? ": cumplido" : ": pendiente"}</span>
            </li>
          ))}
        </ul>
      )}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
