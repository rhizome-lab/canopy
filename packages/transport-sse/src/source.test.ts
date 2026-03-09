import { describe, it, expect, beforeEach } from "bun:test";
import { sseSource } from "./source.ts";

function mockFetchWith(sseText: string) {
  const encoder = new TextEncoder();
  const chunks = [encoder.encode(sseText)];
  let i = 0;
  const mockResponse = {
    body: {
      getReader: () => ({
        read: async () => {
          const chunk = chunks[i++];
          if (!chunk) return { done: true as const, value: undefined };
          return { done: false as const, value: chunk };
        },
        releaseLock: () => {},
      }),
    },
  };
  globalThis.fetch = (() =>
    Promise.resolve(mockResponse as unknown as Response)) as unknown as typeof fetch;
}

function mockFetchWithChunks(sseChunks: string[]) {
  const encoder = new TextEncoder();
  const chunks = sseChunks.map((c) => encoder.encode(c));
  let i = 0;
  const mockResponse = {
    body: {
      getReader: () => ({
        read: async () => {
          const chunk = chunks[i++];
          if (!chunk) return { done: true as const, value: undefined };
          return { done: false as const, value: chunk };
        },
        releaseLock: () => {},
      }),
    },
  };
  globalThis.fetch = (() =>
    Promise.resolve(mockResponse as unknown as Response)) as unknown as typeof fetch;
}

async function collectStream(iterable: AsyncIterable<Uint8Array>): Promise<string[]> {
  const decoder = new TextDecoder();
  const results: string[] = [];
  for await (const chunk of iterable) {
    results.push(decoder.decode(chunk));
  }
  return results;
}

describe("sseSource", () => {
  it('has id "sse"', () => {
    expect(sseSource.id).toBe("sse");
  });

  it("throws when url is missing", () => {
    expect(() => sseSource.create({}, {})).toThrow("sse source requires a url");
  });

  it("throws when url is not a string", () => {
    expect(() => sseSource.create({ url: 42 }, {})).toThrow("sse source requires a url");
  });

  it("create returns SourceResult with contentType text/event-stream", () => {
    mockFetchWith("");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    expect(result.contentType).toBe("text/event-stream");
    expect(result.data).toBeDefined();
  });

  it("streams data field values from SSE events", async () => {
    mockFetchWith("data: hello\n\ndata: world\n\n");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["hello", "world"]);
  });

  it("handles multi-line data (multiple data: lines joined with newline)", async () => {
    mockFetchWith("data: line1\ndata: line2\n\n");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["line1\nline2"]);
  });

  it("skips events with no data field", async () => {
    mockFetchWith(": heartbeat\n\ndata: real\n\n");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["real"]);
  });

  it("skips event: and id: lines, yields data field only", async () => {
    mockFetchWith("event: update\nid: 1\ndata: payload\n\n");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["payload"]);
  });

  it("handles events split across multiple chunks", async () => {
    // Split the SSE text mid-event across two chunks
    mockFetchWithChunks(["data: hel", "lo\n\ndata: world\n\n"]);
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["hello", "world"]);
  });

  it("handles a trailing incomplete event in the final flush", async () => {
    // No trailing blank line — last event has no terminating double newline
    mockFetchWith("data: only\n");
    const result = sseSource.create({ url: "http://example.com/events" }, {});
    const chunks = await collectStream(result.data);
    expect(chunks).toEqual(["only"]);
  });
});
