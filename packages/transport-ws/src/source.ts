import type { SourceFactory, SourceResult, SourceConfig } from "@dusklight/core";

export type WsConfig = {
  url: string;
  protocols?: string | string[];
};

function isWsConfig(config: SourceConfig): config is WsConfig {
  return typeof config["url"] === "string";
}

export const wsSource: SourceFactory = {
  id: "ws",
  configSchema: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string", format: "uri" },
      protocols: { oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }] },
    },
  },
  create(config: SourceConfig): SourceResult {
    if (!isWsConfig(config)) {
      throw new Error("ws source requires a url");
    }
    return {
      data: wsStream(config.url, config.protocols),
    };
  },
};

async function* wsStream(url: string, protocols?: string | string[]): AsyncIterable<Uint8Array> {
  // Queue-based bridge from event-driven WebSocket to async iterable
  const queue: Array<Uint8Array | Error | null> = []; // null = closed
  let resolve: (() => void) | null = null;

  const ws = new WebSocket(url, protocols);
  ws.binaryType = "arraybuffer";

  const push = (item: Uint8Array | Error | null) => {
    queue.push(item);
    resolve?.();
    resolve = null;
  };

  ws.onmessage = (e: MessageEvent) => {
    if (e.data instanceof ArrayBuffer) {
      push(new Uint8Array(e.data));
    } else if (typeof e.data === "string") {
      push(new TextEncoder().encode(e.data));
    }
  };
  ws.onerror = () => push(new Error("WebSocket error"));
  ws.onclose = () => push(null);

  try {
    while (true) {
      if (queue.length === 0) {
        await new Promise<void>((r) => {
          resolve = r;
        });
      }
      const item = queue.shift();
      if (item === null || item === undefined) break;
      if (item instanceof Error) throw item;
      yield item;
    }
  } finally {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  }
}
