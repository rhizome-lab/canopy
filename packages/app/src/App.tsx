import { createSignal, For, Show } from "solid-js";
import type { JSX } from "solid-js";
import type { PluginRegistry, ReactiveLens } from "@dusklight/core";
import { createReactiveLens } from "./reactive.ts";
import { Pipeline } from "./pipeline.ts";

type AppProps = {
  registry: PluginRegistry;
};

export function App(props: AppProps): JSX.Element {
  const pipeline = new Pipeline(props.registry);

  const [data, setData] = createSignal<unknown>(null);
  const [selectedRenderer, setSelectedRenderer] = createSignal<string | null>(null);
  const candidates = () => {
    const d = data();
    if (d === null) return [];
    return pipeline.matchPatterns(d);
  };

  const lens = createReactiveLens<unknown>(null);

  // Sync data signal into lens — expose the top-level data signal as the lens signal
  const syncedLens: ReactiveLens<unknown, unknown> = {
    signal: Object.assign(data, {
      get value() {
        return data();
      },
    }),
    set: setData,
    modify: (f: (v: unknown) => unknown) => setData(f(data())),
    focus: lens.focus.bind(lens),
  };

  return (
    <div
      style={{
        "font-family": "system-ui, sans-serif",
        padding: "16px",
        background: "#1e1e1e",
        "min-height": "100vh",
        color: "#d4d4d4",
      }}
    >
      <header style={{ "margin-bottom": "16px" }}>
        <h1 style={{ margin: "0 0 8px", "font-size": "18px", color: "#569cd6" }}>Dusklight</h1>
        <StaticLoader onLoad={setData} />
      </header>

      <Show when={data() !== null}>
        <div style={{ "margin-bottom": "8px", "font-size": "12px", color: "#808080" }}>
          Renderers:{" "}
          <For each={candidates()}>
            {(c) => (
              <button
                onClick={() => setSelectedRenderer(c.rendererId)}
                style={{
                  "margin-right": "4px",
                  padding: "2px 8px",
                  background: selectedRenderer() === c.rendererId ? "#569cd6" : "#2d2d2d",
                  color: "#d4d4d4",
                  border: "1px solid #3e3e3e",
                  "border-radius": "3px",
                  cursor: "pointer",
                  "font-size": "12px",
                }}
              >
                {c.rendererId} ({Math.round(c.confidence * 100)}%)
              </button>
            )}
          </For>
        </div>
        <DataView
          data={data()}
          registry={props.registry}
          rendererId={selectedRenderer() ?? candidates()[0]?.rendererId ?? null}
          lens={syncedLens}
        />
      </Show>
    </div>
  );
}

function StaticLoader(props: { onLoad: (data: unknown) => void }): JSX.Element {
  const demos = [
    { label: "Object", data: { name: "Alice", age: 30, active: true, tags: ["admin", "user"] } },
    { label: "Array", data: [1, "two", true, null, { nested: "value" }] },
    { label: "String", data: "Hello, Dusklight!" },
  ];

  return (
    <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
      <span style={{ "font-size": "13px", color: "#808080" }}>Load demo:</span>
      <For each={demos}>
        {(demo) => (
          <button
            onClick={() => props.onLoad(demo.data)}
            style={{
              padding: "4px 12px",
              background: "#2d2d2d",
              color: "#d4d4d4",
              border: "1px solid #3e3e3e",
              "border-radius": "3px",
              cursor: "pointer",
              "font-size": "13px",
            }}
          >
            {demo.label}
          </button>
        )}
      </For>
    </div>
  );
}

type DataViewProps = {
  data: unknown;
  registry: PluginRegistry;
  rendererId: string | null;
  lens: ReactiveLens<unknown, unknown>;
};

function DataView(props: DataViewProps): JSX.Element {
  const renderer = () => (props.rendererId ? props.registry.getRenderer(props.rendererId) : null);

  return (
    <div
      style={{
        background: "#252526",
        border: "1px solid #3e3e3e",
        "border-radius": "4px",
        padding: "16px",
      }}
    >
      <Show
        when={renderer()}
        fallback={
          <pre style={{ margin: "0", color: "#d4d4d4", "font-size": "13px" }}>
            {JSON.stringify(props.data, null, 2)}
          </pre>
        }
      >
        {(r) => {
          let el!: HTMLDivElement;
          const mount = () => r().mount(el, props.lens, { caps: {} });
          return (
            <div
              ref={(node) => {
                el = node;
                mount();
              }}
            />
          );
        }}
      </Show>
    </div>
  );
}
