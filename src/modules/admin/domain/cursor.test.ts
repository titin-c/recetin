import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "./cursor";

describe("cursor de la auditoría", () => {
  it("ida y vuelta", () => {
    const d = new Date("2026-10-30T13:02:00.000Z");
    const id = "0199f0b2-1111-7aaa-8bbb-123456789abc";
    expect(decodeCursor(encodeCursor(d, id))).toEqual({ createdAt: d, id });
  });
  it.each(["", "basura", "2026-10-30|no-uuid", "no-fecha|0199f0b2-1111-7aaa-8bbb-123456789abc"])("rechaza %s", (c) =>
    expect(decodeCursor(c)).toBeNull(),
  );
});
