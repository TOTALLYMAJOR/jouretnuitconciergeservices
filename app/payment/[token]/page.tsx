import Link from "next/link";
import {
  ArrowLeft,
  FileCheck2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { parseAndVerifyPaymentToken } from "../../../lib/payment-crypto";
import {
  formatMoney,
  PAYABLE_PROPOSAL_STATUSES,
} from "../../../lib/payment-domain";
import { findProposal } from "../../../lib/payment-repository";
import {
  PaymentConfigurationError,
  requireLongSecret,
} from "../../../lib/payment-runtime";
import { CheckoutButton } from "./CheckoutButton";

export const dynamic = "force-dynamic";

type PaymentProposalPageProps = {
  params: Promise<{ token: string }>;
};

function currentTime() {
  return Date.now();
}

async function loadProposal(token: string) {
  try {
    const parsed = await parseAndVerifyPaymentToken(
      token,
      await requireLongSecret("PAYMENT_LINK_SECRET"),
    );
    if (!parsed) notFound();

    const proposal = await findProposal(parsed.proposalId, parsed.version);
    if (!proposal) notFound();
    return { configured: true as const, proposal };
  } catch (error) {
    if (error instanceof PaymentConfigurationError) {
      return { configured: false as const };
    }
    throw error;
  }
}

export default async function PaymentProposalPage({
  params,
}: PaymentProposalPageProps) {
  const { token } = await params;
  const result = await loadProposal(token);
  if (!result.configured) {
    return (
      <main className="subpage">
        <section className="payment-state">
          <p className="kicker">Payment temporarily unavailable</p>
          <h1>Secure checkout is not configured yet.</h1>
          <p>
            Please use the proposal delivery email to contact Jour et Nuit. Do
            not submit payment through a different link.
          </p>
        </section>
      </main>
    );
  }

  const { proposal } = result;
  const isPastDue =
    proposal.dueAt !== null && proposal.dueAt < currentTime();
  const isPayable =
    PAYABLE_PROPOSAL_STATUSES.has(proposal.status) && !isPastDue;
  const isVerified = proposal.status === "deposit_verified";
  const displayName = proposal.businessName ?? proposal.clientName;

  return (
    <main className="subpage">
      <header className="subnav">
        <Link href="/" className="brand">
          <span className="brand-mark">JN</span>
          <span>
            <strong>Jour et Nuit</strong>
            <small>Concierge</small>
          </span>
        </Link>
        <Link href="/" className="back">
          <ArrowLeft size={15} /> Return home
        </Link>
      </header>

      <section className="proposal-payment">
        <div className="proposal-payment-heading">
          <div className="payment-icon">
            <LockKeyhole />
          </div>
          <p className="kicker">Secure proposal deposit</p>
          <h1>
            {isVerified
              ? "This deposit has been verified."
              : "Review the deposit before checkout."}
          </h1>
          <p>
            This private payment request is tied to the accepted commercial
            terms for {displayName}. The amount cannot be edited from this page.
          </p>
        </div>

        <section className="proposal-payment-summary">
          <div>
            <span>Proposal</span>
            <strong>
              {proposal.proposalId} · version {proposal.version}
            </strong>
          </div>
          <div>
            <span>Deposit for</span>
            <strong>{proposal.description}</strong>
          </div>
          <div className="proposal-payment-total">
            <span>Deposit due</span>
            <strong>
              {formatMoney(proposal.depositAmount, proposal.currency)}
            </strong>
          </div>
        </section>

        {isVerified ? (
          <div className="payment-confirmed-notice">
            <FileCheck2 />
            <div>
              <strong>Stripe payment verified</strong>
              <p>
                No additional payment is due through this link. Jour et Nuit
                will confirm the next authorized onboarding step separately.
              </p>
            </div>
          </div>
        ) : isPayable ? (
          <CheckoutButton token={token} />
        ) : (
          <div className="payment-unavailable-notice">
            This payment request is no longer available. Contact Jour et Nuit
            using the proposal delivery email before taking another action.
          </div>
        )}

        <aside>
          <ShieldCheck />
          <p>
            Checkout is hosted by Stripe. Jour et Nuit never asks you to email
            card details, passwords, or banking credentials. Returning from
            Checkout is not payment proof; only Stripe&apos;s verified server
            event updates the deposit.
          </p>
        </aside>
      </section>
    </main>
  );
}
