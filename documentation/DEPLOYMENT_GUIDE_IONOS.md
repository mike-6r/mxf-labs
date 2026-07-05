# IONOS Deployment Guide

MxF Labs is a dynamic Next.js platform with API routes, Prisma, private downloads, payment webhooks, Discord OAuth, and a long-running Discord bot. It should be deployed to an IONOS VPS/Cloud Server or another Node-capable server, not static hosting.

## Hosting Decision

Static/shared hosting is not enough for this project because the platform needs:

- Next.js runtime with server routes and React Server Components.
- Prisma access to a production database.
- Private local file reads for secure downloads.
- Stripe, PayPal, Discord, and Resend webhook/API handling.
- A long-running Discord.js bot process.

Use:

- IONOS VPS or Cloud Server.
- Ubuntu Linux.
- Node.js 20 or newer.
- PM2 or systemd for process management.
- Apache or Nginx as a reverse proxy.
- PostgreSQL for production data.

Do not use Deploy Now/static-only hosting for the full platform.

## Production Environment

Start from `.env.production.example` and place real values in the server environment or a private `.env` file on the server.

Required production values:

```txt
NODE_ENV=production
CONTENT_MODE=production
IONOS_DEPLOY_TARGET=vps
DATABASE_URL=postgresql://...
AUTH_SECRET=...
NEXT_PUBLIC_SITE_URL=https://mxf-labs.com
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_PUBLIC_KEY=...
DISCORD_REDIRECT_URI=https://mxf-labs.com/api/auth/discord/callback
DISCORD_BOT_TOKEN=...
DISCORD_GUILD_ID=...
MXF_API_BASE_URL=https://mxf-labs.com
MXF_BOT_API_KEY=...
DISCORD_BOT_API_KEY=...
MOCK_PROVIDERS_ENABLED=false
PAYMENT_PROVIDER_MODE=stripe
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
PAYPAL_ENV=live
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
RESEND_API_KEY=...
FROM_EMAIL=MxF Labs <support@mxf-labs.com>
SUPPORT_EMAIL=support@mxf-labs.com
STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=/var/www/mxf-labs/storage/products
```

Rotate any credentials that were pasted into chats, screenshots, tickets, or local notes.

## Database

Local development uses SQLite:

```txt
DATABASE_URL=file:./dev.db
```

Production uses PostgreSQL:

```txt
DATABASE_URL=postgresql://mxf_user:strong_password@127.0.0.1:5432/mxf_labs?schema=public
```

The production Prisma schema is:

```bash
prisma/schema.postgres.prisma
```

The safe production migration command is:

```bash
npm run db:migrate
```

Initial production database setup:

```bash
npm ci
npm run db:generate:postgres
npm run db:migrate
npm run content:seed-launch
npm run content:clean
```

Run `npm run db:setup` only for local SQLite/dev seeding. On production, use the PostgreSQL generate/migrate flow above.

## Private Storage And Downloads

Product files must not be placed in `public/` or any Apache/Nginx document root.

Recommended production path:

```bash
sudo mkdir -p /var/www/mxf-labs/storage/products
sudo chown -R $USER:www-data /var/www/mxf-labs/storage
chmod -R 750 /var/www/mxf-labs/storage
```

Configure:

```txt
STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=/var/www/mxf-labs/storage/products
```

Downloads are served through:

```txt
GET /api/downloads/[fileId]
```

The API checks customer session, ownership, paid order status, active license status, private file existence, and one-use signed temporary tokens before streaming a file.

## Server Install Outline

Example Ubuntu setup:

```bash
sudo apt update
sudo apt install -y git curl build-essential postgresql postgresql-contrib apache2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Create a PostgreSQL database/user:

```bash
sudo -u postgres psql
CREATE DATABASE mxf_labs;
CREATE USER mxf_user WITH ENCRYPTED PASSWORD 'replace-with-strong-password';
GRANT ALL PRIVILEGES ON DATABASE mxf_labs TO mxf_user;
\q
```

Deploy the app:

```bash
git clone <repo-url> /var/www/mxf-labs/app
cd /var/www/mxf-labs/app
npm ci
cp .env.production.example .env
# edit .env with real values
npm run production:check
npm run db:generate:postgres
npm run db:migrate
npm run build
```

Start managed processes:

```bash
pm2 start npm --name mxf-labs-web -- run start
pm2 start npm --name mxf-labs-bot -- run bot:start
pm2 save
pm2 startup systemd
```

Register bot commands after the production env is set:

```bash
npm run bot:register
```

## Apache Reverse Proxy Example

Enable proxy modules:

```bash
sudo a2enmod proxy proxy_http headers rewrite ssl
sudo systemctl restart apache2
```

Virtual host shape:

```apache
<VirtualHost *:80>
  ServerName mxf-labs.com
  ServerAlias www.mxf-labs.com
  ProxyPreserveHost On
  ProxyPass / http://127.0.0.1:3000/
  ProxyPassReverse / http://127.0.0.1:3000/
</VirtualHost>
```

Add TLS through the IONOS/Apache certificate flow before public launch. The production app should be served at `https://mxf-labs.com`.

## Discord Bot Deployment

The bot can run on the same IONOS VPS as the website for launch, as long as CPU/RAM are adequate. Running it separately is cleaner later, but not required.

Production bot values:

```txt
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
MXF_API_BASE_URL=https://mxf-labs.com
MXF_BOT_API_KEY=...
BOT_LOCAL_MODE=false
BOT_REGISTER_COMMANDS_ON_START=false
```

The website API client catches temporary website/API failures and returns safe failure results. Setup sync, ticket sync, and website events can queue when the website is unavailable. PM2 should still be used so the process restarts after server reboots or real crashes.

## Deployment Checks

Run before launch:

```bash
npm run production:check
npm run deploy:check
npm run test:flows
npm run bot:test
```

Use the admin panel for live readiness:

```txt
/admin/production
/admin/setup-status
/admin/launch-wizard
```

The admin production page warns about missing provider credentials, local URLs, mock modes, missing product screenshots, missing docs, missing release files, missing legal copy, and storage/database readiness.
