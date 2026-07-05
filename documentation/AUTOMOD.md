# Auto Moderation

AutoMod runs on message events and stores actions through the moderation system.

Detection categories:

- Invite links
- Blacklisted words
- Link spam
- Duplicate messages
- Mass mentions
- Scam patterns
- Suspicious token-like patterns
- New accounts
- Excessive caps

Actions:

- Allow
- Log
- Warn
- Timeout

Commands:

- `/automod enable`
- `/automod disable`
- `/automod config`
- `/automod whitelist`
- `/automod blacklist`
- `/automod test`

Config is stored per guild in `BotGuildConfig.automodConfigJson`.

Recommended production tuning:

- Start in log-only mode.
- Test rules with `/automod test`.
- Enable delete/warn actions after confirming false-positive rates.
- Reserve automatic timeouts for high-confidence detections.
