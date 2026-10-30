"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "./Button";
import { Icon } from "../icons";

/**
 * Botón de envío de formulario: mientras se envía queda bloqueado (sin doble envío)
 * y muestra el texto de carga («Entrando…»), anunciado por el lector con aria-busy.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size,
  full = true,
  ...props
}: { pendingLabel: string; variant?: ButtonVariant; size?: ButtonSize; full?: boolean } & Omit<ComponentProps<"button">, "type">) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      full={full}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      onClick={(e) => {
        if (pending) e.preventDefault();
      }}
      icon={pending ? <Icon.spinner className="animate-spin" /> : undefined}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
