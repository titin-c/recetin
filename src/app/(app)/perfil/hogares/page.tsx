import type { Metadata } from "next";
import { requireActor } from "@/server/session";
import { listMyHouseholds } from "@/modules/households/server";
import { HouseholdCard } from "./HouseholdCard";
import { CreateHousehold } from "./CreateHousehold";

export const metadata: Metadata = { title: "Hogares" };

export default async function HouseholdsPage() {
  const actor = await requireActor();
  const households = await listMyHouseholds(actor);
  const single = households.length === 1;
  return (
    <div className="max-w-2xl">
      <p className="mt-6 text-text-2">
        El menú y la lista de la compra se comparten con quien vive en el mismo hogar. Tus recetas y tus objetivos siguen siendo solo tuyos.
      </p>
      {households.map((h) => (
        <HouseholdCard key={h.id} household={h} me={{ id: actor.userId, emailVerified: actor.emailVerified }} isOnlyHousehold={single} />
      ))}
      {single && (
        <p className="mt-4 border border-dashed border-border-field px-4 py-3 text-sm text-text-2">
          Solo perteneces a un hogar. Cuando te unas a otro, podrás cambiar entre ellos desde la cabecera.
        </p>
      )}
      <CreateHousehold />
    </div>
  );
}
