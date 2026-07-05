# MxF Labs Platform Overview

MxF Labs is now structured as a software company ecosystem: public product discovery, Discord-first customer identity, checkout, licensing, downloads, documentation, changelog, support, analytics, and admin operations.

Primary flow:

1. Customer discovers a product.
2. Customer signs in or links Discord.
3. Customer starts Stripe or PayPal checkout.
4. Webhook records the payment event.
5. Order is marked paid.
6. License is generated.
7. Portal shows products, licenses, orders, downloads, support, and notifications.
8. Product runtimes validate licenses through the licensing server.
