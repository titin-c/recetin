// Contrato público del módulo identity.
//  - index.ts   → reglas puras, usables también en el cliente (sin dependencias pesadas)
//  - schemas.ts → validación de entradas (Zod), para Server Actions
//  - server.ts  → casos de uso que tocan la base de datos (solo servidor)
export { checkPassword, isPasswordAcceptable, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "./domain/password";
export type { PasswordCheck } from "./domain/password";
