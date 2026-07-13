# Balance Update Shared Secret

## Purpose

The auth server (`auth.directsponsor.org/api/update_balance.php`) requires a shared secret on every balance update request. This prevents arbitrary callers from crediting coins to any user — only trusted servers that hold the secret can call the endpoint.

This was identified during a security audit as a vulnerability: `write_balance.php` was proxying balance updates to the auth server with no authentication, meaning any caller could trigger coin awards.

## How It Works

1. Both the **auth server** (ES3) and the **clickforcharity server** (ES1) hold the same secret in `/etc/ds-balance-secret`
2. `site/api/write_balance.php` reads the secret from that file and includes it in every POST to the auth server
3. The auth server compares the incoming `secret` field against its own copy — requests without a matching secret are rejected with `403 Forbidden`

## Server Setup

The secret file must exist on every server that calls `update_balance.php`:

```bash
# Create the file (use the same secret value as on ES3)
echo 'SECRET_VALUE_HERE' | sudo tee /etc/ds-balance-secret > /dev/null
sudo chown root:www-data /etc/ds-balance-secret
sudo chmod 640 /etc/ds-balance-secret
```

**Current servers with this file:**
- ES3 (auth server, `es3-auth`) — authoritative copy
- ES1 (clickforcharity, `clickforcharity`) — set up July 2026

## Retrieving the Secret (for new servers)

```bash
ssh es3-auth "cat /etc/ds-balance-secret"
```

Then create the file on the new server as shown above.

## Key Files

| File | Role |
|------|------|
| `site/api/write_balance.php` | Reads secret, forwards to auth server |
| `/etc/ds-balance-secret` (ES1) | Secret held by clickforcharity server |
| `/etc/ds-balance-secret` (ES3) | Authoritative secret on auth server |
| `auth-server/.../api/update_balance.php` | Validates incoming secret |

## Symptoms if Broken

If `/etc/ds-balance-secret` is missing or wrong on ES1, all coin awards via `write_balance.php` will silently fail with `{"success":false,"error":"Forbidden"}`. Users will complete tasks but receive no coins.

If the file is missing on ES3, the auth server returns `{"success":false,"error":"Balance secret not configured on server"}`.
