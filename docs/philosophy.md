# Philosophy

Canopy is a **consumer** of data. It doesn't produce, mutate, or manage - it observes and renders.

## Core Insight

Data has shape. Shape implies visualization. The gap between "raw JSON response" and "useful UI" is pattern recognition + rendering.

Most tools hardcode this: Swagger UI knows OpenAPI, Grafana knows metrics, pgAdmin knows tables. Canopy inverts it: **you teach it patterns, it applies them everywhere**.

## Design Principles

### 1. Pattern-First Rendering

Data flows through a recognition pipeline:

```
Source → Parse → Recognize Patterns → Select Renderer → Display
```

Patterns can match on:
- **Structure**: `{ x: number, y: number }[]` → scatter plot
- **Field names**: `*_url`, `*_image`, `*_color` → inline preview
- **Value heuristics**: large numbers in plausible timestamp range → datetime
- **Content type**: `image/*` → image viewer
- **Schema hints**: OpenAPI spec available → use it

Patterns compose. A response might match "array of objects" (→ table) where individual fields match "timestamp" (→ formatted date) and "color hex" (→ swatch).

### 2. Progressive Disclosure

Unknown data should still be explorable:
- Start with raw view (JSON tree, hex dump)
- User annotates: "this field is a timestamp", "these 4 bytes are a float"
- Annotations become patterns for future data

Prior art: ImHex, Radare2, Wireshark - tools that help you reverse-engineer structure.

### 3. Plugins Over Hardcoding

Renderers are plugins. Parsers are plugins. Pattern matchers are plugins.

Core provides:
- Plugin loading/lifecycle
- Data flow orchestration
- Built-in primitives (JSON tree, hex view, text)

Everything else is pluggable:
- Custom visualizations (charts, graphs, domain-specific)
- Binary format parsers (protobuf, msgpack, custom)
- Protocol handlers (SSE, WebSocket, gRPC-web)

Local plugins (`~/.config/canopy/plugins/local/`) serve as escape hatches - same API as published plugins, but for personal one-offs and quick fixes.

### 4. Configuration as Code

Settings follow VSCode model:
- Defaults < User settings < Workspace settings
- JSON/JSONC with schema validation
- Per-source overrides ("for this URL, use this renderer")

## What Canopy Is Not

- **Not an API client**: No request builder, no auth management, no collections. Use Insomnia/Postman for that, pipe output to Canopy.
- **Not a database UI**: No query builder, no schema browser. It renders data, not sources.
- **Not a dashboard builder**: No layout persistence, no scheduled refresh. It's a viewer, not a monitoring tool.

These boundaries keep scope manageable. Canopy does one thing: render arbitrary data well.

## Platform

Web app. Reasons:
- No filesystem access needed for MVP (fetch-only)
- Cross-platform free
- Plugins as ES modules
- Easy to embed/share

Desktop (Tauri) later if needed for:
- Local file access
- System integration
- Offline use

## Technology

TypeScript throughout. Discriminated unions for type-safe plugin APIs.

WASM for heavy lifting:
- Binary parsers (protobuf, msgpack)
- Custom format decoders
- Performance-critical transforms

Rust compiles to WASM, so ecosystem alignment preserved.
