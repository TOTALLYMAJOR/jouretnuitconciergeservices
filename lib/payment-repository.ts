import type { CheckoutRecord, PaymentProposal } from "./payment-domain";
import { paymentDb } from "./payment-runtime";

type ProposalRow = {
  key: string;
  proposal_id: string;
  version: number;
  client_name: string;
  client_email: string;
  business_name: string | null;
  description: string;
  acceptance_reference: string;
  immutable_fingerprint: string;
  deposit_amount: number;
  currency: string;
  status: PaymentProposal["status"];
  accepted_at: number | string;
  due_at: number | string | null;
  deposit_verified_at: number | string | null;
};

type CheckoutRow = {
  id: string;
  proposal_key: string;
  attempt: number;
  status: CheckoutRecord["status"];
  payment_status: CheckoutRecord["paymentStatus"];
  amount_total: number;
  currency: string;
  expires_at: number | string | null;
};

function optionalNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

function mapProposal(row: ProposalRow): PaymentProposal {
  return {
    key: row.key,
    proposalId: row.proposal_id,
    version: row.version,
    clientName: row.client_name,
    clientEmail: row.client_email,
    businessName: row.business_name,
    description: row.description,
    acceptanceReference: row.acceptance_reference,
    immutableFingerprint: row.immutable_fingerprint,
    depositAmount: row.deposit_amount,
    currency: row.currency,
    status: row.status,
    acceptedAt: Number(row.accepted_at),
    dueAt: optionalNumber(row.due_at),
    depositVerifiedAt: optionalNumber(row.deposit_verified_at),
  };
}

function mapCheckout(row: CheckoutRow): CheckoutRecord {
  return {
    id: row.id,
    proposalKey: row.proposal_key,
    attempt: row.attempt,
    status: row.status,
    paymentStatus: row.payment_status,
    amountTotal: row.amount_total,
    currency: row.currency,
    expiresAt: optionalNumber(row.expires_at),
  };
}

export async function findProposal(proposalId: string, version: number) {
  const database = paymentDb();
  const [row] = await database<ProposalRow[]>`
      SELECT key, proposal_id, version, client_name, client_email,
        business_name, description, acceptance_reference,
        immutable_fingerprint, deposit_amount, currency, status, accepted_at,
        due_at, deposit_verified_at
      FROM jour_payments.payment_proposals
      WHERE proposal_id = ${proposalId} AND version = ${version}
      LIMIT 1`;

  return row ? mapProposal(row) : null;
}

export async function findProposalByKey(key: string) {
  const database = paymentDb();
  const [row] = await database<ProposalRow[]>`
      SELECT key, proposal_id, version, client_name, client_email,
        business_name, description, acceptance_reference,
        immutable_fingerprint, deposit_amount, currency, status, accepted_at,
        due_at, deposit_verified_at
      FROM jour_payments.payment_proposals
      WHERE key = ${key}
      LIMIT 1`;

  return row ? mapProposal(row) : null;
}

export async function findLatestCheckout(proposalKey: string) {
  const database = paymentDb();
  const [row] = await database<CheckoutRow[]>`
      SELECT id, proposal_key, attempt, status, payment_status, amount_total,
        currency, expires_at
      FROM jour_payments.payment_checkout_sessions
      WHERE proposal_key = ${proposalKey}
      ORDER BY attempt DESC
      LIMIT 1`;

  return row ? mapCheckout(row) : null;
}

export async function findCheckoutWithProposal(sessionId: string) {
  const database = paymentDb();
  const [row] = await database<
    (ProposalRow & {
      checkout_id: string;
      checkout_proposal_key: string;
      checkout_attempt: number;
      checkout_status: CheckoutRecord["status"];
      checkout_payment_status: CheckoutRecord["paymentStatus"];
      checkout_amount_total: number;
      checkout_currency: string;
      checkout_expires_at: number | string | null;
    })[]
  >`
      SELECT
        c.id AS checkout_id,
        c.proposal_key AS checkout_proposal_key,
        c.attempt AS checkout_attempt,
        c.status AS checkout_status,
        c.payment_status AS checkout_payment_status,
        c.amount_total AS checkout_amount_total,
        c.currency AS checkout_currency,
        c.expires_at AS checkout_expires_at,
        p.key, p.proposal_id, p.version, p.client_name, p.client_email,
        p.business_name, p.description, p.acceptance_reference,
        p.immutable_fingerprint, p.deposit_amount, p.currency, p.status,
        p.accepted_at, p.due_at, p.deposit_verified_at
      FROM jour_payments.payment_checkout_sessions c
      JOIN jour_payments.payment_proposals p ON p.key = c.proposal_key
      WHERE c.id = ${sessionId}
      LIMIT 1`;

  if (!row) return null;
  return {
    proposal: mapProposal(row),
    checkout: mapCheckout({
      id: row.checkout_id,
      proposal_key: row.checkout_proposal_key,
      attempt: row.checkout_attempt,
      status: row.checkout_status,
      payment_status: row.checkout_payment_status,
      amount_total: row.checkout_amount_total,
      currency: row.checkout_currency,
      expires_at: row.checkout_expires_at,
    }),
  };
}
