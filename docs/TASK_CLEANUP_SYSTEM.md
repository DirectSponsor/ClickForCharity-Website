# Task Completion Cleanup System

## Overview

The task completion tracking system now includes automatic cleanup mechanisms to prevent localStorage bloat from expired tasks. This applies to both PTC Ads and Simple Tasks.

## Problem Statement

Previously, completion records were stored indefinitely in localStorage:
- Users complete tasks → timestamps stored in `localStorage['completed_tasks']`
- Tasks expire or get deleted → completion records remain
- Over time, localStorage grows with orphaned completion data
- No mechanism to remove records for tasks that no longer exist

## Solution

Automatic cleanup functions that remove completion records for expired/deleted tasks when pages load.

## Implementation

### 1. PTC Ads Cleanup

**Function:** `cleanupExpiredAdCompletions(activeAdIds)`

**Location:** `js/unified-balance.js`

**How it works:**
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

**Called from:** `js/app.js` (PTC page)
```javascript
// Clean up completion records for expired ads
const activeAdIds = ads.map(ad => ad.id);
window.UnifiedBalance.cleanupExpiredAdCompletions(activeAdIds);
```

**When:** Every time the PTC page loads and renders ads

### 2. Simple Tasks Cleanup

**Function:** `cleanupExpiredSimpleTaskCompletions(activeTaskIds)`

**Location:** `js/unified-balance.js`

**How it works:**
```javascript
cleanupExpiredSimpleTaskCompletions(activeTaskIds) {
    const completedTasks = this.getCompletedTasks();
    let cleaned = false;
    
    // Remove completion records for tasks that start with 'simple_' but aren't in active list
    Object.keys(completedTasks).forEach(taskId => {
        if (taskId.startsWith('simple_') && !activeTaskIds.includes(taskId)) {
            delete completedTasks[taskId];
            cleaned = true;
        }
    });
    
    if (cleaned) {
        localStorage.setItem('completed_tasks', JSON.stringify(completedTasks));
        console.log('🧹 Cleaned up expired simple task completion records');
    }
}
```

**Called from:** `js/simple-tasks.js`
```javascript
// Clean up completion records for expired simple tasks
const activeTaskIds = simpleTasks.map(task => task.id);
window.UnifiedBalance.cleanupExpiredSimpleTaskCompletions(activeTaskIds);
```

**When:** Every time the Simple Tasks page loads and renders tasks

## Server-Side Expiry Integration

Both systems integrate with existing server-side expiry mechanisms:

### PTC Ads (`api/get-ads.php`)
```php
// Auto-delete expired ads
if (isset($ad['expiresAt']) && $ad['expiresAt'] !== null && $ad['expiresAt'] < $now) {
    unlink($file);
    continue;
}
```

### Simple Tasks (`api/get-simple-tasks.php`)
```php
// Auto-delete expired tasks (if they have expiry)
if (isset($task['expiresAt']) && $task['expiresAt'] !== null && $task['expiresAt'] < $now) {
    unlink($file);
    continue;
}
```

## Data Flow

```
Admin creates task with expiry date
    ↓
Task stored in /var/clickforcharity-data/
    ↓
User completes task
    ↓
Completion timestamp stored in localStorage
    ↓
[Time passes, task expires]
    ↓
API deletes expired task file
    ↓
User visits page
    ↓
Page fetches active tasks from API
    ↓
Cleanup function compares localStorage vs active tasks
    ↓
Orphaned completion records removed
    ↓
localStorage stays clean
```

## PTC Tasks Counter

In addition to cleanup, we now track total PTC tasks completed for user statistics.

### Functions

**Get total count:**
```javascript
getTotalPTCTasksCompleted() {
    const stats = localStorage.getItem('ptc_stats');
    if (!stats) return 0;
    const parsed = JSON.parse(stats);
    return parsed.totalCompleted || 0;
}
```

**Increment counter:**
```javascript
incrementPTCTasksCompleted() {
    const stats = localStorage.getItem('ptc_stats');
    const parsed = stats ? JSON.parse(stats) : { totalCompleted: 0 };
    parsed.totalCompleted = (parsed.totalCompleted || 0) + 1;
    localStorage.setItem('ptc_stats', JSON.stringify(parsed));
    console.log('📊 Total PTC tasks completed:', parsed.totalCompleted);
    return parsed.totalCompleted;
}
```

**Usage in app.js:**
```javascript
window.UnifiedBalance.markTaskCompleted(ad.id);

// Increment total PTC tasks completed counter
window.UnifiedBalance.incrementPTCTasksCompleted();
```

### Storage Format

```javascript
// localStorage['ptc_stats']
{
    "totalCompleted": 42  // Lifetime count of PTC ads completed
}
```

This counter:
- Never resets (lifetime statistic)
- Increments on each PTC ad completion
- Survives the 23-hour rolling reset
- Can be used for user profiles, achievements, analytics, etc.

## Benefits

1. **Prevents localStorage bloat**
   - Automatic cleanup on page load
   - No manual intervention needed
   - Scales with task lifecycle

2. **Maintains data accuracy**
   - Only tracks active tasks
   - Removes stale data automatically
   - Keeps localStorage lean

3. **No performance impact**
   - Cleanup runs once per page load
   - Only processes completion records
   - Minimal overhead

4. **User statistics**
   - Lifetime PTC task count preserved
   - Can be displayed in user profile
   - Useful for gamification/achievements

## Testing

### Test PTC Ads Cleanup

```javascript
// In browser console on PTC page

// 1. Add fake completion for non-existent ad
const tasks = JSON.parse(localStorage.getItem('completed_tasks'));
tasks['ad_999'] = new Date().toISOString();
localStorage.setItem('completed_tasks', JSON.stringify(tasks));

// 2. Reload page
location.reload();

// 3. Check if ad_999 was removed
const tasksAfter = JSON.parse(localStorage.getItem('completed_tasks'));
console.log('ad_999 still exists?', 'ad_999' in tasksAfter); // Should be false
```

### Test Simple Tasks Cleanup

```javascript
// In browser console on Simple Tasks page

// 1. Add fake completion for non-existent task
const tasks = JSON.parse(localStorage.getItem('completed_tasks'));
tasks['simple_999'] = new Date().toISOString();
localStorage.setItem('completed_tasks', JSON.stringify(tasks));

// 2. Reload page
location.reload();

// 3. Check if simple_999 was removed
const tasksAfter = JSON.parse(localStorage.getItem('completed_tasks'));
console.log('simple_999 still exists?', 'simple_999' in tasksAfter); // Should be false
```

### Test PTC Counter

```javascript
// Check current count
console.log('Total PTC tasks:', window.unifiedBalance.getTotalPTCTasksCompleted());

// Complete a task (will auto-increment)
// Then check again
console.log('Total PTC tasks:', window.unifiedBalance.getTotalPTCTasksCompleted());
```

## Monitoring

### Check localStorage Size

```javascript
// Total size of completion data
const tasks = localStorage.getItem('completed_tasks');
console.log('Completion data:', tasks ? tasks.length : 0, 'characters');

// Number of records
const parsed = JSON.parse(tasks || '{}');
console.log('Total records:', Object.keys(parsed).length);
console.log('PTC ads:', Object.keys(parsed).filter(k => k.startsWith('ad_')).length);
console.log('Simple tasks:', Object.keys(parsed).filter(k => k.startsWith('simple_')).length);
```

### Check PTC Stats

```javascript
const stats = localStorage.getItem('ptc_stats');
console.log('PTC stats:', JSON.parse(stats || '{}'));
```

## Future Enhancements

1. **Server-side tracking**
   - Move completion data to user files on server
   - Sync across devices
   - More reliable than localStorage

2. **Analytics dashboard**
   - Show total tasks completed
   - Completion rate over time
   - Most popular tasks

3. **Achievements system**
   - Milestones (10, 50, 100 tasks)
   - Badges for consistent completion
   - Leaderboards

4. **Cleanup scheduling**
   - Run cleanup on a timer (e.g., every 5 minutes)
   - Not just on page load
   - More aggressive cleanup

## Related Documentation

- `PTC_AD_RESET_SYSTEM.md` - 23-hour rolling reset for PTC ads
- `includes/README.md` - Include system for sidebar
- `api/get-ads.php` - Server-side ad expiry
- `api/get-simple-tasks.php` - Server-side task expiry
