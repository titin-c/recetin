import { buttonClasses } from "@/ui/button/Button";
import { googleAction } from "./actions";

/** Botón de Google. El logo va en color: es la única excepción, la exigen sus normas de marca (paso 8). */
export function GoogleButton({ label, enabled, next }: { label: string; enabled: boolean; next?: string }) {
  if (!enabled) {
    return (
      <div className="mt-6">
        <button type="button" disabled className={buttonClasses("secondary", "md", true)}>
          {label}
        </button>
        <p className="mt-1.5 text-sm text-text-2">El acceso con Google aún no está configurado. Usa tu email.</p>
      </div>
    );
  }
  return (
    <form action={googleAction} className="mt-6">
      {next && <input type="hidden" name="siguiente" value={next} />}
      <button type="submit" className={buttonClasses("secondary", "md", true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z" />
          <path
            fill="#34A853"
            d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z"
          />
          <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z" />
          <path fill="#EA4335" d="M12 5c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3C6.5 7 9 5 12 5z" />
        </svg>
        {label}
      </button>
    </form>
  );
}

export function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center gap-3 text-sm text-text-2 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
      {children}
    </div>
  );
}
