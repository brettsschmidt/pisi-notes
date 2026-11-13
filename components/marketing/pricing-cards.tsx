"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLAN_LIST,
  effectiveMonthly,
  yearlySavingsPct,
  type Plan,
  type PlanId,
} from "@/lib/billing/plans";

export type BillingInterval = "monthly" | "yearly";

interface PricingCardsProps {
  /** Per-plan CTA node, rendered in each card's footer. */
  actions: Record<PlanId, React.ReactNode>;
  /** Plan to flag with a "Current plan" badge, if any. */
  currentPlan?: PlanId;
  /** Notified whenever the visitor flips the monthly/yearly toggle. */
  onIntervalChange?: (interval: BillingInterval) => void;
  className?: string;
}

export function PricingCards({
  actions,
  currentPlan,
  onIntervalChange,
  className,
}: PricingCardsProps) {
  const [interval, setIntervalState] = useState<BillingInterval>("monthly");

  function setInterval(next: BillingInterval) {
    setIntervalState(next);
    onIntervalChange?.(next);
  }

  return (
    <div className={cn("flex flex-col items-center gap-8", className)}>
      <IntervalToggle interval={interval} onChange={setInterval} />
      <div className="grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        {PLAN_LIST.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            isCurrent={currentPlan === plan.id}
            action={actions[plan.id]}
          />
        ))}
      </div>
    </div>
  );
}

function IntervalToggle({
  interval,
  onChange,
}: {
  interval: BillingInterval;
  onChange: (next: BillingInterval) => void;
}) {
  const proSavings = yearlySavingsPct(PLAN_LIST[1]);
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 p-1">
      {(["monthly", "yearly"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          aria-pressed={interval === opt}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
            interval === opt
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt}
          {opt === "yearly" && proSavings > 0 && (
            <span className="ml-1.5 text-xs font-semibold text-primary">−{proSavings}%</span>
          )}
        </button>
      ))}
    </div>
  );
}

function PlanCard({
  plan,
  interval,
  isCurrent,
  action,
}: {
  plan: Plan;
  interval: BillingInterval;
  isCurrent: boolean;
  action: React.ReactNode;
}) {
  const featured = plan.id === "pro";
  const isFree = plan.price.monthly === 0;
  const price =
    interval === "yearly" && !isFree ? effectiveMonthly(plan) : plan.price.monthly;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-5 rounded-2xl border p-6",
        featured
          ? "border-primary/60 bg-card shadow-lg ring-1 ring-primary/30"
          : "border-border bg-card",
      )}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
          Most popular
        </span>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{plan.name}</h3>
          {isCurrent && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              Current plan
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{plan.tagline}</p>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight tabular-nums">${price}</span>
        <span className="text-sm text-muted-foreground">
          {isFree ? "forever" : "/ month"}
        </span>
      </div>
      <p className="-mt-3 h-4 text-xs text-muted-foreground">
        {!isFree &&
          (interval === "yearly"
            ? `Billed $${plan.price.yearly} once a year`
            : "Billed monthly · cancel anytime")}
      </p>

      <ul className="flex flex-col gap-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                featured ? "text-primary" : "text-muted-foreground",
              )}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">{action}</div>
    </div>
  );
}
