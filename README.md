# Dusklight

Universal UI client with control plane.

Part of the [RHI](https://rhi-zone.github.io) ecosystem.

## Overview

Dusklight is a universal UI client for arbitrary data sources. Not just read-only - it includes a control plane for mutating, triggering, and interacting with the systems producing the data.

## Key Ideas

### Data-Agnostic

Dusklight doesn't care about data format. JSON, protobuf, msgpack, SSE streams, video, audio, binary - it's all the same to Dusklight. You define how to view it.

### Control Plane

The control plane is equally format-agnostic. You can:
- View data from any source
- Trigger actions on the system producing the data
- Mutate state through the same protocol
- Monitor multiple systems in unified views

### Project Hub

For RHI projects, Dusklight becomes the unified dashboard:
- View world state
- Trigger extractions
- Monitor pipeline progress
- Inspect expression outputs

All through the same configurable interface.

## License

MIT
