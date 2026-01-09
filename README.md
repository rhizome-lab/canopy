# Canopy

Universal UI client with control plane.

Part of the [Rhizome](https://rhizome-lab.github.io) ecosystem.

## Overview

Canopy is a universal UI client for arbitrary data sources. Not just read-only - it includes a control plane for mutating, triggering, and interacting with the systems producing the data.

## Key Ideas

### Data-Agnostic

Canopy doesn't care about data format. JSON, protobuf, msgpack, SSE streams, video, audio, binary - it's all the same to Canopy. You define how to view it.

### Control Plane

The control plane is equally format-agnostic. You can:
- View data from any source
- Trigger actions on the system producing the data
- Mutate state through the same protocol
- Monitor multiple systems in unified views

### Project Hub

For Rhizome projects, Canopy becomes the unified dashboard:
- View Lotus world state
- Trigger Winnow extractions
- Monitor Cambium pipeline progress
- Inspect Sap expression outputs

All through the same configurable interface.

## License

MIT
