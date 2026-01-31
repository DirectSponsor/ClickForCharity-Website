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

## Phase 3: User-Submitted Ads (Future Enhancement)

### Concept
Allow users to purchase and submit their own banner ads via Lightning payment.

### Workflow
1. User uploads banner image (728×90 or 320×50)
2. User enters destination URL
3. User selects campaign duration (days)
4. System generates Lightning invoice for payment
5. Upon payment confirmation, script automatically adds ad to rotation files
6. Almost instant activation after payment

### Technical Implementation Ideas

**Frontend:**
- Upload form with image validation (size, dimensions, file type)
- Preview before payment
- Campaign duration selector
- Pricing calculator

**Backend:**
- Image upload handler with validation
- Image storage (filesystem or CDN)
- Lightning invoice generation (BTCPay Server, LNbits, etc.)
- Webhook listener for payment confirmation
- Automated script to append ad to text files
- Optional: Expiry tracking with automatic removal

**Features to Consider:**
- User dashboard to view active ads
- Click/impression tracking
- Automatic expiry and removal
- Email notifications
- Refund policy
- Content moderation (automated or manual)
- **Browser cache handling:** Display message to user after payment: "Your ad is now live! If you don't see it immediately, please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"

**Benefits:**
- Instant ad activation (no manual approval)
- Automated payment processing
- Self-service for advertisers
- Scalable revenue stream
- Fair rotation (all ads get equal exposure)

**Pricing Structure Options:**
- Per day (e.g., 1000 sats/day)
- Per impression (e.g., 10 sats per 1000 views)
- Per click (e.g., 100 sats per click)
- Flat rate for duration (e.g., 5000 sats for 7 days)

---

## Known Issues & Resolutions

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
