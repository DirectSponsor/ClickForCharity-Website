# PTC Ad Reset System - 23-Hour Rolling Reset

## Overview

The PTC (Paid-to-Click) ad system uses a **23-hour rolling reset** mechanism to allow users to complete the same ad once every 23 hours. This prevents users from returning at approximately the same time each day and finding ads still marked as completed.

## Why 23 Hours Instead of 24?

If we used a 24-hour reset, users who return at roughly the same time each day might find ads still unavailable. For example:
- User completes ad at 6:00 PM on Monday
- User returns at 5:55 PM on Tuesday (23h 55m later)
- With 24-hour reset: Ad still locked for 5 more minutes
- With 23-hour reset: Ad is available

The 23-hour window ensures ads are always available when users return on their daily routine.

## Implementation

### Files Modified

1. **`js/unified-balance.js`**
   - Added `isPTCAdCompleted(adId)` method
   - Added `cleanupExpiredAdCompletions(activeAdIds)` method

2. **`js/app.js`** (PTC page)
   - Updated to use `isPTCAdCompleted()` instead of `isTaskCompleted()`
   - Calls cleanup function on page load

### Key Functions

#### `isPTCAdCompleted(adId)`

```javascript
isPTCAdCompleted(adId) {
    const completedTasks = this.getCompletedTasks();
    const completedTimestamp = completedTasks[adId];
    
    if (!completedTimestamp) return false;
    
    // Check if 23 hours have passed since completion
    const completedTime = new Date(completedTimestamp);
    const now = new Date();
    const hoursSinceCompletion = (now - completedTime) / (1000 * 60 * 60);
    
    // If more than 23 hours have passed, task is available again
    if (hoursSinceCompletion >= 23) {
        // Clean up old completion record
        delete completedTasks[adId];
        localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
        return false;
    }
    
    return true;
}
```

**How it works:**
1. Retrieves completion timestamp from localStorage
2. Calculates hours since completion
3. If ≥23 hours: removes completion record and returns `false` (available)
4. If <23 hours: returns `true` (still completed)

#### `cleanupExpiredAdCompletions(activeAdIds)`

```javascript
cleanupExpiredAdCompletions(activeAdIds) {
    const completedTasks = this.getCompletedTasks();
    let cleaned = false;
    
    // Remove completion records for ads that start with 'ad_' but aren't in active list
    Object.keys(completedTasks).forEach(taskId => {
        if (taskId.startsWith('ad_') && !activeAdIds.includes(taskId)) {
            delete completedTasks[taskId];
            cleaned = true;
        }
    });
    
    if (cleaned) {
        localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
        console.log('🧹 Cleaned up expired ad completion records');
    }
}
```

**How it works:**
1. Gets list of currently active ad IDs from the API
2. Finds completion records for ads that no longer exist
3. Removes those orphaned completion records
4. Prevents localStorage bloat from expired campaigns

### Data Flow

```
User completes PTC ad
    ↓
markTaskCompleted(adId) stores timestamp
    ↓
localStorage: { "ad_123": "2026-01-11T18:00:00.000Z" }
    ↓
[23 hours pass]
    ↓
isPTCAdCompleted(adId) checks timestamp
    ↓
23+ hours elapsed → removes record, returns false
    ↓
Ad shows as available again
```

### Ad Expiry Integration

The system integrates with the existing ad expiry mechanism:

**Server-side (`api/get-ads.php`):**
- Ads have an `expiresAt` timestamp based on campaign duration
- API automatically deletes expired ad files when fetching
- Campaign duration options: 1 day, 2 days, 1 week, 1 month, indefinite

**Client-side cleanup:**
- When PTC page loads, calls `cleanupExpiredAdCompletions()`
- Removes completion records for ads that no longer exist
- Keeps localStorage clean without manual intervention

## Differences from Simple Tasks

| Feature | PTC Ads | Simple Tasks |
|---------|---------|--------------|
| Reset behavior | 23-hour rolling | One-time only |
| Method used | `isPTCAdCompleted()` | `isTaskCompleted()` |
| Cleanup | Automatic (expired ads) | Manual (needs implementation) |
| Use case | Repeatable daily tasks | One-off actions |

## User Experience

**Status Messages:**
- Available: "Ready when you are"
- Completed: "Completed (available in <23h)"
- After 23h: Automatically shows as "Ready when you are"

**Visual Indicators:**
- Completed ads have `.done` class applied
- Completed ads are sorted to bottom of list
- "Visit" button changes to "Viewed" when completed

## Testing the System

### Manual Testing

1. **Complete an ad:**
   ```javascript
   // In browser console
   window.unifiedBalance.markTaskCompleted('ad_1');
   ```

2. **Check completion status:**
   ```javascript
   window.unifiedBalance.isPTCAdCompleted('ad_1'); // Should return true
   ```

3. **Simulate 23 hours passing:**
   ```javascript
   // Get completion data
   const tasks = JSON.parse(localStorage.getItem('completed_tasks'));
   
   // Set timestamp to 23+ hours ago
   const twentyThreeHoursAgo = new Date(Date.now() - (23 * 60 * 60 * 1000) - 1000);
   tasks['ad_1'] = twentyThreeHoursAgo.toISOString();
   localStorage.setItem('completed_tasks', JSON.stringify(tasks));
   
   // Refresh page - ad should be available again
   ```

4. **Test cleanup:**
   ```javascript
   // Add fake completion for non-existent ad
   const tasks = JSON.parse(localStorage.getItem('completed_tasks'));
   tasks['ad_999'] = new Date().toISOString();
   localStorage.setItem('completed_tasks', JSON.stringify(tasks));
   
   // Reload PTC page - cleanup should remove ad_999
   ```

## Maintenance

### Monitoring localStorage Size

```javascript
// Check size of completion data
const tasks = localStorage.getItem('completed_tasks');
console.log('Completion data size:', tasks ? tasks.length : 0, 'characters');
console.log('Number of completed tasks:', tasks ? Object.keys(JSON.parse(tasks)).length : 0);
```

### Manual Cleanup (if needed)

```javascript
// Remove all PTC ad completions
const tasks = JSON.parse(localStorage.getItem('completed_tasks'));
Object.keys(tasks).forEach(key => {
    if (key.startsWith('ad_')) delete tasks[key];
});
localStorage.setItem('completed_tasks', JSON.stringify(tasks));
```

## Future Enhancements

Potential improvements to consider:

1. **Show exact time remaining:**
   - Calculate and display "Available in 2h 15m" instead of "<23h"
   - Update dynamically with a countdown

2. **Server-side tracking:**
   - Move completion tracking to user data files
   - Sync across devices
   - More reliable than localStorage

3. **Configurable reset period:**
   - Allow admins to set reset period per ad (12h, 23h, 48h, etc.)
   - Store in ad data structure

4. **Analytics:**
   - Track completion rates
   - Monitor which ads are most popular
   - Identify optimal reset periods

## Troubleshooting

**Issue: Ads not resetting after 23 hours**
- Check browser console for errors
- Verify timestamp format in localStorage
- Ensure `isPTCAdCompleted()` is being called

**Issue: localStorage growing too large**
- Run cleanup function manually
- Check for orphaned completion records
- Consider implementing server-side tracking

**Issue: Ads resetting too quickly**
- Verify system clock is correct
- Check for timezone issues in timestamp calculation
- Review timestamp storage format (should be ISO 8601)

## Related Documentation

- `includes/README.md` - Include system for sidebar
- `IMMEDIATE_CONTEXT.md` - Project status and context
- `api/get-ads.php` - Server-side ad expiry logic
