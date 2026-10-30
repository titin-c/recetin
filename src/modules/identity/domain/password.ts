/**
 * Reglas de contraseña (paso 7: visibles antes de escribir, comprobadas también en el servidor).
 * Sin reglas de composición (mayúsculas, símbolos…): longitud + no estar entre las más comunes,
 * como recomiendan las guías actuales de autenticación.
 */
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

// Contraseñas muy comunes (y sus variantes en castellano) de 10 o más caracteres.
const COMMON = new Set([
  "1234567890",
  "12345678910",
  "0123456789",
  "1111111111",
  "0000000000",
  "1234512345",
  "9876543210",
  "qwertyuiop",
  "asdfghjkl1",
  "qwerty1234",
  "1q2w3e4r5t",
  "1qaz2wsx3edc",
  "zaq12wsx34",
  "password12",
  "password123",
  "password1234",
  "passw0rd123",
  "contraseña",
  "contraseña1",
  "contrasena1",
  "contraseña123",
  "contrasena123",
  "iloveyou12",
  "teamo12345",
  "abcdefghij",
  "abc1234567",
  "abcd123456",
  "aaaaaaaaaa",
  "123456789a",
  "a123456789",
  "1234567890a",
  "qwerty12345",
  "superman12",
  "princesa12",
  "barcelona1",
  "realmadrid",
  "realmadrid1",
  "barcelona10",
  "football12",
  "dragonball",
  "estrella12",
  "mariposa12",
  "recetin123",
  "recetas123",
  "cocina1234",
  "bienvenido",
  "bienvenido1",
  "holahola12",
  "hola123456",
  "welcome123",
  "changeme123",
  "letmein123",
  "administrator",
  "admin12345",
  "admin123456",
]);

export type PasswordCheck = { id: "length" | "common"; label: string; ok: boolean };

export function checkPassword(password: string): PasswordCheck[] {
  const normalized = password.trim().toLowerCase();
  return [
    { id: "length", label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`, ok: password.length >= PASSWORD_MIN_LENGTH },
    { id: "common", label: "No es una contraseña muy común", ok: normalized.length > 0 && !COMMON.has(normalized) },
  ];
}

export function isPasswordAcceptable(password: string): boolean {
  return password.length <= PASSWORD_MAX_LENGTH && checkPassword(password).every((c) => c.ok);
}
