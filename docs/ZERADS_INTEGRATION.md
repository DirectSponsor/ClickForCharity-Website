# ZerAds PTC Integration

## Overview

ZerAds is an external PTC (Paid-to-Click) network. Users on the Surf Ads page can click through to ZerAds to view sponsored ads, and ZerAds then calls back to our server to credit the user's balance automatically.

This is separate from our own internal PTC ads (managed via the admin panel). ZerAds provides additional ad inventory without us having to sell ad slots directly.

## How It Works

```
User clicks "View Ads" on ptc.html
    → Opens: https://zerads.com/ptc.php?ref=7940&user={USER_ID}
    → User views an ad on ZerAds

ZerAds calls our callback (server-to-server):
    → https://clickforcharity.net/zeradsptc.php?pwd=SECRET&user={USER_ID}&amount={AMOUNT}&clicks={CLICKS}

Our callback credits the user and returns "OK"

User returns to ptc.html, balance updates automatically
```

## Files

| File | Purpose |
|---|---|
| `site/zeradsptc.php` | ZerAds callback handler (server-side) |
| `site/api/get-anon-zerads.php` | Returns and clears pending anon coins (called by frontend on tab focus) |
| `site/ptc.html` | Surf Ads page — contains the ZerAds link and inline init script |

## Configuration

### ZerAds Admin Panel Settings

- **Publisher site**: `clickforcharity.net`
- **Ref ID / Site ID**: `11110`
- **Callback URL** (set in ZerAds admin):
  ```
  https://clickforcharity.net/zeradsptc.php?pwd=YOUR_PASSWORD&user={USERNAME}&amount={AMOUNT}&clicks={CLICKS}
  ```
  Replace `YOUR_PASSWORD` with the password shown in ZerAds admin.

- **ZerAds server IP**: `162.0.208.108` — callbacks are rejected from any other IP (hardcoded in `zeradsptc.php`)

### Secret Password File

The callback password is stored **outside the webroot and git repo**:

```
/var/clickforcharity-data/zerads-secret.txt
```

To set or update it:
```bash
echo 'your-zerads-password' > /var/clickforcharity-data/zerads-secret.txt
chmod 640 /var/clickforcharity-data/zerads-secret.txt
```

If this file is missing or empty, all callbacks will be rejected with HTTP 403.

### Coin Reward

Controlled by the constant at the top of `zeradsptc.php`:

```php
define('EXCHANGE_RATE', 1000);
```

ZerAds sends `amount` in ZER (always a multiple of 0.001). Coins awarded = `amount × EXCHANGE_RATE` (minimum 1).

Using 1000 ensures every possible ZerAds amount produces a **whole number** of coins — no rounding surprises, and the ZerAds display message matches what we actually award:

| ZER amount | Coins awarded |
|---|---|
| 0.001 ZER | 1 coin |
| 0.005 ZER | 5 coins |
| 0.01 ZER | 10 coins |

Set `1 ZER = 1000` in the ZerAds admin display field so the on-site message matches.

To change the rate, update the constant **and** the ZerAds admin display field to the same value, then redeploy.

## User ID Scheme

The `user=` parameter in the ZerAds URL is populated by the inline script in `ptc.html`:

| User type | ID format | Example |
|---|---|---|
| Logged-in | `id-username` | `42-alice` | (this is what ZerAds passes back as `user=`) |
| Anonymous | `anon_` + 12 hex chars | `anon_a1b2c3d4e5f6` |

The anon ID is generated once and stored in `localStorage` under the key `zerads_anon_id`. It persists across sessions on the same browser.

## Balance Crediting

### Logged-in users
The callback calls `https://auth.directsponsor.org/api/update_balance.php` directly (same endpoint as the rest of the site). Coins appear in their account immediately.

### Anonymous users
The callback writes pending coins to a flat file:
```
/var/clickforcharity-data/anon/{anon_id}.txt
```
When the user returns to `ptc.html` after viewing an ad, the page focuses and `get-anon-zerads.php` is called. It reads the file, returns the coin count, and deletes the file. The frontend then adds those coins to the guest balance in localStorage.

**Anon file expiry:** Files older than 7 days are automatically deleted by `zeradsptc.php` whenever a new anonymous callback comes in. No cron job needed. If an anonymous user never returns to claim their coins within 7 days, the pending balance is forfeited.

## Logging

All callbacks are logged to:
```
/var/clickforcharity-data/zerads-log.txt
```

Each entry shows timestamp, user ID, ZerAds amount, clicks, coins awarded, and whether the auth server credit succeeded. Check this log when testing or debugging.

Example:
```
2026-04-28 19:05:12 CALLBACK: user=42-alice zerads_amount=0.01 clicks=1 coins_awarded=5
2026-04-28 19:05:12   auth_server: OK
2026-04-28 19:06:44 CALLBACK: user=anon_a1b2c3d4e5f6 zerads_amount=0.01 clicks=1 coins_awarded=5
2026-04-28 19:06:44   anon: pending balance 0 → 5
```

## Domain Verification

The file `site/zerads.txt` (containing `zerads.com-11110`) is the ZerAds domain verification token for `clickforcharity.net`. It must remain at the web root and not be deleted.

## Testing the Callback Manually

Once deployed, you can test the callback from the server:

```bash
curl "https://clickforcharity.net/zeradsptc.php?pwd=YOUR_PASSWORD&user=42-alice&amount=0.001&clicks=1"
```

Expected response: `OK`

Then check the log:
```bash
tail /var/clickforcharity-data/zerads-log.txt
```
