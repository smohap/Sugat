import { describe, expect, it } from "vitest";

import { safeNextPath } from "./next-path";

describe("safeNextPath", () => {
  it("keeps same-origin absolute paths", () => {
    expect(safeNextPath("/admin/members")).toBe("/admin/members");
    expect(safeNextPath("/join/abc?x=1")).toBe("/join/abc?x=1");
  });

  it("refuses anything that could leave the origin", () => {
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("https://evil.example")).toBe("/app");
    expect(safeNextPath("javascript:alert(1)")).toBe("/app");
  });

  it("falls back when the value is absent or not a string", () => {
    expect(safeNextPath(undefined)).toBe("/app");
    expect(safeNextPath(["/a", "/b"])).toBe("/app");
    expect(safeNextPath("", "/login")).toBe("/login");
  });
});
