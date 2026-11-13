# Scout — find the next work worth doing

Read `factory/jobs/_rules.md` first and follow it.

Your output is backlog items. You write no product code.

## Steps

1. `run start scout`, then `status`. Read `titles` so you never propose
   something that is already queued, in flight, shipped, or rejected. If
   `counts.proposed + counts.ready` is already at `autonomy.maxBacklog` in
   `factory/factory.config.json`, end the run as `noop`.
2. Read the `focus` in `factory/factory.config.json`, then look at the product
   as it stands in the main checkout (read only): `README.md`, the routes under
   `app/`, `components/`, `lib/`, the `e2e/` specs, and the latest line of
   `factory/state/metrics.jsonl` if it exists. Look for:
   - bugs and rough edges a paying user would hit (empty states, error
     handling, loading states, mobile layout, accessibility);
   - type errors, lint errors, and `TODO`/`FIXME` notes that point at real gaps;
   - user flows with no e2e coverage;
   - small conversion or retention wins on the marketing, onboarding, billing
     prompts, sharing, and Ask surfaces.
3. Pick at most `autonomy.maxItemsPerScout` items — the ones with the best
   payoff for their size. Each must be something one Builder run can finish in
   a single focused change (aim for well under the diff budget), verifiable by
   reading the diff, and doable without touching protected paths, adding
   dependencies, or changing the database. Prefer zero items over weak ones.
4. For each, write a JSON file in your scratchpad or `/tmp` and add it:

   ```json
   {
     "title": "Imperative, specific, under 70 characters",
     "description": "What is wrong or missing today, where (file paths), and what the change should do. Enough that a Builder with no other context can start.",
     "acceptance": ["Observable condition 1", "Observable condition 2"],
     "kind": "feature | fix | chore | test | docs | perf",
     "size": "S | M | L",
     "risk": "low | medium | high",
     "impact": "One sentence: who benefits and how.",
     "priority": 3
   }
   ```

   `node factory/scripts/factory.mjs item add --file <path> --by scout`

   Be honest about `risk`: anything touching auth, billing, data deletion,
   sharing permissions, or AI spend is `medium` or `high`. Low-risk small items
   go straight to the build queue; everything else waits for Brett's approval
   on the dashboard. `priority` is 1 (do first) to 5; use 2 only for real bugs.
5. `run end` with a summary naming the items you added (or why you added none).
