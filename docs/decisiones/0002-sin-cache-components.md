# 0002 · Cache Components de Next.js desactivado

**Fecha:** 30/10/2026 · **Estado:** aceptada (entrega 11a)

## Contexto
Next.js 16 crea los proyectos con `cacheComponents: true`. Con esa opción, cualquier lectura de la sesión obliga a envolver la página en `<Suspense>` y a decidir qué partes se precargan y cachean.

## Decisión
Desactivado. Todas las pantallas de RECETÍN están detrás de una sesión, se renderizan por petición y su HTML va con `Cache-Control: private, no-store` (ARCHITECTURE.md §10.11).

## Consecuencias
- Código más simple y sin riesgo de cachear contenido de un usuario para otro.
- Si en una fase futura hay páginas con partes compartidas y cacheables (por ejemplo el catálogo nutricional), se puede activar y aplicar por ruta. Se mide antes con Lighthouse CI.
