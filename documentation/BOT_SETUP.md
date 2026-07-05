# Discord Bot Setup

Required environment variables:

```env
DISCORD_BOT_TOKEN=""
DISCORD_CLIENT_ID=""
DISCORD_GUILD_ID=""
MXF_API_BASE_URL="http://localhost:3000"
MXF_BOT_API_KEY="replace-with-a-private-bot-api-key"
BOT_LOCAL_MODE="true"
BOT_REGISTER_COMMANDS_ON_START="false"
BOT_HEARTBEAT_INTERVAL_SECONDS="60"
```

Compatibility fallback:

```env
DISCORD_BOT_API_KEY=""
```

`MXF_BOT_API_KEY` is preferred. `DISCORD_BOT_API_KEY` is still accepted by the website for older local setup.

Local setup:

1. Run `npm run db:setup`.
2. Keep `BOT_LOCAL_MODE="true"`.
3. Run `npm run bot:test`.
4. Run `npm run bot:register` for a dry run if credentials are missing.
5. Paste real Discord credentials when ready.
6. Set `BOT_LOCAL_MODE="false"`.
7. Run `npm run bot:register`.
8. Run `npm run bot:dev`.

Production setup:

1. Set `MXF_API_BASE_URL="https://mxf-labs.com"`.
2. Set `BOT_LOCAL_MODE="false"`.
3. Run `npm run bot:register`.
4. Start `npm run bot:start` under PM2 or systemd.

The bot's website API client fails safely if the website API is temporarily offline. Website sync operations return unavailable/queued states instead of throwing through command handlers, but the process should still run under a process manager for reconnects and restarts.

The bot posts heartbeats to:

```http
POST /api/discord/bot-heartbeat
```

The admin panel shows heartbeat status at `/admin/discord`.
