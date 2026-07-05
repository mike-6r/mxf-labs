# Moderation System

Moderation commands create structured cases in `BotModerationCase`.

Case fields:

- Case number
- Guild ID
- Moderator ID
- Target ID
- Action
- Reason
- Duration
- Evidence JSON
- Status
- Timestamp

Warning state is stored in `BotWarning`.

Implemented commands:

- `/ban`
- `/kick`
- `/timeout`
- `/warn`
- `/unwarn`
- `/warnings`
- `/purge`
- `/slowmode`
- `/lock`
- `/unlock`
- `/nickname`
- `/modlogs`
- `/case`
- `/cases`

Permissions:

- Staff actions require Discord moderation or server-management permissions.
- Case creation continues even if a Discord API action fails, so staff have an audit trail.
- Bot logs are stored in `BotLog`.
