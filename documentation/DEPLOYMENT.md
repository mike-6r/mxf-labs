# Discord Bot Deployment

Build/runtime target:

- Node.js
- TypeScript via `tsx`
- Discord.js v14
- Prisma
- Same database as the MxF Labs platform

Local commands:

```bash
npm run db:setup
npm run bot:test
npm run bot:register
npm run bot:dev
```

Production checklist:

1. Set `DATABASE_URL` to the production database.
2. Set `MXF_API_BASE_URL` to the production website URL.
3. Set `MXF_BOT_API_KEY` to a strong private secret.
4. Set `DISCORD_BOT_TOKEN`.
5. Set `DISCORD_CLIENT_ID`.
6. Set `DISCORD_GUILD_ID` for guild-scoped command registration during testing.
7. Run `npm run db:generate`.
8. Run `npm run db:migrate` for Postgres deployments.
9. Run `npm run bot:register`.
10. Start `npm run bot:start` under a process manager.

Recommended process managers:

- PM2
- systemd
- Docker
- Railway/Render/Fly worker process

Health checks:

- Admin panel: `/admin/discord`
- Latest heartbeat row: `BotHeartbeat`
- Sync queue: `BotSyncQueue`
- Bot logs: `BotLog`

Global command registration can take time to propagate. Use `DISCORD_GUILD_ID` during setup for immediate test registration.

IONOS note:

- The full platform requires VPS/Node hosting. Static/shared hosting is not enough.
- Run the website and bot as separate PM2 processes on the same VPS for launch, or move the bot to a separate worker host later.
- Run `npm run production:check` before starting public traffic.
