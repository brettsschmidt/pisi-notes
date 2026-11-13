# pisi-notes

Rich-text note-taking that travels as Markdown. Notes are written in a chat-style timeline with the latest at the bottom, hashtags auto-build categories, and any line written as `do: …` (or `- [ ] …`) becomes a tracked task that you can check off and link back to. Reminders, a calendar view, web-push notifications, dark mode, a draggable mascot, and a companion CLI round it out.

**Ask Pisi** — an AI that has read your notes — answers questions and cites the notes it used; any note can be published as a read-only public link; a marketing landing page lives at `/`; and a Pro plan unlocks unlimited AI.

A companion CLI (`pisi`) syncs your notes to a folder of `.md` files.

The web app shares its Supabase project with [Baby-food](https://github.com/brettsschmidt/Baby-food) — its own tables live in a dedicated `pisi` Postgres schema so the apps don't collide. Existing accounts work here.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind v4 + shadcn/ui (new-york preset)
- Supabase (`@supabase/ssr`) — tables namespaced under the `pisi` schema
- Tiptap with `tiptap-markdown`, task list, custom hashtag highlighter, custom `do:` / reminder input rules
- `react-day-picker` for the calendar + reminder time picker
- AI: Anthropic SDK (`@anthropic-ai/sdk`) — Ask Pisi, grounded in your notes
- Billing: Stripe Checkout, customer portal, and webhooks
- PWA: web manifest + service worker, Web Push for reminders
- Deployed to Cloudflare Workers via OpenNext
- CLI: Commander + prompts, bundled with tsup

## Setup

```bash
nvm use            # Node 22
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#         SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PROJECT_ID
#         (ANTHROPIC_API_KEY and the STRIPE_* keys are optional — the app
#          runs fine without them; see Ask Pisi and Plans & billing below)
```

Apply the migrations in `supabase/migrations/` in order (Supabase SQL Editor or `supabase db push`). They create the `pisi` schema and its tables — `notes`, `tasks`, `reminders`, `push_subscriptions`, `user_prefs`, `subscriptions` — all with row-level security scoped to the signed-in user.

Then regenerate types:

```bash
npm run db:types
```

## Develop

```bash
npm run dev          # Next.js at http://localhost:3000
npm run lint
npm run typecheck
```

## Notes UX

- `/notes` — timeline (oldest at top, newest at bottom). Composer is sticky at the bottom; **Cmd/Ctrl+Enter** sends. A live word count shows as you write.
- **Drafts never get lost** — the composer mirrors what you're typing to `localStorage` and restores it after a refresh, crash, or accidental tab close.
- Sidebar shows your tags by frequency. Click a tag to filter; click again to remove. Multiple tags AND together.
- The search bar accepts free text and `#tag` tokens; an `×` clears it. Matches are highlighted in the results.
- Every note has a `⋯` menu: **Edit**, **Add reminder**, **Pin to top**, **Archive**, **Delete**.
- Pinned notes lift into an always-visible band above the timeline.
- Archived notes stay in the timeline (flagged + dimmed) but drop out of the tag sidebar, tag filters, and search; archiving also strips the note's tags.
- Links paste in and render as clickable, styled anchors. Pasting newline-separated text into a task list explodes into one task per line.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `/` | Focus search |
| `c` | Jump to the note composer |
| `g` then `n` / `t` / `a` / `s` | Go to Notes / Tasks / Calendar / Settings |
| `?` | Show the shortcuts overlay |
| `Esc` | Close dialogs / blur inputs |

## Reminders

Reminders are a sibling concept to tasks — written as `( ) …` lines and pushed to your phone when due.

```
remind: call the dentist
monday: sprint planning          # next Monday, 9am local
fri: submit timesheet            # 3-letter abbreviations work too
5/25: mom's birthday             # M/D — 9am local, rolls to next year if past
5/25/2027: …                     # explicit year
```

- Day/date shortcuts resolve to a concrete time inline; the editor shows a friendly `⏰` chip.
- The composer's alarm-clock button opens a calendar + time picker for an explicit time.
- `/calendar` — month grid with a dot on every day that has a reminder or due task; click a day to see what's scheduled.
- Settings can surface upcoming reminder dates as a sidebar section; sidebar tags and dates can be hidden (with an `×`) and restored from Settings.

## Settings

`/settings` — toggle the sidebar reminders section and restore any tags / reminder dates you've hidden. Hidden entries also reappear automatically once fresh matching content shows up.

## Install as an app

pisi-notes is a PWA: a web manifest, icons, and a service worker are served, so mobile browsers offer **Add to Home Screen** / **Install**. Reminders fire as native web-push notifications via the service worker.

## Tasks

Anywhere in a note you can write a task three ways. They all save to the same place:

```
do: buy milk
todo: ship the PR
- [ ] write tests
- [x] mark off something already done
```

- Tasks render as highlighted checkbox rows inside the note bubble (the bubble shows a `n/m tasks` badge).
- `/tasks` — dedicated view, with **Open** and **Done** tabs. Each row has a link back to the source note.
- Toggling a checkbox (anywhere) records `completed_at` in the database **and** rewrites the source note's Markdown so `[ ]` ↔ `[x]` stays in sync.
- "Add completion note" on any task opens a normal composer pre-filled with a blockquote referencing the task. The note saves like any other and gets linked from the task.

Internally a stable id is encoded in the Markdown as an HTML comment that is invisible in any standard Markdown viewer:

```
- [x] <!--task:9f3c…--> ship the PR
```

## Ask Pisi (AI)

`/ask` — ask a question in plain English and Pisi answers from your own notes, citing the exact notes each answer drew from. The whole note corpus is sent as a cached prompt prefix, so follow-up questions within a session are cheap.

- Free accounts get 10 questions to try it; Pro is unlimited. Usage is metered atomically by the `pisi.consume_ai_credit()` database function.
- Requires `ANTHROPIC_API_KEY`. Without it, `/ask` shows a friendly "not enabled" state — nothing else breaks.
- The model defaults to `claude-opus-4-7`; override with `ANTHROPIC_MODEL`.

Every note's `⋯` menu also has **Ask Pisi** — one-tap summarize or action-item extraction, and the extracted items can be appended to the note as `do:` tasks. And `/api/ai/digest`, hit weekly by the same cron as the reminder dispatcher, pushes Pro subscribers a short AI digest of the week's notes — the proactive retention loop. It self-throttles to one digest per subscriber per week (`pisi.subscriptions.last_digest_at`).

## Sharing

Every note's `⋯` menu has **Share** — it mints an unguessable token, and the note becomes readable at `/n/<token>` by anyone with the link, no account needed. The public page carries a "start your own" call to action. **Stop sharing** revokes the link. Shared notes are read through a `security definer` function, so the page works for signed-out visitors without exposing anything else in the table.

## Plans & billing

- **Free** — the entire notebook: unlimited notes, tasks, reminders, the calendar, search, the CLI, dark mode, PWA install, public sharing, and 10 Ask Pisi questions.
- **Pro** — $8/month or $72/year — unlimited Ask Pisi.

`/` is a marketing landing page for signed-out visitors, `/pricing` lays out the plans, and **Settings → Plan & billing** shows the current plan and AI usage. Upgrades run through Stripe Checkout (`lib/actions/billing.ts`); the `/api/billing/webhook` route keeps `pisi.subscriptions` in sync. Billing is optional — without the `STRIPE_*` env vars the app runs entirely on the free plan and the upgrade button is disabled.

## CLI: `pisi`

```bash
npm run build:cli                # produces dist/cli/index.js
node dist/cli/index.js --help    # or `npx pisi` once installed

pisi login [email]               # email + 6-digit OTP, session saved to ~/.config/pisi-notes/session.json (0600)
pisi whoami
pisi logout
pisi sync --dir ./my-notes       # writes one .md per note (idempotent)
pisi sync --since 2026-01-01     # only newer notes
```

Each exported file looks like:

```
---
id: 9f3c...
created_at: 2026-05-01T08:11:00Z
updated_at: 2026-05-01T08:14:00Z
tags: ["food", "wins"]
---

lunch was great #food #wins

- [x] <!--task:c11a...--> shipped the PR
```

The CLI uses the same `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars as the web app.

## License

MIT — see [LICENSE](./LICENSE).
