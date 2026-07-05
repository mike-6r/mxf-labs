# Auth System

Admin auth:

- Email/password login.
- Bcrypt password hashing.
- Signed HTTP-only session cookie.
- Hashed session token persisted in `AdminSession`.
- `/admin` and `/api/admin/*` are protected.

Customer auth:

- Discord OAuth is the primary identity provider.
- Signed HTTP-only customer session cookie.
- Hashed session token persisted in `CustomerSession`.
- Discord profile fields sync into `Customer`.

Discord OAuth environment:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
