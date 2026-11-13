# Software factory

Four scheduled Claude jobs that find, build, review, and measure small changes
to this repo, and a local dashboard for watching them. Claude does all of the
thinking; the scripts here only keep the books.

```
Scout ──► backlog ──► Builder ──► gate ──► Code reviewer ──► merge to main ──► Auditor
(ideas)              (branch +            (approve / bounce /   (automatic,       (measure,
                      worktree)            escalate)             re-checked)       digest)
```

## Dashboard

```bash
npm run factory:dashboard
```

Opens on http://localhost:4319 (local only). From there you can see what each
job last did, the pipeline, every change's diff, review and measured effects,
the code-health trend, and the Auditor's digest. You can also add an idea,
approve or reject a proposal, and pause the whole factory.

## The jobs

Each is a scheduled task in the Claude desktop app whose prompt points at a
file in `jobs/`. Edit those files to change behavior; `jobs/_rules.md` applies
to all four.

| Job | Does | Writes code? |
|---|---|---|
| Scout | Reads the product, adds up to 3 well-scoped items | No |
| Builder | Takes one item, implements it in `.claude/worktrees/factory-<id>` on `factory/<id>-…`, passes the gate | Only in its worktree |
| Code reviewer | Reads the diff cold: approve (which merges it), send back, or escalate | No |
| Auditor | Accounts for merges, snapshots code health, writes the digest | No |

Scheduled tasks run while the Claude desktop app is open; a run that was due
while it was closed starts on next launch.

## What you do

- **Watch what lands.** An approved change is merged into `main` in your
  checkout straight away (never pushed). Each shipped change's page on the
  dashboard has its diff, review, measured effects, and a copyable
  `git revert` command to undo it.
- **Approve or reject** proposals. Low-risk small items skip this; anything the
  Scout rates medium/high risk or large waits for you.
- **Unstick** items marked "Needs you".

## Guardrails

- The factory never pushes, deploys, or touches a database. Product code is
  written only inside its own worktrees, and reaches `main` only through the
  reviewed merge below.
- **Merge** (`autoMerge` in the config): only the exact commit the reviewer
  approved is merged, with `--no-ff`. It is refused — and the item handed to
  you — if your checkout is not on `main`, git cannot merge cleanly (conflicts,
  or it would overwrite your uncommitted edits), or the branch moved after
  review. After merging, `main` is re-measured; if lint or type errors got
  worse the merge is reverted with a revert commit. Set `autoMerge` to `false`
  to go back to merging by hand.
- The gate (`factory.mjs submit`) refuses a change that is uncommitted, touches
  a protected path, exceeds the diff budget, or adds lint or type errors
  relative to the commit it started from.
- At most `maxOpenChanges` changes can sit unmerged at once; the Builder stops
  starting new work until they clear.
- An item that fails review `maxAttempts` times goes to you instead of looping.
- **Pause** on the dashboard (or `npm run factory -- pause`) makes every job
  exit immediately at its next run.

Limits, protected paths, and the product focus the Scout steers by are in
`factory.config.json`.

## Good to know

- Worktrees are cut from **committed** `main`. Work that exists only as
  uncommitted changes in your checkout is invisible to the factory.
- The gate checks lint and types. It does not run the Playwright suite (that
  needs a live Supabase); add commands to `extraChecks` in the config to make
  the gate run more.
- State lives in `factory/state/` (gitignored): `items.json`, `events.jsonl`,
  `runs.jsonl`, `metrics.jsonl`, `digests.jsonl`, `control.json`.
- `npm run factory -- help` lists every command the jobs use.
