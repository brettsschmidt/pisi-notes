import type { Metadata } from "next";
import { UpgradeSection } from "@/components/billing/upgrade-section";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { getEntitlements } from "@/lib/billing/subscription";
import { PRO_PRICE_MONTHLY } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing — pisi-notes",
  description:
    "pisi-notes is free forever for notes, tasks, reminders, the calendar, and the CLI. Pro adds unlimited Ask Pisi AI for $8/month.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "Is the note-taking app really free?",
    a: "Yes — completely. Notes, tasks, reminders, the calendar, search, dark mode, offline/PWA install, and the pisi CLI are all free, forever. Pro only adds unlimited AI.",
  },
  {
    q: "What counts as an Ask Pisi question?",
    a: "Each question you send to the AI. Free accounts get 10 to try it out; Pro accounts are unlimited. Reading past answers never costs anything.",
  },
  {
    q: "Can I cancel any time?",
    a: "Any time, from Settings → Billing. You keep Pro until the end of the period you already paid for — no clawbacks, no hard feelings.",
  },
  {
    q: "What happens to my notes if I downgrade?",
    a: "Nothing at all. Every note is plain Markdown and always yours — the CLI can sync the lot to your own machine. Downgrading only turns off unlimited AI.",
  },
  {
    q: "Monthly or yearly?",
    a: "Whichever suits you — the features are identical. Paying yearly works out 25% cheaper.",
  },
];

function billingNotice(code: string | undefined): string | null {
  switch (code) {
    case "canceled":
      return "Checkout canceled — you haven’t been charged.";
    case "unavailable":
      return "Card payments aren’t enabled on this deployment yet.";
    case "error":
      return "Something went wrong starting checkout. Please try again.";
    default:
      return null;
  }
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const notice = billingNotice(billing);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entitlements = user ? await getEntitlements() : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Pricing
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Free to think. ${PRO_PRICE_MONTHLY} a month to remember.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The whole notebook is free, forever. Pro unlocks an AI that has read
          every note you’ve written — cancel any time, straight from Settings.
        </p>
      </header>

      {notice && (
        <p className="mx-auto mt-8 max-w-md rounded-md border border-border bg-secondary/50 p-3 text-center text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <div className="mt-14">
        <UpgradeSection
          signedIn={!!user}
          currentPlan={entitlements?.plan ?? "free"}
          isPro={entitlements?.isPro ?? false}
          stripeConfigured={isStripeConfigured()}
        />
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secure payments by Stripe · Prices in USD
        </p>
      </div>

      <section className="mx-auto mt-24 max-w-2xl">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Questions, answered
        </h2>
        <dl className="mt-8 flex flex-col gap-4">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-border bg-card p-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
