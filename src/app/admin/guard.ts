import "server-only";
import { notFound } from "next/navigation";
import { requireActor } from "@/server/session";
import { isAdmin } from "@/modules/access";

/**
 * Layout y páginas del panel se ejecutan en paralelo: cada página comprueba también el rol para responder
 * 404 sin lanzar errores de permiso al log. Los casos de uso vuelven a comprobar el permiso concreto.
 */
export async function requireAdminActor() {
  const actor = await requireActor();
  if (!isAdmin(actor)) notFound();
  return actor;
}
