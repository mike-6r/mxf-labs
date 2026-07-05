# Discord Integration

Customer OAuth:

- `/api/auth/discord/start`
- `/api/auth/discord/callback`
- `/portal/settings/discord`

Protected bot APIs:

- `POST /api/discord/customer`
- `POST /api/discord/license`
- `POST /api/discord/product`
- `POST /api/discord/server`
- `POST /api/discord/sync`

Bot API authentication:

- `DISCORD_BOT_API_KEY`
- Pass as `Authorization: Bearer <key>` or `x-api-key`.

Future bot use cases:

- Role synchronization.
- License checks.
- Product ownership checks.
- Server support verification.
- Ticket Plus server linking.
