import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CircleDashed,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type PaymentStateProps = {
  state: "access" | "returned" | "pending" | "cancelled";
};

const content = {
  access: {
    icon: LockKeyhole,
    kicker: "Secure proposal payment",
    title: "Use the payment link in your accepted proposal.",
    copy: "Deposit amounts are specific to the agreed scope. Jour et Nuit does not publish a customer-editable payment amount or accept deposits before a proposal is accepted.",
    status: "No payment session",
  },
  returned: {
    icon: ShieldCheck,
    kicker: "Provider return received",
    title: "We are verifying the payment—not assuming it.",
    copy: "Returning to this page does not establish that funds were received. Jour et Nuit will rely on the payment provider’s verified event before authorizing onboarding or beginning work.",
    status: "Verification required",
  },
  pending: {
    icon: Clock3,
    kicker: "Payment processing",
    title: "Your payment has not reached a final state.",
    copy: "Some payment methods take additional time to confirm. No action is required unless Jour et Nuit or the payment provider contacts you.",
    status: "Pending provider confirmation",
  },
  cancelled: {
    icon: XCircle,
    kicker: "Checkout ended",
    title: "No payment was confirmed.",
    copy: "You may return to the secure link in your proposal if you still wish to complete the deposit. Cancelling checkout does not cancel an accepted proposal unless its terms say otherwise.",
    status: "Payment not completed",
  },
};

export function PaymentState({ state }: PaymentStateProps) {
  const item = content[state];
  const Icon = item.icon;
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

      <section className="payment-state">
        <div className="payment-icon">
          <Icon />
        </div>
        <p className="kicker">{item.kicker}</p>
        <h1>{item.title}</h1>
        <p>{item.copy}</p>
        <div className={`payment-badge ${state}`}>
          <CircleDashed />
          <span>
            <small>Current status</small>
            <strong>{item.status}</strong>
          </span>
        </div>
        <aside>
          <ShieldCheck />
          <p>
            Never email card details, account passwords, or banking
            credentials. Jour et Nuit payment requests will use a secure,
            provider-hosted page associated with a written proposal.
          </p>
        </aside>
        <div className="payment-actions">
          <Link className="button button-primary" href="/consultation">
            Contact Jour et Nuit <ArrowRight size={16} />
          </Link>
          <Link className="button button-ghost" href="/engagement">
            Review the engagement process
          </Link>
        </div>
      </section>
    </main>
  );
}
