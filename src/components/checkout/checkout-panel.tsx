"use client";

import { CreditCard, WalletCards } from "lucide-react";
import { useState } from "react";

export function CheckoutPanel({
  productSlug,
  productName,
  price,
}: {
  productSlug: string;
  productName: string;
  price: string;
}) {
  const [message, setMessage] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  async function checkout(provider: "stripe" | "paypal", form: HTMLFormElement) {
    setLoadingProvider(provider);
    setMessage("");
    const data = new FormData(form);
    const response = await fetch(`/api/checkout/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug,
        customerEmail: data.get("customerEmail"),
        customerName: data.get("customerName"),
        couponCode: data.get("couponCode"),
      }),
    });
    const result = await response.json();
    setLoadingProvider(null);

    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }

    setMessage(result.message || "Checkout could not be started.");
  }

  return (
    <form
      className="surface rounded-lg p-5"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <p className="font-mono text-xs text-[#ff6262]">One-time purchase</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{productName}</h2>
      <p className="mt-2 text-sm text-white/54">{price}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-white/70">Email</span>
          <input name="customerEmail" type="email" required className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-semibold text-white/70">Name</span>
          <input name="customerName" className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="text-xs font-semibold text-white/70">Coupon</span>
          <input name="couponCode" placeholder="Optional" className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#ff6262]/60" />
        </label>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={(event) => checkout("stripe", event.currentTarget.form!)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-4 text-sm font-semibold text-[#ffd8d8]"
        >
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          {loadingProvider === "stripe" ? "Starting..." : "Pay with Stripe"}
        </button>
        <button
          type="button"
          onClick={(event) => checkout("paypal", event.currentTarget.form!)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-white/76"
        >
          <WalletCards className="h-4 w-4" aria-hidden="true" />
          {loadingProvider === "paypal" ? "Starting..." : "Pay with PayPal"}
        </button>
      </div>
      <p className="mt-4 min-h-5 text-sm text-[#ffe1a3]" aria-live="polite">
        {message}
      </p>
    </form>
  );
}
