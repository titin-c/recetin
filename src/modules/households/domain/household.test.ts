import { describe, expect, it } from "vitest";
import { canLeaveHousehold, personalHouseholdName } from "./household";

describe("hogares", () => {
  it("nombra el hogar propio con el nombre de pila", () => {
    expect(personalHouseholdName("Javi Pérez")).toBe("Casa de Javi");
    expect(personalHouseholdName("   ")).toBe("Casa de mí");
  });
  it("el último propietario no puede salir sin pasar la propiedad", () => {
    expect(canLeaveHousehold("OWNER", 1)).toBe(false);
    expect(canLeaveHousehold("OWNER", 2)).toBe(true);
    expect(canLeaveHousehold("MEMBER", 1)).toBe(true);
  });
});
