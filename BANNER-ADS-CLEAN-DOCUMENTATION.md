# Banner Ad System - Clean Documentation

## Overview

Network-wide banner advertising system with unified booking platform on ClickForCharity.net and display across all sites.

**Current Status:** Planning phase - requires migration of payment systems before implementation.

---

## Phase 1: Migration Prerequisites

### Required Migration from RoflFaucet.com → ClickForCharity.net

**Core Systems to Migrate:**
1. **Payment Processing**
   - Lightning invoice generation via Coinos.io API
   - Payment status monitoring
   - Transaction history
   - User balance tracking

2. **Projects & Recipients**
   - Recipient profiles and projects
   - Project funding targets and progress
   - Random donation system
   - Project archiving when targets met

3. **User Authentication**
   - Shared login system across all sites
   - User profiles and preferences
   - Session management

**Migration Priority:** High - Ad system depends on these being operational on ClickForCharity.net

---

## Phase 2: Network-Wide Ad System

### Architecture

**Master Platform:** ClickForCharity.net
- Ad booking interface
- Payment processing
- Ad file management
- User authentication hub

**Display Sites:** All other sites (DirectSponsor.net, etc.)
- Pull ads from master via API
- Display ads in rotation
- Redirect to master for booking

### Core Concept

"Buy once, appear everywhere" - Single purchase displays ads across entire network of sites.

### How It Works

1. **Discovery:** User sees "Advertise Here" on any site
2. **Redirect:** Clicks → redirected to ClickForCharity.net/advertise
3. **Authentication:** Logs in (shared across all sites)
4. **Browse Projects:** Views recipients/projects while planning ad purchase
5. **Select Ad Options:**
   - Position (header, sidebar, etc.)
   - Number of slots
   - Duration (days)
6. **Payment:** USD-based pricing → Lightning invoice
7. **Activation:** Ad files created on master, synced to all sites
8. **Display:** Ad appears across network until expiry

### Pricing Model

**USD-Based with Lightning Payment:**
- Price per day per slot in USD (e.g., $0.50/day/slot)
- At checkout: Convert USD → sats using current BTC/USD rate
- Generate Lightning invoice for sats amount
- User pays in Bitcoin, thinks in USD

**User-Specific Pricing (Locked Rates):**
- Early adopters get locked USD rate (e.g., $0.50/day/slot)
- New users pay current market rate (e.g., $1.00/day/slot)
- USD rate locked forever as long as they keep ads active

### File Structure

**Master Site (ClickForCharity.net):**
```
site/data/position1/
├── slot-1.txt          # Ad HTML content
├── slot-2.txt
├── slot-3.txt
├── slot-4.txt
├── slot-5.txt
└── metadata.json       # Expiry, user, pricing info
```

**Slave Sites (All other sites):**
```
site/data/position1/
├── slot-1.txt          # Synced copy from master
├── slot-2.txt          # Synced copy from master
├── slot-3.txt          # Synced copy from master
├── slot-4.txt          # Synced copy from master
├── slot-5.txt          # Synced copy from master
└── metadata.json       # Synced copy from master
```

### Ad Metadata Structure

```json
{
  "slot-1": {
    "expiry": "2026-03-15",
    "invoice_id": "abc123",
    "activated": "2026-02-10 14:30:00",
    "user_id": "user_123",
    "days": 30,
    "usd_cost": 15.00,
    "usd_per_day_per_slot": 0.50,
    "btc_usd_rate": 50000,
    "sats_paid": 30000,
    "tier": "Early Adopter",
    "recipient_id": "project_456"
  }
}
```

### Technical Implementation

**Ad Booking Flow (Master Site):**
```php
// api/generate-ad-invoice.php
$user_id = $_SESSION['user_id'];
$slots = $_POST['slots'];
$days = $_POST['days'];
$position = $_POST['position'];
$recipient_id = $_POST['recipient_id']; // Selected project

// Get user's pricing tier
$user_pricing = getUserPricing($user_id);

// Calculate USD cost
$num_slots = count($slots);
$usd_cost = $num_slots * $days * $user_pricing['usd_per_day_per_slot'];

// Get current BTC/USD rate and convert
$btc_usd_rate = getBtcUsdRate();
$sats_amount = round(($usd_cost / $btc_usd_rate) * 100000000);

// Generate Lightning invoice
$invoice = generateCoinosInvoice($sats_amount);

// Store pending purchase
$pending = [
    'invoice_id' => $invoice['id'],
    'user_id' => $user_id,
    'slots' => $slots,
    'position' => $position,
    'recipient_id' => $recipient_id,
    'days' => $days,
    'usd_cost' => $usd_cost,
    'sats_amount' => $sats_amount,
    'created' => time()
];
file_put_contents("data/pending/$invoice[id].json", json_encode($pending));
```

**Ad Activation (After Payment):**
```php
// api/activate-ad.php
if ($status === 'paid') {
    $pending = json_decode(file_get_contents("data/pending/$invoice_id.json"), true);
    
    // Calculate expiry
    $expiry = date('Y-m-d', strtotime("+$pending[days] days"));
    
    // Write ad files to master
    foreach ($pending['slots'] as $slot) {
        file_put_contents("data/$pending[position]/slot-$slot.txt", $pending['banner_html']);
    }
    
    // Update metadata
    $metadata = json_decode(file_get_contents("data/$pending[position]/metadata.json"), true);
    foreach ($pending['slots'] as $slot) {
        $metadata["slot-$slot"] = [
            'expiry' => $expiry,
            'invoice_id' => $invoice_id,
            'activated' => date('Y-m-d H:i:s'),
            'user_id' => $pending['user_id'],
            'days' => $pending['days'],
            'usd_cost' => $pending['usd_cost'],
            'usd_per_day_per_slot' => $user_pricing['usd_per_day_per_slot'],
            'btc_usd_rate' => $btc_usd_rate,
            'sats_paid' => $pending['sats_amount'],
            'tier' => $user_pricing['tier_name'],
            'recipient_id' => $pending['recipient_id']
        ];
    }
    file_put_contents("data/$pending[position]/metadata.json", json_encode($metadata));
    
    // Sync to all slave sites
    syncToSlaveSites($pending['position']);
}
```

**Slave Site Display:**
```javascript
// banner-rotate.js on slave sites
function getAd(slot) {
  // Try to get fresh ad from master
  fetch('https://clickforcharity.net/api/get-ad.php?position=position1&slot=' + slot)
    .then(response => response.json())
    .then(ad => {
      if (ad && ad.expiry > Date.now()) {
        displayAd(ad);
      } else {
        displayPlaceholder();
      }
    })
    .catch(() => {
      // Fallback to local cached ad
      displayLocalAd(slot);
    });
}
```

### Expiry Management

**Lazy Expiry (Check on View):**
- No cron jobs needed
- When ad is about to display, check if expired
- If expired, show placeholder and rotate to next ad
- Acceptable to be hours late due to browser caching

```javascript
function displayAd(ad) {
  // Lazy expiry check
  if (new Date() > new Date(ad.expiry)) {
    showPlaceholder();
    return;
  }
  
  // Display ad
  document.getElementById('ad-banner').innerHTML = ad.html;
}
```

### User Experience

**Ad Booking Interface:**
```
1. Browse Projects (while planning ad purchase)
2. Select Ad Position
3. Choose Slots (1-5 available)
4. Set Duration (days)
5. Select Recipient (who receives payment)
6. Review Cost (USD with sats conversion shown)
7. Pay Lightning Invoice
8. Ad goes live across network
```

**Benefits for Advertisers:**
- See exactly who you're sponsoring
- Network-wide reach from single purchase
- Stable USD pricing with Bitcoin payment
- Locked rates for early adopters

---

## Phase 3: Future Enhancements

### Streaming Money Model (Experimental)

**Concept:** Pay-as-you-go with micro-deductions from balance account
- Deposit sats → ad runs until balance depleted
- 1 sat deducted every ~68 minutes (at $0.50/day rate)
- When balance hits 0, ad pauses (can reactivate)

**Implementation Plan:**
- Introduce on one site as experimental feature
- Remove that site from network temporarily
- Test streaming model with Bitcoin enthusiasts
- If successful, consider network-wide rollout

**Marketing Angle:** "First banner ad platform with streaming Lightning payments"

### Other Enhancements

- **Advertiser Dashboard** - View active ads, performance stats
- **Auto-Renewal** - Automatic renewal before expiry
- **Click/Impression Tracking** - ROI metrics
- **Recipient Selection** - Choose which project receives payment
- **Grace Period** - 3-7 days before losing locked rate
- **Renewal Reminders** - Email notifications before expiry

---

## Implementation Dependencies

**Must Complete Before Ad System:**

1. **Payment System Migration**
   - Move Lightning payment processing from roflfaucet.com
   - Test on ClickForCharity.net domain
   - Ensure Coinos.io API works with new domain

2. **Projects/Recipients Migration**
   - Move all project data
   - Ensure project display works on ClickForCharity
   - Test donation flow

3. **User Authentication Migration**
   - Implement shared login across sites
   - Test session management
   - Ensure user data portability

**After Migration Complete:**
1. Build ad booking interface on ClickForCharity
2. Implement network sync to other sites
3. Test ad rotation across network
4. Launch with traditional model only
5. Consider streaming model as future experiment

---

## Current Status

**Phase:** Planning and Migration Preparation
**Next Step:** Migrate payment and project systems from roflfaucet.com to clickforcharity.net
**Timeline:** Dependent on migration complexity
**Priority:** High - Ad system cannot proceed without core systems in place
