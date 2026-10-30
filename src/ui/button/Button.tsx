import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
export type ButtonSize = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 border font-medium leading-none no-underline cursor-pointer transition-colors " +
  "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent border-accent text-on-accent hover:bg-accent-hover hover:border-accent-hover",
  secondary: "bg-field border-action text-text hover:bg-surface",
  ghost: "bg-transparent border-transparent text-text underline underline-offset-[3px] hover:bg-surface",
  danger: "bg-field border-error-border text-error hover:bg-surface",
  "danger-solid": "bg-error-border border-error-border text-on-accent",
};

// Desactivado (paso 7): texto apagado + borde discontinuo; SIEMPRE con un texto cerca que explique por qué.
const disabled =
  "disabled:bg-transparent disabled:text-disabled disabled:border-dashed disabled:border-disabled " +
  "aria-disabled:bg-transparent aria-disabled:text-disabled aria-disabled:border-dashed aria-disabled:border-disabled";

const sizes: Record<ButtonSize, string> = {
  md: "min-h-12 px-6 py-3 text-base",
  sm: "min-h-10 px-4 py-2 text-sm",
};

export function buttonClasses(variant: ButtonVariant = "secondary", size: ButtonSize = "md", full = false, extra = "") {
  return [base, variants[variant], disabled, sizes[size], variant === "ghost" ? "px-2" : "", full ? "w-full" : "", extra].join(" ");
}

type CommonProps = { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; icon?: ReactNode };

export function Button({
  variant,
  size,
  full,
  icon,
  className = "",
  children,
  type = "button",
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button type={type} className={buttonClasses(variant, size, full, className)} {...props}>
      {icon}
      {children}
    </button>
  );
}

/** Enlace con aspecto de botón (navegación, no acción). */
export function ButtonLink({ variant, size, full, icon, className = "", children, ...props }: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClasses(variant, size, full, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}
