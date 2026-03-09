import { describe, expect, it } from "bun:test";
import { textParser, csvParser, binaryParser } from "./parser.ts";

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const results: T[] = [];
  for await (const item of iter) {
    results.push(item);
  }
  return results;
}

async function* bytes(...chunks: Uint8Array[]): AsyncIterable<Uint8Array> {
  for (const chunk of chunks) yield chunk;
}

describe("textParser", () => {
  it("decodes UTF-8 bytes to string", async () => {
    const encoder = new TextEncoder();
    const input = bytes(encoder.encode("hello world"));
    const results = await collect(textParser.parse(input, {}));
    expect(results).toEqual([{ ok: true, value: "hello world" }]);
  });

  it("handles multi-byte UTF-8 characters", async () => {
    const encoder = new TextEncoder();
    const text = "héllo wörld 日本語";
    const encoded = encoder.encode(text);
    // Split in two chunks to exercise concatenation
    const half = Math.floor(encoded.length / 2);
    const input = bytes(encoded.slice(0, half), encoded.slice(half));
    const results = await collect(textParser.parse(input, {}));
    expect(results).toEqual([{ ok: true, value: text }]);
  });
});

describe("csvParser", () => {
  it("parses multiple rows", async () => {
    const encoder = new TextEncoder();
    const input = bytes(encoder.encode("a,b,c\n1,2,3\n4,5,6"));
    const results = await collect(csvParser.parse(input, {}));
    expect(results).toEqual([
      {
        ok: true,
        value: [
          ["a", "b", "c"],
          ["1", "2", "3"],
          ["4", "5", "6"],
        ],
      },
    ]);
  });

  it("parses single row with no trailing newline", async () => {
    const encoder = new TextEncoder();
    const input = bytes(encoder.encode("x,y,z"));
    const results = await collect(csvParser.parse(input, {}));
    expect(results).toEqual([{ ok: true, value: [["x", "y", "z"]] }]);
  });

  it("returns empty array for empty input", async () => {
    const input = bytes();
    const results = await collect(csvParser.parse(input, {}));
    expect(results).toEqual([{ ok: true, value: [] }]);
  });
});

describe("binaryParser", () => {
  it("returns a Uint8Array with concatenated bytes", async () => {
    const chunk1 = new Uint8Array([1, 2, 3]);
    const chunk2 = new Uint8Array([4, 5, 6]);
    const input = bytes(chunk1, chunk2);
    const results = await collect(binaryParser.parse(input, {}));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ ok: true, value: new Uint8Array([1, 2, 3, 4, 5, 6]) });
  });

  it("returns empty Uint8Array for empty input", async () => {
    const input = bytes();
    const results = await collect(binaryParser.parse(input, {}));
    expect(results).toEqual([{ ok: true, value: new Uint8Array(0) }]);
  });
});
