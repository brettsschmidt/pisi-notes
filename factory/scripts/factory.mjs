#!/usr/bin/env node
// Command line used by the scheduled Claude jobs (and by you) to drive the
// factory. Every command prints JSON. Run from the main checkout:
//   node factory/scripts/factory.mjs <command>
import fs from "node:fs";
import * as f from "./lib.mjs";

const HELP = `factory <command>

  status                         queue, counts and git state
  run start <job>                begin a run (scout|builder|reviewer|auditor)
  run end <runId> --outcome ok|noop|failed --summary "…" [--item F-001]

  item add --file item.json      or: --title … --description … --acceptance … (repeatable)
                                     --kind feature|fix|chore|test|docs|perf --size S|M|L
                                     --risk low|medium|high --impact … --priority 1-5 [--by scout|human]
  item list [--status ready]
  item show <id>
  item set <id> --status <status> [--note …] [--by builder]

  claim                          builder: take the next item and get its worktree
  submit <id> --summary "…"      builder: run the gate and hand off to review
  next-review                    reviewer: the next change to review
  review <id> --verdict approved|changes_requested|needs_human --notes "…" | --notes-file path
                                 (approved + autoMerge: merges the reviewed commit into the base branch)
  merge <id>                     merge an approved change by hand (same safety checks)

  measure [--label "…"]          snapshot code health of the main checkout
  sync                           detect merged changes, clean up worktrees
  digest --title "…" --file body.md
  event --job <job> --message "…" [--item F-001]
  pause [--reason "…"] | resume
`;

function parse(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    const value = next === undefined || next.startsWith("--") ? true : argv[(i += 1)];
    flags[key] = key in flags ? [].concat(flags[key], value) : value;
  }
  return { positional, flags };
}

const { positional, flags } = parse(process.argv.slice(2));
const [command, a, b] = positional;
const out = (value) => console.log(JSON.stringify(value, null, 2));
const text = (inline, filePath) =>
  typeof filePath === "string" ? fs.readFileSync(filePath, "utf8") : inline === true ? "" : inline;

try {
  switch (command) {
    case "status":
      out(f.summary());
      break;

    case "run":
      if (a === "start") {
        const res = f.runStart(b);
        out(res);
        if (res.paused) process.exitCode = 3;
        if (res.busy) process.exitCode = 4;
      } else if (a === "end") {
        out(f.runEnd(b, { outcome: flags.outcome, summary: flags.summary, itemId: flags.item }));
      } else throw new Error("run start <job> | run end <runId>");
      break;

    case "item":
      if (a === "add") {
        const input =
          typeof flags.file === "string"
            ? JSON.parse(fs.readFileSync(flags.file, "utf8"))
            : flags;
        out(f.addItem(input, flags.by || input.by || "scout"));
      } else if (a === "list") {
        out(
          f.listItems(flags.status).map((i) => ({
            id: i.id,
            status: i.status,
            title: i.title,
            kind: i.kind,
            size: i.size,
            risk: i.risk,
            priority: i.priority,
            branch: i.branch,
          })),
        );
      } else if (a === "show") {
        out(f.getItem(b));
      } else if (a === "set") {
        out(f.setItemStatus(b, flags.status, { by: flags.by || "human", note: text(flags.note) }));
      } else throw new Error("item add|list|show|set");
      break;

    case "claim":
      out(f.claim(flags.by));
      break;

    case "submit": {
      const res = f.submit(a, flags.summary, flags.by);
      out(res);
      if (!res.ok) process.exitCode = 2;
      break;
    }

    case "next-review":
      out(f.nextReview());
      break;

    case "review":
      out(f.review(a, flags.verdict, text(flags.notes, flags["notes-file"]), flags.by));
      break;

    case "merge": {
      const res = f.merge(a, flags.by);
      out(res);
      if (!res.ok) process.exitCode = 2;
      break;
    }

    case "measure":
      out(f.snapshotMain(typeof flags.label === "string" ? flags.label : null, flags.by));
      break;

    case "sync":
      out(f.sync(flags.by));
      break;

    case "digest":
      out(f.addDigest({ title: flags.title, body: text(flags.body, flags.file) }, flags.by));
      break;

    case "event":
      out(f.logEvent({ job: flags.job, type: flags.type, message: flags.message, itemId: flags.item }));
      break;

    case "pause":
      out(f.setPaused(true, typeof flags.reason === "string" ? flags.reason : null, flags.by));
      break;

    case "resume":
      out(f.setPaused(false, null, flags.by));
      break;

    default:
      console.log(HELP);
      if (command && command !== "help") process.exitCode = 1;
  }
} catch (error) {
  console.error(`factory: ${error.message}`);
  process.exitCode = 1;
}
