# Database Architecture

Core entities:

- `Customer` stores account and Discord identity.
- `CustomerSession` stores hashed customer session tokens.
- `Product`, `ProductRelease`, and `ProductDownload` manage product delivery.
- `Order`, `PaymentEvent`, `Refund`, and `Coupon` manage commerce.
- `License`, `LicenseActivation`, and `LicenseValidation` manage licensing.
- `DocumentationArticle` and `ChangelogEntry` manage docs and release notes.
- `SupportTicket` and `SupportTicketNote` manage support.
- `DiscordServer` links products, customers, licenses, and Discord servers.
- `ActivityLog` and `CustomerActivity` provide audit history.

SQLite is used locally for this workspace. PostgreSQL is the production target.

Schemas:

- `prisma/schema.prisma` is the local SQLite schema used by `npm run db:setup`.
- `prisma/schema.postgres.prisma` is the production PostgreSQL schema variant.

The Prisma models are kept aligned so production can migrate to PostgreSQL without changing app-level data contracts.

Production commands:

```bash
npm run db:generate:postgres
npm run db:migrate
```

`npm run db:migrate` runs `prisma migrate deploy --schema prisma/schema.postgres.prisma` and uses the checked-in PostgreSQL migration files under `prisma/migrations`.
