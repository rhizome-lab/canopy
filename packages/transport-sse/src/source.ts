import type { SourceFactory, SourceResult, SourceConfig } from "@dusklight/core";

export type SseConfig = {
  url: string;
  headers?: Record<string, string>;
};

function isSseConfig(config: SourceConfig): config is SseConfig {
  return typeof config["url"] === "string";
}

export const sseSource: SourceFactory = {
  id: "sse",
  configSchema: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string", format: "uri" },
      headers: { type: "object", additionalProperties: { type: "string" } },
    },
  },
  create(config: SourceConfig): SourceResult {
    if (!isSseConfig(config)) {
      throw new Error("sse source requires a url");
    }
    return {
      data: sseStream(config.url, config.headers),
      contentType: "text/event-stream",
    };
  },
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function* sseStream(
  url: string,
  headers?: Record<string, string>,
): AsyncIterable<Uint8Array> {
  const response = await fetch(url, {
    headers: { Accept: "text/event-stream", ...headers },
  });
  if (!response.body) return;

  const reader = response.body.getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const events = buffer.split(/\r?\n\r?\n/);
      // Last element may be an incomplete event — keep it in buffer
      buffer = events.pop() ?? "";

      for (const eventText of events) {
        const data = parseEventData(eventText);
        if (data !== null) {
          yield encoder.encode(data);
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const data = parseEventData(buffer);
      if (data !== null) yield encoder.encode(data);
    }
  } finally {
    reader.releaseLock();
  }
}

/** Extract the data field(s) from an SSE event block. */
function parseEventData(eventText: string): string | null {
  const lines = eventText.split(/\r?\n/);
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
    // ignore event:, id:, retry: lines for now
  }

  if (dataLines.length === 0) return null;
  return dataLines.join("\n");
}
