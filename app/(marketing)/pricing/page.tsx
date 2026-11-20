import type { Metadata } from "next";
import { UpgradeSection } from "@/components/billing/upgrade-section";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { getEntitlements } from "@/lib/billing/subscription";
import { LIMITS, PRO_PRICE_MONTHLY } from "@/lib/billing/plans";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Pricing · Quiet Upsell",
  description:
    "Quiet Upsell is free for your first rotating image links. Pro adds unlimited links and more images per link for $8/month.",
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "What does the free plan include?",
    a: `${LIMITS.free.rotators} rotating image links with up to ${LIMITS.free.imagesPerRotator} images each, in-order or random rotation, uploads or linked images, and open counts. Free accounts don't expire.`,
  },
  {
    q: "What counts as an open?",
    a: "Each time a mail client loads the image URL. Some clients load images when the email arrives rather than when it's read (Apple Mail Privacy Protection does this), so counts are a close estimate, not an exact number of human views.",
  },
  {
    q: "Will every reader see a different image?",
    a: "In Gmail, Outlook, Yahoo, and most other clients, yes: Quiet Upsell tells them not to cache the image, so each open fetches the next one. Apple Mail with Privacy Protection fetches it once and keeps that copy.",
  },
  {
    q: "What happens to sent emails if I downgrade?",
    a: "Links you've already sent keep working. On the free plan you can't add new links past the free limit, and links over the image limit keep the images they already have.",
  },
  {
    q: "Can I cancel any time?",
    a: "Any time, from Settings. You keep Pro until the end of the period you've already paid for.",
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
          Free to try. ${PRO_PRICE_MONTHLY} a month to scale.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start with {LIMITS.free.rotators} free rotating image links. Pro removes the link
          limit and allows up to {LIMITS.pro.imagesPerRotator} images per link. Cancel any
          time from Settings.
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
