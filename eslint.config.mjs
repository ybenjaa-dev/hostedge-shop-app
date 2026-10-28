import { defineConfig, globalIgnores } from "eslint/config";
import vitals from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";

export default defineConfig([
  ...vitals,
  ...ts,
  globalIgnores([".next/**", ".open-next/**", "node_modules/**", "themes/**", "next-env.d.ts", "src/db/migrations.generated.ts", "worker.ts"]),
  {
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": ["warn", { allowShortCircuit: true, allowTernary: true }],
      // Images are resized on upload and served from R2 (next/image optimisation isn't available on Workers).
      "@next/next/no-img-element": "off",
      // CSV/print routes are downloads, not pages.
      "@next/next/no-html-link-for-pages": "off",
      // React-compiler advisory rules: informational, the patterns flagged here are intentional (hydration-safe reads, timestamps).
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
]);
