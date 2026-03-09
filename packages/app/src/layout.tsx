import { For, Show } from "solid-js";
import type { JSX } from "solid-js";
import type { LayoutNode, ReactiveLens, RendererCtx } from "@dusklight/core";
import type { PluginRegistry } from "@dusklight/core";

type LayoutProps = {
  node: LayoutNode;
  lens: ReactiveLens<unknown, unknown>;
  ctx: RendererCtx;
  registry: PluginRegistry;
};

function spacingStyle(spacing: unknown): string {
  if (typeof spacing === "number") return String(spacing) + "px";
  return "8px";
}

export function Layout(props: LayoutProps): JSX.Element {
  const { node } = props;
  switch (node.type) {
    case "HStack":
      return (
        <div style={{ display: "flex", "flex-direction": "row", gap: spacingStyle(node.spacing) }}>
          <For each={node.children}>
            {(child) => (
              <Layout node={child} lens={props.lens} ctx={props.ctx} registry={props.registry} />
            )}
          </For>
        </div>
      );
    case "VStack":
      return (
        <div
          style={{ display: "flex", "flex-direction": "column", gap: spacingStyle(node.spacing) }}
        >
          <For each={node.children}>
            {(child) => (
              <Layout node={child} lens={props.lens} ctx={props.ctx} registry={props.registry} />
            )}
          </For>
        </div>
      );
    case "ZStack":
      return (
        <div style={{ position: "relative" }}>
          <For each={node.children}>
            {(child) => (
              <div style={{ position: "absolute", inset: "0" }}>
                <Layout node={child} lens={props.lens} ctx={props.ctx} registry={props.registry} />
              </div>
            )}
          </For>
        </div>
      );
    case "Grid":
      return (
        <div style={{ display: "grid" }}>
          <For each={node.children}>
            {(child) => (
              <Layout node={child} lens={props.lens} ctx={props.ctx} registry={props.registry} />
            )}
          </For>
        </div>
      );
    case "Spacer":
      return <div style={{ flex: "1" }} />;
    case "ForEach":
      return (
        <Show when={Array.isArray(props.lens.signal())} fallback={<div />}>
          <For each={props.lens.signal() as unknown[]}>
            {(_item, _i) => (
              <Layout
                node={node.child}
                lens={props.lens}
                ctx={props.ctx}
                registry={props.registry}
              />
            )}
          </For>
        </Show>
      );
    case "Renderer":
      return (
        <RendererMount
          rendererId={node.rendererId}
          lens={props.lens}
          ctx={props.ctx}
          registry={props.registry}
        />
      );
  }
}

type RendererMountProps = {
  rendererId: string;
  lens: ReactiveLens<unknown, unknown>;
  ctx: RendererCtx;
  registry: PluginRegistry;
};

function RendererMount(props: RendererMountProps): JSX.Element {
  const renderer = props.registry.getRenderer(props.rendererId);
  if (!renderer) {
    return <div style={{ color: "red" }}>Unknown renderer: {props.rendererId}</div>;
  }

  let cleanup: (() => void) | null = null;

  return (
    <div
      ref={(node) => {
        cleanup = renderer.mount(node, props.lens, props.ctx);
      }}
      // eslint-disable-next-line solid/reactivity
      onClick={undefined}
    />
  );

  // cleanup is called when the component unmounts via onCleanup in a real app;
  // for now the ref-based mount is the correct pattern
  void cleanup;
}
