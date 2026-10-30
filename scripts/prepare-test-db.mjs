// Deja la base de datos de PRUEBAS lista: aplica las migraciones pendientes y la semilla.
// No borra nada: cada test limpia sus propios datos (tests/helpers/integration-setup.ts).
// Nunca toca la base de datos de desarrollo: exige DATABASE_URL_TEST y que sea distinta de DATABASE_URL.
import "dotenv/config";
import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL_TEST;
if (!url) throw new Error("Falta DATABASE_URL_TEST en .env");
if (url === process.env.DATABASE_URL) throw new Error("DATABASE_URL_TEST no puede ser la misma base de datos que DATABASE_URL");

const env = { ...process.env, DATABASE_URL: url, DIRECT_URL: url };
execSync("prisma migrate deploy", { stdio: "inherit", env });
execSync("prisma db seed", { stdio: "inherit", env });
