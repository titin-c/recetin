import { describe, expect, it } from "vitest";
import { checkPassword, isPasswordAcceptable } from "./password";

describe("reglas de contraseña", () => {
  it("exige al menos 10 caracteres", () => {
    expect(checkPassword("corta").find((c) => c.id === "length")?.ok).toBe(false);
    expect(checkPassword("pimientos del padron").find((c) => c.id === "length")?.ok).toBe(true);
  });

  it("rechaza contraseñas muy comunes, sin importar mayúsculas ni espacios alrededor", () => {
    expect(isPasswordAcceptable("1234567890")).toBe(false);
    expect(isPasswordAcceptable("  Contraseña123 ")).toBe(false);
    expect(isPasswordAcceptable("RealMadrid")).toBe(false);
  });

  it("acepta frases largas sin reglas de composición", () => {
    expect(isPasswordAcceptable("tomates en rama 2026")).toBe(true);
  });

  it("marca pendiente el requisito de «no común» si aún no se ha escrito nada", () => {
    expect(checkPassword("").every((c) => !c.ok)).toBe(true);
  });

  it("rechaza contraseñas de más de 128 caracteres", () => {
    expect(isPasswordAcceptable("a".repeat(129))).toBe(false);
  });
});
