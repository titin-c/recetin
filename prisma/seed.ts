/**
 * Semilla: roles, permisos, nutrientes base y (opcional) un primer administrador.
 * Idempotente: se puede ejecutar varias veces.
 *
 *   pnpm db:seed
 *   ADMIN_EMAIL=tu@email.es pnpm db:seed   → da el rol ADMIN a esa cuenta (debe existir ya:
 *                                             regístrate primero en la app y luego ejecuta esto)
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "../src/modules/access/domain/policies";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }) });

const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.ADMIN_PANEL]: "Entrar en el panel de administración",
  [PERMISSIONS.USERS_READ]: "Ver usuarios",
  [PERMISSIONS.USERS_MANAGE]: "Suspender, reactivar y eliminar usuarios",
  [PERMISSIONS.ROLES_MANAGE]: "Cambiar roles",
  [PERMISSIONS.AUDIT_READ]: "Ver la auditoría",
  [PERMISSIONS.PRIVATE_CONTENT_READ]: "Ver contenido privado (queda registrado)",
};

// Nutrientes que se pueden fijar como objetivo desde la Fase 1 (el catálogo completo llega en la Fase 3).
const NUTRIENTS = [
  { code: "ENERGY_KCAL", label: "Energía", unit: "kcal", sortBy: 10 },
  { code: "PROTEIN", label: "Proteínas", unit: "g", sortBy: 20 },
  { code: "CARBOHYDRATE", label: "Hidratos de carbono", unit: "g", sortBy: 30 },
  { code: "SUGARS", label: "Azúcares", unit: "g", sortBy: 40 },
  { code: "FAT", label: "Grasas", unit: "g", sortBy: 50 },
  { code: "SATURATED_FAT", label: "Grasas saturadas", unit: "g", sortBy: 60 },
  { code: "FIBER", label: "Fibra", unit: "g", sortBy: 70 },
  { code: "SALT", label: "Sal", unit: "g", sortBy: 80 },
];

async function main() {
  for (const [code, label] of Object.entries(PERMISSION_LABELS)) {
    await db.permission.upsert({ where: { code }, create: { code, label }, update: { label } });
  }
  const roleLabels: Record<string, string> = { USER: "Usuario", ADMIN: "Administrador" };
  for (const code of Object.values(ROLES)) {
    const role = await db.role.upsert({ where: { code }, create: { code, label: roleLabels[code] }, update: { label: roleLabels[code] } });
    for (const permissionCode of ROLE_PERMISSIONS[code]) {
      const permission = await db.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      });
    }
  }
  for (const n of NUTRIENTS) {
    await db.nutrient.upsert({ where: { code: n.code }, create: n, update: n });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail) {
    const user = await db.user.findUnique({ where: { email: adminEmail } });
    if (!user) {
      console.warn(`No existe ninguna cuenta con ${adminEmail}. Regístrate primero en la app y vuelve a ejecutar la semilla.`);
    } else {
      const admin = await db.role.findUniqueOrThrow({ where: { code: ROLES.ADMIN } });
      await db.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: admin.id } },
        create: { userId: user.id, roleId: admin.id },
        update: {},
      });
      console.info(`${adminEmail} ya es administrador.`);
    }
  }
  console.info("Semilla aplicada: roles, permisos y nutrientes base.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
