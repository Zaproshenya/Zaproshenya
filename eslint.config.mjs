import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

const eslintConfig = defineConfig([
  nextVitals,
  nextTs,
  globalIgnores(["**/.next/**"]),
]);

export default eslintConfig;

