# Payments System

Providers:

- Stripe Checkout.
- PayPal Orders API.

Checkout routes:

- `POST /api/checkout/stripe`
- `POST /api/checkout/paypal`

Webhook routes:

- `POST /api/webhooks/stripe`
- `POST /api/webhooks/paypal`

Webhook architecture:

1. Verify provider signature.
2. Store raw payment event in `PaymentEvent`.
3. Locate order.
4. Mark order paid.
5. Generate license.
6. Create portal notification.

Subscriptions are not implemented yet, but the order/payment model leaves room for future billing periods and upgrade paths.
