import { describe, it, expect, beforeEach } from "bun:test";
import { PluginRegistry } from "./registry.ts";
import type { Parser, Pattern, Renderer, PluginManifest } from "./types.ts";

function makeParser(id: string, contentTypes: string[]): Parser {
  return {
    id,
    contentTypes,
    async *parse() {},
  };
}

function makePattern(id: string, rendererId: string, score: number | null): Pattern {
  return {
    id,
    rendererId,
    match: () => score,
  };
}

function makeRenderer(id: string): Renderer<unknown, unknown> {
  return {
    id,
    mount: () => () => {},
  };
}

describe("PluginRegistry", () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  it("registers a plugin manifest", () => {
    const manifest: PluginManifest = { id: "test", version: "1.0.0" };
    registry.register(manifest);
    expect(registry.getManifest("test")).toBe(manifest);
  });

  it("throws on duplicate registration", () => {
    const manifest: PluginManifest = { id: "test", version: "1.0.0" };
    registry.register(manifest);
    expect(() => registry.register(manifest)).toThrow("already registered");
  });

  it("registers and retrieves parsers", () => {
    const parser = makeParser("json", ["application/json"]);
    registry.register({ id: "p", version: "1", parsers: [parser] });
    expect(registry.getParser("json")).toBe(parser);
    expect(registry.getParsersForContentType("application/json")).toContain(parser);
  });

  it("registers and retrieves renderers", () => {
    const renderer = makeRenderer("text");
    registry.register({ id: "p", version: "1", renderers: [renderer] });
    expect(registry.getRenderer("text")).toBe(renderer);
  });

  it("ranks pattern results by confidence", () => {
    const p1 = makePattern("p1", "r1", 0.9);
    const p2 = makePattern("p2", "r2", 0.5);
    const p3 = makePattern("p3", "r3", null);
    registry.register({ id: "plugin", version: "1", patterns: [p1, p2, p3] });
    const results = registry.matchPatterns({}, {});
    expect(results.length).toBe(2);
    expect(results[0]?.rendererId).toBe("r1");
    expect(results[0]?.confidence).toBe(0.9);
    expect(results[1]?.rendererId).toBe("r2");
  });

  it("deduplicates pattern results by rendererId keeping highest confidence", () => {
    const p1 = makePattern("p1", "same-renderer", 0.6);
    const p2 = makePattern("p2", "same-renderer", 0.9);
    registry.register({ id: "plugin", version: "1", patterns: [p1, p2] });
    const results = registry.matchPatterns({}, {});
    expect(results.length).toBe(1);
    expect(results[0]?.confidence).toBe(0.9);
  });

  it("unregisters a plugin and cleans up", () => {
    const parser = makeParser("json", ["application/json"]);
    const pattern = makePattern("pat", "r1", 0.8);
    const renderer = makeRenderer("r1");
    registry.register({
      id: "plugin",
      version: "1",
      parsers: [parser],
      patterns: [pattern],
      renderers: [renderer],
    });
    registry.unregister("plugin");
    expect(registry.getManifest("plugin")).toBeUndefined();
    expect(registry.getParser("json")).toBeUndefined();
    expect(registry.getRenderer("r1")).toBeUndefined();
    expect(registry.matchPatterns({}, {}).length).toBe(0);
  });

  it("lists all manifests", () => {
    registry.register({ id: "a", version: "1" });
    registry.register({ id: "b", version: "1" });
    expect(registry.listManifests().length).toBe(2);
  });
});
