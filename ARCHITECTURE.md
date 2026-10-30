# RECETÍN — Arquitectura

> Documento vivo. Si alguien necesita crear una carpeta o un archivo que no encaja aquí, se actualiza este documento **antes** de crearlo.
> Aprobado en el paso 9 del pipeline (30/10/2026): Better Auth, módulos por dominio, rutas en español. Fase actual: **Fase 1**.

## 1. Qué es RECETÍN y cómo se clasifica

- **Tipo:** aplicación web full-stack (Next.js, App Router) **monolítica y modular**: una sola app desplegable, con el código organizado por **dominios** con contratos explícitos.
- **Por qué no microservicios ni monorepo:** un solo equipo, decenas de usuarios, sin necesidad medible de escalar piezas por separado (brief, sección 13). Los módulos de dominio permiten extraer uno más adelante si hiciera falta, sin reescribir el núcleo.
- **Proyecto nuevo:** el repositorio `titin-c/recetin` estaba vacío.

## 2. Stack

| Pieza | Elección | Motivo |
|---|---|---|
| Lenguaje | TypeScript estricto | Brief |
| Framework | Next.js 16, App Router, Server Components + Server Actions; Cache Components desactivado (ADR 0002) | Brief; lógica en servidor por defecto |
| Base de datos | PostgreSQL (Neon, región UE) | Brief; plan gratuito para empezar |
| ORM / migraciones | Prisma 7 (adaptadores pg / Neon), migraciones versionadas en `prisma/migrations` | Brief; migraciones reproducibles |
| Autenticación | Better Auth (Google + email/contraseña, sesiones en BD, verificación de email, recuperación, límite de intentos) | Mantenedores de Auth.js lo recomiendan para proyectos nuevos; sesiones revocables |
| Validación | Zod, un esquema por entrada, compartido cliente/servidor | Brief: esquemas tipados |
| Estilos | Tailwind CSS leyendo las variables CSS del design system (`src/ui/tokens.css`) | Paso 6 |
| Iconos | lucide-react con `strokeWidth={1}` y `absoluteStrokeWidth` | Paso 7 |
| Email | Resend (región UE si la cuenta lo permite) detrás de la interfaz `EmailSender`; en local, Mailpit | Paso 5 |
| Imágenes (Fase 2) | Cloudflare R2 (S3 compatible, jurisdicción UE) detrás de `ObjectStorage` | Brief: almacenamiento de objetos |
| Hosting | Vercel (región de funciones Fráncfort) | Paso 9 |
| Tests | Vitest (unitarios e integración), Testing Library, Playwright (extremo a extremo) | Brief: tres niveles de pruebas |
| Calidad | ESLint, Prettier, `tsc --noEmit` en CI | — |
| Gestor de paquetes | pnpm | Rápido y con lockfile estricto |
| Local | Docker Compose: PostgreSQL + Mailpit (o Postgres.app sin Docker) | Mismo motor que producción |

Ningún proveedor entra en el dominio: todos se usan a través de un **adaptador** en `src/server/` o en el `infrastructure/` del módulo. Cambiar Vercel por un VPS, Resend por otro SMTP o R2 por S3 no toca la lógica de negocio.

## 3. Árbol de carpetas

```
recetin/
├─ ARCHITECTURE.md            # este documento
├─ README.md                  # instalación y arranque en 5 minutos
├─ docs/
│  ├─ decisiones/             # ADR: una decisión importante por archivo (NNNN-titulo.md)
│  ├─ base-de-datos.md        # modelo, políticas de borrado, cómo crear una migración
│  ├─ despliegue.md           # Vercel + Neon + Resend + R2, variables de entorno
│  ├─ recuperacion.md         # copias de seguridad, restaurar, rotar secretos
│  └─ casos-de-uso.md         # contrato de cada caso de uso (equivale a la «API»)
├─ prisma/
│  ├─ schema.prisma           # modelo de datos (solo tablas de la fase actual)
│  ├─ migrations/             # migraciones generadas; nunca se editan a mano tras aplicarse
│  └─ seed.ts                 # roles, permisos, nutrientes base y un admin inicial
├─ public/                    # robots.txt (Disallow: /), favicons
├─ docker-compose.yml         # postgres + mailpit para desarrollo y tests
├─ scripts/                   # utilidades (preparar la BD de tests…)
├─ src/
│  ├─ app/                    # SOLO rutas y composición de pantallas; sin reglas de negocio
│  │  ├─ (acceso)/            # entrar, registro, mira-tu-correo, verificado, recuperar, nueva-contrasena, privacidad, invitacion/[token]
│  │  ├─ (app)/               # zona con sesión: recetas, biblioteca, planificador, lista, perfil, bienvenida
│  │  ├─ admin/               # panel admin: inicio, usuarios, auditoria (layout propio con barra lateral)
│  │  ├─ api/auth/[...all]/   # handler de Better Auth (única ruta API en Fase 1)
│  │  ├─ layout.tsx           # <html lang="es">, fuentes, meta robots noindex
│  │  └─ not-found.tsx, error.tsx
│  ├─ modules/                # DOMINIOS (uno por carpeta; ver §4)
│  │  ├─ identity/            # usuarios, perfil, preferencias, objetivos, consentimiento (F1)
│  │  ├─ access/              # roles, permisos y políticas de autorización (F1)
│  │  ├─ households/          # hogares, miembros, invitaciones (F1)
│  │  ├─ audit/               # registro de auditoría (F1)
│  │  ├─ admin/               # casos de uso del panel: colas, estadísticas, gestión de usuarios (F1)
│  │  ├─ recipes/             # recetas, versiones, biblioteca, personalizaciones (F2)
│  │  ├─ scaling/             # motor de escalado culinario, puro y sin BD (F2)
│  │  ├─ imports/             # URL, schema.org, plantillas, XML/XSD (F2)
│  │  ├─ catalog/             # ingredientes, alias, unidades, conversiones, alérgenos (F2–F3)
│  │  ├─ nutrition/           # fuentes, perfiles, cálculo nutricional (F3)
│  │  ├─ planner/             # comidas planificadas, quién come, resúmenes (F4)
│  │  ├─ shopping/            # listas de la compra (F5)
│  │  └─ community/           # publicación, búsqueda, denuncias, moderación (F6)
│  ├─ ui/                     # DESIGN SYSTEM: componentes genéricos sin lógica de dominio
│  │  ├─ tokens.css           # variables CSS (claro/oscuro) = tokens del design system
│  │  ├─ button/  text-field/  password-field/  checkbox/  alert/  toast/  badge/  modal/  drawer/
│  │  ├─ data-table/  pagination/  tabs/  stepper/  skeleton/  empty-state/  progress-steps/  queue/
│  │  ├─ fonts/               # Inter y Fraunces autoalojadas (OFL)
│  │  └─ icons.tsx            # iconos de Lucide con grosor 1 px
│  ├─ server/                 # infraestructura transversal (solo se importa desde servidor)
│  │  ├─ db.ts                # cliente Prisma único
│  │  ├─ auth.ts              # configuración de Better Auth
│  │  ├─ session.ts           # getActor(): sesión → Actor {userId, roles, permisos}
│  │  ├─ env.ts               # variables de entorno validadas con Zod al arrancar
│  │  ├─ email/               # EmailSender + adaptadores resend/mailpit + plantillas
│  │  ├─ storage/             # ObjectStorage + adaptador R2 (F2)
│  │  ├─ rate-limit.ts        # límite de peticiones respaldado en BD
│  │  └─ logger.ts            # logs estructurados sin datos sensibles
│  └─ lib/                    # utilidades puras y genéricas (fechas, formato de números, Result)
└─ tests/
   ├─ e2e/                    # Playwright: flujos completos por pantalla
   └─ helpers/                # preparación de tests unitarios y de integración
```

## 4. Dentro de cada módulo de dominio

```
src/modules/households/
├─ index.ts                   # CONTRATO PÚBLICO compartido: reglas puras, usable también en el cliente
├─ schemas.ts                 # CONTRATO PÚBLICO de validación: Zod, para Server Actions
├─ server.ts                  # CONTRATO PÚBLICO de servidor: casos de uso con BD (import "server-only")
├─ ui.ts                      # CONTRATO PÚBLICO de interfaz: componentes del dominio (cliente)
├─ domain/                    # reglas puras (sin Prisma, sin Next): p. ej. «el último propietario no puede salir»
├─ application/               # casos de uso: comprueban permisos, orquestan, escriben auditoría
│  └─ invite-member.ts
├─ infrastructure/            # repositorios Prisma y adaptadores externos del módulo
└─ ui/                        # componentes específicos del dominio (HouseholdSwitcher, MemberList)
```

Reglas:
1. `app/` solo llama a casos de uso de los contratos del módulo. Nunca a Prisma directamente.
2. Un módulo solo importa de otro a través de su contrato (`index.ts`, `schemas.ts`, `server.ts` o `ui.ts`). Prohibido importar carpetas internas ajenas (regla de ESLint `no-restricted-imports`). Se separa en tres archivos para que el código de cliente no arrastre Zod ni código de servidor (ADR 0003).
3. `domain/` no importa nada de `infrastructure/`, de Next ni de Prisma: así se prueba con tests unitarios puros.
4. **Todo caso de uso recibe un `Actor`** obtenido de la sesión en el servidor y comprueba la autorización él mismo. Los identificadores que llegan del cliente nunca se dan por buenos.
5. Las mutaciones sensibles (cambiar rol, suspender, eliminar, leer contenido privado como admin) escriben su entrada de auditoría **en la misma transacción**.

## 5. Autorización

- **Roles globales:** `USER`, `ADMIN`. Los permisos (`users.manage`, `audit.read`, `private_content.read`…) viven en tablas y se cargan en el `Actor`.
- **Roles por hogar:** `OWNER`, `MEMBER` en `HouseholdMember`.
- **Políticas** en `modules/access/domain/policies.ts`: funciones puras `can(actor, accion, recurso)`, cubiertas por tests.
- **Excepción del admin** (paso 2): puede leer contenido privado mediante el permiso `private_content.read`; cada lectura deja una entrada `PRIVATE_CONTENT_VIEWED` en la auditoría.
- Siempre debe quedar al menos un administrador (regla de dominio con test).

## 6. Modelo de datos

**Convenciones:** ids UUID v7; fechas `timestamptz` en UTC; tablas en `snake_case` (`@@map`) y modelos en `PascalCase`; emails normalizados en minúsculas con índice único; `createdAt` y `updatedAt` en todas las tablas mutables.

### 6.1 Tablas de la Fase 1 (se crean ahora)

| Modelo | Campos clave | Relaciones y borrado |
|---|---|---|
| User | email (único), emailVerified, name, status (ACTIVE/SUSPENDED), suspendedReason, lastSeenAt, deletedAt | — |
| Account | providerId (google/credential), accountId, passwordHash (argon2/scrypt) | User 1–N, Cascade |
| Session | token (único), expiresAt, ipHash, userAgent | User 1–N, Cascade |
| Verification | identifier, valueHash, expiresAt (verificar email, recuperar contraseña) | — |
| Role / Permission / RolePermission / UserRole | code (único) | UserRole Cascade con User |
| UserPreferences | units (METRIC/HOUSEHOLD), defaultServings (nullable), theme, publicProfile, onboardingDone, cookingHintSeen (0–3) | User 1–1, Cascade |
| Nutrient | code (ENERGY_KCAL, PROTEIN…), unit, label | Semilla; se reutiliza en F3 |
| NutritionGoal | target (decimal) | User + Nutrient, único por par; Cascade con User |
| Household | name, createdById | — |
| HouseholdMember | role (OWNER/MEMBER), joinedAt | Household + User, único por par; Cascade con ambos |
| HouseholdInvitation | email, tokenHash (único), status, expiresAt, invitedById | Household Cascade |
| ActiveHousehold | userId (PK), householdId | Cascade; si se borra el hogar, pasa al siguiente |
| PrivacyConsent | version, acceptedAt | User Cascade |
| AuditLog | actorId, action, targetType, targetId, before (JSON), after (JSON), reason, createdAt | actorId SetNull (el registro se conserva aunque se borre quien actuó) |
| RateLimit | key, count, windowStart | Lo usa Better Auth |

Índices extra: `audit_log(created_at)`, `audit_log(target_type, target_id)`, `audit_log(actor_id)`, `household_member(user_id)`, `user(status, last_seen_at)` para las colas y estadísticas del admin.

**Eliminar una cuenta** (paso 2): se borran sus datos personales, sesiones, cuentas de acceso, preferencias, objetivos y pertenencias. Desde la Fase 2, sus recetas públicas guardadas por otros pasan a «Usuario eliminado» (`ownerId = null` + `authorDisplayName`). La auditoría se conserva con `actorId` a null.

### 6.2 Fases siguientes (solo diseñadas; sus tablas llegan con su fase)

| Fase | Modelos |
|---|---|
| F2 Recetas e importación | Recipe (ownerId, visibility PRIVATE/PUBLIC/ARCHIVED, originRecipeId para personalizaciones, currentVersionId) · **RecipeVersion** (inmutable: número, raciones, tiempos, notas) · RecipeIngredientLine (versionId, ingredientId nullable, rawText, cantidad, unitId, estado SECO/CRUDO/COCIDO/ESCURRIDO…, preparación, scalingRuleId, matchConfidence) · RecipeStep (orden, texto, duración, timeKind FIXED/MANUAL_PREP/VOLUME_COOK, temperatura) · ScalingRule (estrategia, parámetros JSON, versión) · Ingredient · IngredientAlias · Unit · UnitConversion · Category · Tag · Allergen · RecipeSource (url, autor, atribución) · SavedRecipe (userId, recipeId, savedVersionId) · Favorite · ImportTemplate + ImportTemplateVersion · XmlSchemaVersion · ImportJob (estado, errores, borrador) · MediaAsset · CookingProgress |
| F3 Nutrición | Product (marca, código de barras) · NutritionSource (BEDCA, USDA, OFF, MANUAL; licencia, atribución) · NutritionProfile (ingredientId o productId, estado, base 100 g/100 ml, externalId, fecha, método, confianza, limitaciones) · NutrientValue · Density · EdiblePortion · NutritionCorrection (manual, auditada) |
| F4 Planificador | MealSlot (configurable por hogar) · PlannedMeal (householdId, fecha, slot, **recipeVersionId**, invitados) · PlannedMealEater (userId) |
| F5 Compra | ShoppingList (householdId, desde, hasta) · ShoppingListItem (cantidad, unidad, origin AUTO/MANUAL, manualOverride, checked, atHome, categoría) · ShoppingItemSource (item ↔ PlannedMeal) · ShoppingCategory |
| F6 Comunidad | Report (objetivo, motivo, estado) · ModerationAction |

La versión de receta es **inmutable**: el plan, las bibliotecas y las personalizaciones apuntan a una versión concreta. Una edición crea una versión nueva; nunca se reescribe una anterior.

## 7. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Carpetas | kebab-case | `password-field/`, `invite-member.ts` |
| Componentes React | PascalCase.tsx, mismo nombre que el export | `PasswordField.tsx` |
| Casos de uso | verbo-objeto en kebab-case, una función exportada | `suspend-user.ts` → `suspendUser()` |
| Esquemas Zod | `<caso>Schema` en `schemas.ts` del módulo | `inviteMemberSchema` |
| Tests unitarios | junto al archivo, `.test.ts(x)` | `policies.test.ts` |
| Tests de integración (con BD real de pruebas) | junto al archivo, `.int.test.ts` | `setup.int.test.ts` |
| Tests e2e | `tests/e2e/<flujo>.spec.ts` | `registro.spec.ts` |
| Rutas | en español, kebab-case | `/perfil/hogares`, `/admin/usuarios` |
| Variables CSS | igual que los tokens | `--color-accent` |
| Barrel files | SOLO los contratos de cada módulo (`index.ts`, `schemas.ts`, `server.ts`, `ui.ts`); en ningún otro sitio | — |
| Tipos | locales en su archivo; los del contrato, exportados desde `index.ts` | — |

## 8. Seguridad de base (detalle en el paso 13)

- Sesiones en BD, cookie `httpOnly`, `secure`, `SameSite=Lax`; revocables («cerrar sesión en los demás», suspensión inmediata).
- Contraseñas con hash lento (el de Better Auth); nunca en logs ni en la auditoría.
- CSRF: comprobación de origen en Server Actions y en el handler de auth.
- Límite de intentos en acceso, registro, recuperación e invitación.
- Tokens de email guardados solo como hash, de un solo uso y con caducidad.
- Consultas solo a través de Prisma (parametrizadas).
- Cabeceras: CSP estricta, `X-Robots-Tag: noindex`, HSTS.
- Secretos solo en variables de entorno, validadas al arrancar; `.env.example` sin valores reales.

## 9. Plan de implementación de la Fase 1

1. Base: Next.js + TypeScript + Tailwind + tokens + fuentes; Docker Compose; ESLint, Prettier, Vitest y Playwright; CI.
2. Prisma: esquema de la Fase 1, primera migración, semilla (roles, permisos, nutrientes, admin inicial).
3. Better Auth: Google + email/contraseña, verificación, recuperación, límites; emails con Mailpit en local.
4. Componentes del design system usados en la Fase 1.
5. Pantallas de acceso, registro, recuperación y verificación.
6. Bienvenida y Perfil (Datos, Seguridad).
7. Hogares: crear, invitar, aceptar, roles, cambiar de hogar activo, salir, transferir y borrar.
8. Estructura de la app + páginas «Próximamente».
9. Admin: inicio (colas y cifras), usuarios (ficha, rol, suspender, reactivar, enviar recuperación, reenviar verificación, eliminar, ver contenido privado) y auditoría.
10. Tests unitarios, de integración y e2e de todo lo anterior; documentación en `docs/`.

## 10. Rendimiento (paso 10, wpo-agent [architecture], aprobado 30/10/2026)

Referencia: móvil gama media, Lighthouse «4G lenta». Objetivos LCP < 2,5 s · INP < 200 ms · CLS < 0,1 · TTFB < 0,8 s, en app y admin.

1. `getActor()`: una sola consulta (sesión + roles + permisos + hogar activo) memorizada por petición con `cache()` de React.
2. Neon con pooler para la app, conexión directa solo para migraciones, adaptador serverless de Neon para Prisma; Vercel y Neon en Fráncfort. Arranque en frío del plan gratuito aceptado y documentado en Fase 1.
3. Auditoría: paginación por cursor (fecha) con «Anteriores / Siguientes», sin total exacto. Usuarios: total exacto.
4. Cifras del admin: consultas en paralelo + caché de 60 s.
5. Emails tras la respuesta con `after()`; fallos al log; «Reenviar» siempre disponible.
6. Listados con `select` de columnas necesarias; consultas independientes en paralelo.
7. Índice (email_verified, created_at) para la cola «sin verificar > 7 días».
8. Sin caché de sesión en cookie en Fase 1 (la suspensión debe expulsar al momento).
9. `next/font` autoalojado: Fraunces solo 600 (sin eje variable completo), Inter 400/500/700, subconjunto latino, `display: swap` con fallback ajustado.
10. Server Components por defecto; JS de cliente solo en componentes interactivos; presupuesto ≤ 150 KB gz por ruta; sin librerías pesadas de UI/fechas.
11. HTML con sesión: `Cache-Control: private, no-store`; estáticos con hash e `immutable`.
12. Lucide import por icono; logo Google SVG en línea; esqueletos del tamaño final; toasts y avisos sin desplazar contenido.
13. Fase 2: imágenes con variantes AVIF/WebP al subir, nunca el original; `next/image` con `sizes`, lazy y proporción reservada.
14. Lighthouse CI en cada preview de Vercel (Acceso, Perfil › Hogares, Admin › Usuarios, Admin › Auditoría), **bloquea** si no se cumplen los objetivos; analizador de bundle con el presupuesto; log de consultas Prisma en desarrollo y `EXPLAIN` en listados.

## 11. Alternativas descartadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Monolito modular | Microservicios / monorepo | Sin necesidad medible (brief §13) |
| Módulos por dominio (`src/modules`) | Carpetas por tipo (`components/`, `services/` globales) | Con 9 dominios, por tipo mezcla reglas de todos y duplica lógica |
| Better Auth | Auth.js | Mantenido ahora por el equipo de Better Auth, que recomienda Better Auth para proyectos nuevos; además Auth.js no ofrece sesiones en BD con email/contraseña de serie |
| Server Actions + casos de uso | API REST completa desde el principio | No hay clientes externos; la lógica queda en casos de uso reutilizables si algún día se publica una API |
| Límite de peticiones en PostgreSQL | Redis | Una pieza de infraestructura menos; se cambia si se mide la necesidad |
| Tablas de roles y permisos | Enum de rol en `User` | El brief pide roles y permisos como entidades; permite añadir permisos sin migrar código |
