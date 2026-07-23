import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  FileSignature,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const stages = [
  {
    icon: CircleDashed,
    number: "01",
    title: "Fit conversation",
    state: "No commitment",
    copy: "We identify the business objective, current constraints, and whether the requested work fits our capabilities.",
  },
  {
    icon: FileSignature,
    number: "02",
    title: "Written proposal",
    state: "Review required",
    copy: "The proposed scope identifies deliverables, timing, responsibilities, price, exclusions, and the deposit requested.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Proposal accepted",
    state: "Agreement recorded",
    copy: "Acceptance confirms the agreed scope. It does not, by itself, mean that a payment has been received.",
  },
  {
    icon: WalletCards,
    number: "04",
    title: "Deposit verified",
    state: "Payment confirmed",
    copy: "The engagement becomes active only after the payment provider confirms the required deposit.",
  },
  {
    icon: ShieldCheck,
    number: "05",
    title: "Onboarding",
    state: "Work authorized",
    copy: "You receive the document checklist, communication expectations, milestones, and first authorized next step.",
  },
];

export default function EngagementPage() {
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

      <section className="engagement-page">
        <div className="engagement-intro">
          <p className="kicker">A clear commercial process</p>
          <h1>
            Know exactly where the engagement <em>stands.</em>
          </h1>
          <p>
            Interest, proposal acceptance, payment, and authorization to begin
            are different events. Jour et Nuit keeps those boundaries visible
            so both parties know what has—and has not—been confirmed.
          </p>
        </div>

        <div className="engagement-stages">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <article key={stage.number}>
                <div className="stage-number">{stage.number}</div>
                <div className="stage-icon">
                  <Icon />
                </div>
                <div>
                  <span>{stage.state}</span>
                  <h2>{stage.title}</h2>
                  <p>{stage.copy}</p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="proof-boundary">
          <div>
            <ShieldCheck />
            <div>
              <p className="kicker">Proof before progress</p>
              <h2>A redirect is not proof of payment.</h2>
            </div>
          </div>
          <p>
            When online payments are activated, only a verified provider event
            will establish that the deposit was received. A browser success
            page, screenshot, or pending transaction will not authorize work.
          </p>
        </aside>

        <div className="engagement-actions">
          <Link className="button button-primary" href="/consultation">
            Request a strategy session <ArrowRight size={16} />
          </Link>
          <Link className="button button-ghost" href="/onboarding">
            Preview client preparation
          </Link>
        </div>
      </section>
    </main>
  );
}
