# Implementation Log

Implemented:

- Customer Discord OAuth foundation.
- Customer sessions.
- Customer portal modules.
- Discord bot protected endpoints.
- Discord server linking model.
- Stripe and PayPal checkout foundations.
- Stripe and PayPal webhook receivers.
- Payment event storage.
- License activation, deactivation, reset, heartbeat, and validation telemetry.
- Documentation hub.
- Changelog page.
- Product delivery models.
- Admin customers, analytics, team, documentation, and help pages.
- MxF Hub `/api/v1` routes.
- Secure local storage abstraction.
- Protected download route with ownership, order, and license checks.
- Suspicious activity flags for manual anti-sharing review.
- Admin settings for support SLA, refund summary, storage, contact, and social values.
- Terms, Privacy, and Refund Policy pages.
- Resend email template and send helper foundation.
- Setup checklist documentation for every required `.env` value.
- Admin Setup Status page for Discord OAuth, Discord bot, PayPal, Stripe, Resend, database, local storage, and license API readiness.
- Local mock provider mode for Discord login and payment fulfillment testing.
- Product license rules on product records.
- Full demo data for Ticket Plus, LicenseGrid, Realm Ops, and Addon Forge.
- Local workflow runner for mock login, manual order, licensing, secure downloads, portal ownership, RBAC, support, and suspicious activity.

Pending live-provider work:

- Add production provider credentials.
- Configure Discord application redirect URL.
- Configure Stripe and PayPal webhooks.
- Replace placeholder private product files with real release artifacts.
