import type { SourceFactory, SourceResult, SourceConfig } from "@dusklight/core";

export type HttpConfig = {
  url: string;
  method?: string; // default: 'GET'
  headers?: Record<string, string>;
  body?: string;
};

function isHttpConfig(config: SourceConfig): config is HttpConfig {
  return typeof config["url"] === "string";
}

export const httpSource: SourceFactory = {
  id: "http",
  configSchema: {
    type: "object",
    required: ["url"],
    properties: {
      url: { type: "string", format: "uri" },
      method: { type: "string", default: "GET" },
      headers: { type: "object", additionalProperties: { type: "string" } },
      body: { type: "string" },
    },
  },
  create(config: SourceConfig): SourceResult {
    if (!isHttpConfig(config)) {
      throw new Error("http source requires a url");
    }
    const { url, method = "GET", headers, body } = config;

    // TODO: plumb response contentType back through SourceResult (requires async factory or streaming metadata).
    // Returns immediately — fetch is lazy inside the async generator
    return {
      data: fetchStream(url, method, headers, body),
      // contentType filled from response headers once fetch resolves
    };
  },
};

async function* fetchStream(
  url: string,
  method: string,
  headers?: Record<string, string>,
  body?: string,
): AsyncIterable<Uint8Array> {
  const init: RequestInit = { method };
  if (headers !== undefined) init.headers = headers;
  if (body !== undefined) init.body = body;
  const response = await fetch(url, init);
  if (!response.body) return;
  const reader = response.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
