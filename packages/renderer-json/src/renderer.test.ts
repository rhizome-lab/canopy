import { describe, it, expect } from "bun:test";
import { renderJsonTree, jsonRenderer } from "./renderer.ts";

describe("renderJsonTree", () => {
  function render(value: unknown): string {
    const div = document.createElement("div");
    renderJsonTree(div, value);
    return div.innerHTML;
  }

  it("renders null", () => {
    expect(render(null)).toContain("json-null");
  });

  it("renders boolean", () => {
    expect(render(true)).toContain("json-bool");
    expect(render(true)).toContain("true");
  });

  it("renders number", () => {
    expect(render(42)).toContain("json-number");
    expect(render(42)).toContain("42");
  });

  it("renders string", () => {
    expect(render("hello")).toContain("json-string");
    expect(render("hello")).toContain('"hello"');
  });

  it("renders empty array", () => {
    expect(render([])).toContain("[]");
  });

  it("renders empty object", () => {
    expect(render({})).toContain("{}");
  });

  it("renders nested object", () => {
    const html = render({ a: 1, b: "two" });
    expect(html).toContain("json-object");
    expect(html).toContain("json-key");
  });

  it("renders nested array", () => {
    const html = render([1, 2, 3]);
    expect(html).toContain("json-array");
    expect(html).toContain("json-number");
  });
});

describe("jsonRenderer", () => {
  it("has correct id", () => {
    expect(jsonRenderer.id).toBe("@dusklight/renderer-json");
  });
});
