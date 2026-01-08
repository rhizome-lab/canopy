# Architecture

High-level technical design for Canopy.

## Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Source    │────▶│   Parser    │────▶│  Patterns   │────▶│  Renderer   │
│             │     │             │     │             │     │             │
│ fetch/ws/   │     │ json/proto/ │     │ match shape │     │ tree/table/ │
│ sse/file    │     │ msgpack/bin │     │ select view │     │ chart/hex   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

Each stage is pluggable.

## Core Abstractions

### Source

Produces raw bytes + metadata.

```typescript
type Source = {
  kind: 'fetch' | 'websocket' | 'sse' | 'file' | 'static'
  url?: string
  contentType?: string
  // ...
}

type SourceResult = {
  data: ArrayBuffer | ReadableStream<Uint8Array>
  contentType: string
  headers?: Headers
  metadata?: Record<string, unknown>
}
```

### Parser

Transforms bytes into structured data.

```typescript
type Parser = {
  id: string
  name: string
  // Which content types this parser handles
  contentTypes: string[]
  // Parse raw bytes into structured form
  parse(input: ArrayBuffer, ctx: ParseContext): ParseResult
}

type ParseResult =
  | { ok: true; value: unknown; schema?: Schema }
  | { ok: false; error: string; partial?: unknown }
```

Built-in parsers: JSON, text, binary (passthrough).
Plugin parsers: protobuf, msgpack, CBOR, custom binary formats.

### Pattern

Recognizes structure in parsed data, suggests renderers.

```typescript
type Pattern = {
  id: string
  name: string
  // Higher priority = matched first
  priority: number
  // Does this pattern match the data?
  match(data: unknown, ctx: MatchContext): MatchResult
}

type MatchResult =
  | { matched: false }
  | { matched: true; renderer: string; confidence: number; children?: ChildMatch[] }
```

Patterns can be:
- **Structural**: "array of objects with numeric x/y fields"
- **Heuristic**: "number that looks like a Unix timestamp"
- **Semantic**: "field named `*_color` containing hex string"
- **Schema-derived**: "OpenAPI says this is a DateTime"

### Renderer

Displays data.

```typescript
type Renderer = {
  id: string
  name: string
  // Render data to DOM/component
  render(data: unknown, ctx: RenderContext): RenderResult
}
```

Renderers receive matched data + any child pattern matches, produce UI.

## Plugin System

Plugins are ES modules exporting a manifest:

```typescript
// my-plugin.ts
export const manifest: PluginManifest = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  parsers: [myParser],
  patterns: [myPattern],
  renderers: [myRenderer],
}
```

Loaded dynamically. Core provides:
- Plugin discovery/loading
- Dependency resolution
- Sandboxing (future)

## Configuration

Layered, VSCode-style:

```
defaults < user settings < workspace settings < source overrides
```

Example user settings:

```jsonc
{
  // Default renderer for arrays
  "renderers.array.default": "table",

  // Pattern overrides
  "patterns.timestamp.range": [0, 2000000000000],

  // Per-source config
  "sources": {
    "https://api.example.com/*": {
      "auth": { "type": "bearer", "token": "${env:EXAMPLE_TOKEN}" }
    }
  }
}
```

## Open Questions

- [x] ~~How do user scripts integrate?~~ No distinction - everything is a plugin. Local plugins live in `~/.config/canopy/plugins/local/`, installed ones in `plugins/installed/`. Same API, same power.
- [x] ~~Streaming data - how do patterns work on partial data?~~ Patterns match individual items. Renderers control collection behavior (append/window/replace). Same pattern can render as "table, append last 1000" or "chart, window last 5 minutes". Multiple views on same source can have different collection modes.
- [x] ~~Binary annotation UI - how to persist user structure annotations?~~ Layered like VSCode settings: user (`~/.config/canopy/`), workspace (`.canopy/`), folder, file. User can "promote to plugin" when they've identified a general format.
- [x] ~~Schema discovery - auto-fetch OpenAPI, or explicit config?~~ Both: auto-discover well-known paths, allow explicit override/disable. Schema flows into `MatchContext` so patterns can use it (authoritative) or fall back to data heuristics. Also used for: validation indicators, documentation tooltips (like VSCode JSON language server).
- [x] ~~Plugin distribution - registry, or just URLs?~~ No custom registry. Use npm/jsr for published plugins, URLs for direct install, local paths for personal plugins. All resolve to ES modules. `canopy install npm:@canopy/foo`, `canopy install https://...`, `canopy install ./local/bar.ts`.
