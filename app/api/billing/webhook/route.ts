import type Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe delivers events here. Configure the endpoint in the Stripe dashboard
// as <site>/api/billing/webhook and put its signing secret in
// STRIPE_WEBHOOK_SECRET. Persisting subscription state needs the Supabase
// service-role key (the webhook is unauthenticated, so it bypasses RLS).

function mapStatus(
  status: Stripe.Subscription.Status,
): "active" | "trialing" | "past_due" | "canceled" {
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  // canceled, incomplete, incomplete_expired, unpaid, paused
  return "canceled";
}

function periodEndIso(sub: Stripe.Subscription): string | null {
  // `current_period_end` moved from the subscription to its items in recent
  // Stripe API versions — read whichever location this account reports.
  const loose = sub as unknown as {
    current_period_end?: number;
    items?: { data?: { current_period_end?: number }[] };
  };
  const epoch = loose.current_period_end ?? loose.items?.data?.[0]?.current_period_end;
  return typeof epoch === "number" ? new Date(epoch * 1000).toISOString() : null;
}

function customerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id;
}

/** Mirror a Stripe subscription into minmi.subscriptions. */
async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.warn("stripe webhook: subscription", sub.id, "is missing user_id metadata");
    return;
  }
  const status = mapStatus(sub.status);
  const isPro = status === "active" || status === "trialing";
  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      plan: isPro ? "pro" : "free",
      status,
      stripe_customer_id: customerId(sub),
      stripe_subscription_id: sub.id,
      current_period_end: periodEndIso(sub),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

/** A deleted subscription drops the account back to the free plan. */
async function downgradeSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.user_id;
  if (!userId) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("subscriptions")
    .update({ plan: "free", status: "canceled", cancel_at_period_end: false })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function POST(req: Request): Promise<Response> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return new Response("billing not configured", { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing stripe-signature", { status: 400 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (err) {
    console.error("stripe webhook signature verification failed", err);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        if (subId) await syncSubscription(await stripe.subscriptions.retrieve(subId));
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await downgradeSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        // Acknowledge unhandled event types so Stripe stops retrying them.
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler error for", event.type, err);
    return new Response("handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
