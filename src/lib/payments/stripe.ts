function stripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY;
}

export function stripeConfigured() {
  return Boolean(stripeSecretKey());
}

export async function createStripeCheckoutSession({
  orderId,
  productName,
  productSlug,
  amountCents,
  currency,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  orderId: string;
  productName: string;
  productSlug: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const key = stripeSecretKey();

  if (!key) {
    throw new Error("Stripe is not configured.");
  }

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", successUrl);
  body.set("cancel_url", cancelUrl);
  body.set("customer_email", customerEmail);
  body.set("client_reference_id", orderId);
  body.set("line_items[0][quantity]", "1");
  body.set("line_items[0][price_data][currency]", currency.toLowerCase());
  body.set("line_items[0][price_data][unit_amount]", String(amountCents));
  body.set("line_items[0][price_data][product_data][name]", productName);
  body.set("metadata[orderId]", orderId);
  body.set("metadata[productSlug]", productSlug);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Stripe checkout failed: ${await response.text()}`);
  }

  return (await response.json()) as { id: string; url: string | null };
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyStripeSignature({
  rawBody,
  signatureHeader,
}: {
  rawBody: string;
  signatureHeader: string | null;
}) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  return expected === signature;
}
