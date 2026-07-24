import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  classifyCheckoutEvent,
  type CheckoutEventDecision,
} from "../../../../lib/payment-domain";
import {
  findCheckoutWithProposal,
} from "../../../../lib/payment-repository";
import {
  PaymentConfigurationError,
  paymentDb,
  requireBinding,
  stripeClient,
} from "../../../../lib/payment-runtime";

export const dynamic = "force-dynamic";

const CHECKOUT_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
  "checkout.session.expired",
]);

async function recordEvent(
  event: Stripe.Event,
  processingStatus: "processed" | "ignored" | "rejected",
  message: string,
  objectId: string | null,
) {
  const database = paymentDb();
  await database`
      INSERT INTO jour_payments.stripe_webhook_events (
        id, type, object_id, processing_status, message, received_at
      ) VALUES (
        ${event.id}, ${event.type}, ${objectId}, ${processingStatus},
        ${message}, ${Date.now()}
      )
      ON CONFLICT (id) DO NOTHING`;
}

async function processDecision(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  decision: CheckoutEventDecision,
  proposalKey: string,
) {
  if (decision.outcome !== "processed") {
    await recordEvent(
      event,
      decision.outcome,
      decision.message,
      session.id,
    );
    return;
  }

  const now = Date.now();
  const database = paymentDb();
  await database.begin(async (transaction) => {
    const inserted = await transaction<{ id: string }[]>`
        INSERT INTO jour_payments.stripe_webhook_events (
          id, type, object_id, processing_status, message, received_at
        ) VALUES (
          ${event.id}, ${event.type}, ${session.id}, 'processed',
          ${decision.message}, ${now}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id`;
    if (inserted.length === 0) return;

    await transaction`
        UPDATE jour_payments.payment_checkout_sessions
        SET
          status = ${decision.checkoutStatus},
          payment_status = ${decision.paymentStatus},
          updated_at = ${now}
        WHERE id = ${session.id}`;
    await transaction`
        UPDATE jour_payments.payment_proposals
        SET status = ${decision.proposalStatus},
          deposit_verified_at = CASE
            WHEN ${decision.proposalStatus} = 'deposit_verified'
              THEN COALESCE(deposit_verified_at, ${decision.verifiedAt ?? now})
            ELSE deposit_verified_at
          END,
          updated_at = ${now}
        WHERE key = ${proposalKey}
          AND status <> 'deposit_verified'`;
  });
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 },
      );
    }

    const rawBody = await request.text();
    const stripe = await stripeClient();
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        requireBinding("STRIPE_WEBHOOK_SECRET"),
        undefined,
        Stripe.createSubtleCryptoProvider(),
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid Stripe signature." },
        { status: 400 },
      );
    }

    const database = paymentDb();
    const [replay] = await database<{ id: string }[]>`
      SELECT id
      FROM jour_payments.stripe_webhook_events
      WHERE id = ${event.id}
      LIMIT 1`;
    if (replay) {
      return NextResponse.json({ received: true, replay: true });
    }

    if (!CHECKOUT_EVENT_TYPES.has(event.type)) {
      await recordEvent(
        event,
        "ignored",
        "Event type does not change deposit truth.",
        null,
      );
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const records = await findCheckoutWithProposal(session.id);
    if (!records) {
      await recordEvent(
        event,
        "rejected",
        "No local Checkout record matched this signed event.",
        session.id,
      );
      return NextResponse.json({ received: true });
    }

    const decision = classifyCheckoutEvent(
      event.type,
      session,
      records.proposal,
      records.checkout,
    );
    await processDecision(
      event,
      session,
      decision,
      records.proposal.key,
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentConfigurationError) {
      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 503 },
      );
    }
    console.error("Stripe webhook processing failed.", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
