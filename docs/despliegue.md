# Despliegue

Producción: **Vercel** (app, región Fráncfort `fra1`) + **Neon** (PostgreSQL, región `aws-eu-central-1`) + **Resend** (emails). Imágenes en Cloudflare R2 a partir de la Fase 2.

## 1. Base de datos (Neon)

1. Crea un proyecto en Neon, región Europa (Fráncfort).
2. Copia dos cadenas de conexión:
   - **con pooler** (el host lleva `-pooler`) → `DATABASE_URL`;
   - **directa** → `DIRECT_URL` (solo para migraciones).
3. Plan gratuito: la base de datos se suspende tras unos minutos sin uso y la primera visita después tarda algo más (aceptado en el paso 10).

## 2. Emails (Resend)

1. Crea una cuenta y verifica tu dominio (registros DNS que te indica Resend). Si puedes elegir región, la de la UE.
2. Crea una API key → `RESEND_API_KEY`. Pon `EMAIL_FROM="RECETÍN <no-responder@tu-dominio>"` con ese dominio.

## 3. Acceso con Google (opcional, se puede añadir después)

1. Entra en https://console.cloud.google.com con tu cuenta y crea un proyecto «RECETÍN».
2. **APIs y servicios › Pantalla de consentimiento de OAuth:** tipo «Externo»; nombre RECETÍN, tu email de soporte y el dominio de la app. Permisos: solo `email`, `profile` y `openid`.
3. **APIs y servicios › Credenciales › Crear credenciales › ID de cliente de OAuth** → tipo «Aplicación web».
   - Orígenes autorizados: `http://localhost:3000` y tu dominio de producción.
   - URI de redirección autorizados: `http://localhost:3000/api/auth/callback/google` y `https://TU-DOMINIO/api/auth/callback/google`.
4. Copia el ID y el secreto en `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` (en `.env` en local; en Vercel, en las variables del proyecto). **Nunca los pegues en un chat ni los subas al repositorio.**
5. Mientras la pantalla de consentimiento esté «En pruebas», solo pueden entrar los emails que añadas como usuarios de prueba.

## 4. Vercel

1. Importa el repositorio `titin-c/recetin`. Framework: Next.js. Región de funciones: `fra1`.
2. Variables de entorno (Production y Preview): `APP_URL`, `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET` (genera uno nuevo con `openssl rand -base64 32`, distinto del local), `RESEND_API_KEY`, `EMAIL_FROM` y, si aplica, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
3. **Comando de build:** `pnpm db:deploy && pnpm build`. Aplica las migraciones pendientes antes de publicar; nunca borra datos.
4. Tras el primer despliegue: regístrate en la app y, desde tu ordenador con `DIRECT_URL` de producción en el entorno, ejecuta `ADMIN_EMAIL=tu@email.es pnpm db:seed`.

## Variables de entorno

Todas están descritas en `.env.example`. Si falta una obligatoria, la app no arranca y dice cuál (`src/server/env.ts`).
