# Jour et Nuit feature log

This is the canonical record of product features and their delivery state.
Update it in the same change that adds, materially changes, verifies, or
retires a feature.

## Status definitions

- **Production verified**: deployed to the production domain and exercised
  against the intended production providers.
- **Production deployed**: deployed to production, but complete provider or
  workflow verification has not been recorded.
- **Preview verified**: deployed to a Vercel Preview and exercised against
  sandbox or non-production providers.
- **Provider verified**: the external provider state was inspected or tested,
  but the complete hosted workflow is not yet production verified.
- **Implemented**: code and repository validation exist without hosted proof.
- **Documented**: an operational or product contract exists without a
  corresponding complete runtime workflow.

Repository code, local checks, provider configuration, hosted behavior, and
production readiness are separate evidence classes. A feature must not be
promoted to a stronger status without evidence for that exact claim.

## Current feature register

| Feature | Current status | Last updated | Primary evidence |
| --- | --- | --- | --- |
| Public concierge website and service journeys | Production deployed | 2026-07-23 | `132e1f1`, Ready Vercel production deployment |
| Provider-ready consultation and onboarding playbook | Documented | 2026-07-23 | `docs/provider-ready-launch.md` |
| Accepted-proposal Stripe deposits | Preview verified | 2026-07-24 | `85f27a9`, sandbox Checkout and signed webhook proof |
| Supabase payment persistence | Provider verified | 2026-07-24 | `f2e831e`, applied private-schema migration and database query |
| Vercel Preview payment environment | Preview verified | 2026-07-24 | `45cf284`, `a72d8d7`, `161c6ea`, Ready branch Preview |

## 2026-07-24 — Accepted-proposal Stripe deposits

**Status:** Preview verified

Implemented Stripe-hosted Checkout for one-time deposits tied to immutable,
accepted proposal versions.

### Delivered

- Server-authorized proposal issuance protected by `PAYMENT_ADMIN_TOKEN`.
- Deterministic signed customer payment links protected by a separate
  `PAYMENT_LINK_SECRET`.
- Server-owned deposit amount, currency, description, acceptance reference,
  and proposal version.
- Stripe Checkout Session creation with dynamic payment methods.
- Signature-verified webhook handling for:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
- Idempotent webhook storage and fail-closed payment-state transitions.
- Success, pending, cancellation, invalid-link, expired-link, and
  already-verified customer states.

### Evidence

- Code commit: `85f27a9` (`Implement Stripe proposal payments`).
- Unit coverage: `tests/payment-domain.test.mjs`.
- Vercel Preview build completed with TypeScript and Next.js compilation
  passing.
- Stripe sandbox API key created and immediately expired a hosted Checkout
  Session.
- Stripe delivered signed sandbox events through the protected Vercel branch
  Preview.
- The hosted webhook verified the signature and persisted the expected event
  result in Supabase.

### Remaining before production verification

- Replace the temporary sandbox key with a dedicated least-privilege live
  restricted key.
- Register and verify the live production webhook endpoint.
- Exercise a complete accepted-proposal payment using a Stripe test payment
  method before enabling live payments.
- Document the operational refund and payment-exception procedure.
- Promote the reviewed pull request and verify the production domain.

## 2026-07-24 — Supabase payment persistence

**Status:** Provider verified

Moved payment truth from optional starter storage to a dedicated Supabase
Postgres project.

### Delivered

- Private `jour_payments` schema.
- `payment_proposals` table for immutable commercial terms and deposit state.
- `payment_checkout_sessions` table for Stripe Checkout attempts.
- `stripe_webhook_events` table for replay-safe provider evidence.
- Row-level security enabled with no anonymous or authenticated client access.
- Serverless-safe transaction pooler support with prepared statements
  disabled.
- Runtime support for either `SUPABASE_DATABASE_URL` or the Vercel integration's
  `POSTGRES_URL`.

### Evidence

- Migration:
  `supabase/migrations/20260724144218_jour_payment_persistence.sql`.
- Code commits: `f2e831e` and `a72d8d7`.
- Migration applied to the Supabase project.
- Direct query confirmed all three payment tables are reachable.
- Security advisors reported only the intentional no-policy RLS information
  notices.

### Current limitation

The Preview currently uses the same Supabase project credentials synchronized
for Production and Preview. Create an isolated Supabase branch or staging
project before allowing broader Preview collaboration or realistic customer
data.

## 2026-07-24 — Vercel Preview payment environment

**Status:** Preview verified

### Delivered

- Git branch Preview builds for `agent/stripe-payments`.
- Supabase Marketplace integration synchronized database credentials.
- Branch-scoped Stripe sandbox API key and webhook signing secret.
- Separate generated payment administration and payment-link secrets.
- Canonical Preview payment origin.
- Vercel Deployment Protection retained, with a dedicated automation bypass
  used only by the Stripe sandbox webhook.
- Local browser artifacts excluded from Git.

### Evidence

- Commits: `45cf284`, `a72d8d7`, and `161c6ea`.
- Ready branch Preview:
  `https://jouretnuitconciergeservices-git-agent-stripe-payments-mbmapps.vercel.app`.
- Local, upstream, and remote branch SHA matched at
  `161c6ea7a45bee1683e1b89eb07c679f742e028a`.

## 2026-07-23 — Public concierge website

**Status:** Production deployed

Delivered the Jour et Nuit public website and primary customer journeys:

- Home and service positioning.
- Assessment, consultation, proposal, engagement, onboarding, and policies
  routes.
- Business credit, documents and filing, and business education service pages.
- Responsive visual system and production assets.

### Evidence

- Initial implementation: `5fe97c8`.
- Published website commit: `132e1f1`.
- Vercel production deployment reported Ready for
  `https://jouretnuitconcierge.com`.

### Remaining verification

Record a production browser pass for the primary navigation, consultation CTA,
responsive layouts, and public-domain metadata before promoting this entry to
Production verified.

## 2026-07-23 — Provider-ready launch playbook

**Status:** Documented

Created the commercial operating contract for consultation qualification,
proposal requirements, deposit requests, onboarding, Stripe acceptance
criteria, and Calendly acceptance criteria.

### Evidence

- `docs/provider-ready-launch.md`.

### Remaining verification

Provider configuration and complete production workflow evidence must be
recorded separately; documentation alone does not establish operational
readiness.

## Maintenance rules

For every future feature:

1. Add or update one dated entry in this file.
2. Record the exact feature status using the definitions above.
3. Link the implementation files and commit SHA.
4. Record validation separately for repository checks, provider checks,
   hosted Preview, and Production.
5. List remaining gaps without converting assumptions into shipped claims.
6. Never record API keys, signing secrets, private customer links, bypass
   tokens, or customer data.
