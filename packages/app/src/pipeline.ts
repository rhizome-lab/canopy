import type { PluginRegistry, ParseResult, MatchContext, PatternResult } from "@dusklight/core";

export type PipelineResult = {
  value: unknown;
  schema?: unknown;
  candidates: PatternResult[];
};

export class Pipeline {
  constructor(private readonly registry: PluginRegistry) {}

  /** Parse a stream using all parsers that match the contentType, yield results. */
  async *parseStream(
    data: AsyncIterable<Uint8Array>,
    contentType?: string,
  ): AsyncIterable<ParseResult> {
    const parsers = contentType ? this.registry.getParsersForContentType(contentType) : [];

    // Fall back to first registered parser if no content-type match
    const allManifests = this.registry.listManifests();
    const fallback =
      parsers.length === 0 ? allManifests.flatMap((m) => m.parsers ?? []).at(0) : null;
    const parser = parsers[0] ?? fallback;
    if (!parser) return;

    const parseCtx = contentType !== undefined ? { contentType } : {};
    yield* parser.parse(data, parseCtx);
  }

  /** Run pattern matching on a parsed value and return ranked candidates. */
  matchPatterns(value: unknown, ctx: MatchContext = {}): PatternResult[] {
    return this.registry.matchPatterns(value, ctx);
  }
}
