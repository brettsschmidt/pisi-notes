// Plan catalog + entitlements for Quiet Upsell. Pure data and pure
// functions — safe to import from client components (the pricing page,
// billing panel, and upgrade nudges all render plan info directly).

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

/** Plan limits. Enforced in app code (lib/actions/rotators.ts). */
export const LIMITS: Record<PlanId, { rotators: number; imagesPerRotator: number }> = {
  free: { rotators: 2, imagesPerRotator: 5 },
  pro: { rotators: Number.POSITIVE_INFINITY, imagesPerRotator: 50 },
};

/** Max upload size per image, in bytes. Mirrors the storage bucket limit. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Monthly price of Pro, used wherever a single headline number is needed. */
export const PRO_PRICE_MONTHLY = 8;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Try rotating images in your next send.",
    price: { monthly: 0, yearly: 0 },
    features: [
      `${LIMITS.free.rotators} rotating image links`,
      `Up to ${LIMITS.free.imagesPerRotator} images per link`,
      "In-order or random rotation",
      "Upload files or point at any https image",
      "Open counts per link and per image",
      "Works in any email tool that accepts an image URL",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "For newsletters and campaigns that ship every week.",
    price: { monthly: PRO_PRICE_MONTHLY, yearly: 72 },
    features: [
      "Everything in Free",
      "Unlimited rotating image links",
      `Up to ${LIMITS.pro.imagesPerRotator} images per link`,
      "Priority support",
      "Support a small indie app 💚",
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
  stripeCustomerId: string | null;
}

/** What a subscription unlocks — derived once, read everywhere. */
export interface Entitlements {
  plan: PlanId;
  isPro: boolean;
  maxRotators: number;
  maxImagesPerRotator: number;
}

/** A Pro plan only counts while the subscription is actually in good standing. */
export function isProActive(sub: Pick<Subscription, "plan" | "status">): boolean {
  return sub.plan === "pro" && (sub.status === "active" || sub.status === "trialing");
}

export function entitlementsFor(sub: Subscription): Entitlements {
  const isPro = isProActive(sub);
  const limits = LIMITS[isPro ? "pro" : "free"];
  return {
    plan: sub.plan,
    isPro,
    maxRotators: limits.rotators,
    maxImagesPerRotator: limits.imagesPerRotator,
  };
}
