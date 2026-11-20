import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Code2,
  ImagePlus,
  Link2,
  ListOrdered,
  Mail,
  PauseCircle,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { LIMITS } from "@/lib/billing/plans";
import { rotatorImageUrl } from "@/lib/rotators/urls";

const FEATURES = [
  {
    icon: Link2,
    title: "One URL, many images",
    body: "Each link is a plain image URL. Put it in any email, and every open asks Quiet Upsell which image to show.",
  },
  {
    icon: ListOrdered,
    title: "In order or random",
    body: "Step through your images 1, 2, 3 and back to 1, or let every open pick at random. Switch any time, even after you send.",
  },
  {
    icon: ImagePlus,
    title: "Upload or link",
    body: "Drop in PNG, JPEG, GIF, or WebP files, or point at images you already host. Reorder with a click.",
  },
  {
    icon: Code2,
    title: "Works in your email tool",
    body: "Paste the URL into Mailchimp, Klaviyo, Gmail, Outlook, or anything that accepts an image link. There's a ready-made HTML snippet too.",
  },
  {
    icon: BarChart3,
    title: "See what got shown",
    body: "Open counts for every link and a shown-count for every image, so you know what people actually saw.",
  },
  {
    icon: PauseCircle,
    title: "Change it after you hit send",
    body: "Swap images, add new ones, or pause a link. Emails already in inboxes pick up the change on the next open.",
  },
];

const STEPS = [
  {
    n: "1",
    title: "Create a link",
    body: "Name it and choose in-order or random rotation.",
  },
  {
    n: "2",
    title: "Add your images",
    body: "Upload a set of same-sized images: product shots, tips, seasonal banners, anything.",
  },
  {
    n: "3",
    title: "Paste it in your email",
    body: "Use the URL as the image source. Each open shows the next one.",
  },
];

// Stand-ins for a user's images in the demo: gradient "photos" with a caption.
const DEMO_IMAGES = [
  { caption: "Tip #1", from: "oklch(0.7 0.16 235)", to: "oklch(0.5 0.2 265)" },
  { caption: "Tip #2", from: "oklch(0.78 0.14 75)", to: "oklch(0.65 0.18 35)" },
  { caption: "Tip #3", from: "oklch(0.7 0.15 320)", to: "oklch(0.55 0.16 280)" },
];

export function Landing() {
  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 -z-10 h-[480px]"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 0%, oklch(0.6 0.19 255 / 0.24), transparent 72%)",
          }}
        />
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Mail className="h-3.5 w-3.5" />
              For newsletters, drip campaigns, and signatures
            </span>
            <h1 className="text-4xl font-bold leading-[1.07] tracking-tight sm:text-5xl">
              One image link.
              <br />
              A new picture{" "}
              <span className="bg-gradient-to-r from-primary to-[oklch(0.55_0.16_225)] dark:to-[oklch(0.78_0.13_215)] bg-clip-text text-transparent">
                every open.
              </span>
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              Quiet Upsell gives you an image URL to put in any email. Load it with a set of
              images, and each time someone opens the email it shows the next one.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 text-sm">
                <Link href="/signup">
                  Make your first link, free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm">
                <Link href="#how-it-works">How it works</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {LIMITS.free.rotators} links free · No credit card · Works with any email tool
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <OpenDemo />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-border bg-secondary/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="How it works"
            title="Set it up in about a minute"
            subtitle="No code and no plugins. If your email tool can show an image from a URL, it works with Quiet Upsell."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative flex flex-col gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-9 top-4 hidden h-px w-[calc(100%-1.5rem)] bg-border md:block"
                  />
                )}
                <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              What goes in your email
            </p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed">
              <code>{`<img src="${rotatorImageUrl("k7Qm2xPa9TbR")}" width="600" alt="This week's tip" />`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ Features */}
      <section id="features" className="scroll-mt-20 border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="Features"
            title="Keep a sent email fresh"
            subtitle="Show a different product, tip, or offer on each open, and change the lineup without resending."
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-muted-foreground">
            Some mail apps fetch images once and keep them (Apple Mail Privacy Protection loads them
            when the email arrives). Those readers keep seeing the image they first got. Gmail,
            Outlook, and most other clients ask for a fresh one on each open.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------------------- Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-border bg-secondary/20">
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="Pricing"
            title="Start free. Upgrade when you send more."
            subtitle="The free plan covers a couple of campaigns. Pro removes the link limit."
          />
          <div className="mt-14">
            <PricingCards
              actions={{
                free: (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/signup">Start free</Link>
                  </Button>
                ),
                pro: (
                  <Button asChild className="w-full">
                    <Link href="/signup">Get started</Link>
                  </Button>
                ),
              }}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- Final CTA */}
      <section className="border-t border-border">
        <div className="relative mx-auto w-full max-w-6xl overflow-hidden px-4 py-24 text-center sm:px-6">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(50% 80% at 50% 100%, oklch(0.6 0.19 255 / 0.22), transparent 75%)",
            }}
          />
          <BrandMark className="mx-auto mb-6 h-14 w-14" />
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Give your next email something new to show.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Make a rotating image link, drop in a few pictures, and paste it into your next send.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6 text-sm">
              <Link href="/signup">
                Make your first link, free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6 text-sm">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-3 text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/** Three opens of the same email, each showing a different image from one URL. */
function OpenDemo() {
  return (
    <div className="relative flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-2 self-center rounded-full border border-border bg-card px-3 py-1 font-mono text-xs text-muted-foreground shadow-sm">
        <Link2 className="h-3.5 w-3.5 text-primary" /> /i/k7Qm2xPa9TbR
      </div>
      <div className="grid grid-cols-3 gap-3">
        {DEMO_IMAGES.map((img, i) => (
          <div key={img.caption} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center gap-1 border-b border-border px-2 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              <span className="ml-auto text-[10px] font-medium text-muted-foreground">Open {i + 1}</span>
            </div>
            <div className="flex flex-col gap-1.5 p-2">
              <span className="h-1.5 w-3/4 rounded bg-muted" />
              <div
                className="flex aspect-[4/3] items-end rounded-md p-1.5"
                style={{ background: `linear-gradient(135deg, ${img.from}, ${img.to})` }}
              >
                <span className="rounded bg-white/85 px-1 text-[10px] font-semibold text-black">
                  {img.caption}
                </span>
              </div>
              <span className="h-1.5 w-full rounded bg-muted" />
              <span className="h-1.5 w-2/3 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Shuffle className="h-3.5 w-3.5" /> Same email, same link, a different image each time
      </p>
    </div>
  );
}
