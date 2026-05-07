#!/usr/bin/env node
import { Command } from "commander";
import { login, logout, whoami } from "./auth.js";
import { sync } from "./sync.js";

const program = new Command();

program
  .name("pisi")
  .description("CLI companion for pisi-notes — sync notes to local Markdown files.")
  .version("0.1.0");

program
  .command("login")
  .description("Sign in via email + 6-digit OTP. Saves a session in ~/.config/pisi-notes/session.json.")
  .argument("[email]", "email address")
  .action(async (email?: string) => {
    try {
      await login(email);
    } catch (e) {
      fail(e);
    }
  });

program
  .command("logout")
  .description("Forget the local session.")
  .action(async () => {
    try {
      await logout();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("whoami")
  .description("Show the email of the current session.")
  .action(async () => {
    try {
      await whoami();
    } catch (e) {
      fail(e);
    }
  });

program
  .command("sync")
  .description("Pull all notes and write them as .md files in the target directory.")
  .option("-d, --dir <path>", "target directory", "./notes")
  .option("--since <iso>", "only fetch notes updated at or after this ISO timestamp")
  .action(async (options: { dir: string; since?: string }) => {
    try {
      const result = await sync(options);
      console.log(`wrote ${result.wrote}, skipped ${result.skipped}, total ${result.total}`);
    } catch (e) {
      fail(e);
    }
  });

program.parseAsync().catch((e) => fail(e));

function fail(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`pisi: ${msg}`);
  process.exit(1);
}
