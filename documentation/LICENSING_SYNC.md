# Bot Licensing Sync

The website remains the licensing source of truth.

Customer commands use:

- `/license check`
- `/license activate`
- `/license status`
- `/license reset-request`
- `/license server`
- `/license products`

Staff commands use:

- `/license lookup`
- `/license revoke`
- `/license suspend`
- `/license reset-hwid`
- `/license reset-ip`
- `/license activations`
- `/license flags`
- `/license sync`

Website routes:

- `POST /api/discord/license`
- `POST /api/discord/license-admin`
- `POST /api/licenses/validate`
- `POST /api/licenses/activate`

Role sync maps product ownership to configured Discord roles:

- `ticket-plus`
- `licensegrid`
- `realm-ops`
- `addon-forge`

Configure product roles with:

```text
/config roles type: Product Role product: ticket-plus role: @Ticket Plus Owner
```

License reset requests are queued as `license.reset_requested` jobs in `BotSyncQueue` for manual review.
