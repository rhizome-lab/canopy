export { jsonRenderer, renderJsonTree } from "./renderer.ts";
export { JSON_TREE_CSS } from "./styles.ts";
import type { PluginManifest } from "@dusklight/core";
import { jsonRenderer } from "./renderer.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/renderer-json",
  version: "0.1.0",
  renderers: [jsonRenderer],
};

export default manifest;
