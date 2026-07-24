import postgres from "postgres";
import Stripe from "stripe";
import { STRIPE_API_VERSION } from "./payment-domain";

type PaymentBindings = {
  SUPABASE_DATABASE_URL?: string;
  STRIPE_API_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PAYMENT_ADMIN_TOKEN?: string;
  PAYMENT_LINK_SECRET?: string;
  PAYMENT_PUBLIC_URL?: string;
};

export class PaymentConfigurationError extends Error {}

export function paymentBindings() {
  return process.env as PaymentBindings;
}

export function requireBinding(name: keyof PaymentBindings): string {
  const value = paymentBindings()[name]?.trim();
  if (!value) {
    throw new PaymentConfigurationError(
      `Required payment secret or setting ${name} is unavailable.`,
    );
  }
  return value;
}

export function requireLongSecret(
  name: "PAYMENT_ADMIN_TOKEN" | "PAYMENT_LINK_SECRET",
) {
  const value = requireBinding(name);
  if (new TextEncoder().encode(value).byteLength < 32) {
    throw new PaymentConfigurationError(
      `${name} must contain at least 32 bytes of secret material.`,
    );
  }
  return value;
}

let database: ReturnType<typeof postgres> | null = null;
let databaseUrl: string | null = null;

export function paymentDb() {
  const connectionString = requireBinding("SUPABASE_DATABASE_URL");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw new PaymentConfigurationError(
      "SUPABASE_DATABASE_URL must be a valid PostgreSQL connection URL.",
    );
  }

  if (!["postgres:", "postgresql:"].includes(parsedUrl.protocol)) {
    throw new PaymentConfigurationError(
      "SUPABASE_DATABASE_URL must use the PostgreSQL protocol.",
    );
  }

  if (!database || databaseUrl !== connectionString) {
    void database?.end({ timeout: 1 });
    database = postgres(connectionString, {
      // Supabase transaction pooling is serverless-safe but does not support
      // named prepared statements.
      prepare: false,
      ssl: ["localhost", "127.0.0.1"].includes(parsedUrl.hostname)
        ? false
        : "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    databaseUrl = connectionString;
  }

  return database;
}

export function stripeClient() {
  return new Stripe(requireBinding("STRIPE_API_KEY"), {
    // stripe-node types only its release-pinned version, but Stripe accepts
    // this explicitly selected, supported API version at runtime.
    apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 2,
    appInfo: {
      name: "Jour et Nuit Concierge",
      version: "0.1.0",
    },
  });
}

export async function paymentPublicUrl(request: Request) {
  const configuredUrl = requireBinding("PAYMENT_PUBLIC_URL");
  const url = new URL(configuredUrl);
  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new PaymentConfigurationError(
      "PAYMENT_PUBLIC_URL must use HTTPS outside local development.",
    );
  }

  const requestOrigin = new URL(request.url).origin;
  if (
    requestOrigin !== url.origin &&
    !["localhost", "127.0.0.1"].includes(new URL(requestOrigin).hostname)
  ) {
    throw new PaymentConfigurationError(
      "Payment request origin does not match PAYMENT_PUBLIC_URL.",
    );
  }

  return url.origin;
}
