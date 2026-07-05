# Architecture Map

Public app:

- `/products`, `/products/[slug]`
- `/docs`, `/docs/[slug]`
- `/changelog`
- `/support`
- `/checkout/[slug]`

Customer app:

- `/portal`
- `/portal/products`
- `/portal/licenses`
- `/portal/orders`
- `/portal/downloads`
- `/portal/support`
- `/portal/notifications`
- `/portal/settings`
- `/portal/settings/discord`

Admin app:

- `/admin`
- `/admin/products`
- `/admin/customers`
- `/admin/orders`
- `/admin/licenses`
- `/admin/support`
- `/admin/analytics`
- `/admin/documentation`
- `/admin/team`
- `/admin/help`

API layers:

- `/api/v1/*` is the versioned MxF Hub API.
- `/api/licenses/*` is the runtime licensing API.
- `/api/discord/*` is the protected bot integration API.
- `/api/checkout/*` and `/api/webhooks/*` are provider integration points.
