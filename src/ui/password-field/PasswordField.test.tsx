import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PasswordField } from "./PasswordField";

describe("PasswordField", () => {
  it("alterna Mostrar/Ocultar y anuncia el estado", () => {
    render(<PasswordField />);
    const input = screen.getByLabelText("Contraseña");
    const toggle = screen.getByRole("button", { name: /mostrar la contraseña/i });
    expect(input).toHaveProperty("type", "password");
    fireEvent.click(toggle);
    expect(input).toHaveProperty("type", "text");
    // El nombre del botón cambia y anuncia el nuevo estado.
    expect(screen.getByRole("button", { name: /ocultar la contraseña/i })).toBe(toggle);
  });

  it("en contraseñas nuevas muestra los requisitos antes de escribir y los marca al cumplirse", () => {
    render(<PasswordField isNew />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("pendiente");
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "tomates en rama 2026" } });
    expect(screen.getAllByRole("listitem").every((li) => li.textContent?.includes("cumplido"))).toBe(true);
  });

  it("asocia el error al campo", () => {
    render(<PasswordField error="Escribe tu contraseña." />);
    const input = screen.getByLabelText("Contraseña");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const describedBy = input.getAttribute("aria-describedby")!;
    expect(document.getElementById(describedBy.split(" ")[0])?.textContent).toContain("Escribe tu contraseña.");
  });
});
