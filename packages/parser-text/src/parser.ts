import type { Parser, ParseContext, ParseResult } from "@dusklight/core";

async function collectBytes(input: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  for await (const chunk of input) {
    chunks.push(chunk);
    totalLength += chunk.length;
  }
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export const textParser: Parser = {
  id: "text",
  contentTypes: [
    "text/plain",
    "text/plain; charset=utf-8",
    "text/html",
    "text/css",
    "text/javascript",
    "application/javascript",
  ],
  async *parse(input: AsyncIterable<Uint8Array>, _ctx: ParseContext): AsyncIterable<ParseResult> {
    const bytes = await collectBytes(input);
    const decoder = new TextDecoder("utf-8");
    const value = decoder.decode(bytes);
    yield { ok: true, value };
  },
};

export const csvParser: Parser = {
  id: "csv",
  contentTypes: ["text/csv", "application/csv"],
  async *parse(input: AsyncIterable<Uint8Array>, _ctx: ParseContext): AsyncIterable<ParseResult> {
    const bytes = await collectBytes(input);
    const decoder = new TextDecoder("utf-8");
    const text = decoder.decode(bytes);
    if (text.length === 0) {
      yield { ok: true, value: [] };
      return;
    }
    const lines = text.split("\n").filter((line) => line.length > 0);
    const rows = lines.map((line) => line.split(","));
    yield { ok: true, value: rows };
  },
};

export const binaryParser: Parser = {
  id: "binary",
  contentTypes: ["application/octet-stream"],
  async *parse(input: AsyncIterable<Uint8Array>, _ctx: ParseContext): AsyncIterable<ParseResult> {
    const value = await collectBytes(input);
    yield { ok: true, value };
  },
};
