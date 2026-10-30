import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

const headers = () => new Headers({ "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` });

describe("acceso con Better Auth (BD real)", () => {
  it("el registro con email deja la cuenta lista: preferencias, rol y hogar propio", async () => {
    const res = await auth.api.signUpEmail({
      body: { name: "Lucía Martín", email: "lucia@test.es", password: "pimientos del padron" },
      headers: headers(),
    });
    const user = await db.user.findUniqueOrThrow({
      where: { id: res.user.id },
      include: { preferences: true, roles: true, memberships: true },
    });
    expect(user.emailVerified).toBe(false);
    expect(user.status).toBe("ACTIVE");
    expect(user.preferences).not.toBeNull();
    expect(user.roles).toHaveLength(1);
    expect(user.memberships).toHaveLength(1);
    // La contraseña nunca se guarda en claro.
    const account = await db.account.findFirstOrThrow({ where: { userId: user.id, providerId: "credential" } });
    expect(account.password).not.toContain("pimientos");
  });

  it("rechaza contraseñas muy comunes aunque se llame directamente a la API", async () => {
    await expect(
      auth.api.signUpEmail({ body: { name: "X", email: "x@test.es", password: "contraseña123" }, headers: headers() }),
    ).rejects.toMatchObject({ body: { message: "PASSWORD_NOT_ACCEPTABLE" } });
    expect(await db.user.count({ where: { email: "x@test.es" } })).toBe(0);
  });

  it("una cuenta suspendida no puede abrir sesión", async () => {
    await auth.api.signUpEmail({ body: { name: "Pepe", email: "pepe@test.es", password: "pimientos del padron" }, headers: headers() });
    await db.user.update({ where: { email: "pepe@test.es" }, data: { status: "SUSPENDED" } });
    await expect(
      auth.api.signInEmail({ body: { email: "pepe@test.es", password: "pimientos del padron" }, headers: headers() }),
    ).rejects.toMatchObject({ body: { message: "ACCOUNT_SUSPENDED" } });
  });

  it("con credenciales incorrectas no distingue si el email existe", async () => {
    await auth.api.signUpEmail({ body: { name: "Marta", email: "marta@test.es", password: "pimientos del padron" }, headers: headers() });
    const wrongPass = await auth.api
      .signInEmail({ body: { email: "marta@test.es", password: "otra cosa distinta" }, headers: headers() })
      .catch((e) => e);
    const noUser = await auth.api
      .signInEmail({ body: { email: "nadie@test.es", password: "otra cosa distinta" }, headers: headers() })
      .catch((e) => e);
    expect(wrongPass.body?.code).toBe(noUser.body?.code);
  });
});
