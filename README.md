# MxF Labs

MxF Labs is now structured as a software company ecosystem: public product discovery, Discord-first customer identity, checkout, licensing, product delivery, documentation, changelog, support, analytics, customer portal, and admin operations.

The design intentionally uses no AI-generated images, stock photos, renders, or placeholder illustrations. Visual polish comes from typography, gradients, grid systems, glass surfaces, geometric CSS, icons, SVG, and motion.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide icons
- Prisma + SQLite
- PostgreSQL-ready Prisma schema for production
- Discord OAuth foundation
- Stripe Checkout + PayPal Orders foundations
- Resend email foundation
- Private local product storage abstraction
- Signed HTTP-only admin and customer sessions
- Zod validation

## Run Locally

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

The local SQLite database is created at `prisma/dev.db`. It is ignored by git.

## Admin

- URL: `http://localhost:3000/admin/login`
- Email: `admin@mxf-labs.com`
- Password: `ChangeMe123!`

Change `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `AUTH_SECRET` before production.

Admin modules include products, projects, announcements, support, customers, contacts, orders, licenses, analytics, suspicious activity, documentation/delivery, team, settings, and help.

Configuration readiness lives at:

- `http://localhost:3000/admin/setup-status`

The setup checklist lives at `documentation/SETUP_CHECKLIST.md`.

## Customer Portal

Portal routes include:

- `/portal`
- `/portal/products`
- `/portal/licenses`
- `/portal/orders`
- `/portal/downloads`
- `/portal/support`
- `/portal/notifications`
- `/portal/settings`
- `/portal/settings/discord`

Discord OAuth routes:

- `/api/auth/discord/start`
- `/api/auth/discord/callback`
- `/api/auth/logout`

## Runtime APIs

Licensing:

- `POST /api/licenses/validate`
- `POST /api/licenses/activate`
- `POST /api/licenses/deactivate`
- `POST /api/licenses/reset`
- `POST /api/licenses/heartbeat`

Discord bot foundation:

- `POST /api/discord/customer`
- `POST /api/discord/license`
- `POST /api/discord/product`
- `POST /api/discord/server`
- `POST /api/discord/sync`

MxF Hub API:

- `/api/v1/auth`
- `/api/v1/customers`
- `/api/v1/products`
- `/api/v1/licenses/*`
- `/api/v1/orders`
- `/api/v1/downloads`
- `/api/v1/discord`
- `/api/v1/support`
- `/api/v1/analytics`

Secure downloads:

- `GET /api/downloads/[fileId]`

Downloads require customer auth, product ownership, paid order status, active license status, and private file availability.

## Payments

Checkout routes:

- `POST /api/checkout/stripe`
- `POST /api/checkout/paypal`

Webhook routes:

- `POST /api/webhooks/stripe`
- `POST /api/webhooks/paypal`

Provider routes fail closed until credentials are configured.

## Production Notes

- Target host: IONOS.
- Full production target: IONOS VPS/Cloud Server or another Node-capable host. Static hosting is not enough for API routes, Prisma, downloads, webhooks, and the Discord bot.
- Production database target: PostgreSQL.
- Local verified schema: `prisma/schema.prisma` using SQLite.
- Production schema variant: `prisma/schema.postgres.prisma` using PostgreSQL.
- Private local storage root: `storage/products`.
- Production private storage root: `/var/www/mxf-labs/storage/products`.
- Future storage backends: Cloudflare R2 and Amazon S3.
- Legal placeholders exist at `/terms`, `/privacy`, and `/refund-policy`.
- Owner settings live at `/admin/settings`.
- Anti-sharing review queue lives at `/admin/suspicious`.

## Documentation

Public docs:

- `/docs`
- `/docs/[slug]`
- `/changelog`
- `/documentation`

Architecture documents live in `documentation/`.

## Checks

```bash
npm run db:setup
npm run db:generate:postgres
npm run db:migrate
npm run production:check
npm run deploy:check
npm run typecheck
npm run lint
npm run build
npm run test:flows
```
