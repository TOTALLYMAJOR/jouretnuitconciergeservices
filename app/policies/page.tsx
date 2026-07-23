import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const effectiveDate = "July 23, 2026";

export default function PoliciesPage() {
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

      <article className="policy-page">
        <header>
          <p className="kicker">Website and engagement policies</p>
          <h1>Clear terms support better partnerships.</h1>
          <p>Effective {effectiveDate}. Last reviewed {effectiveDate}.</p>
          <aside>
            These operational policies are provided for transparency and should
            be reviewed by qualified legal counsel before a public commercial
            launch.
          </aside>
        </header>

        <nav aria-label="Policy contents">
          <a href="#privacy">Privacy</a>
          <a href="#website-terms">Website terms</a>
          <a href="#consultations">Consultations</a>
          <a href="#deposits">Deposits and refunds</a>
          <a href="#professional-boundaries">Professional boundaries</a>
        </nav>

        <section id="privacy">
          <p className="kicker">01 · Privacy notice</p>
          <h2>Information we collect and why</h2>
          <p>
            Jour et Nuit may collect information you voluntarily provide,
            including your name, email address, business name, business stage,
            service interests, scheduling details, and the contents of your
            inquiry. This information is used to respond, assess service fit,
            prepare for a consultation, deliver an agreed engagement, maintain
            business records, and protect the website from misuse.
          </p>
          <p>
            Scheduling and payment providers process information under their
            own privacy terms. Jour et Nuit does not sell personal information.
            Reasonable requests to access, correct, or delete inquiry
            information may be sent to
            {" "}
            <a href="mailto:hello@jouretnuitconcierge.services">
              hello@jouretnuitconcierge.services
            </a>
            , subject to legal and recordkeeping obligations.
          </p>
        </section>

        <section id="website-terms">
          <p className="kicker">02 · Website terms</p>
          <h2>Educational use and responsible reliance</h2>
          <p>
            Website content is general business information. It does not create
            a client relationship, constitute a promise of service, or replace
            advice from licensed legal, tax, accounting, lending, or financial
            professionals. You remain responsible for decisions made using
            website information and for independently verifying third-party
            requirements.
          </p>
          <p>
            You may not misuse the website, attempt unauthorized access,
            interfere with its operation, submit false information, or copy
            proprietary materials for commercial redistribution.
          </p>
        </section>

        <section id="consultations">
          <p className="kicker">03 · Consultation policy</p>
          <h2>Scheduling, preparation, and cancellations</h2>
          <p>
            A strategy session is an exploratory conversation and does not
            guarantee that Jour et Nuit will accept an engagement. Clients
            should provide accurate scheduling information and attend prepared
            to discuss the stated business objective.
          </p>
          <p>
            Rescheduling or cancellation should occur at least 24 hours before
            the appointment when reasonably possible. Repeated missed
            appointments may result in Jour et Nuit declining future scheduling
            requests.
          </p>
        </section>

        <section id="deposits">
          <p className="kicker">04 · Deposits and refunds</p>
          <h2>Payment follows a written proposal</h2>
          <p>
            No deposit is due until a proposal identifies the scope, total
            price, requested deposit, timing, responsibilities, and applicable
            cancellation terms. Proposal acceptance and payment confirmation
            are separate events. Work begins only after the required payment is
            verified and any stated prerequisites are satisfied.
          </p>
          <p>
            Refund eligibility, if any, will be stated in the accepted proposal
            and may depend on work already performed, nonrecoverable filing or
            third-party costs, reserved capacity, and applicable law. Fees paid
            directly to government agencies or other third parties may be
            nonrefundable even when Jour et Nuit’s service fee is refundable.
          </p>
        </section>

        <section id="professional-boundaries">
          <p className="kicker">05 · Professional boundaries</p>
          <h2>Consulting and administrative support</h2>
          <p>
            Jour et Nuit is a business consulting and administrative-support
            firm. It is not a law firm, lender, credit bureau, tax practice, or
            credit-repair organization. Jour et Nuit does not guarantee
            financing, approvals, credit scores, limits, filing acceptance, or
            legal outcomes.
          </p>
          <p>
            Questions requiring a licensed professional may be referred to an
            attorney, accountant, tax professional, financial adviser, or other
            qualified specialist.
          </p>
        </section>
      </article>
    </main>
  );
}
