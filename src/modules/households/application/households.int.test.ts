import { describe, expect, it, beforeEach } from "vitest";
import { v7 as uuidv7 } from "uuid";
import { db } from "@/server/db";
import { MemorySender, setEmailSender } from "@/server/email";
import { setupNewUser } from "@/modules/identity/server";
import { deleteOwnAccount } from "@/modules/identity/server";
import type { Actor } from "@/modules/access";
import {
  acceptInvitation,
  changeMemberRole,
  createHousehold,
  deleteHousehold,
  getInvitation,
  inviteMember,
  leaveHousehold,
  removeMember,
  revokeInvitation,
  setActiveHousehold,
} from "./households";

let mail: MemorySender;
beforeEach(() => {
  mail = new MemorySender();
  setEmailSender(mail);
});

async function newUser(name: string, verified = true) {
  const u = await db.user.create({
    data: { id: uuidv7(), name, email: `${name.toLowerCase()}-${uuidv7()}@test.es`, emailVerified: verified },
  });
  await setupNewUser(u);
  return u;
}

/** Actor tal como lo construye getActor() a partir de la BD. */
async function actorOf(userId: string): Promise<Actor> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { memberships: true, activeHousehold: true } });
  return {
    userId: u.id,
    name: u.name,
    email: u.email,
    emailVerified: u.emailVerified,
    roles: ["USER"],
    permissions: [],
    households: Object.fromEntries(u.memberships.map((m) => [m.householdId, m.role])),
    activeHouseholdId: u.activeHousehold?.householdId ?? null,
  };
}

const tokenFromLastEmail = () => /\/invitacion\/([\w-]+)/.exec(mail.sent.at(-1)!.message.text)![1];

describe("hogares (BD real)", () => {
  it("invitar → aceptar: la persona invitada se une como miembro y pasa a ese hogar", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const casa = (await actorOf(marta.id)).activeHouseholdId!;

    await inviteMember(await actorOf(marta.id), casa, javi.email);
    expect(mail.sent).toHaveLength(1);
    const token = tokenFromLastEmail();
    // El token no se guarda en claro.
    expect(await db.householdInvitation.count({ where: { tokenHash: token } })).toBe(0);

    expect(await getInvitation(token)).toMatchObject({ usable: true, householdName: "Casa de Marta", inviterName: "Marta" });
    expect(await acceptInvitation(await actorOf(javi.id), token)).toBe("Casa de Marta");

    const javiNow = await actorOf(javi.id);
    expect(javiNow.households[casa]).toBe("MEMBER");
    expect(javiNow.activeHouseholdId).toBe(casa);
    // La invitación solo sirve una vez.
    await expect(acceptInvitation(javiNow, token)).rejects.toThrow(/ya no vale/);
  });

  it("solo la persona propietaria y verificada puede invitar; un miembro no", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const sinVerificar = await newUser("Pepe", false);
    const casa = (await actorOf(marta.id)).activeHouseholdId!;
    await inviteMember(await actorOf(marta.id), casa, javi.email);
    await acceptInvitation(await actorOf(javi.id), tokenFromLastEmail());

    await expect(inviteMember(await actorOf(javi.id), casa, "otra@test.es")).rejects.toThrow(/propietaria/);
    const casaPepe = (await actorOf(sinVerificar.id)).activeHouseholdId!;
    await expect(inviteMember(await actorOf(sinVerificar.id), casaPepe, "otra@test.es")).rejects.toThrow(/verifica tu email/);
  });

  it("una invitación para otro email no se puede aceptar con un enlace reenviado", async () => {
    const marta = await newUser("Marta");
    const intruso = await newUser("Intruso");
    const casa = (await actorOf(marta.id)).activeHouseholdId!;
    await inviteMember(await actorOf(marta.id), casa, "lucia@test.es");
    await expect(acceptInvitation(await actorOf(intruso.id), tokenFromLastEmail())).rejects.toThrow(/es para lucia@test.es/);
  });

  it("anular una invitación la deja inservible, y reinvitar anula la anterior", async () => {
    const marta = await newUser("Marta");
    const casa = (await actorOf(marta.id)).activeHouseholdId!;
    const a = await actorOf(marta.id);
    await inviteMember(a, casa, "lucia@test.es");
    const first = tokenFromLastEmail();
    await inviteMember(a, casa, "lucia@test.es");
    expect((await getInvitation(first))?.usable).toBe(false);
    const inv = await db.householdInvitation.findFirstOrThrow({ where: { email: "lucia@test.es", status: "PENDING" } });
    await revokeInvitation(a, inv.id);
    expect((await getInvitation(tokenFromLastEmail()))?.usable).toBe(false);
  });

  it("nadie actúa sobre un hogar ajeno (ni cambiar al hogar activo, ni expulsar)", async () => {
    const marta = await newUser("Marta");
    const ajena = await newUser("Ajena");
    const casaAjena = (await actorOf(ajena.id)).activeHouseholdId!;
    await expect(setActiveHousehold(await actorOf(marta.id), casaAjena)).rejects.toThrow(/No existe o no tienes acceso/);
    await expect(removeMember(await actorOf(marta.id), casaAjena, ajena.id)).rejects.toThrow(/No existe o no tienes acceso/);
  });

  it("la última persona propietaria no puede salir sin pasar la propiedad", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const martaA = await actorOf(marta.id);
    const casa = martaA.activeHouseholdId!;
    await inviteMember(martaA, casa, javi.email);
    await acceptInvitation(await actorOf(javi.id), tokenFromLastEmail());
    await createHousehold(await actorOf(marta.id), "Piso de la playa");

    await expect(leaveHousehold(await actorOf(marta.id), casa)).rejects.toThrow(/única persona propietaria/);
    await leaveHousehold(await actorOf(marta.id), casa, javi.id);
    const javiA = await actorOf(javi.id);
    expect(javiA.households[casa]).toBe("OWNER");
    expect((await actorOf(marta.id)).households[casa]).toBeUndefined();
  });

  it("no se puede salir ni borrar el único hogar", async () => {
    const marta = await newUser("Marta");
    const a = await actorOf(marta.id);
    await expect(leaveHousehold(a, a.activeHouseholdId!)).rejects.toThrow(/único hogar/);
    await expect(deleteHousehold(a, a.activeHouseholdId!, "Casa de Marta")).rejects.toThrow(/único hogar/);
  });

  it("siempre queda al menos una persona propietaria", async () => {
    const marta = await newUser("Marta");
    const a = await actorOf(marta.id);
    await expect(changeMemberRole(a, a.activeHouseholdId!, marta.id, "MEMBER")).rejects.toThrow(/al menos una persona propietaria/);
  });

  it("borrar un hogar exige escribir su nombre y reubica a sus miembros", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const playa = await createHousehold(await actorOf(marta.id), "Piso de la playa");
    await inviteMember(await actorOf(marta.id), playa.id, javi.email);
    await acceptInvitation(await actorOf(javi.id), tokenFromLastEmail());

    await expect(deleteHousehold(await actorOf(marta.id), playa.id, "piso")).rejects.toThrow(/exactamente/);
    await deleteHousehold(await actorOf(marta.id), playa.id, "Piso de la playa");
    expect(await db.household.count({ where: { id: playa.id } })).toBe(0);
    const javiA = await actorOf(javi.id);
    expect(javiA.activeHouseholdId).not.toBe(playa.id);
    expect(javiA.activeHouseholdId).not.toBeNull();
  });

  it("expulsar a alguien que se queda sin hogares le crea uno propio", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const casa = (await actorOf(marta.id)).activeHouseholdId!;
    await inviteMember(await actorOf(marta.id), casa, javi.email);
    await acceptInvitation(await actorOf(javi.id), tokenFromLastEmail());
    // Javi deja su hogar propio para quedarse solo en el de Marta.
    const javiA = await actorOf(javi.id);
    const casaJavi = Object.keys(javiA.households).find((id) => id !== casa)!;
    await deleteHousehold(javiA, casaJavi, "Casa de Javi");

    await removeMember(await actorOf(marta.id), casa, javi.id);
    const after = await actorOf(javi.id);
    expect(Object.keys(after.households)).toHaveLength(1);
    expect(after.activeHouseholdId).toBe(Object.keys(after.households)[0]);
  });

  it("eliminar la propia cuenta exige pasar antes la propiedad de los hogares compartidos", async () => {
    const marta = await newUser("Marta");
    const javi = await newUser("Javi");
    const casa = (await actorOf(marta.id)).activeHouseholdId!;
    await inviteMember(await actorOf(marta.id), casa, javi.email);
    await acceptInvitation(await actorOf(javi.id), tokenFromLastEmail());

    await expect(deleteOwnAccount(await actorOf(marta.id), "otro@test.es")).rejects.toThrow(/exactamente/);
    await expect(deleteOwnAccount(await actorOf(marta.id), marta.email)).rejects.toThrow(/pasa la propiedad de «Casa de Marta»/);
    await changeMemberRole(await actorOf(marta.id), casa, javi.id, "OWNER");
    await deleteOwnAccount(await actorOf(marta.id), marta.email);
    expect(await db.user.count({ where: { id: marta.id } })).toBe(0);
    expect(await db.household.count({ where: { id: casa } })).toBe(1); // el hogar compartido sigue para Javi
  });
});
