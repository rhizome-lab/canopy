import type { PluginManifest } from "@dusklight/core";
import { jsonParser, jsonlParser } from "./parser.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/parser-json",
  version: "0.1.0",
  parsers: [jsonParser, jsonlParser],
};

export default manifest;
export { jsonParser, jsonlParser } from "./parser.ts";
