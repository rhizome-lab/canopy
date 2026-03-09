import type { Parser, ParseContext, ParseResult } from "@dusklight/core";

export const jsonParser: Parser = {
  id: "@dusklight/parser-json/json",
  contentTypes: ["application/json", "application/json; charset=utf-8", "text/json"],
  async *parse(input: AsyncIterable<Uint8Array>, _ctx: ParseContext): AsyncIterable<ParseResult> {
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    for await (const chunk of input) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }
    chunks.push(decoder.decode());
    const text = chunks.join("");
    if (text.length === 0) {
      yield { ok: false, error: "Empty input", partial: undefined };
      return;
    }
    try {
      const value = JSON.parse(text);
      yield { ok: true, value };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      yield { ok: false, error: message, partial: undefined };
    }
  },
};

export const jsonlParser: Parser = {
  id: "@dusklight/parser-json/jsonl",
  contentTypes: ["application/x-ndjson", "application/jsonlines", "application/jsonl"],
  async *parse(input: AsyncIterable<Uint8Array>, _ctx: ParseContext): AsyncIterable<ParseResult> {
    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of input) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last element as the incomplete line buffer
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.trim() === "") continue;
        try {
          const value = JSON.parse(line);
          yield { ok: true, value };
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          yield { ok: false, error: message, partial: undefined };
        }
      }
    }
    // Flush remaining decoder state
    buffer += decoder.decode();
    // Process any remaining content in buffer
    const remaining = buffer.split("\n");
    for (const line of remaining) {
      if (line.trim() === "") continue;
      try {
        const value = JSON.parse(line);
        yield { ok: true, value };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        yield { ok: false, error: message, partial: undefined };
      }
    }
  },
};
