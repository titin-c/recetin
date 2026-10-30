/**
 * Tests de integración: usan una base de datos PostgreSQL REAL de pruebas (nunca la de desarrollo).
 *   DATABASE_URL_TEST=postgresql://…/recetin_test pnpm test:int
 * La migración y la semilla se aplican antes con `pnpm test:int:prepare`.
 */
import "dotenv/config";
import { afterAll, beforeEach } from "vitest";

const url = process.env.DATABASE_URL_TEST;
if (!url) throw new Error("Falta DATABASE_URL_TEST: los tests de integración necesitan una base de datos de pruebas.");
process.env.DATABASE_URL = url;
process.env.BETTER_AUTH_SECRET ??= "secreto-de-tests-0123456789abcdef0123456789";
process.env.EMAIL_DRIVER = "console";

const { db } = await import("@/server/db");

beforeEach(async () => {
  // Limpia los datos de usuario entre tests; conserva roles, permisos y nutrientes de la semilla.
  await db.auditLog.deleteMany();
  await db.household.deleteMany();
  await db.user.deleteMany();
  await db.rateLimit.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
});
