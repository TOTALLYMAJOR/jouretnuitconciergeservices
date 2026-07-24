import type Stripe from "stripe";

export const STRIPE_API_VERSION = "2026-05-27.dahlia" as const;

export const PAYABLE_PROPOSAL_STATUSES = new Set([
  "deposit_requested",
  "deposit_pending",
]);

export type PaymentProposal = {
  key: string;
  proposalId: string;
  version: number;
  clientName: string;
  clientEmail: string;
  businessName: string | null;
  description: string;
  acceptanceReference: string;
  immutableFingerprint: string;
  depositAmount: number;
  currency: string;
  status:
    | "deposit_requested"
    | "deposit_pending"
    | "deposit_verified"
    | "cancelled"
    | "expired";
  acceptedAt: number;
  dueAt: number | null;
  depositVerifiedAt: number | null;
};

export type CheckoutRecord = {
  id: string;
  proposalKey: string;
  attempt: number;
  status: "open" | "complete" | "expired";
  paymentStatus: "unpaid" | "paid" | "no_payment_required";
  amountTotal: number;
  currency: string;
  expiresAt: number | null;
};

export type CheckoutEventDecision =
  | {
      outcome: "ignored";
      message: string;
    }
  | {
      outcome: "rejected";
      message: string;
    }
  | {
      outcome: "processed";
      proposalStatus:
        | "deposit_requested"
        | "deposit_pending"
        | "deposit_verified";
      checkoutStatus: "complete" | "expired";
      paymentStatus: "unpaid" | "paid" | "no_payment_required";
      verifiedAt: number | null;
      message: string;
    };

export function proposalKey(proposalId: string, version: number) {
  return `${proposalId}:v${version}`;
}

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export function classifyCheckoutEvent(
  eventType: string,
  session: Stripe.Checkout.Session,
  proposal: PaymentProposal,
  checkout: CheckoutRecord,
  now = Date.now(),
): CheckoutEventDecision {
  const supportedEvents = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
    "checkout.session.expired",
  ]);

  if (!supportedEvents.has(eventType)) {
    return {
      outcome: "ignored",
      message: "Event type does not change deposit truth.",
    };
  }

  const metadataMatches =
    session.metadata?.proposal_key === proposal.key &&
    session.metadata?.proposal_fingerprint === proposal.immutableFingerprint;
  const amountMatches =
    session.amount_total === proposal.depositAmount &&
    session.amount_total === checkout.amountTotal;
  const currencyMatches =
    session.currency === proposal.currency &&
    session.currency === checkout.currency;

  if (
    session.id !== checkout.id ||
    session.mode !== "payment" ||
    !metadataMatches ||
    !amountMatches ||
    !currencyMatches
  ) {
    return {
      outcome: "rejected",
      message:
        "Signed event did not match the immutable proposal and Checkout record.",
    };
  }

  if (eventType === "checkout.session.expired") {
    return {
      outcome: "processed",
      proposalStatus: "deposit_requested",
      checkoutStatus: "expired",
      paymentStatus: session.payment_status,
      verifiedAt: null,
      message: "Checkout expired without verifying a deposit.",
    };
  }

  if (eventType === "checkout.session.async_payment_failed") {
    return {
      outcome: "processed",
      proposalStatus: "deposit_requested",
      checkoutStatus: "complete",
      paymentStatus: session.payment_status,
      verifiedAt: null,
      message: "Asynchronous payment failed; deposit remains unverified.",
    };
  }

  if (session.payment_status !== "paid") {
    return {
      outcome: "processed",
      proposalStatus: "deposit_pending",
      checkoutStatus: "complete",
      paymentStatus: session.payment_status,
      verifiedAt: null,
      message: "Checkout completed, but Stripe has not marked the payment paid.",
    };
  }

  return {
    outcome: "processed",
    proposalStatus: "deposit_verified",
    checkoutStatus: "complete",
    paymentStatus: "paid",
    verifiedAt: now,
    message: "Stripe verified the exact proposal deposit as paid.",
  };
}
