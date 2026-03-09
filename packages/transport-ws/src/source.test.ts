import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { wsSource } from "./source.ts";

// Minimal WebSocket mock
class MockWebSocket {
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = MockWebSocket.CONNECTING;
  binaryType: string = "blob";
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(
    public url: string,
    public protocols?: string | string[],
  ) {
    Promise.resolve().then(() => {
      this.readyState = MockWebSocket.OPEN;
    });
  }

  close() {
    this.readyState = 3;
  }

  simulateMessage(data: ArrayBuffer | string) {
    this.onmessage?.({ data } as MessageEvent);
  }
  simulateClose() {
    this.onclose?.();
  }
  simulateError() {
    this.onerror?.();
  }
}

describe("wsSource", () => {
  let originalWebSocket: typeof WebSocket;

  beforeEach(() => {
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = MockWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("has correct id", () => {
    expect(wsSource.id).toBe("ws");
  });

  it("throws when url is missing", () => {
    expect(() => wsSource.create({}, {})).toThrow("url");
  });

  it("returns a SourceResult with a data iterable", () => {
    const result = wsSource.create({ url: "ws://localhost:8080" }, {});
    expect(result.data).toBeDefined();
    expect(typeof result.data[Symbol.asyncIterator]).toBe("function");
  });

  it("terminates when WebSocket closes", async () => {
    class ImmediateCloseWs extends MockWebSocket {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols);
        Promise.resolve().then(() => this.simulateClose());
      }
    }
    globalThis.WebSocket = ImmediateCloseWs as unknown as typeof WebSocket;

    const result = wsSource.create({ url: "ws://localhost" }, {});
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.data) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual([]);
  });
});
