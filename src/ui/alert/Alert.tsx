import type { ReactNode } from "react";
import { Icon } from "../icons";

type Tone = "error" | "warning" | "info";

const tones: Record<Tone, { border: string; title: string; icon: string; Glyph: typeof Icon.alert }> = {
  error: { border: "border-error-border", title: "text-error", icon: "text-error-border", Glyph: Icon.alert },
  warning: { border: "border-warning", title: "text-warning", icon: "text-warning-icon", Glyph: Icon.alert },
  info: { border: "border-info", title: "text-info", icon: "text-info", Glyph: Icon.info },
};

/**
 * Aviso persistente. El color nunca va solo: siempre icono + título en palabras.
 * `announce`: errores de envío se anuncian al momento (role="alert"); los avisos fijos no.
 */
export function Alert({
  tone,
  title,
  children,
  announce = tone === "error",
  action,
  className = "",
}: {
  tone: Tone;
  title: string;
  children?: ReactNode;
  announce?: boolean;
  action?: ReactNode;
  className?: string;
}) {
  const t = tones[tone];
  return (
    <div
      role={announce ? "alert" : undefined}
      className={`flex gap-3 border border-l-4 bg-field px-4 py-3 text-sm leading-normal ${t.border} ${className}`}
    >
      <t.Glyph className={`mt-0.5 shrink-0 ${t.icon}`} />
      <p className="flex-1">
        <b className={`font-medium ${t.title}`}>{title}</b> {children}
      </p>
      {action}
    </div>
  );
}
