# Base de datos

PostgreSQL 16 con Prisma 7. El esquema está en `prisma/schema.prisma`, el modelo completo de todas las fases en ARCHITECTURE.md §6 y las migraciones en `prisma/migrations`.

## Tablas de la Fase 1
`user`, `session`, `account`, `verification`, `rate_limit` (Better Auth) · `role`, `permission`, `role_permission`, `user_role` · `user_preferences`, `nutrient`, `nutrition_goal`, `privacy_consent` · `household`, `household_member`, `household_invitation`, `active_household` · `audit_log`.

## Políticas de borrado
| Al borrar… | Se borra en cascada | Se conserva |
|---|---|---|
| un usuario | sesiones, cuentas de acceso, roles, preferencias, objetivos, consentimientos, pertenencias a hogares, hogar activo | hogares que creó (`createdById` a null), invitaciones que envió (`invitedById` a null), auditoría (`actorId` a null, con `actorLabel`) |
| un hogar | miembros, invitaciones, hogar activo de quien lo tuviera | — |
| un rol | sus permisos asignados | no se puede borrar si alguien lo tiene (`Restrict`) |

## Crear una migración
1. Cambia `prisma/schema.prisma`.
2. `pnpm db:migrate --name descripcion_corta` crea la migración SQL y la aplica en tu BD local.
3. Revisa el SQL generado y súbelo con el código.
4. En producción se aplica sola en el build (`pnpm db:deploy`). Las migraciones ya aplicadas **no se editan nunca**.

## Semilla
`pnpm db:seed` es idempotente: crea o actualiza roles, permisos y nutrientes base. Con `ADMIN_EMAIL` da el rol de administrador a esa cuenta.
