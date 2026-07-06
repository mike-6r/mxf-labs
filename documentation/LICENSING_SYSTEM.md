# Licensing System

MxF Labs licenses are built for paid plugins, Discord products, internal APIs, and customer downloads.

License keys use this format:

```txt
MXF-XXXX-XXXX-XXXX-XXXX
```

Generation uses cryptographic randomness and the database enforces uniqueness. Runtime clients should never expose full keys in logs, Discord messages, crash reports, or public support tickets.

## Runtime Endpoints

Use the versioned endpoints for new integrations:

| Action | Endpoint | Purpose |
| --- | --- | --- |
| Activate | `POST /api/v1/licenses/activate` | Claims a license for a device and instance. |
| Validate | `POST /api/v1/licenses/validate` | Checks license state before enabling protected features. |
| Heartbeat | `POST /api/v1/licenses/heartbeat` | Keeps an activation alive and refreshes the short-lived lease. |

Legacy aliases remain available:

- `POST /api/licenses/activate`
- `POST /api/licenses/validate`
- `POST /api/licenses/heartbeat`
- `POST /api/licenses/deactivate`
- `POST /api/licenses/reset` admin-only

## Request Body

```json
{
  "key": "MXF-XXXX-XXXX-XXXX-XXXX",
  "productSlug": "mxf-factions",
  "productVersion": "1.0.0",
  "deviceId": "machine-or-hwid-id",
  "instanceId": "server-or-install-id",
  "discordId": "optional-discord-user-id",
  "country": "optional-country"
}
```

`deviceId` should represent the machine or server environment. `instanceId` should represent a specific install/server. Minecraft plugins should keep `instanceId` stable in a config file after first boot.

## Response Contract

Successful HTTP responses return `ok: true` even when a license is denied. Use `valid`, `activated`, or `alive` plus `code` to decide whether to unlock the product.

```json
{
  "ok": true,
  "valid": true,
  "code": "VALID",
  "reason": "valid",
  "message": "License is valid.",
  "serverTime": "2026-07-06T16:00:00.000Z",
  "status": "Active",
  "product": "mxf-factions",
  "license": {
    "id": "cm...",
    "keyMasked": "MXF-ABCD-...-WXYZ",
    "keyFingerprint": "9e2f...",
    "status": "Active",
    "type": "Lifetime",
    "expiresAt": null,
    "blacklisted": false,
    "minimumVersion": "1.0.0",
    "allowedVersions": []
  },
  "activations": {
    "current": 1,
    "max": 3
  },
  "policy": {
    "heartbeatSeconds": 300,
    "leaseTtlSeconds": 900,
    "offlineGraceSeconds": 21600
  },
  "lease": {
    "token": "signed.payload",
    "issuedAt": "2026-07-06T16:00:00.000Z",
    "expiresAt": "2026-07-06T16:15:00.000Z",
    "ttlSeconds": 900,
    "offlineGraceSeconds": 21600
  }
}
```

## Denial Codes

| Code | Meaning |
| --- | --- |
| `INVALID_KEY` | Key does not exist. |
| `PRODUCT_MISMATCH` | Key belongs to another product. |
| `EXPIRED` | License expiration has passed. |
| `REVOKED` | License was revoked. |
| `SUSPENDED` | License was paused by staff. |
| `HWID_MISMATCH` | Device/instance binding does not match. |
| `IP_MISMATCH` | Strict IP binding blocked the request. |
| `ACTIVATION_LIMIT_REACHED` | Active devices exceed the configured limit. |
| `VERSION_BLOCKED` | Product version is below minimum or not in the allowlist. |
| `SUSPICIOUS_ACTIVITY` | Discord mismatch, blacklist, or security review state. |

## Signed Lease Behavior

Activation, validation, and heartbeat responses include a signed lease when the license exists. Treat it as proof that the API recently evaluated the license. Clients can cache the latest successful lease and last successful server time for a short offline grace period.

Do not treat a decoded lease payload as a permanent license. When the API is reachable, the live API decision always wins. Offline grace should only be used when the API is temporarily unreachable.

Environment controls:

| Variable | Default | Purpose |
| --- | --- | --- |
| `LICENSE_SIGNING_SECRET` | `AUTH_SECRET` fallback | HMAC signing secret for lease tokens. |
| `LICENSE_HEARTBEAT_SECONDS` | `300` | Recommended client heartbeat interval. |
| `LICENSE_LEASE_TTL_SECONDS` | `900` | Lease expiration window. |
| `LICENSE_OFFLINE_GRACE_SECONDS` | `21600` | Maximum offline allowance after a valid check. |

## Admin Controls

The admin license editor controls:

- Status: active, suspended, expired, revoked.
- License type.
- Expiration date.
- Minimum product version.
- Allowed product versions, one per line or comma-separated.
- Max/current activations.
- Blacklist state.
- Internal notes.

Paid orders and Discord-created licenses inherit the product version as the default minimum version. You can loosen or tighten that per license from `/admin/licenses`.

## Node.js Usage

See `examples/license-node-client.mjs`.

Quick run:

```bash
MXF_LICENSE_KEY="MXF-XXXX-XXXX-XXXX-XXXX" \
MXF_PRODUCT_SLUG="mxf-factions" \
MXF_PRODUCT_VERSION="1.0.0" \
node examples/license-node-client.mjs
```

## Java Usage

See `examples/LicenseClient.java`.

For Minecraft plugins, add Gson if your platform does not already provide it:

```kotlin
implementation("com.google.code.gson:gson:2.11.0")
```

Typical plugin boot flow:

1. Read the license key from config.
2. Load or create a stable `instanceId`.
3. Activate once on startup.
4. Validate before enabling premium systems.
5. Heartbeat every `policy.heartbeatSeconds`.
6. If the API is unreachable, keep running only inside the cached offline grace window.
7. Disable paid features when the API returns a denial code.

## Security Notes

- Never log full license keys.
- Never store product files in public web directories.
- Downloads must stay behind signed temporary token routes.
- Use HTTPS in production.
- Keep `LICENSE_SIGNING_SECRET` and `AUTH_SECRET` private.
- Review suspicious flags from `/admin/suspicious`.
- Reset activations only after checking customer ownership.
