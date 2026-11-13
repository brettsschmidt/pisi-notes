# Builder — implement one item on its own branch

Read `factory/jobs/_rules.md` first and follow it.

## Steps

1. `run start builder`.
2. `node factory/scripts/factory.mjs claim`
   - `item: null` → nothing to build (the `reason` says why). End the run as
     `noop` with that reason.
   - Otherwise you get the item, its `worktree` (absolute path), its `branch`,
     the `protectedPaths`, and `maxDiffLines`. `claim` has already created the
     branch and worktree from `main` and measured the starting point.
   - `retry: true` means a Reviewer sent it back: read `item.review.notes` and
     address every point. `resumed: true` means an earlier run was interrupted:
     look at `git status` and `git log` in the worktree and continue from there.
3. Work **only inside the worktree**. Read the item's description and
   acceptance criteria, read the surrounding code, and make the smallest change
   that fully satisfies them. Match the existing style and patterns. Add or
   extend an e2e spec when the item is about behavior and a spec is the natural
   place to pin it down; do not try to run Playwright (it needs a live
   Supabase).
   - The worktree is cut from committed `main`. Files that exist only as
     uncommitted work in the main checkout are not there. If the item depends
     on them, do not copy them in — set the item to `needs_human` with a note
     ("depends on uncommitted work in main: <files>") and end the run.
4. Check your work in the worktree: `npm run lint` and `npm run typecheck`.
   You do not have to fix problems that were already there, but you must not
   add any.
5. Commit on the factory branch from inside the worktree. Stage the files you
   changed by name, and write a message that says what changed and why, ending
   with a line `Factory-Item: <item id>`.
6. `node factory/scripts/factory.mjs submit <id> --summary "<what you changed, in one or two sentences>"`
   - Exit code 2 means the gate refused it; `reasons` says why. Fix, commit,
     and submit again — at most three tries.
   - If you cannot get it through, or the item turns out to be wrong,
     impossible, or bigger than described:
     `item set <id> --status needs_human --by builder --note "<what blocked you>"`.
7. `run end` with `--item <id>` and a summary of what was built or what
   blocked it. Leave the worktree in place; the Reviewer needs it.
