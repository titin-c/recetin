# Casos de uso (contrato interno)

RECETÍN no expone una API pública: las pantallas llaman a Server Actions, y estas a los casos de uso de cada módulo. Cada caso de uso valida su entrada (Zod) y comprueba en el servidor quién lo pide (`getActor()`). Este documento crece con cada entrega.

## Acceso — `src/app/(acceso)/actions.ts` (Better Auth por debajo)
| Acción | Entrada | Resultado | Errores |
|---|---|---|---|
| `signInAction` | email, contraseña | sesión + ir a /biblioteca | credenciales incorrectas (mensaje único), cuenta suspendida, demasiados intentos (5/min) |
| `googleAction` | — | redirección a Google | Google no configurado |
| `signUpAction` | nombre, email, contraseña, aceptar privacidad | cuenta + hogar propio + email de verificación + ir a /mira-tu-correo | email ya registrado, contraseña común, demasiados intentos (5/hora) |
| `resendVerificationAction` | (sesión) | email reenviado | demasiados intentos (3 cada 15 min) |
| `requestResetAction` | email | mismo mensaje siempre (exista o no la cuenta) | demasiados intentos (3 cada 15 min) |
| `resetPasswordAction` | token, contraseña nueva | contraseña cambiada, sesiones cerradas, ir a /entrar | enlace caducado o usado, contraseña común |
| `signOutAction` | (sesión) | sesión cerrada | — |
| `acceptPrivacyAction` | (sesión) | consentimiento registrado | — |

## Módulos
- `identity/server`: `setupNewUser`, `recordPrivacyConsent`, `hasCurrentPrivacyConsent`.
- `households/server`: `createPersonalHousehold`.
- `access`: políticas puras (`canInviteToHousehold`, `canRemoveAdminRole`…).
- `audit/server`: `recordAudit` (siempre dentro de la transacción de la acción auditada).
