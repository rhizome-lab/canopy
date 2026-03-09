import { createSignal, createMemo } from "solid-js";
import type { ReactiveLens, Lens, Signal } from "@dusklight/core";

export function createReactiveLens<S>(initial: S): ReactiveLens<S, S> {
  const [get, set] = createSignal<S>(initial);
  return makeLens<S, S>(get as unknown as Signal<S>, (f) => set((prev) => f(prev as S)));
}

function makeLens<S, A>(signal: Signal<A>, modify: (f: (a: A) => A) => void): ReactiveLens<S, A> {
  return {
    signal,
    set(a: A) {
      modify(() => a);
    },
    modify,
    focus<B>(lens: Lens<A, B>): ReactiveLens<S, B> {
      const focused = createMemo(() => lens.get(signal()));
      const focusedSignal = focused as unknown as Signal<B>;
      return makeLens<S, B>(focusedSignal, (f) => {
        modify((a) => lens.set(a, f(lens.get(a))));
      });
    },
  };
}
