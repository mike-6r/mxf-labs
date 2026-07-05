# Licensing System

License keys use the format:

```txt
MXF-XXXX-XXXX-XXXX-XXXX
```

Generation uses cryptographic randomness and checks for duplicates before creating payment-generated licenses.

Runtime API:

- `POST /api/licenses/validate`
- `POST /api/licenses/activate`
- `POST /api/licenses/deactivate`
- `POST /api/licenses/reset`
- `POST /api/licenses/heartbeat`

Tracked data:

- Device ID.
- Instance ID.
- IP address.
- Country.
- Product version.
- First seen.
- Last seen.
- Activation count.
- Validation result and failure reason.
