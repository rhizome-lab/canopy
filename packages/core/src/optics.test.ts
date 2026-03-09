import { describe, it, expect } from "bun:test";
import { field, index, each, composeLenses, composeLensTraversal } from "./optics.ts";

describe("field lens", () => {
  it("gets a field", () => {
    const l = field<{ x: number; y: number }, "x">("x");
    expect(l.get({ x: 1, y: 2 })).toBe(1);
  });

  it("sets a field without mutating", () => {
    const l = field<{ x: number; y: number }, "x">("x");
    const s = { x: 1, y: 2 };
    const s2 = l.set(s, 10);
    expect(s2).toEqual({ x: 10, y: 2 });
    expect(s.x).toBe(1);
  });
});

describe("index lens", () => {
  it("gets an element", () => {
    const l = index<number>(1);
    expect(l.get([10, 20, 30])).toBe(20);
  });

  it("sets an element without mutating", () => {
    const l = index<number>(1);
    const s = [10, 20, 30];
    const s2 = l.set(s, 99);
    expect(s2).toEqual([10, 99, 30]);
    expect(s[1]).toBe(20);
  });

  it("removes element when set to undefined", () => {
    const l = index<number>(1);
    expect(l.set([10, 20, 30], undefined)).toEqual([10, 30]);
  });
});

describe("each traversal", () => {
  it("gets all elements", () => {
    const t = each<number>();
    expect(t.getAll([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("modifies all elements", () => {
    const t = each<number>();
    expect(t.modify([1, 2, 3], (x) => x * 2)).toEqual([2, 4, 6]);
  });
});

describe("composeLenses", () => {
  it("composes two lenses", () => {
    const outer = field<{ inner: { x: number } }, "inner">("inner");
    const inner = field<{ x: number }, "x">("x");
    const composed = composeLenses(outer, inner);
    const s = { inner: { x: 42 } };
    expect(composed.get(s)).toBe(42);
    expect(composed.set(s, 99)).toEqual({ inner: { x: 99 } });
  });
});

describe("composeLensTraversal", () => {
  it("focuses a field then traverses each element", () => {
    const l = field<{ items: number[] }, "items">("items");
    const t = each<number>();
    const composed = composeLensTraversal(l, t);
    const s = { items: [1, 2, 3] };
    expect(composed.getAll(s)).toEqual([1, 2, 3]);
    expect(composed.modify(s, (x) => x + 10)).toEqual({ items: [11, 12, 13] });
  });
});
