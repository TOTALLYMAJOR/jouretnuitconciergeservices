import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const paymentProposals = sqliteTable(
  "payment_proposals",
  {
    key: text("key").primaryKey(),
    proposalId: text("proposal_id").notNull(),
    version: integer("version").notNull(),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull(),
    businessName: text("business_name"),
    description: text("description").notNull(),
    acceptanceReference: text("acceptance_reference").notNull(),
    immutableFingerprint: text("immutable_fingerprint").notNull(),
    depositAmount: integer("deposit_amount").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("deposit_requested"),
    acceptedAt: integer("accepted_at").notNull(),
    dueAt: integer("due_at"),
    depositVerifiedAt: integer("deposit_verified_at"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("payment_proposals_id_version_unique").on(
      table.proposalId,
      table.version,
    ),
    uniqueIndex("payment_proposals_fingerprint_unique").on(
      table.immutableFingerprint,
    ),
    check("payment_proposals_version_positive", sql`${table.version} > 0`),
    check(
      "payment_proposals_deposit_amount_positive",
      sql`${table.depositAmount} > 0`,
    ),
    check(
      "payment_proposals_currency_lowercase",
      sql`${table.currency} = lower(${table.currency}) AND length(${table.currency}) = 3`,
    ),
    check(
      "payment_proposals_status_valid",
      sql`${table.status} IN ('deposit_requested', 'deposit_pending', 'deposit_verified', 'cancelled', 'expired')`,
    ),
  ],
);

export const paymentCheckoutSessions = sqliteTable(
  "payment_checkout_sessions",
  {
    id: text("id").primaryKey(),
    proposalKey: text("proposal_key")
      .notNull()
      .references(() => paymentProposals.key, { onDelete: "restrict" }),
    attempt: integer("attempt").notNull(),
    status: text("status").notNull(),
    paymentStatus: text("payment_status").notNull(),
    amountTotal: integer("amount_total").notNull(),
    currency: text("currency").notNull(),
    expiresAt: integer("expires_at"),
    createdAt: integer("created_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    updatedAt: integer("updated_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    uniqueIndex("payment_checkout_sessions_proposal_attempt_unique").on(
      table.proposalKey,
      table.attempt,
    ),
    index("payment_checkout_sessions_proposal_idx").on(table.proposalKey),
    check(
      "payment_checkout_sessions_status_valid",
      sql`${table.status} IN ('open', 'complete', 'expired')`,
    ),
    check(
      "payment_checkout_sessions_payment_status_valid",
      sql`${table.paymentStatus} IN ('unpaid', 'paid', 'no_payment_required')`,
    ),
  ],
);

export const stripeWebhookEvents = sqliteTable(
  "stripe_webhook_events",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    objectId: text("object_id"),
    processingStatus: text("processing_status").notNull(),
    message: text("message"),
    receivedAt: integer("received_at")
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("stripe_webhook_events_type_idx").on(table.type),
    check(
      "stripe_webhook_events_processing_status_valid",
      sql`${table.processingStatus} IN ('processed', 'ignored', 'rejected')`,
    ),
  ],
);
