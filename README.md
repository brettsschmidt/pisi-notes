# Quiet Upsell

Rotating image links for email. Create a link, load it with a set of images, and put its URL in an email's `<img src>`. Every time someone opens the email, the URL serves the next image — in order (1, 2, 3, back to 1) or at random.

Built from the pisi-notes codebase: same stack, auth, Stripe billing, and Cloudflare deploy, with the notes app removed.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind v4 + shadcn/ui
- Supabase (`@supabase/ssr`): Postgres in its own `minmi` schema, Auth, Storage
- Stripe for the Pro plan (optional)
- Cloudflare Workers via OpenNext

## How rotation works

```
email client ──GET /i/<slug>──▶ app/i/[slug]/route.ts
                                   │ rpc minmi.next_rotator_image(slug)
                                   │   bumps open_count (row lock → no races)
                                   │   picks image #(open_count-1) mod n, or random
                                   ▼
                    fetch image (Storage public URL or external https URL)
                                   │
                    stream bytes back with Cache-Control: no-store
```

- The route **proxies the bytes** rather than redirecting, so the URL itself is the image and no-cache headers apply to it.
- `/i/<slug>.png` (or `.jpg`, `.gif`, `.webp`) also works, for email tools that insist on an extension.
- An unknown, paused, or empty link — or an image that fails to load — serves a 1×1 transparent GIF, never a broken-image icon.
- `HEAD` requests don't count as opens.
- Caveat: Apple Mail Privacy Protection fetches images once at delivery and caches them, so those readers keep the first image. Gmail, Outlook, and most other clients honor the no-cache headers.

## Plans

Defined in [`lib/billing/plans.ts`](lib/billing/plans.ts) and enforced in [`lib/actions/rotators.ts`](lib/actions/rotators.ts):

| | Free | Pro ($8/mo, $72/yr) |
|---|---|---|
| Image links | 2 | Unlimited |
| Images per link | 5 | 50 |

## Setup

```bash
nvm use            # Node 22
npm install
cp .env.example .env.local   # fill in Supabase (and optionally Stripe) values
```

Apply the migration (Supabase SQL Editor, or `supabase db push`):

```
supabase/migrations/0001_minmi_init.sql
```

It creates the `minmi` schema, its tables and RLS policies, the `next_rotator_image` function, and the public `minmi-images` storage bucket.

**Then expose the schema:** Supabase dashboard → Project Settings → API → *Exposed schemas* → add `minmi`. Without this, PostgREST returns "schema must be one of …" errors.

Regenerate types once it's live:

```bash
npm run db:types
```

`NEXT_PUBLIC_SITE_URL` is the origin image links are built from, so in production it must be the public URL recipients' mail clients can reach.

## Develop

```bash
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run test:e2e     # authed specs need SUPABASE_SERVICE_ROLE_KEY
```

## Deploy

```bash
npm run deploy       # opennextjs-cloudflare build + deploy (worker: quiet-upsell)
```

Set `SUPABASE_SERVICE_ROLE_KEY` and any Stripe secrets as Cloudflare secrets. Point the Stripe webhook at `<site>/api/billing/webhook`.

## License

MIT. See [LICENSE](./LICENSE).
