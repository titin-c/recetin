import { describe, expect, it } from "vitest";
import { resetPasswordMessage, verifyEmailMessage } from "./templates";

describe("plantillas de email", () => {
  it("escapan el nombre del usuario (sin HTML inyectado)", () => {
    const m = verifyEmailMessage('<img src=x onerror="alert(1)">', "https://app/verificar?t=1");
    expect(m.html).not.toContain("<img src=x");
    expect(m.html).toContain("&lt;img");
  });
  it("incluyen el enlace en el texto plano y la caducidad", () => {
    const m = resetPasswordMessage("Marta", "https://app/reset/abc");
    expect(m.text).toContain("https://app/reset/abc");
    expect(m.text).toMatch(/caduca en 1 hora/);
  });
});
