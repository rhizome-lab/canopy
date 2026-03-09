import type { PluginManifest } from "@dusklight/core";
import { httpSource } from "./source.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/transport-http",
  version: "0.1.0",
  capabilities: ["network:*"],
  sources: [httpSource],
};

export default manifest;
export { httpSource } from "./source.ts";
export type { HttpConfig } from "./source.ts";
