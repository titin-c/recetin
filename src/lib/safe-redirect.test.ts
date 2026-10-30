import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./safe-redirect";

describe("safeInternalPath", () => {
  it("acepta rutas internas", () => expect(safeInternalPath("/invitacion/abc", "/x")).toBe("/invitacion/abc"));
  it.each(["https://malo.es", "//malo.es", "/\\malo.es", "javascript:alert(1)", undefined, 42])("rechaza %s", (v) =>
    expect(safeInternalPath(v, "/x")).toBe("/x"),
  );
});
