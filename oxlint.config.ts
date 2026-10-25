import { defineConfig } from "oxlint";

export default defineConfig({
  ignorePatterns: ["**/node_modules/", "dist/"],
  plugins: ["import", "eslint", "promise", "unicorn"],
  categories: { correctness: "error" },
  env: { builtin: true, browser: true, node: true }
});
