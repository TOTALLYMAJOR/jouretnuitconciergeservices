import { NextResponse } from "next/server";
import { parseAndVerifyPaymentToken } from "../../../../lib/payment-crypto";
import {
  PAYABLE_PROPOSAL_STATUSES,
  type CheckoutRecord,
} from "../../../../lib/payment-domain";
import {
  findLatestCheckout,
  findProposal,
} from "../../../../lib/payment-repository";
import {
  PaymentConfigurationError,
  paymentDb,
  paymentPublicUrl,
  requireLongSecret,
  stripeClient,
} from "../../../../lib/payment-runtime";

export const dynamic = "force-dynamic";

function checkoutResponse(checkoutUrl: string) {
  return NextResponse.json(
    { checkoutUrl },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

async function reusableCheckout(
  checkout: CheckoutRecord | null,
  stripe: Awaited<ReturnType<typeof stripeClient>>,
) {
  if (!checkout || checkout.status !== "open") return null;

  const session = await stripe.checkout.sessions.retrieve(checkout.id);
  if (session.status === "open" && session.url) {
    return session.url;
  }

  const database = paymentDb();
  await database`
      UPDATE jour_payments.payment_checkout_sessions
      SET
        status = ${session.status === "expired" ? "expired" : "complete"},
        payment_status = ${session.payment_status},
        updated_at = ${Date.now()}
      WHERE id = ${checkout.id}`;
  return null;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json." },
        { status: 415 },
      );
    }

    await paymentPublicUrl(request);
    const body = (await request.json()) as { token?: unknown };
    if (typeof body.token !== "string") {
      return NextResponse.json(
        { error: "A secure proposal payment token is required." },
        { status: 400 },
      );
    }

    const tokenValues = await parseAndVerifyPaymentToken(
      body.token,
      requireLongSecret("PAYMENT_LINK_SECRET"),
    );
    if (!tokenValues) {
      return NextResponse.json(
        { error: "This proposal payment link is invalid." },
        { status: 404 },
      );
    }

    const proposal = await findProposal(
      tokenValues.proposalId,
      tokenValues.version,
    );
    if (!proposal) {
      return NextResponse.json(
        { error: "This proposal payment link is unavailable." },
        { status: 404 },
      );
    }
    if (proposal.status === "deposit_verified") {
      return NextResponse.json(
        { error: "This proposal deposit has already been verified." },
        { status: 409 },
      );
    }
    if (!PAYABLE_PROPOSAL_STATUSES.has(proposal.status)) {
      return NextResponse.json(
        { error: "This proposal is not currently payable." },
        { status: 409 },
      );
    }
    if (proposal.dueAt !== null && proposal.dueAt < Date.now()) {
      return NextResponse.json(
        { error: "This proposal payment link has expired." },
        { status: 410 },
      );
    }

    const stripe = await stripeClient();
    const latestCheckout = await findLatestCheckout(proposal.key);
    const existingUrl = await reusableCheckout(latestCheckout, stripe);
    if (existingUrl) return checkoutResponse(existingUrl);

    const attempt = (latestCheckout?.attempt ?? 0) + 1;
    const publicUrl = await paymentPublicUrl(request);
    const expiresAt = Math.floor(Date.now() / 1000) + 23 * 60 * 60;
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: proposal.key,
        customer_email: proposal.clientEmail,
        success_url: `${publicUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${publicUrl}/payment/cancelled`,
        expires_at: expiresAt,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: proposal.currency,
              unit_amount: proposal.depositAmount,
              product_data: {
                name: `Jour et Nuit deposit — Proposal ${proposal.proposalId}`,
                description: proposal.description,
              },
            },
          },
        ],
        metadata: {
          proposal_key: proposal.key,
          proposal_fingerprint: proposal.immutableFingerprint,
        },
        payment_intent_data: {
          metadata: {
            proposal_key: proposal.key,
            proposal_fingerprint: proposal.immutableFingerprint,
          },
        },
      },
      {
        idempotencyKey: `jour:${proposal.key}:checkout:${attempt}`,
      },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a hosted Checkout URL.");
    }

    const now = Date.now();
    const database = paymentDb();
    await database.begin(async (transaction) => {
      await transaction`
          INSERT INTO jour_payments.payment_checkout_sessions (
            id, proposal_key, attempt, status, payment_status, amount_total,
            currency, expires_at, created_at, updated_at
          ) VALUES (
            ${session.id}, ${proposal.key}, ${attempt}, ${session.status},
            ${session.payment_status}, ${session.amount_total},
            ${session.currency},
            ${session.expires_at ? session.expires_at * 1000 : null},
            ${now}, ${now}
          )
          ON CONFLICT (id) DO UPDATE SET updated_at = EXCLUDED.updated_at`;
      await transaction`
          UPDATE jour_payments.payment_proposals
          SET status = 'deposit_pending', updated_at = ${now}
          WHERE key = ${proposal.key} AND status = 'deposit_requested'`;
    });

    return checkoutResponse(session.url);
  } catch (error) {
    if (
      error instanceof SyntaxError ||
      error instanceof PaymentConfigurationError
    ) {
      const status =
        error instanceof PaymentConfigurationError ? 503 : 400;
      return NextResponse.json(
        {
          error:
            status === 503
              ? "Payment service is not configured."
              : "Request body must be valid JSON.",
        },
        { status },
      );
    }
    console.error("Unable to start Stripe Checkout.", error);
    return NextResponse.json(
      { error: "Unable to start secure checkout. Please try again." },
      { status: 502 },
    );
  }
}
