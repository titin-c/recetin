// Prepara Lighthouse CI: crea una cuenta de prueba con rol de administrador en la app ya arrancada,
// entra con ella y deja la cookie de sesión en .lighthouseci/cookie.txt para medir las páginas con sesión.
// Solo para CI y pruebas locales: NUNCA contra producción.
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import pg from "pg";

const base = process.env.LHCI_BASE_URL ?? "http://localhost:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error("lhci-prepare solo se ejecuta contra localhost");

const email = `lighthouse-${Date.now()}@example.test`;
const password = randomBytes(18).toString("base64url");
const headers = { "content-type": "application/json", origin: base };

const signUp = await fetch(`${base}/api/auth/sign-up/email`, {
  method: "POST",
  headers,
  body: JSON.stringify({ name: "Lighthouse", email, password }),
});
if (!signUp.ok) throw new Error(`No se pudo crear la cuenta de prueba: ${signUp.status} ${await signUp.text()}`);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
// Aviso de privacidad aceptado + rol de administrador, para poder medir también el panel.
await client.query(
  `insert into privacy_consent (id, "userId", version) select gen_random_uuid(), id, '2026-10-30' from "user" where email = $1 on conflict do nothing`,
  [email],
);
await client.query(
  `insert into user_role ("userId", "roleId") select u.id, r.id from "user" u, role r where u.email = $1 and r.code = 'ADMIN' on conflict do nothing`,
  [email],
);
await client.query(`update user_preferences set "onboardingDone" = true where "userId" = (select id from "user" where email = $1)`, [
  email,
]);
await client.end();

const signIn = await fetch(`${base}/api/auth/sign-in/email`, {
  method: "POST",
  headers,
  body: JSON.stringify({ email, password }),
  redirect: "manual",
});
const cookie = signIn.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ");
if (!signIn.ok || !cookie) throw new Error(`No se pudo entrar con la cuenta de prueba: ${signIn.status}`);
mkdirSync(".lighthouseci", { recursive: true });
writeFileSync(".lighthouseci/cookie.txt", cookie);
console.log("Cuenta de prueba lista para Lighthouse CI.");
