# 0003 · Contrato de módulo en tres archivos

**Fecha:** 30/10/2026 · **Estado:** aceptada (entrega 11a; ajusta ARCHITECTURE.md §4)

## Contexto
ARCHITECTURE.md preveía un único `index.ts` por módulo. Pero un componente de cliente (por ejemplo, los requisitos de contraseña en directo) necesita reglas puras del módulo, y si `index.ts` también exporta código de servidor o esquemas Zod, el navegador acabaría descargando código que no necesita o fallaría el build.

## Decisión
Cada módulo expone hasta tres contratos:
- `index.ts`: reglas puras y tipos. Se puede usar en el cliente.
- `schemas.ts`: validación de entradas (Zod), para Server Actions.
- `server.ts`: casos de uso con base de datos (`import "server-only"`).

ESLint prohíbe importar cualquier otra carpeta interna de un módulo desde fuera.
