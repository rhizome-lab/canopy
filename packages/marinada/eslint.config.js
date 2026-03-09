import js from "@eslint/js"
import ts from "typescript-eslint"

export default ts.config(
  js.configs.recommended,
  ...ts.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Test files are checked by bun at runtime; exclude from tsc-aware lint
    ignores: ["src/**/*.test.ts"],
  },
)
