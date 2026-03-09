import { describe, it, expect } from "bun:test";
import { typecheck, typecheckModule, EMPTY_TYPE_ENV } from "./typecheck.ts";
import type { MType } from "./typecheck.ts";
import type { Expr } from "./types.ts";

// --- Helpers ---

function ok(type: MType) {
  return expect.objectContaining({ ok: true, type });
}

function err(code: string) {
  return expect.objectContaining({
    ok: false,
    errors: expect.arrayContaining([expect.objectContaining({ code })]),
  });
}

const UNKNOWN: MType = { kind: "unknown" };
const NULL_T: MType = { kind: "null" };
const BOOL: MType = { kind: "bool" };
const INT: MType = { kind: "int" };
const FLOAT: MType = { kind: "float" };
const STRING: MType = { kind: "string" };

// --- Atoms ---

describe("atoms", () => {
  it("null → null", () => {
    expect(typecheck(null)).toEqual(ok(NULL_T));
  });

  it("true → bool", () => {
    expect(typecheck(true)).toEqual(ok(BOOL));
  });

  it("false → bool", () => {
    expect(typecheck(false)).toEqual(ok(BOOL));
  });

  it("integer → int", () => {
    expect(typecheck(42)).toEqual(ok(INT));
    expect(typecheck(0)).toEqual(ok(INT));
    expect(typecheck(-7)).toEqual(ok(INT));
  });

  it("float → float", () => {
    expect(typecheck(3.14)).toEqual(ok(FLOAT));
    expect(typecheck(-0.5)).toEqual(ok(FLOAT));
  });

  it("known variable → its type", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: INT });
    expect(typecheck("x", env)).toEqual(ok(INT));
  });

  it("unknown variable → error + unknown type", () => {
    const result = typecheck("missing");
    expect(result).toEqual(err("UNDEFINED_VAR"));
  });
});

// --- Arithmetic ---

describe("arithmetic", () => {
  it("int + int → int", () => {
    expect(typecheck(["+", 1, 2])).toEqual(ok(INT));
  });

  it("float + float → float", () => {
    expect(typecheck(["+", 1.5, 2.5])).toEqual(ok(FLOAT));
  });

  it("int + float → float", () => {
    expect(typecheck(["+", 1, 2.5])).toEqual(ok(FLOAT));
  });

  it("float + int → float", () => {
    expect(typecheck(["+", 1.5, 2])).toEqual(ok(FLOAT));
  });

  it("unknown + anything → unknown (no error)", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: UNKNOWN });
    expect(typecheck(["+", "x", 1], env)).toEqual(ok(UNKNOWN));
    expect(typecheck(["+", 1, "x"], env)).toEqual(ok(UNKNOWN));
    expect(typecheck(["+", "x", "x"], env)).toEqual(ok(UNKNOWN));
  });

  it("string in arithmetic → TYPE_MISMATCH", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    expect(typecheck(["+", "s", 1], env)).toEqual(err("TYPE_MISMATCH"));
  });

  it("string right operand → TYPE_MISMATCH", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    expect(typecheck(["+", 1, "s"], env)).toEqual(err("TYPE_MISMATCH"));
  });

  it("both string operands → two TYPE_MISMATCH errors", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    const result = typecheck(["+", "s", "s"], env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("subtraction", () => {
    expect(typecheck(["-", 10, 3])).toEqual(ok(INT));
    // Note: 10.0 === 10 in JS, Number.isInteger(10.0) is true, so it's int
    expect(typecheck(["-", 10.0, 3])).toEqual(ok(INT));
  });

  it("multiplication", () => {
    expect(typecheck(["*", 4, 5])).toEqual(ok(INT));
  });

  it("division", () => {
    expect(typecheck(["/", 10, 2])).toEqual(ok(INT));
    // 10.0 is integer in JS; use 10.5 for a true float
    expect(typecheck(["/", 10.5, 2])).toEqual(ok(FLOAT));
  });

  it("modulo", () => {
    expect(typecheck(["%", 10, 3])).toEqual(ok(INT));
  });

  it("arity error", () => {
    expect(typecheck(["+", 1])).toEqual(err("ARITY_ERROR"));
    expect(typecheck(["+", 1, 2, 3])).toEqual(err("ARITY_ERROR"));
  });
});

// --- Comparison ---

describe("comparison", () => {
  it("== accepts any types → bool", () => {
    expect(typecheck(["==", 1, 2])).toEqual(ok(BOOL));
    expect(typecheck(["==", true, false])).toEqual(ok(BOOL));
  });

  it("!= accepts any types → bool", () => {
    expect(typecheck(["!=", 1, 2])).toEqual(ok(BOOL));
  });

  it("< with ints → bool", () => {
    expect(typecheck(["<", 1, 2])).toEqual(ok(BOOL));
  });

  it("< with unknown → bool (no error)", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: UNKNOWN });
    expect(typecheck(["<", "x", 1], env)).toEqual(ok(BOOL));
  });

  it("< with string → TYPE_MISMATCH", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    expect(typecheck(["<", "s", 1], env)).toEqual(err("TYPE_MISMATCH"));
  });
});

// --- Logic ---

describe("logic", () => {
  it("and bool bool → bool", () => {
    expect(typecheck(["and", true, false])).toEqual(ok(BOOL));
  });

  it("or bool bool → bool", () => {
    expect(typecheck(["or", true, false])).toEqual(ok(BOOL));
  });

  it("not bool → bool", () => {
    expect(typecheck(["not", true])).toEqual(ok(BOOL));
  });

  it("and with unknown → bool (no error)", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: UNKNOWN });
    expect(typecheck(["and", "x", true], env)).toEqual(ok(BOOL));
  });

  it("and with int → TYPE_MISMATCH", () => {
    expect(typecheck(["and", 1, true])).toEqual(err("TYPE_MISMATCH"));
  });

  it("not with int → TYPE_MISMATCH", () => {
    expect(typecheck(["not", 42])).toEqual(err("TYPE_MISMATCH"));
  });
});

// --- Control flow ---

describe("if", () => {
  it("if with bool cond, same branch types → branch type", () => {
    expect(typecheck(["if", true, 1, 2])).toEqual(ok(INT));
  });

  it("if with bool cond, different branch types → union", () => {
    const result = typecheck(["if", true, 1, 1.5]);
    expect(result).toEqual(ok({ kind: "union", types: [INT, FLOAT] }));
  });

  it("if with unknown cond → no error", () => {
    const env = EMPTY_TYPE_ENV.extend({ c: UNKNOWN });
    expect(typecheck(["if", "c", 1, 2], env)).toEqual(ok(INT));
  });

  it("if with non-bool cond → TYPE_MISMATCH", () => {
    expect(typecheck(["if", 1, 2, 3])).toEqual(err("TYPE_MISMATCH"));
  });

  it("if arity error", () => {
    expect(typecheck(["if", true, 1])).toEqual(err("ARITY_ERROR"));
  });
});

describe("do", () => {
  it("do returns type of last expr", () => {
    expect(typecheck(["do", 1, true, 3.14])).toEqual(ok(FLOAT));
  });

  it("do arity error", () => {
    expect(typecheck(["do"])).toEqual(err("ARITY_ERROR"));
  });
});

// --- let ---

describe("let", () => {
  it("let binding type propagates to body", () => {
    expect(typecheck(["let", [["x", 42]], "x"])).toEqual(ok(INT));
  });

  it("let with float binding", () => {
    expect(typecheck(["let", [["x", 3.14]], "x"])).toEqual(ok(FLOAT));
  });

  it("let binding used in arithmetic", () => {
    expect(
      typecheck([
        "let",
        [
          ["x", 1],
          ["y", 2],
        ],
        ["+", "x", "y"],
      ]),
    ).toEqual(ok(INT));
  });

  it("let with string binding in arithmetic → TYPE_MISMATCH", () => {
    // "hello" as a Marinada expr is a var lookup, not a string literal.
    // To bind a variable to string type, put a string-typed var in env.
    // Use a let that binds from an env var of string type.
    const env = EMPTY_TYPE_ENV.extend({ strVal: STRING });
    expect(typecheck(["let", [["s", "strVal"]], ["+", "s", 1]], env)).toEqual(err("TYPE_MISMATCH"));
  });

  it("let sequential binding (second can use first)", () => {
    // Second binding references first
    expect(
      typecheck([
        "let",
        [
          ["x", 1],
          ["y", ["+", "x", 1]],
        ],
        "y",
      ]),
    ).toEqual(ok(INT));
  });
});

// --- letrec ---

describe("letrec", () => {
  it("letrec bindings are unknown initially (recursive refs ok)", () => {
    // Self-recursive fn — f is unknown during its own check.
    // Use ["call", "f", "x"] not ["f", "x"] — bare lowercase string is var, not a call.
    const result = typecheck(["letrec", [["f", ["fn", ["x"], ["call", "f", "x"]]]], "f"]);
    // Should not error (unknown propagates through recursive calls)
    expect(result.ok).toBe(true);
  });
});

// --- fn and call ---

describe("fn", () => {
  it("fn with unannotated params has unknown param types", () => {
    const result = typecheck(["fn", ["x"], "x"]);
    expect(result).toEqual(
      ok({
        kind: "fn",
        params: [UNKNOWN],
        ret: UNKNOWN,
      }),
    );
  });

  it("fn with annotated params infers return type", () => {
    const result = typecheck(["fn", [["x", "int"]], ["+", "x", 1]]);
    expect(result).toEqual(
      ok({
        kind: "fn",
        params: [INT],
        ret: INT,
      }),
    );
  });

  it("fn body type errors are reported", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    // fn with int param but body adds string
    const result = typecheck(["fn", [["x", "int"]], ["+", "x", "s"]], env);
    expect(result).toEqual(err("TYPE_MISMATCH"));
  });
});

describe("call", () => {
  it("call known fn → return type", () => {
    // fn(int) -> int called with int
    const env = EMPTY_TYPE_ENV.extend({
      f: { kind: "fn", params: [INT], ret: INT } as MType,
    });
    expect(typecheck(["call", "f", 1], env)).toEqual(ok(INT));
  });

  it("call unknown fn → unknown", () => {
    const env = EMPTY_TYPE_ENV.extend({ f: UNKNOWN });
    expect(typecheck(["call", "f", 1], env)).toEqual(ok(UNKNOWN));
  });

  it("call with wrong arity → ARITY_ERROR", () => {
    const env = EMPTY_TYPE_ENV.extend({
      f: { kind: "fn", params: [INT], ret: INT } as MType,
    });
    expect(typecheck(["call", "f", 1, 2], env)).toEqual(err("ARITY_ERROR"));
  });

  it("call with wrong arg type → TYPE_MISMATCH", () => {
    const env = EMPTY_TYPE_ENV.extend({
      f: { kind: "fn", params: [INT], ret: INT } as MType,
      s: STRING,
    });
    expect(typecheck(["call", "f", "s"], env)).toEqual(err("TYPE_MISMATCH"));
  });

  it("call inline fn literal", () => {
    // ["call", ["fn", ["x"], ["+", "x", 1]], 5]
    const result = typecheck(["call", ["fn", ["x"], ["+", "x", 1]], 5]);
    // x is unknown, so +unknown,int = unknown, so ret=unknown
    expect(result).toEqual(ok(UNKNOWN));
  });
});

// --- unknown passes through ---

describe("unknown propagation", () => {
  it("unknown in any position suppresses type errors, returns unknown", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: UNKNOWN });
    // unknown + unknown
    expect(typecheck(["+", "x", "x"], env)).toEqual(ok(UNKNOWN));
    // unknown and unknown (logic)
    expect(typecheck(["and", "x", "x"], env)).toEqual(ok(BOOL));
  });

  it("unknown variable in if condition is ok", () => {
    const env = EMPTY_TYPE_ENV.extend({ c: UNKNOWN });
    expect(typecheck(["if", "c", 1, 2], env)).toEqual(ok(INT));
  });

  it("unknown in comparison is ok", () => {
    const env = EMPTY_TYPE_ENV.extend({ x: UNKNOWN });
    expect(typecheck(["<", "x", 1], env)).toEqual(ok(BOOL));
    expect(typecheck(["==", "x", "x"], env)).toEqual(ok(BOOL));
  });
});

// --- untyped ---

describe("untyped", () => {
  it("untyped returns unknown without checking inner", () => {
    // Inner expr would be a type error if checked (undefined var)
    expect(typecheck(["untyped", ["+", "undefined_var", "also_undefined"]])).toEqual(ok(UNKNOWN));
  });

  it("untyped with wrong arg count → ARITY_ERROR", () => {
    expect(typecheck(["untyped"])).toEqual(err("ARITY_ERROR"));
  });
});

// --- Collections ---

describe("collections", () => {
  it("map fn array<T> → array<ret>", () => {
    // map with typed fn: fn(int) -> bool
    const env = EMPTY_TYPE_ENV.extend({
      f: { kind: "fn", params: [INT], ret: BOOL } as MType,
      arr: { kind: "array", elem: INT } as MType,
    });
    expect(typecheck(["map", "f", "arr"], env)).toEqual(ok({ kind: "array", elem: BOOL }));
  });

  it("map with unknown fn → array<unknown>", () => {
    const env = EMPTY_TYPE_ENV.extend({
      f: UNKNOWN,
      arr: { kind: "array", elem: INT } as MType,
    });
    expect(typecheck(["map", "f", "arr"], env)).toEqual(ok({ kind: "array", elem: UNKNOWN }));
  });

  it("map with non-array → TYPE_MISMATCH", () => {
    const env = EMPTY_TYPE_ENV.extend({ f: UNKNOWN, x: INT });
    expect(typecheck(["map", "f", "x"], env)).toEqual(err("TYPE_MISMATCH"));
  });

  it("filter preserves element type", () => {
    const env = EMPTY_TYPE_ENV.extend({
      pred: { kind: "fn", params: [INT], ret: BOOL } as MType,
      arr: { kind: "array", elem: INT } as MType,
    });
    expect(typecheck(["filter", "pred", "arr"], env)).toEqual(ok({ kind: "array", elem: INT }));
  });

  it("reduce returns type of init", () => {
    const env = EMPTY_TYPE_ENV.extend({
      f: UNKNOWN,
      arr: { kind: "array", elem: INT } as MType,
    });
    expect(typecheck(["reduce", "f", 0, "arr"], env)).toEqual(ok(INT));
  });

  it("count array → int", () => {
    const env = EMPTY_TYPE_ENV.extend({ arr: { kind: "array", elem: INT } as MType });
    expect(typecheck(["count", "arr"], env)).toEqual(ok(INT));
  });

  it("count non-array → TYPE_MISMATCH", () => {
    expect(typecheck(["count", 1])).toEqual(err("TYPE_MISMATCH"));
  });

  it("merge two records → record", () => {
    const r1: MType = { kind: "record", fields: new Map([["a", INT]]) };
    const r2: MType = { kind: "record", fields: new Map([["b", STRING]]) };
    const env = EMPTY_TYPE_ENV.extend({ r1, r2 });
    const result = typecheck(["merge", "r1", "r2"], env);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.type.kind).toBe("record");
    }
  });

  it("merge with non-record → TYPE_MISMATCH", () => {
    expect(typecheck(["merge", 1, 2])).toEqual(err("TYPE_MISMATCH"));
  });

  it("keys record → array<string>", () => {
    const env = EMPTY_TYPE_ENV.extend({
      r: { kind: "record", fields: new Map() } as MType,
    });
    expect(typecheck(["keys", "r"], env)).toEqual(ok({ kind: "array", elem: STRING }));
  });

  it("vals record → array<unknown>", () => {
    const env = EMPTY_TYPE_ENV.extend({
      r: { kind: "record", fields: new Map() } as MType,
    });
    expect(typecheck(["vals", "r"], env)).toEqual(ok({ kind: "array", elem: UNKNOWN }));
  });
});

// --- String ops ---

describe("string ops", () => {
  it("concat strings → string", () => {
    const env = EMPTY_TYPE_ENV.extend({ a: STRING, b: STRING });
    expect(typecheck(["concat", "a", "b"], env)).toEqual(ok(STRING));
  });

  it("concat non-string → TYPE_MISMATCH", () => {
    expect(typecheck(["concat", 1, 2])).toEqual(err("TYPE_MISMATCH"));
  });

  it("slice string int int → string", () => {
    expect(typecheck(["slice", "hello", 0, 3])).toEqual(err("UNDEFINED_VAR")); // "hello" is a var
    // Use literal expr approach — string atom in data position is var lookup
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    expect(typecheck(["slice", "s", 0, 3], env)).toEqual(ok(STRING));
  });

  it("to-string any → string", () => {
    expect(typecheck(["to-string", 42])).toEqual(ok(STRING));
    expect(typecheck(["to-string", true])).toEqual(ok(STRING));
  });

  it("parse-number string → int | float | null", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    const result = typecheck(["parse-number", "s"], env);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.type.kind).toBe("union");
    }
  });

  it("parse-number non-string → TYPE_MISMATCH", () => {
    expect(typecheck(["parse-number", 42])).toEqual(err("TYPE_MISMATCH"));
  });
});

// --- Error collection (multiple errors) ---

describe("error collection", () => {
  it("collects errors from multiple subexpressions", () => {
    // Both args to + are strings — should get 2 errors
    const env = EMPTY_TYPE_ENV.extend({ a: STRING, b: STRING });
    const result = typecheck(["+", "a", "b"], env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("nested errors all collected", () => {
    // if cond is int (error), then branch has string in arithmetic (error)
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    const result = typecheck(["if", 1, ["+", "s", 1], 2], env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("errors have path information", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    const result = typecheck(["+", "s", 1], env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      // The error should be at path [1] (first operand)
      expect(result.errors[0]?.path).toEqual([1]);
    }
  });

  it("errors have expected/got fields", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    const result = typecheck(["+", "s", 1], env);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const e = result.errors[0];
      expect(e?.expected).toBeDefined();
      expect(e?.got).toBeDefined();
    }
  });
});

// --- type ops ---

describe("type ops", () => {
  it("is T expr → bool", () => {
    expect(typecheck(["is", "int", 42])).toEqual(ok(BOOL));
  });

  it("as T expr → T type", () => {
    expect(typecheck(["as", "int", 42])).toEqual(ok(INT));
    expect(typecheck(["as", "bool", true])).toEqual(ok(BOOL));
    expect(typecheck(["as", "float", 1.5])).toEqual(ok(FLOAT));
  });
});

// --- match ---

describe("match", () => {
  it("match branches union types", () => {
    const env = EMPTY_TYPE_ENV.extend({ v: UNKNOWN });
    // Two branches: one returns int, one returns float → union
    const result = typecheck(["match", "v", [["Circle", "r"], 1], [["Rect", "w", "h"], 1.5]], env);
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should be union of int and float
      expect(result.type.kind).toBe("union");
    }
  });

  it("match single branch returns its type", () => {
    const env = EMPTY_TYPE_ENV.extend({ v: UNKNOWN });
    const result = typecheck(["match", "v", [["Tag"], 42]], env);
    expect(result).toEqual(ok(INT));
  });

  it("match binds pattern variables as unknown in branch body", () => {
    const env = EMPTY_TYPE_ENV.extend({ v: UNKNOWN });
    // Pattern var r used in arithmetic with unknown — should succeed
    const result = typecheck(
      [
        "match",
        "v",
        [
          ["Circle", "r"],
          ["+", "r", 1],
        ],
      ],
      env,
    );
    expect(result).toEqual(ok(UNKNOWN));
  });
});

// --- Module ---

describe("typecheckModule", () => {
  it("typechecks main expression", () => {
    const result = typecheckModule({ main: ["+", 1, 2] });
    expect(result).toEqual(ok(INT));
  });

  it("reports valid arithmetic in main", () => {
    const result = typecheckModule({ main: ["+", 1, 1.5] });
    // 1 + 1.5 is valid: int + float = float
    expect(result).toEqual(ok(FLOAT));
  });

  it("type error in module main", () => {
    // We can't easily inject env into typecheckModule, but undefined var is an error
    const result = typecheckModule({ main: "undefined_var" });
    expect(result).toEqual(err("UNDEFINED_VAR"));
  });
});

// --- Edge cases ---

describe("edge cases", () => {
  it("empty array → UNKNOWN_OP error", () => {
    expect(typecheck([])).toEqual(err("UNKNOWN_OP"));
  });

  it("non-string op → UNKNOWN_OP error", () => {
    expect(typecheck([1, 2, 3] as unknown as Expr)).toEqual(err("UNKNOWN_OP"));
  });

  it("unknown op → UNKNOWN_OP error", () => {
    expect(typecheck(["not-an-op", 1, 2])).toEqual(err("UNKNOWN_OP"));
  });

  it("variant constructor (uppercase) → unknown", () => {
    expect(typecheck(["Circle", 1.5])).toEqual(ok(UNKNOWN));
  });

  it("variant constructor with subexpr errors propagated", () => {
    const env = EMPTY_TYPE_ENV.extend({ s: STRING });
    // Circle with bad arithmetic inside
    const result = typecheck(["Circle", ["+", "s", 1]], env);
    expect(result).toEqual(err("TYPE_MISMATCH"));
  });
});
