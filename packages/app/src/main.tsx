import { render } from "solid-js/web";
import { PluginRegistry } from "@dusklight/core";
import rendererJsonManifest from "@dusklight/renderer-json";
import { App } from "./App.tsx";

// Create registry with default plugins
const registry = new PluginRegistry();

// Register JSON renderer
registry.register(rendererJsonManifest);

// Register JSON fallback pattern (matches anything, low confidence)
registry.register({
  id: "@dusklight/pattern-json-fallback",
  version: "0.1.0",
  patterns: [
    {
      id: "json-fallback",
      rendererId: "@dusklight/renderer-json",
      match: () => 0.5,
    },
  ],
});

const root = document.getElementById("root")!;
render(() => <App registry={registry} />, root);
