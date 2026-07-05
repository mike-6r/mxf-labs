# Secure Downloads

Paid product files must never be stored in `/public`.

Current private storage root:

```txt
storage/products
```

Recommended production private storage root:

```txt
/var/www/mxf-labs/storage/products
```

Configure it with:

```txt
STORAGE_PROVIDER=local
LOCAL_STORAGE_ROOT=/var/www/mxf-labs/storage/products
```

Protected route:

```http
GET /api/downloads/[fileId]
```

The route verifies:

1. Logged-in customer session.
2. Product ownership.
3. Paid or fulfilled order.
4. Active license.
5. Private file availability.
6. One-use signed temporary download token.
7. Download log creation.

The customer never receives direct file URLs, internal file paths, or storage provider details.

Storage providers:

- `LocalStorageProvider` is active now.
- `CloudflareR2Provider` is reserved for future expansion.
- `S3Provider` is reserved for future expansion.
