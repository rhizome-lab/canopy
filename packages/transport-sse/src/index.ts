import type { PluginManifest } from "@dusklight/core";
import { sseSource } from "./source.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/transport-sse",
  version: "0.1.0",
  capabilities: ["network:*"],
  sources: [sseSource],
};

export default manifest;
export { sseSource } from "./source.ts";
export type { SseConfig } from "./source.ts";
