import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextWebVitals = require("eslint-config-next/core-web-vitals");
const nextTs = require("eslint-config-next/typescript");

export default [
  ...nextWebVitals,
  ...nextTs,
  {
    ignores: [".next/**", "dist/**", "node_modules/**", "public/**"],
  },
];
