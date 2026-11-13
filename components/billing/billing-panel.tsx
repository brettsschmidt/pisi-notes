import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openBillingPortal } from "@/lib/actions/billing";
import {
  FREE_AI_CREDITS,
  PRO_PRICE_MONTHLY,
  type Entitlements,
  type Subscription,
} from "@/lib/billing/plans";

interface BillingPanelProps {
  subscription: Subscription;
  entitlements: Entitlements;
  /** Whether Stripe keys are present on this deployment. */
  stripeConfigured: boolean;
}

/** The "Plan & billing" section of the Settings page. */
export function BillingPanel({ subscription, entitlements, stripeConfigured }: BillingPanelProps) {
  const { isPro, aiCreditsUsed } = entitlements;

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium">Plan &amp; billing</h2>
        <span
          className={
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold " +
            (isPro
              ? "bg-primary text-primary-foreground"
              : "border border-border text-muted-foreground")
          }
        >
          {isPro && <Sparkles className="h-3 w-3" />}
          {isPro ? "Pro" : "Free"}
        </span>
      </div>

      {isPro ? (
        <ProDetails subscription={subscription} stripeConfigured={stripeConfigured} />
      ) : (
        <FreeDetails used={aiCreditsUsed} />
      )}
    </section>
  );
}

function ProDetails({
  subscription,
  stripeConfigured,
}: {
  subscription: Subscription;
  stripeConfigured: boolean;
}) {
  const periodEnd = subscription.currentPeriodEnd
    ? format(parseISO(subscription.currentPeriodEnd), "MMMM d, yyyy")
    : null;

  let status: string;
  if (subscription.status === "past_due") {
    status = "Your last payment didn’t go through — update your card to keep Pro.";
  } else if (subscription.cancelAtPeriodEnd && periodEnd) {
    status = `Pro access ends on ${periodEnd}.`;
  } else if (periodEnd) {
    status = `Renews on ${periodEnd}.`;
  } else {
    status = "Your Pro subscription is active.";
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Thanks for going Pro 🖤 — unlimited Ask Pisi is on. {status}
      </p>
      {stripeConfigured ? (
        <form action={openBillingPortal}>
          <Button type="submit" variant="outline" size="sm">
            Manage billing
          </Button>
        </form>
      ) : (
        <p className="text-xs text-muted-foreground">
          Billing management isn’t available on this deployment.
        </p>
      )}
    </div>
  );
}

function FreeDetails({ used }: { used: number }) {
  const remaining = Math.max(0, FREE_AI_CREDITS - used);
  const pct = Math.min(100, Math.round((used / FREE_AI_CREDITS) * 100));

  return (
    <div className="mt-3 flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        You’re on the free plan — the whole notebook, no limits. Pro adds
        unlimited <span className="font-medium text-foreground">Ask Pisi</span>{" "}
        AI for ${PRO_PRICE_MONTHLY}/month.
      </p>

      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">Ask Pisi free trial</span>
          <span className="tabular-nums text-muted-foreground">
            {Math.min(used, FREE_AI_CREDITS)} / {FREE_AI_CREDITS} used
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {remaining > 0
            ? `${remaining} free question${remaining === 1 ? "" : "s"} left.`
            : "You’ve used your free questions — upgrade for unlimited."}
        </p>
      </div>

      <Button asChild size="sm" className="self-start">
        <Link href="/pricing">
          <Sparkles className="h-4 w-4" /> Upgrade to Pro
        </Link>
      </Button>
    </div>
  );
}
