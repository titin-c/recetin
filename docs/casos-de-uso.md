# Casos de uso (contrato interno)

RECETÍN no expone una API pública: las pantallas llaman a Server Actions, y estas a los casos de uso de cada módulo. Cada caso de uso valida su entrada (Zod) y comprueba en el servidor quién lo pide (`getActor()`). Este documento crece con cada entrega.

## Acceso — `src/app/(acceso)/actions.ts` (Better Auth por debajo)

| Acción                     | Entrada                                       | Resultado                                                            | Errores                                                                                  |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `signInAction`             | email, contraseña                             | sesión + ir a /biblioteca                                            | credenciales incorrectas (mensaje único), cuenta suspendida, demasiados intentos (5/min) |
| `googleAction`             | —                                             | redirección a Google                                                 | Google no configurado                                                                    |
| `signUpAction`             | nombre, email, contraseña, aceptar privacidad | cuenta + hogar propio + email de verificación + ir a /mira-tu-correo | email ya registrado, contraseña común, demasiados intentos (5/hora)                      |
| `resendVerificationAction` | (sesión)                                      | email reenviado                                                      | demasiados intentos (3 cada 15 min)                                                      |
| `requestResetAction`       | email                                         | mismo mensaje siempre (exista o no la cuenta)                        | demasiados intentos (3 cada 15 min)                                                      |
| `resetPasswordAction`      | token, contraseña nueva                       | contraseña cambiada, sesiones cerradas, ir a /entrar                 | enlace caducado o usado, contraseña común                                                |
| `signOutAction`            | (sesión)                                      | sesión cerrada                                                       | —                                                                                        |
| `acceptPrivacyAction`      | (sesión)                                      | consentimiento registrado                                            | —                                                                                        |

## Zona con sesión — `src/app/(app)/actions.ts`

Todas comprueban la sesión en el servidor (`requireActor`) y los permisos dentro del caso de uso. Muestran un aviso breve (toast) al terminar.

| Acción                                                            | Quién puede                        | Notas                                                                             |
| ----------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------- |
| `switchHouseholdAction`                                           | miembro del hogar                  | cambia el hogar activo                                                            |
| `updateProfileAction`                                             | la propia persona                  | nombre, unidades, comensales habituales, tema, perfil público, objetivos          |
| `linkGoogleAction` / `setPasswordAction` / `changePasswordAction` | la propia persona                  | cambiar contraseña cierra las demás sesiones                                      |
| `signOutOthersAction`                                             | la propia persona                  | cierra las demás sesiones                                                         |
| `deleteAccountAction`                                             | la propia persona                  | escribir el email; bloqueado si es la única propietaria de un hogar compartido    |
| `createHouseholdAction`                                           | cualquiera                         | pasa a ser su hogar activo                                                        |
| `renameHouseholdAction`                                           | propietario/a                      | —                                                                                 |
| `inviteAction`                                                    | propietario/a con email verificado | enlace válido 7 días, token guardado como hash, una invitación viva por email     |
| `revokeInvitationAction`                                          | propietario/a                      | —                                                                                 |
| `changeMemberRoleAction`                                          | propietario/a                      | siempre queda al menos una persona propietaria                                    |
| `removeMemberAction`                                              | propietario/a                      | si se queda sin hogares, se le crea uno propio                                    |
| `leaveHouseholdAction`                                            | miembro                            | la última persona propietaria debe pasar la propiedad; no se sale del único hogar |
| `deleteHouseholdAction`                                           | propietario/a                      | escribir el nombre; no se borra el único hogar                                    |
| `acceptInvitationAction`                                          | la persona invitada (mismo email)  | el enlace reenviado a otra cuenta no sirve                                        |

## Bienvenida — `src/app/(asistente)/actions.ts`

`saveUnitsAction` · `finishOnboardingAction` (objetivos opcionales) · `skipOnboardingAction`.

## Administración — `src/app/admin/actions.ts`

Todas exigen el rol de administrador (cada caso de uso comprueba su permiso concreto) y dejan entrada en la auditoría, dentro de la misma transacción.

| Acción                                         | Permiso                | Reglas                                                                                                 |
| ---------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `changeRoleAction`                             | `ROLES_MANAGE`         | siempre queda al menos un administrador activo                                                         |
| `suspendAction` / `reactivateAction`           | `USERS_MANAGE`         | motivo obligatorio; no a uno mismo; suspender cierra todas sus sesiones                                |
| `sendResetAction` / `resendVerificationAction` | `USERS_MANAGE`         | nunca se ve ni se cambia la contraseña: se envía el email                                              |
| `deleteUserAction`                             | `USERS_MANAGE`         | motivo + escribir su email; hogares compartidos pasan al miembro más antiguo; la auditoría se conserva |
| `openPrivateContentAction`                     | `PRIVATE_CONTENT_READ` | solo con confirmación explícita; la página registra cada carga                                         |

## Módulos

- `identity/server`: `setupNewUser`, `recordPrivacyConsent`, `hasCurrentPrivacyConsent`.
- `households/server`: `createPersonalHousehold`, `listMyHouseholds`, `householdNames`, `createHousehold`, `renameHousehold`, `setActiveHousehold`, `inviteMember`, `getInvitation`, `acceptInvitation`, `revokeInvitation`, `changeMemberRole`, `removeMember`, `leaveHousehold`, `deleteHousehold`.
- `identity/server`: además, `getProfile`, `updateProfile`, `completeOnboarding`, `deleteOwnAccount`.
- `access`: políticas puras (`canInviteToHousehold`, `canRemoveAdminRole`…).
- `admin/server`: `getDashboard` (cifras en caché 60 s), `listUsers`, `getUserDetail`, `changeUserRole`, `suspendUser`, `reactivateUser`, `deleteUserAsAdmin`, `viewPrivateContent`, `listAudit` (paginación por cursor), `auditEmailSent`, `getUserEmail`.
- `audit/server`: `recordAudit` (siempre dentro de la transacción de la acción auditada).
