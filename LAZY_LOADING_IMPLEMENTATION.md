# ClickForCharity Lazy Loading Implementation

## ✅ COMPLETED (2025-11-12)

### 1. Created ROFLFaucet-Compatible Data Structure
**Directory Structure:**
```
/home/charitynet/domains/clickforcharity.net/
├── data/
│   ├── userdata/           # NEW - ROFLFaucet-compatible structure
│   │   ├── profiles/       # User profile data (.txt files)
│   │   └── balances/       # User balance data (.txt files)
│   ├── users/              # OLD - kept for reference
│   └── ads/
└── public_html/
    └── api/
        ├── simple-profile.php     # NEW - Lazy loading profile API
        ├── update_balance.php     # UPDATED - Lazy loading balance API
        └── update_balance_old.php # BACKUP of original
```

**Data Protection:** ✅
- `/data/userdata/` is OUTSIDE `/public_html/` (not web-accessible)
- Follows same security pattern as ROFLFaucet

### 2. Profile Data Format (ROFLFaucet-Compatible)
**File:** `data/userdata/profiles/{user_id}.txt`
```json
{
    "user_id": "11-comet",
    "level": 1,
    "username": "comet",
    "display_name": "",
    "avatar": "👤",
    "email": "comet@example.com",
    "bio": "",
    "location": "",
    "website": "",
    "joined_date": 1762973705,
    "settings": {
        "notifications": true,
        "theme": "default"
    },
    "stats": {
        "total_ads_viewed": 0,
        "total_surveys_completed": 0,
        "total_earned": 0
    },
    "roles": ["member"],
    "last_profile_update": 1762973705
}
```

### 3. Balance Data Format (ROFLFaucet-Compatible)
**File:** `data/userdata/balances/{user_id}.txt`
```json
{
    "balance": 10,
    "last_updated": 1762973768,
    "recent_transactions": [
        {
            "amount": 10,
            "timestamp": 1762973768,
            "type": "ad_view"
        }
    ]
}
```

### 4. API Endpoints Created

#### a) Profile API: `simple-profile.php`
**Endpoint:** `GET /api/simple-profile.php?action=profile&user_id={id}`

**Features:**
- ✅ Lazy loads profile from auth.directsponsor.org
- ✅ Creates both profile and balance files on first access
- ✅ Returns ROFLFaucet-compatible profile structure
- ✅ Uses auth server sync API

**Test Results:**
```bash
# User didn't exist locally → Fetched from auth server → Created files
curl "https://clickforcharity.net/api/simple-profile.php?action=profile&user_id=11-comet"
# ✅ SUCCESS: User profile created and returned
```

#### b) Balance Update API: `update_balance.php`
**Endpoint:** `POST /api/update_balance.php`
**Body:** `{"userId": "id-username", "reward": amount}`

**Features:**
- ✅ Lazy loads user if they don't exist (creates from auth server)
- ✅ Updates balance with transaction history
- ✅ ROFLFaucet-compatible balance format
- ✅ Atomic file writes with LOCK_EX

**Test Results:**
```bash
# Test 1: Existing user (11-comet)
curl -X POST "https://clickforcharity.net/api/update_balance.php" \
  -H "Content-Type: application/json" \
  -d '{"userId": "11-comet", "reward": 5}'
# ✅ SUCCESS: Balance updated from 0 → 5

# Test 2: New user (12-comet) - Full lazy loading
curl -X POST "https://clickforcharity.net/api/update_balance.php" \
  -H "Content-Type: application/json" \
  -d '{"userId": "12-comet", "reward": 10}'
# ✅ SUCCESS: User created from auth server, balance set to 10
```

### 5. Backup Created
**File:** `/home/andy/work/projects/clickforcharity/backups/clickforcharity-backup-20251112-184805.tar.gz`
- Full backup of ClickForCharity before changes (12MB)
- Also on server: `/home/charitynet/clickforcharity-backup-20251112-184805.tar.gz`

---

## 🎯 NEXT STEPS

### 1. Update Frontend to Use New APIs
The ClickForCharity frontend needs to be updated to:
- Use the new `user_id` format: `id-username` (e.g., `11-comet`)
- Call the updated APIs with proper user_id
- Display balance from new structure

**Current Frontend Files to Check:**
- `/public_html/surf-ads.html` (or similar)
- Any JavaScript that calls balance APIs
- Session/auth integration

### 2. Test End-to-End Signup Flow
**Test Steps:**
1. Create new user on auth.directsponsor.org
2. Access ClickForCharity site with that user
3. Verify profile auto-created on first action
4. Watch an ad, earn balance
5. Confirm balance persists

### 3. Migrate Old Users (if needed)
If there are real users in `/data/users/`:
```bash
# Check old users
ls /home/charitynet/domains/clickforcharity.net/data/users/
# Current: 1-testuser1.json, 2-testuser2.json (dummy data)
```

### 4. Setup Sync with Auth Server (Future)
Consider implementing periodic sync like ROFLFaucet:
- Push balance updates to auth server
- Pull profile changes from auth server
- Keep sites in sync

---

## 📝 KEY DIFFERENCES FROM ROFLFAUCET

| Aspect | ROFLFaucet | ClickForCharity |
|--------|-----------|-----------------|
| **Profile Stats** | `total_claims`, `total_games_played`, `total_won` | `total_ads_viewed`, `total_surveys_completed`, `total_earned` |
| **Data Directory** | `/var/roflfaucet-data/userdata/` | `/home/charitynet/domains/clickforcharity.net/data/userdata/` |
| **Old User Files** | None (started fresh) | `/data/users/*.json` (testuser1, testuser2) |
| **Production URL** | roflfaucet.com | clickforcharity.net |

---

## 🔧 TECHNICAL NOTES

### Auth Server Integration
- **URL:** `https://auth.directsponsor.org/api/sync.php`
- **Action:** `?action=get&user_id={id}&data_type=profile`
- **Response:** Returns complete profile data including username
- **Tested:** ✅ Working with curl on production

### Security
- User ID validation: `^[0-9]+-[a-zA-Z0-9_-]+$`
- Directory traversal protection
- Files outside web root
- File locking on writes (LOCK_EX)

### PHP Requirements
- ✅ `curl` extension available (tested on shared hosting)
- ✅ File permissions: 755 for directories, files auto-created with proper permissions
- ✅ JSON encoding/decoding

---

## 📊 TEST RESULTS SUMMARY

| Test | Status | Details |
|------|--------|---------|
| Profile lazy load (existing user) | ✅ | User 11-comet fetched from auth server |
| Profile lazy load (new user) | ✅ | User 12-comet created successfully |
| Balance update (existing) | ✅ | Balance updated with transactions |
| Balance lazy load | ✅ | User created on first balance update |
| Data structure compatibility | ✅ | Matches ROFLFaucet format |
| Auth server integration | ✅ | Successfully fetches user data |
| File security | ✅ | Data outside public_html |

---

## 🚀 DEPLOYMENT STATUS

**Production Server:** `clickforcharity-prod` (SSH access: `ssh clickforcharity-prod`)
**Deployed Files:**
- ✅ `/public_html/api/simple-profile.php` (NEW)
- ✅ `/public_html/api/update_balance.php` (UPDATED)
- ✅ `/public_html/api/update_balance_old.php` (BACKUP)
- ✅ `/data/userdata/profiles/` (directory created)
- ✅ `/data/userdata/balances/` (directory created)

**System Status:** 🟢 LIVE and WORKING
**Tested:** 2025-11-12 18:55 UTC
