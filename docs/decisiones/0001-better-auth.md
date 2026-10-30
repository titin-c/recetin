# 0001 · Better Auth para el acceso

**Fecha:** 30/10/2026 · **Estado:** aceptada (paso 9 del pipeline)

## Contexto

Hace falta acceso con Google y con email y contraseña, verificación de email, recuperación de contraseña, límite de intentos y sesiones que se puedan revocar al momento (cerrar sesión en otros dispositivos, suspensión por el admin).

## Decisión

Better Auth 1.7 con el adaptador de Prisma, sesiones guardadas en PostgreSQL y el plugin `nextCookies` para Server Actions.

## Por qué no Auth.js

Desde el 22/09/2025 Auth.js lo mantiene el equipo de Better Auth, que recomienda Better Auth para proyectos nuevos. Además, Auth.js no guarda en BD las sesiones de email y contraseña sin trucos.

## Consecuencias

- Las tablas `user`, `session`, `account`, `verification` y `rate_limit` tienen los nombres de campo que espera Better Auth.
- Nuestras reglas van en ganchos de Better Auth, así se aplican también si alguien llama a `/api/auth/*` directamente:
  - contraseña no común (`hooks.before`);
  - preparar la cuenta nueva: preferencias, rol y hogar (`databaseHooks.user.create.after`);
  - bloquear cuentas suspendidas (`databaseHooks.session.create.before`).
- Google no se vincula solo a una cuenta de email existente (`disableImplicitLinking`): se vincula desde Perfil › Seguridad tras entrar con la contraseña.
