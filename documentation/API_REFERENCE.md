# API Reference

Versioned API:

- `GET /api/health`
- `GET /api/v1/auth`
- `GET /api/v1/customers`
- `GET /api/v1/products`
- `GET /api/v1/orders`
- `GET /api/v1/downloads`
- `GET /api/v1/discord`
- `GET /api/v1/support`
- `GET /api/v1/analytics`
- `POST /api/v1/licenses/validate`
- `POST /api/v1/licenses/activate`
- `POST /api/v1/licenses/heartbeat`

Runtime licensing:

- `POST /api/licenses/validate`
- `POST /api/licenses/activate`
- `POST /api/licenses/deactivate`
- `POST /api/licenses/reset`
- `POST /api/licenses/heartbeat`

New license clients should prefer the `/api/v1/licenses/*` endpoints. License responses include stable result codes, masked key metadata, activation counts, heartbeat policy, and a signed short-lived lease for graceful offline handling. Full usage examples live in:

- `examples/license-node-client.mjs`
- `examples/LicenseClient.java`
- `documentation/LICENSING_SYSTEM.md`

Discord bot:

- `POST /api/discord/customer`
- `POST /api/discord/license`
- `POST /api/discord/product`
- `POST /api/discord/server`
- `POST /api/discord/sync`
