import type { Product } from "@prisma/client";
import { isLiveProductStatus } from "@/lib/products/status";

export function mockPaymentsEnabled() {
  return process.env.PAYMENT_PROVIDER_MODE === "mock" || process.env.MOCK_PROVIDERS_ENABLED === "true";
}

export function stripeCheckoutConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && (process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_PROVIDER_MODE === "stripe"));
}

export function paypalCheckoutConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET && (process.env.PAYPAL_WEBHOOK_ID || process.env.PAYMENT_PROVIDER_MODE === "paypal"));
}

export function paymentProviderConfigured(provider?: "stripe" | "paypal") {
  if (mockPaymentsEnabled()) return true;
  if (provider === "stripe") return stripeCheckoutConfigured();
  if (provider === "paypal") return paypalCheckoutConfigured();
  return stripeCheckoutConfigured() || paypalCheckoutConfigured();
}

export function productCheckoutReady(product: Pick<Product, "visible" | "status" | "priceCents">) {
  return product.visible && product.priceCents > 0 && isLiveProductStatus(product.status) && paymentProviderConfigured();
}
