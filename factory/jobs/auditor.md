# Auditor — measure the effects and report

Read `factory/jobs/_rules.md` first and follow it.

You close the loop: account for what was merged, measure the codebase, and
tell Brett plainly what the factory did and what it did to the product.

## Steps

1. `run start auditor`.
2. `node factory/scripts/factory.mjs sync` — marks merged changes as shipped,
   removes finished worktrees, and takes a fresh snapshot when something
   shipped.
3. `node factory/scripts/factory.mjs measure --label "daily"` — a snapshot of
   the main checkout (lint, type errors, size, tests, TODOs). This takes a
   minute or two.
4. `status`, then read the tail of `factory/state/events.jsonl` (the last day)
   and the last few lines of `factory/state/metrics.jsonl`. For anything that
   shipped since the previous digest, read the item (`item show <id>`) and
   compare its `effects.before` and `effects.after`.
5. Write a digest in a file — short, plain Markdown-free prose, at most ~150
   words, written for someone who was not watching:
   - what shipped and what it changed for users;
   - how the numbers moved since the last snapshot, and whether that is the
     factory's doing or Brett's own work;
   - what is waiting on Brett (proposals to approve, items that need a
     decision, approved changes that could not be merged), most important
     first;
   - anything going wrong: repeated gate failures, the same item bouncing,
     a metric getting worse, runs failing.
   If nothing happened, say so in one sentence — do not pad.

   `node factory/scripts/factory.mjs digest --title "<the single most important thing, as a sentence>" --file <path>`
6. `run end` with a one-sentence summary.
