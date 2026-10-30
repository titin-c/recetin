/** Reglas puras de hogares. */

export const HOUSEHOLD_NAME_MAX = 60;

/** Nombre del hogar que se crea solo al registrarse: «Casa de Marta». */
export function personalHouseholdName(userName: string): string {
  const first = userName.trim().split(/\s+/)[0] || "mí";
  return `Casa de ${first}`.slice(0, HOUSEHOLD_NAME_MAX);
}

/** El último propietario no puede salir sin pasar la propiedad o borrar el hogar (paso 2). */
export function canLeaveHousehold(role: "OWNER" | "MEMBER", ownerCount: number): boolean {
  return role === "MEMBER" || ownerCount > 1;
}
