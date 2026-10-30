import { describe, expect, it } from "vitest";
import { fieldErrors, signInSchema, signUpSchema } from "./schemas";

describe("validación de registro", () => {
  const valid = { name: " Lucía ", email: " LUCIA@Correo.es ", password: "pimientos del padron", privacy: "on" };

  it("normaliza nombre y email", () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.name).toBe("Lucía");
    expect(parsed.email).toBe("lucia@correo.es");
  });

  it("exige aceptar el aviso de privacidad", () => {
    const r = signUpSchema.safeParse({ ...valid, privacy: undefined });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).privacy).toMatch(/aviso de privacidad/);
  });

  it("da mensajes en castellano, uno por campo", () => {
    const r = signUpSchema.safeParse({ name: "", email: "no-es-email", password: "123", privacy: "on" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.name).toBe("Escribe tu nombre.");
      expect(e.email).toMatch(/email válido/);
      expect(e.password).toMatch(/al menos 10/);
    }
  });

  it("para entrar no aplica reglas de contraseña nueva (solo que no esté vacía)", () => {
    expect(signInSchema.safeParse({ email: "a@b.es", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.es", password: "" }).success).toBe(false);
  });
});
