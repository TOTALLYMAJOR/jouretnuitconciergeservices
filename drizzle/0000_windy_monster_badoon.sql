CREATE TABLE `payment_checkout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`proposal_key` text NOT NULL,
	`attempt` integer NOT NULL,
	`status` text NOT NULL,
	`payment_status` text NOT NULL,
	`amount_total` integer NOT NULL,
	`currency` text NOT NULL,
	`expires_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`proposal_key`) REFERENCES `payment_proposals`(`key`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payment_checkout_sessions_status_valid" CHECK("payment_checkout_sessions"."status" IN ('open', 'complete', 'expired')),
	CONSTRAINT "payment_checkout_sessions_payment_status_valid" CHECK("payment_checkout_sessions"."payment_status" IN ('unpaid', 'paid', 'no_payment_required'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_checkout_sessions_proposal_attempt_unique` ON `payment_checkout_sessions` (`proposal_key`,`attempt`);--> statement-breakpoint
CREATE INDEX `payment_checkout_sessions_proposal_idx` ON `payment_checkout_sessions` (`proposal_key`);--> statement-breakpoint
CREATE TABLE `payment_proposals` (
	`key` text PRIMARY KEY NOT NULL,
	`proposal_id` text NOT NULL,
	`version` integer NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text NOT NULL,
	`business_name` text,
	`description` text NOT NULL,
	`acceptance_reference` text NOT NULL,
	`immutable_fingerprint` text NOT NULL,
	`deposit_amount` integer NOT NULL,
	`currency` text NOT NULL,
	`status` text DEFAULT 'deposit_requested' NOT NULL,
	`accepted_at` integer NOT NULL,
	`due_at` integer,
	`deposit_verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "payment_proposals_version_positive" CHECK("payment_proposals"."version" > 0),
	CONSTRAINT "payment_proposals_deposit_amount_positive" CHECK("payment_proposals"."deposit_amount" > 0),
	CONSTRAINT "payment_proposals_currency_lowercase" CHECK("payment_proposals"."currency" = lower("payment_proposals"."currency") AND length("payment_proposals"."currency") = 3),
	CONSTRAINT "payment_proposals_status_valid" CHECK("payment_proposals"."status" IN ('deposit_requested', 'deposit_pending', 'deposit_verified', 'cancelled', 'expired'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_proposals_id_version_unique` ON `payment_proposals` (`proposal_id`,`version`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_proposals_fingerprint_unique` ON `payment_proposals` (`immutable_fingerprint`);--> statement-breakpoint
CREATE TABLE `stripe_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`object_id` text,
	`processing_status` text NOT NULL,
	`message` text,
	`received_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "stripe_webhook_events_processing_status_valid" CHECK("stripe_webhook_events"."processing_status" IN ('processed', 'ignored', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `stripe_webhook_events_type_idx` ON `stripe_webhook_events` (`type`);