# Stripe proposal deposits

Jour et Nuit uses Stripe-hosted Checkout for one-time proposal deposits. The
browser never supplies an amount, currency, description, or acceptance state.
Those values come from an immutable record in a private Supabase Postgres
schema created only after the proposal has been accepted.

## Truth boundary

- Creating or visiting a payment link does not establish payment.
- Starting Checkout changes the local proposal to `deposit_pending`.
- A Checkout success redirect does not establish payment.
- `checkout.session.completed` remains pending when `payment_status` is not
  `paid`.
- Only a signature-verified paid event whose session, metadata fingerprint,
  amount, and currency match the local record sets `deposit_verified`.
- A verified deposit authorizes the onboarding handoff, not arbitrary work
  outside the accepted proposal.

## Required infrastructure

1. Create a dedicated Supabase project and apply the migration under
   `supabase/migrations/`.
2. Set `SUPABASE_DATABASE_URL` to the Supabase transaction-pooler connection
   URL (port `6543`) in the server-side hosting secret store. The database
   client disables prepared statements for transaction-pooler compatibility.
   When the Supabase Vercel integration supplies `POSTGRES_URL`, the runtime
   accepts that synchronized value instead.
3. Store these values in the hosting secret store, never in Git:
   - `STRIPE_API_KEY`: preferably a restricted key with the minimum Checkout
     Session permissions needed by this service.
   - `STRIPE_WEBHOOK_SECRET`: the endpoint signing secret.
   - `PAYMENT_ADMIN_TOKEN`: a long random token for the proposal-issuance API.
   - `PAYMENT_LINK_SECRET`: a different random secret, at least 32 bytes.
   - `PAYMENT_PUBLIC_URL`: the canonical HTTPS site origin.
4. Register `POST /api/stripe/webhook` in Stripe Workbench for:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

The Stripe API version is pinned in code to `2026-05-27.dahlia`. Dynamic payment
methods remain enabled because the Checkout request does not hard-code
`payment_method_types`.

## Issue an accepted proposal payment link

The operator endpoint is not a proposal acceptance endpoint. Call it only after
the accepted proposal version and acceptance evidence have been recorded.
`depositAmount` is an integer in the currency's minor unit (for USD, cents).

```bash
curl --request POST \
  --url https://YOUR_SITE/api/payment-proposals \
  --header "Authorization: Bearer $PAYMENT_ADMIN_TOKEN" \
  --header "Content-Type: application/json" \
  --data '{
    "proposalId": "JN-1042",
    "version": 2,
    "clientName": "Ada Client",
    "clientEmail": "ada@example.com",
    "businessName": "Ada & Co.",
    "description": "Business readiness engagement deposit",
    "acceptanceReference": "esign-event-or-internal-record-id",
    "depositAmount": 125000,
    "currency": "usd",
    "acceptedAt": "2026-07-23T15:00:00.000Z",
    "dueAt": "2026-08-06T23:59:59.000Z"
  }'
```

The response contains a deterministic, signed private `paymentUrl`. Repeating
the exact request safely returns the same URL. Reusing the proposal ID and
version with changed commercial terms returns `409`.

## Sandbox verification

Run unit tests:

```bash
npm run test:unit
```

For a Stripe sandbox:

1. Start the app with test secrets in ignored `.dev.vars`.
2. Forward Stripe events to
   `http://localhost:3000/api/stripe/webhook`.
3. Issue a test proposal through the operator endpoint.
4. Exercise successful, declined, cancelled, and delayed payment methods.
5. Resend a completed event and confirm its event ID appears only once in
   `stripe_webhook_events`.
6. Confirm the success page remains a return/verification state until the
   verified webhook updates Supabase Postgres.

Do not switch to live mode until the Supabase migration, private-schema access,
HTTPS origin, restricted key, webhook signing secret, event subscriptions,
replay behavior, and operational refund process have each been verified.
