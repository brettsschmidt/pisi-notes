import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextWebVitals = require("eslint-config-next/core-web-vitals");
const nextTs = require("eslint-config-next/typescript");

const config = [
  ...nextWebVitals,
  ...nextTs,
  {
    ignores: [".next/**", "dist/**", "node_modules/**", "public/**", ".claude/**"],
  },
  {
    // Playwright fixtures expose a `use()` callback that ESLint's react-hooks
    // plugin mistakes for the React `use` hook. These files never run React.
    files: ["e2e/**"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
];

export default config;
