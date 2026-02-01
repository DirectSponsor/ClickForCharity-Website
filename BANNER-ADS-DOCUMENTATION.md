note, to be removed once resolved. 

A lot of this is out of date, e.g. we don't need paired slot stuff because we are goign to have single txt file per ad, and we dont need to monitor ad expiry any more if we have it triggered by being viewed. I think changes were added but some of the old stuff was not removed. 

-------------------------

# Banner Ad Rotation System - Documentation

## Overview
File-based banner ad rotation system with responsive switching and admin interface for ClickForCharity.net.

---

## Phase 1: Rotation System (Completed Jan 30, 2026)

### Files Created
- `site/data/ads-desktop.txt` - Desktop banners (728×90)
- `site/data/ads-mobile.txt` - Mobile banners (320×50)
- `site/js/banner-rotate.js` - Rotation engine
- Modified: `site/ptc.html` - Added ad container
- Modified: `site/index.html` - Added ad container

### Features
- **Sequential rotation** - Uses localStorage to track position
- **Responsive switching** - Desktop (>768px) vs Mobile (≤768px)
- **Multi-line support** - Use `---` separator for complex ads
- **Minimal styling** - Container: `<div id="ad-banner" style="margin:0.3em 0;"></div>`

### How It Works
1. Page loads → `banner-rotate.js` runs
2. Checks screen width to determine desktop or mobile
3. Fetches appropriate text file (`ads-desktop.txt` or `ads-mobile.txt`)
4. Parses ads using `---` separator
5. Gets next ad index from localStorage
6. Inserts HTML into `#ad-banner` container
7. Increments position for next page load

### Ad File Format
```
<img src="banner1.png" width="728" height="90" style="max-width:100%;height:auto;" alt="Ad">
---
<a href="https://example.com" target="_blank">
  <img src="banner2.png" width="728" height="90">
</a>
---
<script src="https://adnetwork.com/code.js"></script>
<div id="ad-slot"></div>
```

### Script Loading Order (PTC Page)
```html
<script src="js/unified-balance.js"></script>
<script src="js/auth.js"></script>
<script src="js/nav.js"></script>
<script src="js/banner-rotate.js"></script>
<script src="js/app.js"></script>
```

---

## Phase 2: Admin Interface (Completed Jan 31, 2026)

### Files Created
- `site/admin-banners.html` - Admin interface
- `site/api/get-banner-ads.php` - Fetch ads from files
- `site/api/save-banner-ad.php` - Add new ad to file
- `site/api/delete-banner-ad.php` - Remove ad by index

### Admin Features
1. **View existing ads** - Lists all current banners with HTML code
2. **Add new banner** - Paste HTML, preview, then save
3. **Delete banner** - Remove unwanted ads
4. **Preview** - See how ad will appear before adding
5. **Separate management** - Desktop and mobile ads managed independently

### Access
Navigate to: `https://clickforcharity.net/admin-banners.html`

Password protected via `requireAdmin()` function from `auth.js`.

### How to Add a Banner
1. Scroll to "Add New Desktop Banner" or "Add New Mobile Banner" section
2. Paste HTML code in the textarea
3. Click "Preview" to see how it will look
4. Click "Add Banner" to save to file

### How to Delete a Banner
1. Find the banner in the list
2. Click "Delete" button next to it
3. Confirm deletion in popup

### Example HTML Snippets

**Simple Image:**
```html
<img src="banner.png" width="728" height="90" style="max-width:100%;height:auto;" alt="Ad">
```

**Clickable Banner:**
```html
<a href="https://example.com" target="_blank">
  <img src="banner.png" width="728" height="90" style="max-width:100%;height:auto;">
</a>
```

**Ad Network Script:**
```html
<script src="https://adnetwork.com/banner.js"></script>
<div id="ad-container-123"></div>
```

### PHP Backend Details

**get-banner-ads.php**
- Accepts `?type=desktop` or `?type=mobile` parameter
- Reads corresponding text file
- Parses ads using `---` separator
- Returns JSON: `{success: true, ads: [...]}`

**save-banner-ad.php**
- Accepts POST with JSON: `{type: "desktop", html: "..."}`
- Validates input
- Appends new ad to file with `---` separator
- Returns JSON: `{success: true, message: "..."}`

**delete-banner-ad.php**
- Accepts POST with JSON: `{type: "desktop", index: 0}`
- Reads file, parses ads
- Removes ad at specified index
- Rebuilds file with remaining ads
- Returns JSON: `{success: true, message: "..."}`

---

## Phase 3: Automated Slot Purchasing with Lightning Payments (Future)

### Overview
Enable advertisers to purchase banner ad slots directly using Lightning Network payments, with instant activation upon payment confirmation. This system leverages the existing Coinos.io integration from the donations system.

### Payment Infrastructure

**Coinos.io Integration:**
- Leverage existing read-only API from donations system
- Generate Lightning invoices for ad purchases
- Monitor payment status in real-time
- Peer-to-peer payments with no middleman
- Instant verification when invoice is paid

**Key Advantage:** The payment infrastructure already exists and works for donations, so we're adapting a proven system rather than building from scratch.

### Pricing Model: USD-Based with Lightning Payment

**Simple USD Pricing:**
- Price per day per slot in USD (e.g., $0.50/day/slot)
- At checkout, convert USD to sats using current BTC/USD rate
- Generate Lightning invoice for sats amount
- User pays in Bitcoin, thinks in USD

**How It Works:**
```
User wants: 3 slots for 10 days
Cost: 3 slots × 10 days × $0.50 = $15 USD

At checkout (BTC = $50,000):
- Convert: $15 ÷ $50,000 = 0.0003 BTC = 30,000 sats
- Generate Lightning invoice for 30,000 sats
- User pays invoice
```

**User-Specific Pricing (Locked USD Rates):**
- Early adopters get locked USD rate (e.g., $0.50/day/slot)
- New users pay current market rate (e.g., $1.00/day/slot)
- USD rate locked forever as long as they keep ads active
- Sats amount fluctuates with BTC price, but USD rate stays fixed

**Pricing Tiers Example:**
```
Tier 1 (Early Adopters): $0.50/day/slot - Locked perpetually
Tier 2 (Beta Users):     $0.75/day/slot - Locked perpetually  
Tier 3 (Standard):       $1.00/day/slot - Current market rate
```

**Example with Bitcoin Price Changes:**
```
Early Adopter locked at $0.50/day/slot
Purchase: 3 slots × 10 days = $15 USD

When BTC = $50,000:  $15 = 30,000 sats
When BTC = $100,000: $15 = 15,000 sats
When BTC = $25,000:  $15 = 60,000 sats

USD cost stays $15, sats amount adjusts automatically
```

**Marketing Psychology Benefits:**
- **Stable Pricing** - "$0.50/day/slot" makes sense to everyone
- **Bitcoin Price Irrelevant** - Advertisers think in USD, pay in Bitcoin
- **Early Adopter Incentive** - Lock in low USD rate forever
- **Urgency Creation** - "Lock in $0.50 before we raise it to $2!"
- **Price Increase Justification** - As traffic grows, USD rate increases for new users
- **Loyalty Reward** - Keep ads active = keep locked USD rate forever
- **Predictable Costs** - Advertisers know exactly what they'll pay in USD
- **Word of Mouth** - "I'm paying $0.50 while new users pay $2!"

**Purchase Interface:**
```
Your locked rate: $0.50/day/slot (Early Adopter)
Current market rate: $1.00/day/slot

Select slots: [3 slots selected]
Duration: [10 days]
Total cost: $15.00 USD

Current BTC rate: $50,000
Payment amount: 30,000 sats

You save: $15.00 vs market rate ($30.00)

[Generate Lightning Invoice]
```

**Benefits:**
- **Universal Understanding** - Everyone understands USD pricing
- **Bitcoin Volatility Irrelevant** - Conversion happens at payment time
- **Still Lightning Payment** - No fiat handling, pure Bitcoin payment
- **Locked USD Rates** - Early adopters protected from price increases
- **Simple Implementation** - Fetch BTC/USD rate from API, convert, done

### Purchase Interface

**Public Purchase Page** (`/advertise.html`):

**Section 1: Information (Top of Page)**
- How the system works
- Pricing breakdown and examples
- Benefits of advertising on the platform
- Link to "Purchase Now" section below

**Section 2: Slot Selection Grid**
```
Position 1 - Homepage Header Banner

[ ] Slot 1 - Available
[ ] Slot 2 - Occupied until Feb 15, 2026
[ ] Slot 3 - Available
[ ] Slot 4 - Available  
[ ] Slot 5 - Available

[Select All Available Slots]

Selected: 3 slots
Price: 100 sats/day/slot
```

**Section 3: Purchase Form**
```
Payment Amount: [1500] sats
Duration: 5 days (auto-calculated)

Banner Upload: [Choose File] (728×90 recommended, will scale responsively)
Destination URL: [https://example.com]

[Preview Banner] [Generate Invoice]
```

**Section 4: Invoice Display**
- Lightning invoice with QR code
- Payment instructions
- Real-time payment status monitoring
- Confirmation message upon payment

### Empty Slot Placeholder

Instead of generic "Ad Slot Available", use self-promoting ad:

```html
<a href="/advertise.html" style="text-decoration:none;">
  <div style="width:728px;max-width:100%;height:90px;border:2px dashed #4CAF50;display:flex;align-items:center;justify-content:center;color:#4CAF50;font-size:16px;font-weight:bold;cursor:pointer;background:#f9f9f9;">
    📢 Advertise Here - Click to Learn More
  </div>
</a>
```

This turns empty inventory into marketing for the ad system itself.

### User Workflow

1. User visits `/advertise.html` (directly or via empty slot ad)
2. Reads explanation of how system works
3. Scrolls to slot selection grid
4. Sees which slots are available vs occupied
5. Selects desired slots with checkboxes (or "Select All Available")
6. Enters payment amount (or uses suggested amount)
7. System calculates and displays duration in days
8. Uploads banner image
9. Enters destination URL
10. Clicks "Preview Banner" to see how it will look
11. Clicks "Generate Invoice"
12. Lightning invoice displayed with QR code
13. User pays invoice from Lightning wallet
14. System detects payment via Coinos.io API
15. Ad automatically written to selected slot files
16. Confirmation shown: "Your ad is now live! Active until [date]"
17. Optional: Confirmation email sent

### Backend Process

**User Pricing Lookup:**
```php
// api/get-user-pricing.php
function getUserPricing($user_id) {
    // Load user pricing data
    $pricing_file = "data/user-pricing.json";
    $pricing_data = json_decode(file_get_contents($pricing_file), true);
    
    // Check if user has custom pricing
    if (isset($pricing_data[$user_id])) {
        $user_tier = $pricing_data[$user_id];
        return [
            'usd_per_day_per_slot' => $user_tier['usd_rate'],
            'tier_name' => $user_tier['tier'],
            'locked_perpetually' => $user_tier['locked_perpetually']
        ];
    }
    
    // Return standard pricing
    return [
        'usd_per_day_per_slot' => 1.00, // Standard rate
        'tier_name' => 'Standard',
        'locked_perpetually' => false
    ];
}

// Get current BTC/USD rate from API
function getBtcUsdRate() {
    // Use CoinGecko, Kraken, or similar API
    $response = file_get_contents('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    $data = json_decode($response, true);
    return $data['bitcoin']['usd'];
}
```

**User Pricing Data Structure:**
```json
{
  "user_123": {
    "tier": "Early Adopter",
    "usd_rate": 0.50,
    "locked_perpetually": true,
    "locked_since": "2026-02-01"
  },
  "user_456": {
    "tier": "Beta User",
    "usd_rate": 0.75,
    "locked_perpetually": true,
    "locked_since": "2026-02-15"
  }
}
```

**Invoice Generation:**
```php
// api/generate-ad-invoice.php
$user_id = $_SESSION['user_id']; // From auth system
$slots = $_POST['slots']; // array of slot numbers
$days = $_POST['days']; // number of days
$banner_html = $_POST['banner_html'];
$position = $_POST['position'];

// Get user's pricing tier
$user_pricing = getUserPricing($user_id);

// Calculate USD cost
$num_slots = count($slots);
$usd_cost = $num_slots * $days * $user_pricing['usd_per_day_per_slot'];

// Get current BTC/USD rate
$btc_usd_rate = getBtcUsdRate();

// Convert USD to BTC to sats
$btc_amount = $usd_cost / $btc_usd_rate;
$sats_amount = round($btc_amount * 100000000); // BTC to sats

// Generate invoice via Coinos.io API
$invoice = generateCoinosInvoice($sats_amount);

// Store pending purchase
$pending = [
    'invoice_id' => $invoice['id'],
    'user_id' => $user_id,
    'slots' => $slots,
    'position' => $position,
    'banner_html' => $banner_html,
    'days' => $days,
    'usd_cost' => $usd_cost,
    'usd_per_day_per_slot' => $user_pricing['usd_per_day_per_slot'],
    'btc_usd_rate' => $btc_usd_rate,
    'sats_amount' => $sats_amount,
    'tier_name' => $user_pricing['tier_name'],
    'created' => time()
];
file_put_contents("data/pending/$invoice[id].json", json_encode($pending));

return [
    'invoice' => $invoice,
    'usd_cost' => $usd_cost,
    'btc_usd_rate' => $btc_usd_rate,
    'sats_amount' => $sats_amount,
    'user_rate' => $user_pricing['usd_per_day_per_slot']
];
```

**Payment Monitoring:**
```php
// api/check-payment-status.php (called via polling or webhook)
$invoice_id = $_GET['invoice_id'];

// Check payment status via Coinos.io API
$status = checkCoinosPayment($invoice_id);

if ($status === 'paid') {
    // Load pending purchase
    $pending = json_decode(file_get_contents("data/pending/$invoice_id.json"), true);
    
    // Calculate expiry date from days (already calculated in credits)
    $days = $pending['days'];
    $expiry = date('Y-m-d', strtotime("+$days days"));
    
    // Write banner to selected slots
    foreach ($pending['slots'] as $slot) {
        file_put_contents("data/{$pending['position']}/slot-$slot.txt", $pending['banner_html']);
    }
    
    // Update metadata
    $metadata = json_decode(file_get_contents("data/{$pending['position']}/metadata.json"), true);
    foreach ($pending['slots'] as $slot) {
        $metadata["slot-$slot"] = [
            'expiry' => $expiry,
            'invoice_id' => $invoice_id,
            'activated' => date('Y-m-d H:i:s'),
            'user_id' => $pending['user_id'],
            'credits_used' => $pending['credits_used'],
            'sats_per_credit' => $pending['sats_per_credit'],
            'tier' => $pending['tier_name']
        ];
    }
    file_put_contents("data/{$pending['position']}/metadata.json", json_encode($metadata));
    
    // Clean up pending file
    unlink("data/pending/$invoice_id.json");
    
    return [
        'success' => true,
        'expiry' => $expiry,
        'credits_used' => $pending['credits_used'],
        'sats_paid' => $pending['amount_sats']
    ];
}
```

**Expiry Management:**
```php
// api/check-ad-expiry.php (run daily via cron)
$positions = ['position1']; // expand as needed

foreach ($positions as $position) {
    $metadata = json_decode(file_get_contents("data/$position/metadata.json"), true);
    
    foreach ($metadata as $slot => $data) {
        if (strtotime($data['expiry']) < time()) {
            // Ad expired - replace with "Advertise Here" placeholder
            $placeholder = file_get_contents('data/templates/advertise-here.html');
            file_put_contents("data/$position/$slot.txt", $placeholder);
            
            // Remove from metadata
            unset($metadata[$slot]);
        }
    }
    
    file_put_contents("data/$position/metadata.json", json_encode($metadata));
}
```

### File Structure

```
site/
├── advertise.html              # Public purchase page
├── data/
│   ├── position1/
│   │   ├── slot-1.txt
│   │   ├── slot-2.txt
│   │   ├── slot-3.txt
│   │   ├── slot-4.txt
│   │   ├── slot-5.txt
│   │   └── metadata.json       # Track expiry dates and pricing
│   ├── pending/                # Pending purchases awaiting payment
│   │   └── [invoice_id].json
│   ├── templates/
│   │   └── advertise-here.html # Empty slot placeholder
│   └── user-pricing.json       # User-specific pricing tiers
├── api/
│   ├── generate-ad-invoice.php
│   ├── get-user-pricing.php
│   ├── check-payment-status.php
│   └── check-ad-expiry.php     # Cron job
```

**Slot Metadata Structure:**
```json
{
  "slot-1": {
    "expiry": "2026-02-15",
    "invoice_id": "abc123",
    "activated": "2026-02-10 14:30:00",
    "user_id": "user_123",
    "days": 5,
    "usd_cost": 2.50,
    "usd_per_day_per_slot": 0.50,
    "btc_usd_rate": 50000,
    "sats_paid": 5000,
    "tier": "Early Adopter"
  },
  "slot-3": {
    "expiry": "2026-02-20",
    "invoice_id": "def456",
    "activated": "2026-02-12 09:15:00",
    "user_id": "user_456",
    "days": 10,
    "usd_cost": 10.00,
    "usd_per_day_per_slot": 1.00,
    "btc_usd_rate": 50000,
    "sats_paid": 20000,
    "tier": "Standard"
  }
}
```

### Dependencies & Prerequisites

**Before Implementation:**

1. **DirectSponsor.net Operational**
   - Advertisers need to see recipient projects
   - Understand where their payment goes
   - Build trust in the platform

2. **Payment System Migration**
   - Currently on roflfaucet.com
   - Need to copy/adapt for clickforcharity.net
   - Alternative: Centralize on DirectSponsor.net, other sites pull via API

3. **CORS Handling**
   - Cross-site data access needed
   - Consider routing through auth server API
   - Ensure Coinos.io API calls work from domain

4. **Coinos.io API Access**
   - Verify read-only API credentials
   - Test invoice generation
   - Confirm webhook/polling works

### Manual Fallback (Immediate Use)

**Until automation is built:**

1. Accept ad purchases via email/contact form
2. Admin manually adds banner to slot files
3. Track expiry in spreadsheet
4. Manual removal when expired
5. Manual invoice generation via Coinos.io dashboard

**Benefits:**
- Start generating revenue immediately
- Test pricing and demand
- Gather requirements for automation
- Build advertiser relationships

### Future Enhancements

**Perpetual Pricing Lock (Loyalty Program):**
- **Concept**: Lock in pricing rate forever as long as ad stays active (no lapse)
- **Mechanics**:
  - Early adopter pays 50 sats/day, renews before expiry → keeps 50 sats/day forever
  - If they let ad expire (lapse), they lose the locked rate
  - New purchase after lapse = current market rate
- **Psychology**:
  - **Incredible Retention** - Advertisers never want to lose their locked rate
  - **Predictable Revenue** - Long-term committed advertisers
  - **Compound Loyalty** - The longer they stay, the more valuable their rate becomes
  - **FOMO Prevention** - "I can't let this lapse, I'll lose my 50 sat rate!"
- **Implementation**:
  - Track "original_price" in user pricing data
  - Check if current slots have any lapse in history
  - If continuous (no gaps), maintain original price
  - If lapsed, reset to current market rate
- **Marketing Message**: "Keep your ad active and lock in this rate FOREVER. Let it expire and you'll pay current market rates."
- **Question to Explore**: How long would people keep ads running with this model? Potentially years if the rate differential becomes significant (e.g., locked at 50 sats while market is 200 sats).

**Hybrid Pricing Model: Traditional + Streaming (Experimental):**
- **Concept**: Offer both upfront booking AND pay-as-you-go streaming in the same slots
- **Traditional Model**: "Buy 30 days for $15" - predictable, familiar
- **Streaming Model**: "Deposit $5, runs until depleted" - flexible, Bitcoin-native
- **Unified Queue**: Both model types rotate in the same slots seamlessly
- **Micro-Deductions**: For streaming, deduct 1 sat every ~68 minutes (at $0.50/day rate)
- **Paused State**: When streaming balance hits 0, ad pauses (not deleted), can reactivate anytime
- **Marketing Differentiator**: "First banner ad platform with streaming Lightning payments"
- **Advantages**:
  - Appeals to both conservative and experimental advertisers
  - Low barrier to entry (start with $5, test, then scale)
  - No refunds needed - just let balance run out
  - Reactivation keeps same slot preference
- **Implementation**:
  - User chooses model at checkout: [Traditional Booking] or [Streaming Balance]
  - Same USD rate locking applies to both models
  - Dashboard shows both types: "Active (Traditional - 12 days)" or "Active (Streaming - 1,250 sats)"
  - When either expires, slot rotates to next active ad
- **Phase Approach**:
  - Phase 3a: Traditional model first (core functionality)
  - Phase 3b: Streaming model as "experimental beta" feature
  - Phase 3c: Unified dashboard showing both

**Other Enhancements:**
- **Advertiser Dashboard** - View active ads, performance stats, renewal options
- **Auto-Renewal** - Automatically renew slots before expiry
- **Click/Impression Tracking** - Show ROI metrics to advertisers
- **Slot Bidding** - Premium pricing for high-traffic positions
- **Recipient Selection** - Let advertiser choose which recipient receives payment
- **Bulk Discounts** - Lower price for longer commitments (e.g., 10% off for 30+ days)
- **A/B Testing** - Rotate multiple creatives within purchased slots
- **Grace Period** - 3-7 day grace period before losing locked rate (reduces accidental lapses)
- **Renewal Reminders** - Email notifications before expiry: "Renew now to keep your 50 sat rate!"
- **Lazy Expiry (Check on View)** - Instead of cron jobs checking all ads constantly, only check expiry when an ad is about to be displayed. If expired, pause it and show next ad. Benefits: zero cron overhead, natural load distribution via browser cache, acceptable to be hours late. First unique view after expiry triggers cleanup.
- **Browser Cache Handling** - Display message: "Your ad is now live! If you don't see it immediately, please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"

---

## Known Issues & Resolutions

### Issue: Ad Management UX - Separate Lists vs Paired Slots
**Problem:** Current admin interface manages desktop and mobile ads in separate lists. This can cause confusion when trying to create paired ads (one desktop version + one mobile version for the same advertiser/campaign).

**Current Behavior:**
- Desktop ads and mobile ads are completely independent
- Adding ad #5 to mobile doesn't necessarily pair with desktop ad #5
- Each list rotates independently
- Can lead to mismatched pairings

**Future Improvement - remove paired and use 1 ad**
Instead of two separate lists, redesign admin interface to manage "ad slots" where each slot contains:
- Desktop version (728×90 or 468×60)
- Mobile version (320×50 or 468×60)
- Both versions rotate together as a pair
- Easier to manage campaigns with responsive versions

**Implementation Concept:**
```
Ad Slot #1:
  Desktop: <script src="...728x90"></script>
  Mobile:  <script src="...320x50"></script>
  
Ad Slot #2:
  Desktop: <img src="banner-desktop.png">
  Mobile:  <img src="banner-mobile.png">
```

**Observed Behavior:**
- During testing, adding what should be banner #5 to mobile section replaced banner #4 instead
- Sometimes delete doesn't work
- Sometimes adding a new ad deletes an existing one
- This suggests deeper issue with PHP file handling, not just UX design

**Root Cause Analysis:**
The PHP scripts have fragile file parsing/rebuilding logic:
1. `save-banner-ad.php` - Regex check for trailing `---` may fail with whitespace
2. Both scripts - Split on `---`, modify array, rebuild with `implode()` - can corrupt structure
3. No file locking - concurrent operations can cause race conditions
4. No validation that rebuild matches expected structure

**Critical Fix Needed BEFORE Redesign:**
- Add file locking (`flock()`) to prevent concurrent writes
- Improve parsing to handle whitespace variations
- Add validation after write to verify file structure
- Consider atomic file operations (write to temp, then rename)
- Add logging to track what's actually being written

**Note:** Redesigning UI for paired slots won't fix these bugs - they'll persist in new interface

**Workaround Until Redesign:**
- Manually ensure desktop ad #1 corresponds to mobile ad #1
- Keep lists synchronized manually
- Document which ads are paired in a separate note
- Check text files directly after adding ads to verify correct placement

### Issue: CORS Errors with file:// Protocol
**Problem:** Banner rotation fails when viewing files locally with `file://` protocol.
**Solution:** System requires HTTP server. Works correctly when deployed to web server.

### Issue: Large Container with Extra Space
**Problem:** Placeholder images had transparent padding causing large checkered background.
**Solution:** Recreated placeholder images without extra space. Changed container from `padding` to `margin`.

### Issue: PTC Tasks Disappeared
**Problem:** Removed `app.js` while troubleshooting, which broke PTC task loading.
**Solution:** Restored `app.js` to script loading order.

---

## File Structure

```
site/
├── admin-banners.html          # Admin interface for banner management
├── index.html                  # Homepage (includes ad container)
├── ptc.html                    # PTC page (includes ad container)
├── data/
│   ├── ads-desktop.txt         # Desktop banner ads (728×90)
│   └── ads-mobile.txt          # Mobile banner ads (320×50)
├── js/
│   └── banner-rotate.js        # Rotation engine
├── api/
│   ├── get-banner-ads.php      # Fetch ads from files
│   ├── save-banner-ad.php      # Add new ad
│   └── delete-banner-ad.php    # Remove ad
└── banner-placeholders/        # Test images (728×90 and 320×50)
```

---

## Testing Checklist

- [ ] Deploy files to server
- [ ] Access admin interface at `/admin-banners.html`
- [ ] Add a test banner via admin interface
- [ ] Verify banner appears on homepage
- [ ] Verify banner appears on PTC page
- [ ] Refresh page multiple times to see rotation
- [ ] Resize browser window to test responsive switching
- [ ] Delete test banner via admin interface
- [ ] Verify banner is removed from rotation

---

## Maintenance

### Adding Ads Manually (Without Admin Interface)
1. Open `site/data/ads-desktop.txt` or `ads-mobile.txt`
2. Add new HTML at the end
3. Use `---` on its own line as separator
4. Save file

### Backing Up Ads
Copy the text files:
- `site/data/ads-desktop.txt`
- `site/data/ads-mobile.txt`

### Troubleshooting

**Ads not showing:**
- Check browser console for errors
- Verify text files exist and are readable
- Check file permissions on server
- Ensure `banner-rotate.js` is loading

**Ads not rotating:**
- Clear localStorage in browser
- Check that multiple ads exist in text file
- Verify `---` separator is present between ads

**New ad not showing immediately:**
- Browser may be caching the old text file
- Force refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Clear browser cache if issue persists
- Note: This is normal behavior and users should be instructed to refresh after adding ads

**Admin interface not working:**
- Verify PHP files have correct permissions
- Check that user is authenticated as admin
- Look for PHP errors in server logs

---

## Credits

Implemented: January 30-31, 2026
System: ClickForCharity.net
Design Philosophy: Frugal, static-first, minimal dependencies
