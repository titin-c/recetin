# RECETÍN

App web privada para gestionar recetas, planificar menús, calcular valores nutricionales y generar listas de la compra.

- Cómo está organizado el código: [ARCHITECTURE.md](ARCHITECTURE.md)
- Decisiones importantes: [docs/decisiones/](docs/decisiones/)
- Base de datos: [docs/base-de-datos.md](docs/base-de-datos.md)
- Despliegue (Vercel + Neon + Resend) y acceso con Google: [docs/despliegue.md](docs/despliegue.md)
- Copias de seguridad y recuperación: [docs/recuperacion.md](docs/recuperacion.md)
- Casos de uso (la «API» interna): [docs/casos-de-uso.md](docs/casos-de-uso.md)

## Estado

**Fase 1:**

- **11a:** acceso con email y contraseña (y con Google cuando se configure), verificación de email, recuperación de contraseña, aviso de privacidad y la base de datos de la Fase 1.
- **11b:** navegación de la app (5 secciones, las de fases futuras explican qué harán), selector de hogar, bienvenida, perfil (datos, objetivos, tema, seguridad, eliminar cuenta) y hogares (crear, invitar por email, roles, salir, borrar).
- **11c:** panel de administración (`/admin`, solo administradores; para el resto la ruta no existe): inicio con colas y cifras, gestión de usuarios (buscar, filtrar, ficha con rol, suspender/reactivar con motivo, enviar recuperación, reenviar verificación, eliminar), contenido privado con registro obligatorio y auditoría paginada. Control de rendimiento con Lighthouse en el CI.

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
pnpm lhci            # Lighthouse (con la app arrancada en http://localhost:3000): rendimiento y accesibilidad
```

`pnpm lhci` crea una cuenta de prueba con rol de administrador en tu base de datos local (solo funciona contra `localhost`) para medir también las páginas con sesión. Los informes quedan en `.lighthouseci/`.

Lo mismo se ejecuta automáticamente en GitHub en cada push y pull request (`.github/workflows/ci.yml`).
