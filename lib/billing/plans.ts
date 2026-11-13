// Plan catalog + entitlements for pisi-notes. Pure data and pure functions —
// safe to import from client components (the pricing page, billing panel, and
// upgrade nudges all render plan info directly).

export type PlanId = "free" | "pro";

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export interface Plan {
  id: PlanId;
  name: string;
  /** One-line positioning shown under the plan name. */
  tagline: string;
  /** Price in whole USD. `yearly` is the once-a-year total. */
  price: { monthly: number; yearly: number };
  /** Marketing bullets, in display order. */
  features: string[];
}

/**
 * Lifetime "Ask Pisi" questions a free account gets before Pro is required.
 * The database meters usage atomically via pisi.consume_ai_credit() (see
 * migration 0003) — this constant is the single source of truth for the
 * limit itself, enforced in app code.
 */
export const FREE_AI_CREDITS = 10;

/** Monthly price of Pro, used wherever a single headline number is needed. */
export const PRO_PRICE_MONTHLY = 8;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Everything you need to think in Markdown.",
    price: { monthly: 0, yearly: 0 },
    features: [
      "Unlimited notes, tasks & reminders",
      "Hashtag categories & instant search",
      "Calendar view & web-push reminders",
      "Install as an app — works offline (PWA)",
      "Dark mode & the pisi CLI for local sync",
      `${FREE_AI_CREDITS} Ask Pisi questions to try the AI`,
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Your notes, with a brain.",
    price: { monthly: PRO_PRICE_MONTHLY, yearly: 72 },
    features: [
      "Everything in Free",
      "Unlimited Ask Pisi — chat with every note you've written",
      "Answers cite the exact notes they came from",
      "AI summaries & action-item extraction on any note",
      "A weekly AI digest of your notes, pushed to your phone",
      "Support a small indie app 🖤",
    ],
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.pro];

/** Yearly price expressed as an effective monthly rate ("$6/mo, billed yearly"). */
export function effectiveMonthly(plan: Plan): number {
  return Math.round((plan.price.yearly / 12) * 100) / 100;
}

/** Whole-percent saved by paying yearly instead of twelve monthly charges. */
export function yearlySavingsPct(plan: Plan): number {
  const yearlyAtMonthlyRate = plan.price.monthly * 12;
  if (yearlyAtMonthlyRate === 0) return 0;
  return Math.round(((yearlyAtMonthlyRate - plan.price.yearly) / yearlyAtMonthlyRate) * 100);
}

/** A user's subscription as the app reads it (see lib/billing/subscription.ts). */
export interface Subscription {
  plan: PlanId;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  aiCreditsUsed: number;
  stripeCustomerId: string | null;
}

/** What a subscription unlocks — derived once, read everywhere. */
export interface Entitlements {
  plan: PlanId;
  isPro: boolean;
  /** Free accounts: Ask Pisi questions left in the lifetime trial. Pro: Infinity. */
  aiCreditsRemaining: number;
  aiCreditsUsed: number;
  /** Whether the user may send an Ask Pisi question right now. */
  canUseAi: boolean;
}

/** A Pro plan only counts while the subscription is actually in good standing. */
export function isProActive(sub: Pick<Subscription, "plan" | "status">): boolean {
  return sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing");
}

export function entitlementsFor(sub: Subscription): Entitlements {
  const isPro = isProActive(sub);
  const aiCreditsRemaining = isPro
    ? Number.POSITIVE_INFINITY
    : Math.max(0, FREE_AI_CREDITS - sub.aiCreditsUsed);
  return {
    plan: sub.plan,
    isPro,
    aiCreditsRemaining,
    aiCreditsUsed: sub.aiCreditsUsed,
    canUseAi: isPro || aiCreditsRemaining > 0,
  };
}
