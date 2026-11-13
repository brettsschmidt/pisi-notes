import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  entitlementsFor,
  type Entitlements,
  type PlanId,
  type Subscription,
  type SubscriptionStatus,
} from "./plans";

const FREE_DEFAULT: Subscription = {
  plan: "free",
  status: "active",
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  aiCreditsUsed: 0,
  stripeCustomerId: null,
};

/**
 * The signed-in user's subscription. Lazily bootstraps a free row the first
 * time it's read — the RLS insert policy permits free-only inserts, so every
 * downstream reader (billing panel, AI metering) always has a row. Returns the
 * free default for signed-out callers rather than throwing.
 */
export async function getSubscription(): Promise<Subscription> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return FREE_DEFAULT;

  const { data } = await supabase
    .from("subscriptions")
    .select(
      "plan, status, current_period_end, cancel_at_period_end, ai_credits_used, stripe_customer_id",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    // First read for this user — create the default free row so billing and
    // AI metering have something to read. Ignore a unique-violation race.
    await supabase.from("subscriptions").insert({ user_id: user.id });
    return FREE_DEFAULT;
  }

  return {
    plan: data.plan as PlanId,
    status: data.status as SubscriptionStatus,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    aiCreditsUsed: data.ai_credits_used,
    stripeCustomerId: data.stripe_customer_id,
  };
}

/** Convenience: the current user's entitlements in one call. */
export async function getEntitlements(): Promise<Entitlements> {
  return entitlementsFor(await getSubscription());
}
