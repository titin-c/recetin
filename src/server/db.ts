import "server-only";
// eslint-disable-next-line no-restricted-imports -- este es el cliente único
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

/**
 * Cliente Prisma único.
 * - Neon (producción): adaptador serverless sobre la cadena con pooler (ARCHITECTURE.md §10.2).
 * - Resto (PostgreSQL local, CI): adaptador pg estándar.
 */
function createClient() {
  const isNeon = env.DATABASE_URL.includes(".neon.tech");
  const adapter = isNeon ? new PrismaNeon({ connectionString: env.DATABASE_URL }) : new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" && process.env.PRISMA_LOG_QUERIES === "1" ? ["query", "warn", "error"] : ["warn", "error"],
  });
}

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };
export const db = globalForDb.db ?? createClient();
if (env.NODE_ENV !== "production") globalForDb.db = db;

export type Db = typeof db;
/** Cliente dentro de una transacción interactiva. */
export type Tx = Parameters<Parameters<Db["$transaction"]>[0]>[0];
