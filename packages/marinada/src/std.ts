import type { Expr } from "./types.ts";

export type StdBinding = {
  name: string;
  expr: Expr;
};

/**
 * lib:std standard library bindings.
 * Defined as ordinary Marinada expressions — no special compiler knowledge.
 * Loaded by the module resolver the same way as any other lib: module.
 */
export const STD_BINDINGS: StdBinding[] = [
  // --- Function combinators ---
  { name: "identity", expr: ["fn", ["x"], "x"] },
  { name: "compose", expr: ["fn", ["f", "g"], ["fn", ["x"], ["call", "f", ["call", "g", "x"]]]] },
  { name: "const", expr: ["fn", ["x"], ["fn", ["_"], "x"]] },
  { name: "flip", expr: ["fn", ["f"], ["fn", ["a", "b"], ["call", "f", "b", "a"]]] },

  // --- Option<T> = None | Some(T) ---
  { name: "some", expr: ["fn", ["x"], ["Some", "x"]] },
  { name: "none", expr: ["None"] },
  {
    name: "is-some",
    expr: ["fn", ["opt"], ["match", "opt", [["Some", "_"], true], [["None"], false]]],
  },
  {
    name: "is-none",
    expr: ["fn", ["opt"], ["match", "opt", [["None"], true], [["Some", "_"], false]]],
  },
  {
    name: "unwrap-or",
    expr: ["fn", ["opt", "default"], ["match", "opt", [["Some", "x"], "x"], [["None"], "default"]]],
  },
  {
    name: "map-option",
    expr: [
      "fn",
      ["f", "opt"],
      [
        "match",
        "opt",
        [
          ["Some", "x"],
          ["Some", ["call", "f", "x"]],
        ],
        [["None"], ["None"]],
      ],
    ],
  },
  {
    name: "and-then",
    expr: [
      "fn",
      ["f", "opt"],
      [
        "match",
        "opt",
        [
          ["Some", "x"],
          ["call", "f", "x"],
        ],
        [["None"], ["None"]],
      ],
    ],
  },
  {
    name: "option-or",
    expr: [
      "fn",
      ["opt", "fallback"],
      [
        "match",
        "opt",
        [
          ["Some", "x"],
          ["Some", "x"],
        ],
        [["None"], "fallback"],
      ],
    ],
  },

  // --- Result<T, E> = Ok(T) | Err(E) ---
  { name: "ok", expr: ["fn", ["x"], ["Ok", "x"]] },
  { name: "err", expr: ["fn", ["e"], ["Err", "e"]] },
  {
    name: "is-ok",
    expr: ["fn", ["r"], ["match", "r", [["Ok", "_"], true], [["Err", "_"], false]]],
  },
  {
    name: "is-err",
    expr: ["fn", ["r"], ["match", "r", [["Err", "_"], true], [["Ok", "_"], false]]],
  },
  {
    name: "unwrap-or-else",
    expr: [
      "fn",
      ["r", "f"],
      [
        "match",
        "r",
        [["Ok", "x"], "x"],
        [
          ["Err", "e"],
          ["call", "f", "e"],
        ],
      ],
    ],
  },
  {
    name: "map-result",
    expr: [
      "fn",
      ["f", "r"],
      [
        "match",
        "r",
        [
          ["Ok", "x"],
          ["Ok", ["call", "f", "x"]],
        ],
        [
          ["Err", "e"],
          ["Err", "e"],
        ],
      ],
    ],
  },
  {
    name: "map-err",
    expr: [
      "fn",
      ["f", "r"],
      [
        "match",
        "r",
        [
          ["Ok", "x"],
          ["Ok", "x"],
        ],
        [
          ["Err", "e"],
          ["Err", ["call", "f", "e"]],
        ],
      ],
    ],
  },
  {
    name: "result-and-then",
    expr: [
      "fn",
      ["f", "r"],
      [
        "match",
        "r",
        [
          ["Ok", "x"],
          ["call", "f", "x"],
        ],
        [
          ["Err", "e"],
          ["Err", "e"],
        ],
      ],
    ],
  },

  // --- Numeric helpers ---
  { name: "clamp", expr: ["fn", ["x", "lo", "hi"], ["max", "lo", ["min", "x", "hi"]]] },
  {
    name: "between?",
    expr: ["fn", ["x", "lo", "hi"], ["and", [">=", "x", "lo"], ["<=", "x", "hi"]]],
  },
  // sign: -1, 0, or 1 — uses nested if since cond is not a primitive
  { name: "sign", expr: ["fn", ["x"], ["if", ["<", "x", 0], -1, ["if", [">", "x", 0], 1, 0]]] },

  // --- String helpers ---
  { name: "str-empty?", expr: ["fn", ["s"], ["==", ["str-len", "s"], 0]] },
  { name: "bool->str", expr: ["fn", ["b"], ["to-string", "b"]] },
];

export const STD_EXPORT_NAMES: string[] = STD_BINDINGS.map((b) => b.name);
