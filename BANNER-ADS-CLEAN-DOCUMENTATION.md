# Banner Ad System - Documentation

## Overview

Two ad positions on every page, each with 10 slots. Slots determine share of impressions. Unused slots show house ads (reflinks, "advertise here"). Revenue funds specific recipient projects.

**Current Status:** Implemented and live. Manual booking via contact form; payment via Lightning invoice.

---

## Pricing Model

- **Target:** 50,000 pageviews/month at $1.00 CPM
- **10 slots per position** — each slot = 10% of impressions
- **$5/slot/month** (1 slot = ~5,000 impressions)
- **$50/month = 10 slots = exclusive position**
- Early advertisers can negotiate discounts
- Payment in Bitcoin via Lightning Network

---

## Ad Positions

| Position | ID | Size | Location |
|---|---|---|---|
| Top banner | `desktop` | 728×90 (scales for mobile) | Top of every page |
| Floating | `floating` | Flexible (300×250 recommended) | Fixed bottom-right, dismissible |

---

## File Structure

```
site/
├── top/                          # Top banner images
│   ├── advertise-on-clickforcharity.gif
│   ├── advertise-728x90.gif
│   └── 728x90-red.png etc.       # Placeholder test images
├── float/                        # Floating ad images
│   ├── advertise-468x60.gif
│   ├── satsman1.gif
│   └── litebits.png
├── api/
│   ├── get-banner-ads.php        # Serves rotation array to JS
│   ├── save-banner-ad.php        # Admin: add paid ad (JSON)
│   ├── delete-banner-ad.php      # Admin: delete paid ad by ID
│   └── contact-advertise.php    # Advertise page contact form
├── js/
│   ├── banner-rotate.js          # Top banner rotation
│   └── floating-ad.js            # Floating ad rotation
├── admin-banners.html            # Admin interface
└── advertise.html                # Public advertise page

data/
├── fallback-desktop/             # House ads for top banner (one .html file per ad)
│   └── advertise.html            → top/advertise-on-clickforcharity.gif
└── fallback-floating/            # House ads for floating position
    ├── advertise.html            → float/advertise-468x60.gif
    ├── satsman.html              → float/satsman1.gif → satsman.com/?ref=andysavage
    └── litebits.html             → float/litebits.png → litebits.io/ref/J61UMX3M

/var/clickforcharity-data/
└── banner-ads/                   # Paid advertiser JSON files (one per advertiser)
    └── {id}.json
```

---

## How the Rotation Works

`get-banner-ads.php?type=desktop` (or `?type=floating`):

1. Reads all JSON files from `/var/clickforcharity-data/banner-ads/`
2. Filters to the requested position
3. Skips expired ads
4. Repeats each ad's HTML by its slot count (e.g. 3 slots → appears 3× in array)
5. Counts total paid slots used (max 10)
6. Pads remaining slots by randomly picking from `data/fallback-{position}/` `.html` files
7. Returns the full array to JS

JS rotators (`banner-rotate.js`, `floating-ad.js`) use localStorage to track position and display sequentially.

---

## Paid Ad JSON Format

Stored in `/var/clickforcharity-data/banner-ads/{id}.json`:

```json
{
  "id": 1,
  "advertiser": "Acme Corp",
  "position": "desktop",
  "slots": 3,
  "html": "<a href=\"https://example.com\"><img src=\"...\"></a>",
  "createdAt": 1740000000,
  "expiresAt": 1742678400
}
```

- `position`: `desktop` or `floating`
- `slots`: 1–10
- `expiresAt`: Unix timestamp, or `null` for indefinite

---

## Adding a Paid Advertiser (Admin)

1. Go to `admin-banners.html`
2. Fill in advertiser name, position, slot count, duration, banner HTML
3. Click **Add Banner** — saves JSON to `/var/clickforcharity-data/banner-ads/`

The rotation updates immediately on next page load.

---

## Adding House/Fallback Ads

1. Drop the image into `site/top/` or `site/float/`
2. Create a `.html` file in `data/fallback-desktop/` or `data/fallback-floating/`:

```html
<a href="https://destination-url.com" target="_blank" rel="noopener"><img src="top/your-image.png" style="max-width:100%;height:auto;" alt="Description"></a>
```

No code changes needed. The file is picked up automatically.

---

## Advertise Page & Contact Form

`advertise.html` — public-facing page with:
- Early adopter offer callout (yellow box, leads the pricing section)
- Pricing table (slots, impressions, monthly cost) framed as standard rates
- Position descriptions
- "Where the money goes" section — explains payment goes direct to recipient in Bitcoin, not to us; offers help for anyone unfamiliar with Bitcoin
- Low-friction contact form — just name, email, and a free-text message; no need to have details worked out
- Contact form → `api/contact-advertise.php` → emails `ads@clickforcharity.net`
- FAQ

**Bot protection on contact form:**
- Honeypot field (`website`, hidden) — if filled, silently discards
- Visible "are you a bot?" field — must answer "no", otherwise silently discards

---

## Site Integration

**Sidebar nav** (`site/includes/sidebar.incl`) — "Advertise" link added to nav on all pages.

**Footer** (`site/includes/footer.incl`) — `advertise-on-clickforcharity.gif` added as a centered block below the existing footer links on all pages, linking to `advertise.html`. Scales down on small screens via `max-width:100%`.

Both are managed via includes and applied to all non-admin pages by running `build.sh`.

---

## Server Setup

Required on first deploy (one-time):

```bash
sudo mkdir -p /var/clickforcharity-data/banner-ads
sudo chown -R www-data:www-data /var/clickforcharity-data/banner-ads
```

The `data/fallback-desktop/` and `data/fallback-floating/` directories live at `/var/www/clickforcharity.net/data/` on the server and are synced by `deploy.sh`.

Server snapshot taken before this overhaul: `/root/snapshots/clickforcharity-pre-ad-overhaul-20260222-185454.tar.gz`

---

## Deployment

Run `bash deploy.sh` from the project root. The script:
1. Commits and pushes any pending git changes
2. rsyncs `site/` to `/var/www/clickforcharity.net/public_html/`
3. rsyncs `data/fallback-desktop/` and `data/fallback-floating/` to the server
4. Fixes file permissions (`www-data`)

**Note:** `/var/clickforcharity-data/banner-ads/` (paid ad JSON files) is on the server only — it is not in the repo and is not touched by the deploy script.

---

## Future Enhancements

- **Self-service booking** — advertiser pays Lightning invoice, ad activates automatically
- **Impression counting** — log to daily flat file for reporting; use to tune fallback slot weights
- **Expiry notifications** — email advertiser before ad expires
- **Streaming payments** — pay-per-impression via Lightning balance (experimental)
- **Advertiser dashboard** — view active ads, impressions, expiry
