create schema if not exists jour_payments;

comment on schema jour_payments is
  'Private server-side payment persistence for Jour et Nuit Concierge.';

revoke all on schema jour_payments from public, anon, authenticated;

create table jour_payments.payment_proposals (
  key text primary key,
  proposal_id text not null,
  version integer not null,
  client_name text not null,
  client_email text not null,
  business_name text,
  description text not null,
  acceptance_reference text not null,
  immutable_fingerprint text not null,
  deposit_amount integer not null,
  currency text not null,
  status text not null default 'deposit_requested',
  accepted_at bigint not null,
  due_at bigint,
  deposit_verified_at bigint,
  created_at bigint not null,
  updated_at bigint not null,
  constraint payment_proposals_id_version_unique
    unique (proposal_id, version),
  constraint payment_proposals_fingerprint_unique
    unique (immutable_fingerprint),
  constraint payment_proposals_version_positive
    check (version > 0),
  constraint payment_proposals_deposit_amount_valid
    check (deposit_amount between 100 and 100000000),
  constraint payment_proposals_currency_lowercase
    check (currency = lower(currency) and currency ~ '^[a-z]{3}$'),
  constraint payment_proposals_status_valid
    check (
      status in (
        'deposit_requested',
        'deposit_pending',
        'deposit_verified',
        'cancelled',
        'expired'
      )
    ),
  constraint payment_proposals_timestamps_valid
    check (
      accepted_at >= 0
      and (due_at is null or due_at >= accepted_at)
      and created_at >= 0
      and updated_at >= 0
    )
);

create table jour_payments.payment_checkout_sessions (
  id text primary key,
  proposal_key text not null
    references jour_payments.payment_proposals (key) on delete restrict,
  attempt integer not null,
  status text not null,
  payment_status text not null,
  amount_total integer not null,
  currency text not null,
  expires_at bigint,
  created_at bigint not null,
  updated_at bigint not null,
  constraint payment_checkout_sessions_proposal_attempt_unique
    unique (proposal_key, attempt),
  constraint payment_checkout_sessions_attempt_positive
    check (attempt > 0),
  constraint payment_checkout_sessions_status_valid
    check (status in ('open', 'complete', 'expired')),
  constraint payment_checkout_sessions_payment_status_valid
    check (payment_status in ('unpaid', 'paid', 'no_payment_required')),
  constraint payment_checkout_sessions_amount_positive
    check (amount_total > 0),
  constraint payment_checkout_sessions_currency_lowercase
    check (currency = lower(currency) and currency ~ '^[a-z]{3}$'),
  constraint payment_checkout_sessions_timestamps_valid
    check (
      (expires_at is null or expires_at >= 0)
      and created_at >= 0
      and updated_at >= 0
    )
);

create index payment_checkout_sessions_proposal_key_idx
  on jour_payments.payment_checkout_sessions (proposal_key);

create table jour_payments.stripe_webhook_events (
  id text primary key,
  type text not null,
  object_id text,
  processing_status text not null,
  message text not null,
  received_at bigint not null,
  constraint stripe_webhook_events_processing_status_valid
    check (processing_status in ('processed', 'ignored', 'rejected')),
  constraint stripe_webhook_events_received_at_valid
    check (received_at >= 0)
);

create index stripe_webhook_events_object_id_idx
  on jour_payments.stripe_webhook_events (object_id)
  where object_id is not null;

alter table jour_payments.payment_proposals enable row level security;
alter table jour_payments.payment_checkout_sessions enable row level security;
alter table jour_payments.stripe_webhook_events enable row level security;

revoke all on all tables in schema jour_payments
  from public, anon, authenticated;

alter default privileges in schema jour_payments
  revoke all on tables from public, anon, authenticated;
