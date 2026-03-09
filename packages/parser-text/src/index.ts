import type { PluginManifest } from "@dusklight/core";
import { textParser, csvParser, binaryParser } from "./parser.ts";

export const manifest: PluginManifest = {
  id: "@dusklight/parser-text",
  version: "0.1.0",
  parsers: [textParser, csvParser, binaryParser],
};

export default manifest;
export { textParser, csvParser, binaryParser } from "./parser.ts";
