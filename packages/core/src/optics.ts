import type { Lens, Traversal } from "./types.ts";

/** Focus a record field by key. */
export function field<S extends Record<string, unknown>, K extends keyof S & string>(
  key: K,
): Lens<S, S[K]> {
  return {
    get: (s) => s[key],
    set: (s, a) => ({ ...s, [key]: a }),
  };
}

/** Focus an array element by index. */
export function index<A>(i: number): Lens<A[], A | undefined> {
  return {
    get: (s) => s[i],
    set: (s, a) => {
      const copy = [...s];
      if (a === undefined) {
        copy.splice(i, 1);
      } else {
        copy[i] = a;
      }
      return copy;
    },
  };
}

/** Traversal over all array elements. */
export function each<A>(): Traversal<A[], A> {
  return {
    getAll: (s) => [...s],
    modify: (s, f) => s.map(f),
  };
}

/** Compose two lenses. */
export function composeLenses<S, A, B>(outer: Lens<S, A>, inner: Lens<A, B>): Lens<S, B> {
  return {
    get: (s) => inner.get(outer.get(s)),
    set: (s, b) => outer.set(s, inner.set(outer.get(s), b)),
  };
}

/** Compose a lens with a traversal to get a traversal. */
export function composeLensTraversal<S, A, B>(
  lens: Lens<S, A>,
  traversal: Traversal<A, B>,
): Traversal<S, B> {
  return {
    getAll: (s) => traversal.getAll(lens.get(s)),
    modify: (s, f) => lens.set(s, traversal.modify(lens.get(s), f)),
  };
}
