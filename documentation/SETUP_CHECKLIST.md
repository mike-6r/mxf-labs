# MxF Labs Setup Checklist

This checklist shows every value needed for production readiness. Put these values in `.env` locally and in the IONOS/hosting environment for production. Local development can continue with SQLite and mock providers until real credentials are pasted in.

## Core Platform

| Value | `.env` key | Powers | Local default |
| --- | --- | --- | --- |
| Database URL | `DATABASE_URL` | Prisma database connection for every model, portal, admin, orders, licenses, support, docs, downloads, and analytics | `file:./dev.db` |
| Admin email | `ADMIN_EMAIL` | First seeded admin account | `admin@mxf-labs.com` |
| Admin password | `ADMIN_PASSWORD` | First seeded admin password | `ChangeMe123!` |
| Session secret | `AUTH_SECRET` | Signed admin/customer sessions, OAuth state, download tokens | Required before production |
| Public site URL | `NEXT_PUBLIC_SITE_URL` | Checkout redirects, canonical local URLs, future emails | `http://localhost:3000`; production `https://mxf-labs.com` |
| Public site mode | `NEXT_PUBLIC_SITE_MODE`, `PUBLIC_SITE_MODE` | Controls whether visitors see the Coming Soon landing page or the full storefront | Use `coming-soon` before launch; set both to `full` when ready |
| Content mode | `CONTENT_MODE` | Demo/clean/production content visibility | `clean` locally; `production` live |
| Support email | `SUPPORT_EMAIL` | Support forms, footer contact, notification fallback | `support@mxf-labs.com` |
| Sender email | `FROM_EMAIL` | Resend transactional sender | `MxF Labs <support@mxf-labs.com>` |
| Mock providers | `MOCK_PROVIDERS_ENABLED` | Local Discord/payment workflow testing without external calls | `true` locally; `false` live |
| IONOS deploy target | `IONOS_DEPLOY_TARGET` | Admin production readiness note for hosting type | `vps` after selecting an IONOS VPS/Cloud server |

## Discord

| Value | `.env` key | Powers | Local/mock behavior |
| --- | --- | --- | --- |
| Discord client ID | `DISCORD_CLIENT_ID` | Discord OAuth login | Mock login available at `/api/auth/mock-discord` |
| Discord client secret | `DISCORD_CLIENT_SECRET` | OAuth token exchange | Mock login does not require it |
| Discord public key | `DISCORD_PUBLIC_KEY` | Future Discord interaction verification | Not required for local portal testing |
| Discord redirect URI | `DISCORD_REDIRECT_URI` | OAuth callback target | `http://localhost:3000/api/auth/discord/callback`; production `https://mxf-labs.com/api/auth/discord/callback` |
| Discord bot token | `DISCORD_BOT_TOKEN` | Live Discord.js bot login | Not required while `BOT_LOCAL_MODE="true"` |
| Discord guild ID | `DISCORD_GUILD_ID` | Guild-scoped command registration and local server config | Optional until registering live commands |
| Website API base URL | `MXF_API_BASE_URL` | Bot-to-website API calls | `http://localhost:3000` |
| Bot website API key | `MXF_BOT_API_KEY` | Protected `/api/discord/*` bot routes and heartbeat | Preferred key for new bot runtime |
| Legacy bot API key | `DISCORD_BOT_API_KEY` | Protected `/api/discord/*` fallback | Supported for compatibility |
| Bot local mode | `BOT_LOCAL_MODE` | Dry-run startup and tests without real Discord token | `true` locally; `false` live |
| Register commands on start | `BOT_REGISTER_COMMANDS_ON_START` | Optional command registration during bot boot | `false` |
| Heartbeat interval | `BOT_HEARTBEAT_INTERVAL_SECONDS` | Future heartbeat schedule tuning | `60` |
| Discord invite URL | `DISCORD_INVITE_URL` | Footer/support/community link | Optional locally |
| Discord webhook URL | `DISCORD_WEBHOOK_URL` | Future Discord notifications | Optional until webhook notifications are enabled |
| Mock Discord ID | `MOCK_DISCORD_ID` | Local customer identity | `111111111111111111` |
| Mock Discord username | `MOCK_DISCORD_USERNAME` | Local profile display | `local.tester` |
| Mock Discord global name | `MOCK_DISCORD_GLOBAL_NAME` | Local profile display | `Local Tester` |
| Mock Discord email | `MOCK_DISCORD_EMAIL` | Local customer account email | `local.customer@mxf-labs.test` |

## Payments

| Value | `.env` key | Powers | Local/mock behavior |
| --- | --- | --- | --- |
| Payment provider mode | `PAYMENT_PROVIDER_MODE` | Chooses mock vs live checkout behavior | `mock` locally; `stripe` or `paypal` live |
| Stripe secret key | `STRIPE_SECRET_KEY` | Stripe Checkout Session creation | Not needed in mock mode |
| Stripe publishable key | `STRIPE_PUBLISHABLE_KEY` | Server-side Stripe status and future client config | Not needed in mock mode |
| Public Stripe key | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Future client Stripe UI | Not needed in mock mode |
| Stripe webhook secret | `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification | Required for real provider testing |
| PayPal environment | `PAYPAL_ENV` | PayPal sandbox/live base URL | `sandbox` |
| PayPal client ID | `PAYPAL_CLIENT_ID` | PayPal order creation | Not needed in mock mode |
| PayPal client secret | `PAYPAL_CLIENT_SECRET` | PayPal access tokens | Not needed in mock mode |
| PayPal webhook ID | `PAYPAL_WEBHOOK_ID` | PayPal webhook signature verification | Required for real provider testing |

## Email

| Value | `.env` key | Powers | Local/mock behavior |
| --- | --- | --- | --- |
| Resend API key | `RESEND_API_KEY` | Welcome, account created, purchase, license, invoice, support, download-ready emails | Missing key creates skipped delivery records locally |
| Contact destination | `CONTACT_TO_EMAIL` | Future routing override for contact form emails | Falls back to `SUPPORT_EMAIL` |

## Storage

| Value | `.env` key | Powers | Local/default behavior |
| --- | --- | --- | --- |
| Storage provider | `STORAGE_PROVIDER` | Download storage provider selection | `local` |
| Local storage root | `LOCAL_STORAGE_ROOT` | Private product file root | `storage/products`; production `/var/www/mxf-labs/storage/products` |

## Licensing Runtime

| Value | `.env` key | Powers | Local/default behavior |
| --- | --- | --- | --- |
| License signing secret | `LICENSE_SIGNING_SECRET` | Signed short-lived license lease tokens returned by activation, validation, and heartbeat | Falls back to `AUTH_SECRET` |
| License heartbeat seconds | `LICENSE_HEARTBEAT_SECONDS` | Recommended client heartbeat interval returned in runtime policy | `300` |
| License lease TTL | `LICENSE_LEASE_TTL_SECONDS` | How long each signed runtime lease remains fresh | `900` |
| Offline grace seconds | `LICENSE_OFFLINE_GRACE_SECONDS` | Max client-side grace window after the API becomes unreachable | `21600` |

## Production Switches

Before launch:

1. Replace `DATABASE_URL` with PostgreSQL.
2. Replace `AUTH_SECRET` with a long random secret.
3. Set `PAYMENT_PROVIDER_MODE` to provider/live behavior instead of `mock`.
4. Add Stripe and PayPal credentials plus webhook secrets.
5. Add Discord OAuth and bot credentials.
6. Add `RESEND_API_KEY` and verify the sender domain.
7. Upload real product files into private storage.
8. Replace legal placeholder copy with final reviewed terms, privacy, and refund policy.
9. Set `IONOS_DEPLOY_TARGET=vps` after choosing an IONOS VPS/Cloud server.
10. Confirm `LOCAL_STORAGE_ROOT` is outside `/public` and outside the web server document root.
11. Enable admin two-factor authentication from `/admin/settings` and store recovery codes offline.

## Production Verification

Run these on the server after real production values are present:

```bash
npm run production:check
npm run db:generate:postgres
npm run db:migrate
npm run build
npm run deploy:check
curl -fsS https://mxf-labs.com/api/health
```

`npm run production:check` intentionally fails if localhost URLs, SQLite, mock providers, default secrets, or missing provider credentials are still configured.
`/api/health` returns machine-readable database, storage, bot heartbeat, and configuration status for uptime monitoring.

## Local Workflow Tests

Run the app locally, then execute:

```bash
npm run test:flows
npm run bot:test
```

The flow runner tests:

- Mock Discord login
- Manual paid order
- License generation
- License activation
- License validation
- Secure download token
- Customer portal ownership
- Admin RBAC rejection
- Support ticket creation
- Suspicious activity flagging

The bot runner tests:

- Command payload generation
- Website API failure fallback
- Local ownership lookup
- Product role sync planning
- Moderation case creation
- AutoMod detection
- Ticket creation and transcript close
- Giveaway entry/end
- Suggestion status workflow
- Guild config setup
