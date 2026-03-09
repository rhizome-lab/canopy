import type { Module } from "./types.ts";
import { evaluate, EMPTY_ENV } from "./evaluate.ts";
import type { EvalResult, Value } from "./evaluate.ts";
import { typecheckModule } from "./typecheck.ts";
import type { TypecheckResult } from "./typecheck.ts";
import { STD_BINDINGS } from "./std.ts";

export type { EvalResult, TypecheckResult };

/**
 * Evaluate a full module.
 *
 * For `lib:std` imports, each requested binding is evaluated from its STD_BINDINGS
 * expression and added to the environment before evaluating module.main.
 * For other import schemes, they remain stubs (names are not bound).
 *
 * Variant constructors (None, Some, Ok, Err, etc.) are handled automatically by
 * the evaluator's uppercase-tag convention — no env wiring required.
 */
export function evaluateModule(module: Module): EvalResult {
  // Build env with lib:std bindings for any requested imports
  let env = EMPTY_ENV;

  for (const imp of module.imports ?? []) {
    if (imp.from !== "lib:std") continue;

    const bindings: Record<string, Value> = {};
    for (const name of imp.import) {
      const binding = STD_BINDINGS.find((b) => b.name === name);
      if (binding === undefined) continue;
      const result = evaluate(binding.expr, EMPTY_ENV);
      if (!result.ok) return result;
      bindings[name] = result.value;
    }
    env = env.extend(bindings);
  }

  return evaluate(module.main, env);
}

// Re-export typecheckModule so callers can import both from module.ts
export { typecheckModule };
