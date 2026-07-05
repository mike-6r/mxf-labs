# Discord `/setup` Command

`/setup` is the primary onboarding wizard for turning a Discord server into an MxF Labs-powered support, product, licensing, and customer community.

It can:

- Check required bot permissions
- Preview roles, categories, and channels
- Create MxF staff/customer/product roles
- Create support, product, community, staff, and log channels
- Apply safe permission overwrites
- Rename/reuse emoji-branded MxF channels without duplicating old plain channels
- Seed premium welcome, product, support, FAQ, suggestion, giveaway, changelog, update, and bot-status embeds
- Create the ticket panel in `#create-ticket`
- Save guild configuration locally
- Sync setup state to the website
- Queue website sync if the API is unavailable
- Repair missing tracked resources, permissions, panel state, and broken IDs
- Reset only tracked bot-created resources

## Required User Permission

Only the server owner or a user with `Administrator` can run setup actions.

## Required Bot Permissions

- Manage Roles
- Manage Channels
- Manage Messages
- View Audit Log
- Send Messages
- Embed Links
- Attach Files
- Use Slash Commands
- Manage Webhooks
- Read Message History
- Moderate Members

If any permission is missing, `/setup preview` and `/setup status` will show exactly what is missing. `/setup apply` and repair actions stop before creating resources.

## Setup Modes

`basic`

Creates essential support, logging, and customer roles.

`standard`

Creates support, moderation, tickets, logging, customer/product roles, and staff structure.

`full`

Creates the full MxF Labs community foundation, including product channels, suggestions, giveaways, announcements, sync logs, license logs, payment logs, bot status, and ticket panels.

`custom`

Creates the full plan first, then you can fine-tune behavior with `/config`.

## Commands

```text
/setup start
/setup preview
/setup apply confirm:APPLY
/setup status
/setup sync roles
/setup sync website
/setup repair all
/setup repair roles
/setup repair channels
/setup reset confirm:RESET
```

## Roles Created

Staff:

- MxF Owner
- MxF Admin
- MxF Developer
- MxF Support
- MxF Moderator

Customer/product:

- MxF Customer
- Verified Customer
- Premium Support
- Beta Tester
- Ticket Plus Owner
- LicenseGrid Owner
- Realm Ops Owner
- Addon Forge Owner

Utility:

- Giveaway Access
- Announcement Ping
- Update Ping

The bot reuses existing matching names and does not duplicate roles.

## Channels Created

Categories:

- MXF INFORMATION
- MXF SUPPORT
- MXF PRODUCTS
- MXF COMMUNITY
- MXF STAFF
- MXF LOGS

Channels use MxF-branded emoji names such as `📌・welcome`, `📣・announcements`, `🎫・create-ticket`, `📚・support-info`, `❓・faq`, `🛠️・ticket-plus`, `🔐・licensegrid`, `📜・ticket-logs`, and `🤖・bot-status`.

Channels include announcements, product updates, changelog, support, ticket panel, product channels, staff chat, ticket logs, moderation logs, license logs, sync logs, payment logs, suspicious activity, bot status, audit logs, AutoMod logs, member logs, message logs, role-sync logs, and website-sync logs.

The bot reuses existing matching names and does not duplicate channels. If a tracked bot-created plain channel exists, setup can safely rename it to the branded emoji name.

## Permission Structure

Public/support channels are visible to everyone unless they are announcement-style channels.

Announcement/update channels are readable by everyone but only staff roles can post.

Product channels are visible to the customer/product-owner roles and staff.

Staff/log channels deny `@everyone` and allow staff roles.

Ticket channels created by panel buttons or `/ticket create` deny `@everyone` and only allow the ticket creator, support/admin staff roles, and the bot.

## Seeded Channel Content

`/setup apply` posts clean MxF embeds to the important channels:

- Welcome and announcement instructions
- Product updates and changelog placeholders
- Product info for Ticket Plus, LicenseGrid, Realm Ops, and Addon Forge
- Support info and FAQ guidance
- Suggestion and giveaway instructions
- Staff-only bot-status setup snapshot

It avoids reposting duplicate setup embeds by checking recent bot messages.

## Website Sync

Setup sync posts to:

```http
POST /api/discord/server/setup-sync
```

The payload includes:

- Guild ID/name
- Owner ID
- Setup mode
- Created roles/channels
- Ticket category and panel channel
- Log channel IDs
- Product role IDs
- Support role IDs
- Timestamp

If the website API is unavailable, setup continues locally and queues a `discord.setup_sync` job in `BotSyncQueue`.

## Repair

Repair checks for missing roles/channels by name, reapplies permission overwrites, recreates what is missing, refreshes ticket panel state, updates config, and resyncs website state.

It avoids duplicates.

## Reset

Reset requires `confirm:RESET`.

Options:

- `config`
- `channels`
- `roles`
- `full`

Only tracked bot-created resources are eligible for deletion. Manually created roles/channels are not deleted.

## Troubleshooting

If setup cannot create roles, move the bot role above all MxF-managed roles.

If setup cannot create channels, confirm the bot has `Manage Channels`.

If website sync is queued, confirm `MXF_API_BASE_URL` and `MXF_BOT_API_KEY` are correct and the website is running.

If slash commands do not appear, run:

```bash
npm run bot:register
```
