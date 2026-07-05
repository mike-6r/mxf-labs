# Discord Bot Security

Security requirements:

- Never expose `MXF_BOT_API_KEY`.
- Never expose `DISCORD_BOT_TOKEN`.
- Keep website API calls server-side only.
- Use permission checks before staff commands.
- Use cooldowns on commands.
- Fail closed when licensing data cannot be verified.
- Continue local moderation and tickets when website sync is down.
- Store structured logs for sensitive actions.

Protected website routes use:

```http
x-api-key: <MXF_BOT_API_KEY>
authorization: Bearer <MXF_BOT_API_KEY>
```

Risk scoring only uses Discord-visible server/account data and linked website abuse flags. It must not become a doxxing or off-platform surveillance tool.

Secret handling:

- Do not paste tokens into Discord.
- Do not log request headers.
- Do not print `.env` values.
- Use hosting secret managers for production.

Recommended Discord permissions:

- Manage Roles
- Manage Channels
- Moderate Members
- Kick Members
- Ban Members
- Manage Messages
- Read Message History
- Send Messages
- Use Slash Commands
