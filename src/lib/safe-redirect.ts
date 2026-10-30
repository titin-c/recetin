/** Solo rutas internas («/algo»): evita redirecciones abiertas a otras webs con ?siguiente=. */
export function safeInternalPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
