"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";

export function CheckoutButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function beginCheckout() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const result = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.error ?? "Unable to start checkout.");
      }

      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      setLoading(false);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout.",
      );
    }
  }

  return (
    <div className="payment-checkout-action">
      <button
        className="button button-primary"
        type="button"
        onClick={beginCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            Opening secure checkout <LoaderCircle className="spin" size={16} />
          </>
        ) : (
          <>
            Pay securely with Stripe <ArrowRight size={16} />
          </>
        )}
      </button>
      {error && (
        <p className="payment-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
