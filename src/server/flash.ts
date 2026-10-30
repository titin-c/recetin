import "server-only";
import { cookies } from "next/headers";

export const FLASH_COOKIE = "recetin_flash";

/**
 * Mensaje breve para el próximo render (toast «Cambios guardados», «Ahora estás en…»).
 * Cookie corta y sin datos sensibles; la lee y la borra el componente Toast.
 */
export async function flash(message: string) {
  // El id hace que el mismo mensaje dos veces seguidas se vuelva a mostrar.
  (await cookies()).set(FLASH_COOKIE, `${Date.now()}|${message}`, { path: "/", maxAge: 30, sameSite: "lax", httpOnly: false });
}

/** Lo lee el layout en el servidor (también tras una Server Action que no cambia de página). */
export async function readFlash(): Promise<{ id: string; message: string } | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  const i = raw.indexOf("|");
  return i > 0 ? { id: raw.slice(0, i), message: raw.slice(i + 1) } : null;
}
