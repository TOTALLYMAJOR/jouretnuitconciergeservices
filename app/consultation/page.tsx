"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";

const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();

export default function Consultation() {
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(
      `Strategy session request — ${data.get("name")}`,
    );
    const body = encodeURIComponent(
      [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Business: ${data.get("business")}`,
        `Business stage: ${data.get("stage")}`,
        `Primary focus: ${data.get("focus")}`,
        `Preferred timing: ${data.get("timing")}`,
        "",
        "What I want help with:",
        String(data.get("goal")),
        "",
        "What I have already tried:",
        String(data.get("attempted")),
      ].join("\n"),
    );
    setSent(true);
    window.location.href = `mailto:hello@jouretnuitconcierge.services?subject=${subject}&body=${body}`;
  }

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

      <section className="subhero consultation-layout">
        <div>
          <p className="kicker">Private strategy session</p>
          <h1>
            Let’s make the next move <em>intentional.</em>
          </h1>
          <p>
            This is a focused business conversation—not a sales ambush. We will
            clarify the goal, identify the highest-priority gaps, and determine
            whether Jour et Nuit is the right partner for the work.
          </p>
          <div className="session-notes">
            <span>
              <Clock3 /> 30-minute discovery conversation
            </span>
            <span>
              <Check /> Clear next-step recommendation
            </span>
            <span>
              <ShieldCheck /> Guidance, not funding guarantees
            </span>
          </div>

          <aside className="prepare-card">
            <div>
              <FileText size={18} />
              <strong>Come prepared to discuss</strong>
            </div>
            <ul>
              <li>Your immediate business priority</li>
              <li>What is currently slowing progress</li>
              <li>Any deadline or opportunity ahead</li>
              <li>The documents or systems already in place</li>
            </ul>
          </aside>
        </div>

        {calendlyUrl ? (
          <section className="calendly-shell" aria-labelledby="calendar-title">
            <div className="form-intro">
              <span>01</span>
              <div>
                <h2 id="calendar-title">Choose a time</h2>
                <p>
                  Select an available strategy-session time. Confirmation is
                  sent by the scheduling provider.
                </p>
              </div>
            </div>
            <iframe
              title="Schedule a Jour et Nuit strategy session"
              src={`${calendlyUrl}?hide_gdpr_banner=1&background_color=171612&text_color=f4efe4&primary_color=c8ac72`}
              loading="lazy"
            />
            <a
              className="text-link"
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open the scheduler in a new window <ArrowRight size={15} />
            </a>
          </section>
        ) : (
          <form className="consult-form" onSubmit={submit}>
            <div className="form-intro">
              <span>01</span>
              <div>
                <h2>Request your session</h2>
                <p>
                  Until live scheduling is connected, this prepares a
                  structured email request for you to review and send.
                </p>
              </div>
            </div>
            <div className="form-grid">
              <label>
                Full name
                <input name="name" required autoComplete="name" />
              </label>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </label>
            </div>
            <label>
              Business name
              <input name="business" required autoComplete="organization" />
            </label>
            <label>
              Business stage
              <select name="stage" required defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                <option>Planning or pre-launch</option>
                <option>Operating less than one year</option>
                <option>Established and reorganizing</option>
                <option>Growing or preparing to scale</option>
              </select>
            </label>
            <label>
              Primary focus
              <select name="focus" required defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                <option>Business credit readiness</option>
                <option>Documents and filing</option>
                <option>Business education or coaching</option>
                <option>Growth strategy</option>
                <option>Not sure yet</option>
              </select>
            </label>
            <label>
              Preferred timing
              <select name="timing" required defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                <option>Within 1–2 weeks</option>
                <option>Within 30 days</option>
                <option>Exploring for later</option>
              </select>
            </label>
            <label>
              What would make this conversation valuable?
              <textarea name="goal" required rows={4} />
            </label>
            <label>
              What have you already tried?
              <textarea name="attempted" required rows={3} />
            </label>
            <button className="button button-primary" type="submit">
              Prepare my request <ArrowRight size={16} />
            </button>
            {sent && (
              <p className="form-status" role="status">
                Your email app should open now. Send the prepared message to
                complete your request.
              </p>
            )}
            <p className="form-privacy">
              Your information is used only to respond to this request. Review
              our <Link href="/policies#privacy">privacy notice</Link>.
            </p>
          </form>
        )}
      </section>

      <section className="consult-journey">
        <div className="shell">
          <p className="kicker">What happens next</p>
          <div>
            {[
              ["01", "Conversation", "We clarify the need and determine fit."],
              ["02", "Written proposal", "Scope, timeline, price, and exclusions are documented."],
              ["03", "Your decision", "You may accept, decline, or ask questions before paying."],
              ["04", "Deposit", "Payment is requested only after proposal acceptance."],
            ].map(([number, title, copy]) => (
              <article key={number}>
                <span>{number}</span>
                <h2>{title}</h2>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <Link className="text-link" href="/engagement">
            See the complete engagement process <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </main>
  );
}
