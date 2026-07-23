import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileLock2,
  FileSignature,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const requirements = [
  {
    icon: FileSignature,
    title: "Defined scope",
    copy: "Deliverables, exclusions, responsibilities, and scope-change treatment.",
  },
  {
    icon: CalendarClock,
    title: "Realistic timing",
    copy: "Estimated milestones, client dependencies, and third-party timing.",
  },
  {
    icon: WalletCards,
    title: "Exact commercial terms",
    copy: "Total fee, requested deposit, payment schedule, and applicable policies.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible boundaries",
    copy: "No-guarantee language and referrals for licensed professional services.",
  },
];

export default function ProposalAccessPage() {
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

      <section className="proposal-access">
        <div className="proposal-lock">
          <FileLock2 />
        </div>
        <div>
          <p className="kicker">Private proposal access</p>
          <h1>Every engagement begins with a proposal built for the work.</h1>
          <p>
            Personalized proposals are issued through private links after a
            completed strategy session. This general page is not a proposal,
            offer, invoice, or request for payment.
          </p>
        </div>

        <div className="proposal-requirements">
          {requirements.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <Icon />
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>

        <aside>
          If you received a proposal but cannot open it, reply to the delivery
          email rather than submitting payment through another link.
        </aside>

        <div className="engagement-actions">
          <Link className="button button-primary" href="/consultation">
            Request a strategy session <ArrowRight size={16} />
          </Link>
          <Link className="button button-ghost" href="/policies#deposits">
            Review deposit policy
          </Link>
        </div>
      </section>
    </main>
  );
}
