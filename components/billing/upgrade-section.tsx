"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PricingCards, type BillingInterval } from "@/components/marketing/pricing-cards";
import { startCheckout, openBillingPortal } from "@/lib/actions/billing";
import type { PlanId } from "@/lib/billing/plans";

interface UpgradeSectionProps {
  signedIn: boolean;
  currentPlan: PlanId;
  isPro: boolean;
  /** Whether Stripe keys are present on this deployment. */
  stripeConfigured: boolean;
}

/**
 * Billing-aware wrapper around <PricingCards>. The per-plan CTA adapts to
 * whether the visitor is signed in, what they're already on, and whether the
 * deployment has Stripe wired up.
 */
export function UpgradeSection({
  signedIn,
  currentPlan,
  isPro,
  stripeConfigured,
}: UpgradeSectionProps) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  const freeAction = !signedIn ? (
    <Button asChild variant="outline" className="w-full">
      <Link href="/signup">Get started free</Link>
    </Button>
  ) : (
    <Button variant="outline" className="w-full" disabled>
      {isPro ? "Included with Pro" : "Your current plan"}
    </Button>
  );

  let proAction: React.ReactNode;
  if (!signedIn) {
    proAction = (
      <Button asChild className="w-full">
        <Link href="/signup">Get started</Link>
      </Button>
    );
  } else if (isPro) {
    proAction = stripeConfigured ? (
      <form action={openBillingPortal} className="w-full">
        <Button type="submit" variant="outline" className="w-full">
          Manage billing
        </Button>
      </form>
    ) : (
      <Button variant="outline" className="w-full" disabled>
        Your current plan
      </Button>
    );
  } else if (stripeConfigured) {
    proAction = (
      <form action={startCheckout} className="w-full">
        <input type="hidden" name="interval" value={interval} />
        <Button type="submit" className="w-full">
          Upgrade to Pro
        </Button>
      </form>
    );
  } else {
    proAction = (
      <div className="w-full">
        <Button className="w-full" disabled>
          Upgrade to Pro
        </Button>
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Card payments aren’t enabled on this deployment yet.
        </p>
      </div>
    );
  }

  return (
    <PricingCards
      currentPlan={signedIn ? currentPlan : undefined}
      onIntervalChange={setInterval}
      actions={{ free: freeAction, pro: proAction }}
    />
  );
}
