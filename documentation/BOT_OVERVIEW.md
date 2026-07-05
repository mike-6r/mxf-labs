# MxF Labs Discord Bot Overview

The MxF Labs Discord Bot is the official Discord companion system for the MxF Labs platform. It is built as a business/server operating layer, not a generic moderation bot.

The website remains the source of truth for:

- Customers
- Purchases
- Products
- Licenses
- Product ownership
- Support records

The bot owns local Discord operational state:

- Guild configuration
- Moderation cases
- Warnings
- Ticket channel state
- Ticket messages and transcripts
- Giveaways and entries
- Suggestions
- Bot logs
- Sync queue jobs
- Cached customer/license snapshots
- Heartbeats

Runtime lives under `bot/src` and uses Node.js, TypeScript, Discord.js v14, Prisma, slash commands, buttons, embeds, permission checks, rate limits, and protected website API calls.

Primary scripts:

```bash
npm run bot:dev
npm run bot:register
npm run bot:test
```

Local development works without real Discord credentials when `BOT_LOCAL_MODE="true"`.
