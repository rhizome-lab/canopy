import type { PluginManifest } from "@dusklight/core";
import { wsSource } from "./source.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/transport-ws",
  version: "0.1.0",
  capabilities: ["network:*"],
  sources: [wsSource],
};

export default manifest;
export { wsSource } from "./source.ts";
export type { WsConfig } from "./source.ts";
