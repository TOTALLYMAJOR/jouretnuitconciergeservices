# Jour et Nuit Provider-Ready Launch Playbook

## Commercial truth states

1. Consultation requested
2. Consultation scheduled
3. Consultation completed
4. Proposal drafted
5. Proposal delivered
6. Proposal accepted
7. Deposit requested
8. Deposit pending
9. Deposit verified
10. Engagement authorized
11. Onboarding started

Proposal acceptance must never imply payment. A browser redirect, screenshot,
or client statement must never mark a deposit as paid. Only a verified Stripe
event may establish `deposit_verified`.

## Consultation script

### Opening

- Confirm the client’s objective and time available.
- Explain that the session is exploratory and does not guarantee service,
  financing, credit, filing, or legal outcomes.
- Ask what would make the conversation valuable.

### Discovery

- What is the business trying to accomplish in the next 90 days?
- What has already been completed?
- What is unclear, blocked, late, or inconsistent?
- Is there a deadline or third-party decision ahead?
- Who owns the decision and who will provide documents?
- What has already been tried?

### Fit decision

- Fit: Jour et Nuit can define a clear, lawful, supportable scope.
- Refer: the need requires a licensed attorney, accountant, tax professional,
  lender, financial adviser, or other specialist.
- Decline: the client requests a guarantee, misrepresentation, inaccurate
  filing, credit manipulation, or work outside the firm’s capabilities.

### Close

- Summarize the priority in plain language.
- State whether a proposal will follow and when.
- Do not quote an unreviewed scope as a guaranteed final price.

## Lead qualification scorecard

Score each item from 0 to 2:

- Clear business objective
- Appropriate service fit
- Realistic timeline
- Willingness to provide accurate information
- Decision-maker participation
- Capacity to complete client responsibilities
- Acceptance of no-guarantee boundaries

Interpretation:

- 11–14: strong fit for a scoped proposal
- 7–10: clarify requirements before proposing
- 0–6: refer, educate, or decline

## Proposal requirements

Every proposal should include:

- Client and business name
- Proposal identifier and version
- Issue date and expiration date
- Client objective
- Included deliverables
- Explicit exclusions
- Client responsibilities
- Milestones and estimated timing
- Total professional fee
- Third-party fees, if any
- Deposit amount and due date
- Remaining payment schedule
- Cancellation and refund treatment
- Scope-change method
- No-guarantee statement
- Acceptance language

## Deposit request email

Subject: Jour et Nuit proposal accepted — deposit request

Thank you for accepting proposal [PROPOSAL ID]. Your scope is now agreed, but
the engagement is not yet active. The required deposit is [AMOUNT], due
[DATE]. Please use the secure Stripe payment link in this message. Work will be
authorized only after Stripe confirms the payment and all stated prerequisites
are satisfied.

## Onboarding checklist

- Verify proposal identifier and accepted version.
- Verify the required deposit through the provider event.
- Confirm primary client contact.
- Send secure document-exchange instructions.
- Send required-document checklist.
- Confirm milestone dates and response expectations.
- Record referrals or professional-boundary exceptions.
- Record the first authorized action.

## Stripe implementation acceptance criteria

- Checkout amount is resolved server-side from an immutable proposal record.
- Client input cannot change price, currency, or deposit amount.
- Idempotency prevents duplicate Checkout sessions.
- Webhook signature is verified before processing.
- Events are idempotently recorded by Stripe event ID.
- `checkout.session.completed` is not treated as paid when payment status is
  still pending.
- Only the verified terminal payment state authorizes onboarding.
- Success and cancellation pages describe browser state, not payment truth.
- Restricted keys and webhook secrets remain in the hosting secret store.
- Sandbox tests cover success, decline, cancellation, delayed payment, duplicate
  events, and webhook replay.

## Calendly implementation acceptance criteria

- Event title: Jour et Nuit Strategy Session
- Duration: 30 minutes
- Minimum notice: 24 hours
- Buffers: 15 minutes before and after
- Daily limit: 3–4 meetings
- Business calendar connected
- Location configured
- Intake questions mirror the website qualification fields
- Confirmation and reminder messages explain preparation expectations
- Cancellation and rescheduling links remain available
