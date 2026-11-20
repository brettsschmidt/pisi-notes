"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/billing/stripe";
import { getSubscription } from "@/lib/billing/subscription";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Send the signed-in user to Stripe Checkout for the Pro plan. Invoked as a
 * form action; the `interval` field selects the monthly or yearly price.
 * Persisting the resulting subscription is the webhook's job — see
 * app/api/billing/webhook/route.ts.
 */
export async function startCheckout(formData: FormData): Promise<void> {
  const interval = formData.get("interval") === "yearly" ? "yearly" : "monthly";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stripe = getStripe();
  const priceId = STRIPE_PRICE_IDS[interval];
  if (!stripe || !priceId) redirect("/pricing?billing=unavailable");

  const sub = await getSubscription();
  if (sub.plan === "pro") redirect("/settings?billing=already-pro");

  let checkoutUrl: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      // Stamp the user id onto the subscription so the webhook can map the
      // resulting Stripe subscription back to a Quiet Upsell account.
      subscription_data: { metadata: { user_id: user.id } },
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
      success_url: `${siteUrl()}/settings?billing=success`,
      cancel_url: `${siteUrl()}/pricing?billing=canceled`,
    });
    checkoutUrl = session.url;
  } catch (err) {
    console.error("stripe checkout session failed", err);
    redirect("/pricing?billing=error");
  }

  redirect(checkoutUrl ?? "/pricing?billing=error");
}

/** Open the Stripe customer portal so a Pro user can manage or cancel. */
export async function openBillingPortal(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stripe = getStripe();
  const sub = await getSubscription();
  if (!stripe || !sub.stripeCustomerId) redirect("/settings?billing=unavailable");

  let portalUrl: string | null = null;
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${siteUrl()}/settings`,
    });
    portalUrl = session.url;
  } catch (err) {
    console.error("stripe billing portal session failed", err);
    redirect("/settings?billing=error");
  }

  redirect(portalUrl ?? "/settings?billing=error");
}
