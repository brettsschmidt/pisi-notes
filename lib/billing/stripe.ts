import "server-only";
import Stripe from "stripe";

/**
 * Billing is entirely optional. The whole monetization layer — pricing page,
 * upgrade buttons, webhook — degrades gracefully when these env vars are
 * absent, so the app runs fine on a deployment with no Stripe account.
 *
 *   STRIPE_SECRET_KEY      sk_live_… / sk_test_…
 *   STRIPE_WEBHOOK_SECRET  whsec_…  (for /api/billing/webhook)
 *   STRIPE_PRICE_MONTHLY   price_…  (the $8/mo Pro price)
 *   STRIPE_PRICE_YEARLY    price_…  (the $72/yr Pro price)
 */
export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_PRICE_MONTHLY || process.env.STRIPE_PRICE_YEARLY),
  );
}

export const STRIPE_PRICE_IDS: Record<"monthly" | "yearly", string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
};

let cached: Stripe | null = null;

/**
 * The Stripe client, or null when STRIPE_SECRET_KEY is not configured. Uses
 * the fetch-based HTTP client so it runs on the Cloudflare Workers runtime
 * the app is deployed to via OpenNext.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    cached = new Stripe(key, {
      httpClient: Stripe.createFetchHttpClient(),
      appInfo: { name: "pisi-notes" },
    });
  }
  return cached;
}
