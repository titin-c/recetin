# RECETÍN

App web privada para gestionar recetas, planificar menús, calcular valores nutricionales y generar listas de la compra.

- Cómo está organizado el código: [ARCHITECTURE.md](ARCHITECTURE.md)
- Decisiones importantes: [docs/decisiones/](docs/decisiones/)
- Base de datos: [docs/base-de-datos.md](docs/base-de-datos.md)
- Despliegue (Vercel + Neon + Resend) y acceso con Google: [docs/despliegue.md](docs/despliegue.md)
- Copias de seguridad y recuperación: [docs/recuperacion.md](docs/recuperacion.md)
- Casos de uso (la «API» interna): [docs/casos-de-uso.md](docs/casos-de-uso.md)

## Estado

**Fase 1, entrega 11a:** acceso con email y contraseña (y con Google cuando se configure), verificación de email, recuperación de contraseña, aviso de privacidad y la base de datos de la Fase 1 (usuarios, roles y permisos, perfil, hogares, auditoría).
Siguientes entregas: 11b (bienvenida, perfil, hogares y navegación) y 11c (panel de administración).

## Arrancar en tu ordenador

Necesitas **Node.js 22** y **pnpm** (`corepack enable` lo activa), y una base de datos PostgreSQL 16 en local. Dos opciones:

- **Con Docker:** `docker compose up -d` arranca PostgreSQL (puerto 5432) y Mailpit (los emails se ven en http://localhost:8025, no se envían).
- **Sin Docker (Mac):** instala [Postgres.app](https://postgresapp.com), ábrelo y crea las bases de datos `recetin` y `recetin_test`. Los emails se mostrarán en la terminal.

```bash
pnpm install
cp .env.example .env            # y revisa los valores (ver comentarios dentro)
pnpm db:migrate                 # crea las tablas
pnpm db:seed                    # roles, permisos y nutrientes base
pnpm dev                        # http://localhost:3000
```

Para hacerte **administrador**: regístrate en la app y luego ejecuta `ADMIN_EMAIL=tu@email.es pnpm db:seed`.

## Comprobaciones

```bash
pnpm lint            # estilo y fronteras entre módulos
pnpm typecheck       # TypeScript estricto
pnpm test            # tests unitarios y de componentes
pnpm test:int:prepare && pnpm test:int   # tests de integración contra la BD de pruebas (DATABASE_URL_TEST)
pnpm build           # build de producción
```

Lo mismo se ejecuta automáticamente en GitHub en cada push y pull request (`.github/workflows/ci.yml`).
