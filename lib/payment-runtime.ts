import Stripe from "stripe";
import { STRIPE_API_VERSION } from "./payment-domain";

type PaymentBindings = {
  DB?: D1Database;
  STRIPE_API_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PAYMENT_ADMIN_TOKEN?: string;
  PAYMENT_LINK_SECRET?: string;
  PAYMENT_PUBLIC_URL?: string;
};

export class PaymentConfigurationError extends Error {}

export async function paymentBindings() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as PaymentBindings;
}

export async function requireBinding(
  name: keyof Omit<PaymentBindings, "DB">,
): Promise<string> {
  const value = (await paymentBindings())[name]?.trim();
  if (!value) {
    throw new PaymentConfigurationError(
      `Required payment secret or setting ${name} is unavailable.`,
    );
  }
  return value;
}

export async function requireLongSecret(
  name: "PAYMENT_ADMIN_TOKEN" | "PAYMENT_LINK_SECRET",
) {
  const value = await requireBinding(name);
  if (new TextEncoder().encode(value).byteLength < 32) {
    throw new PaymentConfigurationError(
      `${name} must contain at least 32 bytes of secret material.`,
    );
  }
  return value;
}

export async function paymentDb() {
  const database = (await paymentBindings()).DB;
  if (!database) {
    throw new PaymentConfigurationError(
      "Cloudflare D1 binding DB is unavailable.",
    );
  }
  return database;
}

export async function stripeClient() {
  return new Stripe(await requireBinding("STRIPE_API_KEY"), {
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
  const configuredUrl = await requireBinding("PAYMENT_PUBLIC_URL");
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
