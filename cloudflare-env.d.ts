declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    STRIPE_API_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    PAYMENT_ADMIN_TOKEN?: string;
    PAYMENT_LINK_SECRET?: string;
    PAYMENT_PUBLIC_URL?: string;
  }
}
