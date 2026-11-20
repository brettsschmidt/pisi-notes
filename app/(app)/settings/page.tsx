import type { Metadata } from "next";
import { BillingPanel } from "@/components/billing/billing-panel";
import { SignedInShell } from "@/components/nav/signed-in-shell";
import { entitlementsFor } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { getSubscription } from "@/lib/billing/subscription";
import { countRotators } from "@/lib/queries/rotators";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings · Quiet Upsell" };

function billingBanner(code: string | undefined): string | null {
  switch (code) {
    case "success":
      return "Payment received. Thanks for upgrading! If Pro isn’t showing yet, give it a moment to sync.";
    case "already-pro":
      return "You’re already on the Pro plan.";
    case "unavailable":
      return "Billing management isn’t available on this deployment.";
    case "error":
      return "Something went wrong with billing. Please try again.";
    default:
      return null;
  }
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
  const banner = billingBanner(billing);

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    subscription,
    rotatorCount,
  ] = await Promise.all([supabase.auth.getUser(), getSubscription(), countRotators()]);

  return (
    <SignedInShell>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
        <header>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          {user?.email && (
            <p className="text-sm text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user.email}</span>
            </p>
          )}
        </header>
        {banner && (
          <p className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            {banner}
          </p>
        )}
        <BillingPanel
          subscription={subscription}
          entitlements={entitlementsFor(subscription)}
          stripeConfigured={isStripeConfigured()}
          rotatorCount={rotatorCount}
        />
      </div>
    </SignedInShell>
  );
}
