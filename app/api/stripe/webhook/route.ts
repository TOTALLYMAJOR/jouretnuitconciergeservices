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
  await (await paymentDb())
    .prepare(
      `INSERT OR IGNORE INTO stripe_webhook_events (
        id, type, object_id, processing_status, message, received_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(event.id, event.type, objectId, processingStatus, message, Date.now())
    .run();
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
  const database = await paymentDb();
  await database.batch([
    database
      .prepare(
        `INSERT OR IGNORE INTO stripe_webhook_events (
          id, type, object_id, processing_status, message, received_at
        ) VALUES (?1, ?2, ?3, 'processed', ?4, ?5)`,
      )
      .bind(event.id, event.type, session.id, decision.message, now),
    database
      .prepare(
        `UPDATE payment_checkout_sessions
        SET status = ?1, payment_status = ?2, updated_at = ?3
        WHERE id = ?4`,
      )
      .bind(
        decision.checkoutStatus,
        decision.paymentStatus,
        now,
        session.id,
      ),
    database
      .prepare(
        `UPDATE payment_proposals
        SET status = ?1,
          deposit_verified_at = CASE
            WHEN ?1 = 'deposit_verified'
              THEN COALESCE(deposit_verified_at, ?2)
            ELSE deposit_verified_at
          END,
          updated_at = ?2
        WHERE key = ?3
          AND status <> 'deposit_verified'`,
      )
      .bind(decision.proposalStatus, decision.verifiedAt ?? now, proposalKey),
  ]);
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
        await requireBinding("STRIPE_WEBHOOK_SECRET"),
        undefined,
        Stripe.createSubtleCryptoProvider(),
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid Stripe signature." },
        { status: 400 },
      );
    }

    const replay = await (await paymentDb())
      .prepare("SELECT id FROM stripe_webhook_events WHERE id = ?1")
      .bind(event.id)
      .first<{ id: string }>();
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
