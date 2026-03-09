import { describe, it, expect, mock } from "bun:test";
import { httpSource } from "./source.ts";

describe("httpSource", () => {
  it("has correct id", () => {
    expect(httpSource.id).toBe("http");
  });

  it("throws when url is missing", () => {
    expect(() => httpSource.create({}, {})).toThrow("url");
  });

  it("returns a SourceResult with a data iterable", () => {
    // Mock fetch at the global level
    const mockResponse = {
      body: {
        getReader: () => ({
          read: async () => ({ done: true, value: undefined }),
          releaseLock: () => {},
        }),
      },
    };
    globalThis.fetch = mock(
      async () => mockResponse as unknown as Response,
    ) as unknown as typeof fetch;

    const result = httpSource.create({ url: "http://example.com" }, {});
    expect(result.data).toBeDefined();
    expect(typeof result.data[Symbol.asyncIterator]).toBe("function");
  });

  it("streams bytes from the response body", async () => {
    const chunks = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])];
    let callCount = 0;
    const mockResponse = {
      body: {
        getReader: () => ({
          read: async () => {
            const chunk = chunks[callCount++];
            if (!chunk) return { done: true as const, value: undefined };
            return { done: false as const, value: chunk };
          },
          releaseLock: () => {},
        }),
      },
    };
    globalThis.fetch = mock(
      async () => mockResponse as unknown as Response,
    ) as unknown as typeof fetch;

    const result = httpSource.create({ url: "http://example.com" }, {});
    const collected: Uint8Array[] = [];
    for await (const chunk of result.data) {
      collected.push(chunk);
    }
    expect(collected.length).toBe(2);
    expect(collected[0]).toEqual(new Uint8Array([1, 2, 3]));
  });
});
