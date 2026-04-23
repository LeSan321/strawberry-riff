import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getUserById, getUserByStripeCustomerId, setUserPremium } from "../db";

// ─── Stripe client ────────────────────────────────────────────────────────────
// Live mode price ID — must be set via STRIPE_PRICE_ID env var
const PRICE_ID = process.env.STRIPE_PRICE_ID;
if (!PRICE_ID) {
  throw new Error("STRIPE_PRICE_ID environment variable is not set. Please configure it in your environment.");
}

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!secretKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured. Please add STRIPE_SECRET_KEY.",
    });
  }
  return new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const stripeRouter = router({
  /** Create a Stripe Checkout Session for the Premium subscription */
  createCheckoutSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = ctx.user;

    // Re-use existing Stripe customer if we already have one
    let customerId: string | undefined = user.stripeCustomerId ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        metadata: { userId: String(user.id) },
      });
      customerId = customer.id;
    }

    const origin = (ctx.req.headers.origin as string | undefined) ?? "https://strawberryriff.com";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: String(user.id),
      metadata: {
        user_id: String(user.id),
        customer_email: user.email ?? "",
        customer_name: user.name ?? "",
      },
      success_url: `${origin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
    });

    return { url: session.url };
  }),

  /** Create a Stripe Customer Portal session so the user can manage their subscription */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripe();
    const user = await getUserById(ctx.user.id);

    if (!user?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription found.",
      });
    }

    const origin = (ctx.req.headers.origin as string | undefined) ?? "https://strawberryriff.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/profile-setup`,
    });

    return { url: session.url };
  }),

  /** Return the current user's premium status */
  status: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserById(ctx.user.id);
    return {
      isPremium: user?.isPremium ?? false,
      premiumSince: user?.premiumSince ?? null,
    };
  }),
});

// ─── Webhook handler (called from Express, not tRPC) ─────────────────────────
export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean }> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  const secretKey = process.env.STRIPE_SECRET_KEY ?? "";
  if (!secretKey) {
    console.warn("[Stripe Webhook] STRIPE_SECRET_KEY not set — skipping");
    return { received: false };
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-03-25.dahlia" });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    throw new Error("Webhook signature verification failed");
  }

  // Test events — return immediately so Stripe CLI verification passes
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return { received: true };
  }

  console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id
        ? parseInt(session.metadata.user_id, 10)
        : session.client_reference_id
          ? parseInt(session.client_reference_id, 10)
          : null;

      if (userId && !isNaN(userId)) {
        await setUserPremium(userId, {
          isPremium: true,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          premiumSince: new Date(),
        });
        console.log(`[Stripe Webhook] User ${userId} upgraded to Premium`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const user = await getUserByStripeCustomerId(customerId);
      if (user) {
        await setUserPremium(user.id, {
          isPremium: false,
          stripeSubscriptionId: undefined,
          premiumSince: null,
        });
        console.log(`[Stripe Webhook] User ${user.id} downgraded from Premium (subscription cancelled)`);
      }
      break;
    }

    case "invoice.payment_failed": {
      // Log but don't immediately revoke — Stripe will retry
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe Webhook] Payment failed for customer ${invoice.customer}`);
      break;
    }

    default:
      // Ignore unhandled event types
      break;
  }

  return { received: true };
}
