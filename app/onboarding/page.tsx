import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck2,
  LockKeyhole,
  MessagesSquare,
} from "lucide-react";

const checklist = [
  "Current business registration and ownership information",
  "EIN confirmation and core organizational records",
  "Business contact details and professional profiles",
  "Relevant notices, filings, or existing documents",
  "A short description of the immediate business goal",
  "Questions or deadlines that may affect the engagement",
];

export default function OnboardingPage() {
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

      <section className="onboarding-page">
        <div className="onboarding-intro">
          <p className="kicker">Client preparation center</p>
          <h1>
            Good work begins with a <em>clean handoff.</em>
          </h1>
          <p>
            This preview explains what clients can expect after an accepted
            proposal and verified deposit. Do not submit sensitive documents
            through email or the public website.
          </p>
        </div>

        <div className="onboarding-grid">
          <section>
            <FileCheck2 />
            <p className="kicker">Preparation checklist</p>
            <h2>Gather the relevant records.</h2>
            <ul>
              {checklist.map((item) => (
                <li key={item}>
                  <Check /> {item}
                </li>
              ))}
            </ul>
          </section>
          <div>
            <article>
              <LockKeyhole />
              <div>
                <h2>Secure document exchange</h2>
                <p>
                  A private upload method will be provided when the engagement
                  requires documents. Never send Social Security numbers,
                  banking credentials, or account passwords by email.
                </p>
              </div>
            </article>
            <article>
              <MessagesSquare />
              <div>
                <h2>Communication rhythm</h2>
                <p>
                  The engagement kickoff identifies the primary contact,
                  expected response times, milestone updates, and how scope
                  changes are handled.
                </p>
              </div>
            </article>
          </div>
        </div>

        <div className="onboarding-notice">
          <strong>Important:</strong> Viewing this page does not establish a
          client relationship or authorize Jour et Nuit to begin work.
        </div>

        <Link className="button button-primary" href="/consultation">
          Begin with a strategy session <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  );
}
