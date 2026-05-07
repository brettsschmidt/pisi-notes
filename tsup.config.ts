import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node22",
  outDir: "dist/cli",
  clean: true,
  platform: "node",
  // Keep all node_modules deps external — Node will resolve them at runtime.
  // Only our own source (lib/, types/) gets bundled.
  external: ["commander", "prompts", "@supabase/supabase-js", "date-fns", "uuid"],
  noExternal: [/^@\/lib\//, /^@\/types\//],
});
