import { describe, expect, it } from "bun:test";
import { jsonlParser, jsonParser } from "./parser.ts";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

function toIterable(bytes: Uint8Array): AsyncIterable<Uint8Array> {
  return {
    async *[Symbol.asyncIterator]() {
      yield bytes;
    },
  };
}

function encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

describe("jsonParser", () => {
  it("parses a simple object", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode('{"a":1}')), {}));
    expect(results).toEqual([{ ok: true, value: { a: 1 } }]);
  });

  it("parses an array", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("[1,2,3]")), {}));
    expect(results).toEqual([{ ok: true, value: [1, 2, 3] }]);
  });

  it("parses null", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("null")), {}));
    expect(results).toEqual([{ ok: true, value: null }]);
  });

  it("parses numbers", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("42")), {}));
    expect(results).toEqual([{ ok: true, value: 42 }]);
  });

  it("parses booleans", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("true")), {}));
    expect(results).toEqual([{ ok: true, value: true }]);
  });

  it("parses strings", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode('"hello"')), {}));
    expect(results).toEqual([{ ok: true, value: "hello" }]);
  });

  it("returns ok:false on invalid JSON", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("not json")), {}));
    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(false);
    if (!results[0]!.ok) {
      expect(typeof results[0]!.error).toBe("string");
    }
  });

  it("handles empty input", async () => {
    const results = await collect(jsonParser.parse(toIterable(encode("")), {}));
    expect(results).toHaveLength(1);
    expect(results[0]!.ok).toBe(false);
  });
});

describe("jsonlParser", () => {
  it("parses multiple lines", async () => {
    const input = '{"a":1}\n{"b":2}\n{"c":3}\n';
    const results = await collect(jsonlParser.parse(toIterable(encode(input)), {}));
    expect(results).toEqual([
      { ok: true, value: { a: 1 } },
      { ok: true, value: { b: 2 } },
      { ok: true, value: { c: 3 } },
    ]);
  });

  it("skips empty lines", async () => {
    const input = '{"a":1}\n\n{"b":2}\n';
    const results = await collect(jsonlParser.parse(toIterable(encode(input)), {}));
    expect(results).toEqual([
      { ok: true, value: { a: 1 } },
      { ok: true, value: { b: 2 } },
    ]);
  });

  it("returns ok:false for invalid lines while continuing", async () => {
    const input = '{"a":1}\nnot json\n{"b":2}\n';
    const results = await collect(jsonlParser.parse(toIterable(encode(input)), {}));
    expect(results).toHaveLength(3);
    expect(results[0]!).toEqual({ ok: true, value: { a: 1 } });
    expect(results[1]!.ok).toBe(false);
    expect(results[2]!).toEqual({ ok: true, value: { b: 2 } });
  });

  it("parses single line without trailing newline", async () => {
    const input = '{"a":1}';
    const results = await collect(jsonlParser.parse(toIterable(encode(input)), {}));
    expect(results).toEqual([{ ok: true, value: { a: 1 } }]);
  });

  it("handles mixed valid/invalid lines", async () => {
    const input = "1\nnot json\nnull\n{}\n[broken\n";
    const results = await collect(jsonlParser.parse(toIterable(encode(input)), {}));
    expect(results).toHaveLength(5);
    expect(results[0]!).toEqual({ ok: true, value: 1 });
    expect(results[1]!.ok).toBe(false);
    expect(results[2]!).toEqual({ ok: true, value: null });
    expect(results[3]!).toEqual({ ok: true, value: {} });
    expect(results[4]!.ok).toBe(false);
  });
});
