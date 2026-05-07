# pisi-notes

Rich-text note-taking that travels as Markdown. Notes are written in a chat-style timeline with the latest at the bottom, hashtags auto-build categories, and any line written as `do: …` (or `- [ ] …`) becomes a tracked task that you can check off and link back to.

A companion CLI (`pisi`) syncs your notes to a folder of `.md` files.

The web app shares its Supabase project with [Baby-food](https://github.com/brettsschmidt/Baby-food), so existing accounts work here.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind v4 + shadcn/ui (new-york preset)
- Supabase (`@supabase/ssr`)
- Tiptap with `tiptap-markdown`, task list, custom hashtag highlighter, custom `do:` input rule
- CLI: Commander + prompts, bundled with tsup

## Setup

```bash
nvm use            # Node 22
npm install
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#         SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PROJECT_ID
```

Apply the migration to the shared Supabase project (Supabase SQL Editor or `supabase db push`):

```
supabase/migrations/0001_pisi_notes_init.sql
```

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

- `/notes` — timeline (oldest at top, newest at bottom). Composer is sticky at the bottom; **Cmd/Ctrl+Enter** sends.
- Sidebar shows your tags by frequency. Click a tag to filter; click again to remove. Multiple tags AND together.
- The search bar accepts free text and `#tag` tokens.

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
