# Discord Ticket System

The bot ticket system stores local Discord ticket state in:

- `BotTicket`
- `BotTicketMessage`
- `BotTicketTranscript`

Website support sync uses:

```http
POST /api/discord/support-ticket
```

Ticket commands:

- `/ticket panel`
- `/ticket create`
- `/ticket close`
- `/ticket claim`
- `/ticket add`
- `/ticket remove`
- `/ticket transcript`
- `/ticket rename`
- `/ticket priority`
- `/ticket assign`
- `/ticket move`
- `/ticket escalate`

Supported ticket types:

- General Support
- Product Support
- License Support
- Purchase Support
- Bug Report
- Custom Order

## Ticket Panel Flow

The setup wizard posts a support panel in `🎫・create-ticket`.

Buttons:

- Open Ticket
- Product Support
- License Help
- Purchase Help
- Bug Report
- Custom Order

General tickets open immediately. Product, license, purchase, bug, and custom-order tickets show Discord modal forms first so staff receives structured context.

## Private Channel Creation

When a ticket opens, the bot:

- Defers/replies ephemerally to avoid interaction timeouts
- Loads `BotGuildConfig`
- Finds the saved support/ticket category
- Creates a private text channel such as `ticket-username`, `license-username`, or `purchase-username`
- Denies `@everyone`
- Allows the ticket creator
- Allows configured support/admin staff roles
- Allows the bot to manage and transcript the channel
- Sends an opening embed with ticket ID, type, requester, product, version, masked license key, ownership summary, priority, and staff instructions
- Shows ticket controls for claim, close, add/remove user, transcript, escalate, rename, and priority
- Logs creation to bot logs and ticket logs
- Syncs to the website when available, or queues a `BotSyncQueue` job when unavailable

## Ticket Modals

Product Support asks for product, version, issue, logs, and optional license key.

License Help asks for product, optional license key, HWID/IP reset request, and issue description.

Purchase Help asks for product, payment provider, order email, and issue description.

License keys are masked in embeds.

## Customer Context

Ticket embeds use website ownership when available and local SQLite fallback during development. Staff can see:

- Linked account status
- Owned product count
- License count/status
- Active warning count
- Open suspicious-activity flags

Unlinked users see a `Link MxF Account` button.

When a ticket closes:

- Local status becomes `Closed`.
- `closedAt` and `closeReason` are saved.
- A transcript row is generated.
- A transcript file is sent to ticket logs when permissions allow.
- The ticket requester receives a DM transcript when DMs are open.
- The Discord channel is archived by renaming it and removing requester send access.
- Bot logs record the action.
- A website close event is queued.

## Customer Commands

- `/verify` links/syncs the user's MxF Labs account and refreshes product roles.
- `/products owned` shows owned products and active license counts.
- `/license status` and `/license reset-request` support self-service license checks.
- `/support status` shows queue size, response target, and the user's open tickets.
- `/customer inspect user:@user` gives staff an ephemeral account/product/license/ticket/flag snapshot.
