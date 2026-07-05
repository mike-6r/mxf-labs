# Bot Website Sync

The bot calls protected website routes using:

```env
MXF_API_BASE_URL=
MXF_BOT_API_KEY=
```

Protected bot routes:

- `POST /api/discord/customer`
- `POST /api/discord/ownership`
- `POST /api/discord/license`
- `POST /api/discord/license-admin`
- `POST /api/discord/product`
- `POST /api/discord/server`
- `POST /api/discord/support-ticket`
- `POST /api/discord/sync`
- `POST /api/discord/bot-heartbeat`

Headers:

```http
x-api-key: <MXF_BOT_API_KEY>
authorization: Bearer <MXF_BOT_API_KEY>
```

If the website API is unavailable:

- License and premium commands fail closed.
- Moderation continues locally.
- Tickets continue locally.
- Sync events can be queued in `BotSyncQueue`.
- Cached customer/license snapshots remain available for local fallback.

Do not expose the API key in Discord messages, logs, embeds, screenshots, or client code.
