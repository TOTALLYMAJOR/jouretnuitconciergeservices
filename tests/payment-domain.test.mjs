import assert from "node:assert/strict";
import test from "node:test";
import Stripe from "stripe";
import {
  constantTimeEqual,
  createPaymentToken,
  parseAndVerifyPaymentToken,
  sha256,
} from "../lib/payment-crypto.ts";
import {
  classifyCheckoutEvent,
  formatMoney,
  proposalKey,
} from "../lib/payment-domain.ts";

const proposal = {
  key: "JN-1042:v2",
  proposalId: "JN-1042",
  version: 2,
  clientName: "Ada Client",
  clientEmail: "ada@example.com",
  businessName: "Ada & Co.",
  description: "Business readiness engagement deposit",
  acceptanceReference: "esign_evt_1042",
  immutableFingerprint: "fingerprint_1042",
  depositAmount: 125_000,
  currency: "usd",
  status: "deposit_pending",
  acceptedAt: Date.parse("2026-07-20T15:00:00.000Z"),
  dueAt: null,
  depositVerifiedAt: null,
};

const checkout = {
  id: "cs_test_1042",
  proposalKey: proposal.key,
  attempt: 1,
  status: "open",
  paymentStatus: "unpaid",
  amountTotal: proposal.depositAmount,
  currency: proposal.currency,
  expiresAt: null,
};

function session(overrides = {}) {
  return {
    id: checkout.id,
    object: "checkout.session",
    amount_total: proposal.depositAmount,
    currency: proposal.currency,
    mode: "payment",
    payment_status: "unpaid",
    status: "complete",
    metadata: {
      proposal_key: proposal.key,
      proposal_fingerprint: proposal.immutableFingerprint,
    },
    ...overrides,
  };
}

test("creates a tamper-evident, deterministic proposal payment token", async () => {
  const secret = "this-is-a-test-payment-link-secret-with-enough-entropy";
  const token = await createPaymentToken("JN-1042", 2, secret);

  assert.deepEqual(await parseAndVerifyPaymentToken(token, secret), {
    proposalId: "JN-1042",
    version: 2,
  });
  assert.equal(
    await parseAndVerifyPaymentToken(token.replace(".2.", ".3."), secret),
    null,
  );
  assert.equal(
    await createPaymentToken("JN-1042", 2, secret),
    token,
  );
});

test("constant-time comparison and SHA-256 helper preserve expected behavior", async () => {
  assert.equal(constantTimeEqual("same", "same"), true);
  assert.equal(constantTimeEqual("same", "different"), false);
  assert.equal(await sha256("commercial terms"), await sha256("commercial terms"));
  assert.notEqual(
    await sha256("commercial terms"),
    await sha256("changed terms"),
  );
});

test("commercial identifiers and money formatting are stable", () => {
  assert.equal(proposalKey("JN-1042", 2), "JN-1042:v2");
  assert.equal(formatMoney(125_000, "usd"), "$1,250.00");
});

test("a completed but unpaid Checkout session stays pending", () => {
  assert.deepEqual(
    classifyCheckoutEvent(
      "checkout.session.completed",
      session(),
      proposal,
      checkout,
      123,
    ),
    {
      outcome: "processed",
      proposalStatus: "deposit_pending",
      checkoutStatus: "complete",
      paymentStatus: "unpaid",
      verifiedAt: null,
      message: "Checkout completed, but Stripe has not marked the payment paid.",
    },
  );
});

test("only an exact paid Checkout session verifies the deposit", () => {
  assert.deepEqual(
    classifyCheckoutEvent(
      "checkout.session.async_payment_succeeded",
      session({ payment_status: "paid" }),
      proposal,
      checkout,
      987_654,
    ),
    {
      outcome: "processed",
      proposalStatus: "deposit_verified",
      checkoutStatus: "complete",
      paymentStatus: "paid",
      verifiedAt: 987_654,
      message: "Stripe verified the exact proposal deposit as paid.",
    },
  );
});

test("amount, currency, metadata, or session mismatches cannot verify payment", () => {
  for (const changedSession of [
    session({ amount_total: proposal.depositAmount - 1, payment_status: "paid" }),
    session({ currency: "eur", payment_status: "paid" }),
    session({ id: "cs_test_other", payment_status: "paid" }),
    session({
      payment_status: "paid",
      metadata: {
        proposal_key: proposal.key,
        proposal_fingerprint: "changed",
      },
    }),
  ]) {
    assert.equal(
      classifyCheckoutEvent(
        "checkout.session.completed",
        changedSession,
        proposal,
        checkout,
      ).outcome,
      "rejected",
    );
  }
});

test("failed and expired asynchronous payments return to an unpaid state", () => {
  assert.equal(
    classifyCheckoutEvent(
      "checkout.session.async_payment_failed",
      session(),
      proposal,
      checkout,
    ).proposalStatus,
    "deposit_requested",
  );
  assert.equal(
    classifyCheckoutEvent(
      "checkout.session.expired",
      session({ status: "expired" }),
      proposal,
      checkout,
    ).checkoutStatus,
    "expired",
  );
});

test("Stripe webhook signatures are verified with Web Crypto", async () => {
  const stripe = new Stripe("sk_test_placeholder", {
    httpClient: Stripe.createFetchHttpClient(),
  });
  const payload = JSON.stringify({
    id: "evt_test_signed",
    object: "event",
    type: "checkout.session.completed",
    data: { object: session({ payment_status: "paid" }) },
  });
  const secret = "whsec_test_signing_secret";
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });

  const event = await stripe.webhooks.constructEventAsync(
    payload,
    signature,
    secret,
    undefined,
    Stripe.createSubtleCryptoProvider(),
  );
  assert.equal(event.id, "evt_test_signed");

  await assert.rejects(
    stripe.webhooks.constructEventAsync(
      `${payload} `,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    ),
  );
});
