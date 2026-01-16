# Task System Documentation

## Overview

The Click for Charity task system allows users to complete social media tasks (follows, likes, comments, etc.) to earn coins that can be allocated to help recipients. The system includes platform filtering, task expiry, automatic cleanup, and comprehensive monitoring.

## System Architecture

### User Flow

**Guest Users:**
1. Visit `simple-tasks.html` without logging in
2. See all available tasks in a single list
3. Can expand tasks, read instructions, and start timers
4. See sign-up prompts to save progress and earn coins

**Logged-In Users:**
1. Select platforms on `my-platforms.html`
2. Get 25 coin bonus for joining rewarded platforms (Odysee, Publish0x, Minds)
3. See filtered tasks based on platform selections
4. Tasks organized in 3 tabs: Engagements, Follows, Other
5. Complete tasks to earn coins
6. Skip unwanted tasks (can unskip later)
7. Track progress with stats

### Task Categories

1. **Engagements** - Likes, comments, shares (usually repeatable)
2. **Follows** - Follow accounts, subscribe to channels (one-time)
3. **Other** - SEO tasks, surveys, miscellaneous

### Platform Filtering

- **Platform-specific tasks** (`platform: "x"`, `"youtube"`, etc.) - Only show to users who selected that platform
- **Universal tasks** (`platform: "none"`) - Show to everyone regardless of platform membership

## File Structure

```
/api/
  ├── get-complex-tasks.php          # Fetch tasks for user (filtered by platform)
  ├── update-user-tasks.php          # Complete or skip tasks
  ├── get-skipped-tasks.php          # Fetch user's skipped tasks
  ├── unskip-task.php                # Restore skipped task
  ├── save-complex-task.php          # Admin: Create new task
  ├── delete-complex-task.php        # Admin: Delete task
  ├── cleanup-expired-tasks.php      # Cron: Clean expired/deleted tasks
  ├── cleanup-status.php             # Monitor cleanup health
  └── send-cleanup-alert.php         # Cron: Email alerts

/data/
  └── complex-tasks/
      └── tasks.json                 # Master task list

/js/
  ├── complex-tasks.js               # Task UI and interactions
  └── skipped-tasks.js               # Skipped tasks page

/simple-tasks.html                   # Main tasks page
/skipped-tasks.html                  # Skipped tasks page
/my-platforms.html                   # Platform selection page
/admin-simple-tasks.html             # Admin task management

/CRON-SETUP.md                       # Cron job setup guide
/TASK-SYSTEM-DOCS.md                 # This file
```

## Task Data Structure

```json
{
  "id": "task_001",
  "title": "Follow @ClickForAfrica on X",
  "shortDescription": "Help us grow our X community",
  "instructions": "1. Click Visit\n2. Follow @ClickForAfrica\n3. Return and complete",
  "url": "https://x.com/clickforafrica",
  "reward": 25,
  "duration": 20,
  "category": "follows",
  "platform": "x",
  "repeatable": false,
  "enabled": true,
  "expiryDate": "2026-02-15"
}
```

### Field Descriptions

- **id** - Unique identifier (e.g., `task_001`)
- **title** - Task name shown to users
- **shortDescription** - Brief description in compact view
- **instructions** - Step-by-step guide (supports multi-line)
- **url** - Destination URL when user clicks "Visit"
- **reward** - Coins earned on completion
- **duration** - Timer length in seconds (max 59)
- **category** - `follows`, `engagements`, or `other`
- **platform** - Platform filter (`x`, `youtube`, `facebook`, etc. or `none` for universal)
- **repeatable** - `true` if users can complete multiple times
- **enabled** - `true` to show task, `false` to hide
- **expiryDate** - Optional ISO date (YYYY-MM-DD), task hides after this date

## User Profile Data

Stored in `/var/clickforcharity-data/userdata/profiles/{userId}.txt`

```json
{
  "memberPlatforms": ["x", "youtube", "odysee"],
  "completedComplexTasks": ["task_001", "task_002"],
  "skippedComplexTasks": ["task_003"],
  "taskStats": {
    "totalCompleted": 15,
    "byCategory": {
      "follows": 5,
      "engagements": 8,
      "other": 2
    }
  }
}
```

## Admin Interface

Access: `admin-simple-tasks.html` (requires admin login)

### Creating Tasks

1. Fill out form with all task details
2. Select category (Engagements, Follows, Other)
3. Select platform (or "None" for universal tasks)
4. Check "Repeatable" if users can do it multiple times
5. Check "Enabled" to make it live
6. Optionally set expiry date
7. Click "Save Task"

### Managing Tasks

- View all tasks with full details
- See which tasks are enabled/disabled
- Delete tasks (cleanup script removes from user profiles)

## Task Expiry & Cleanup

### How Expiry Works

1. **Set expiry date** in admin interface (optional)
2. **API filters** expired tasks automatically
3. **Cleanup script** removes expired task IDs from user profiles
4. **Stats preserved** - total completed counts remain

### Cleanup Script

**Runs:** Daily at 2 AM (via cron)

**What it does:**
- Loads all valid tasks from `tasks.json`
- Removes expired task IDs from user profiles
- Removes deleted task IDs from user profiles
- Preserves `taskStats` for analytics
- Logs all activity
- Saves status for monitoring

**Manual run:**
```bash
curl https://clickforcharity.net/api/cleanup-expired-tasks.php
```

### Monitoring

**Check status:**
```bash
curl https://clickforcharity.net/api/cleanup-status.php
```

**Response:**
```json
{
  "last_cleanup": {
    "success": true,
    "timestamp": "2026-01-16 02:00:15",
    "users_cleaned": 5,
    "total_completed_removed": 12
  },
  "time_since_cleanup_hours": 14.5,
  "cleanup_overdue": false,
  "status": "healthy"
}
```

**Email alerts:**
- Configured in `/var/clickforcharity-data/config/alerts.json`
- Sends to `andy@clickforcharity.net`
- Alerts on failures or overdue (>48 hours)
- Checks every 5 minutes

## Common Tasks

### Add a New Task

1. Go to `admin-simple-tasks.html`
2. Fill out form
3. Choose appropriate category and platform
4. Save

### Add a Time-Limited Campaign

1. Create task as normal
2. Set "Expiry Date" to campaign end date
3. Task will auto-hide after that date
4. Cleanup script will remove it from user profiles

### Add a Universal Task (SEO, etc.)

1. Create task
2. Set platform to "None"
3. Set category to "Other"
4. All users will see it regardless of platform selection

### Delete a Task

1. Go to `admin-simple-tasks.html`
2. Scroll to "Manage Existing Tasks"
3. Click "Delete" on the task
4. Cleanup script will remove it from user profiles on next run

### Check System Health

Visit: `https://clickforcharity.net/api/cleanup-status.php`

### View Logs

```bash
# Cleanup activity
ssh clickforcharity 'tail -f /var/log/clickforcharity-cleanup.log'

# Errors
ssh clickforcharity 'tail -f /var/clickforcharity-data/logs/cleanup-errors.log'

# Email alerts
ssh clickforcharity 'tail -f /var/log/cleanup-alerts.log'
```

## API Reference

### GET /api/get-complex-tasks.php

**Parameters:**
- `user_id` - Combined user ID (format: `id-username`)

**Returns:**
- Filtered tasks based on user's platforms
- Excludes completed tasks (unless repeatable)
- Excludes skipped tasks
- Excludes expired tasks
- Excludes disabled tasks

### POST /api/update-user-tasks.php

**Body:**
```json
{
  "user_id": "123-username",
  "task_id": "task_001",
  "action": "complete"
}
```

**Actions:**
- `complete` - Mark task done, award coins, update stats
- `skip` - Hide task from list

### GET /api/get-skipped-tasks.php

**Parameters:**
- `user_id` - Combined user ID

**Returns:**
- List of tasks user has skipped

### POST /api/unskip-task.php

**Body:**
```json
{
  "user_id": "123-username",
  "task_id": "task_001"
}
```

**Returns:**
- Removes task from skipped list

### POST /api/save-complex-task.php

**Body:** Task object (see Task Data Structure above)

**Returns:**
- Success message with new task ID

### POST /api/delete-complex-task.php

**Body:**
```json
{
  "id": "task_001"
}
```

**Returns:**
- Success message

### GET /api/cleanup-expired-tasks.php

**No parameters**

**Returns:**
- Cleanup statistics

### GET /api/cleanup-status.php

**No parameters**

**Returns:**
- Health status and recent activity

## Troubleshooting

### Tasks not showing for users

1. Check if task is enabled
2. Check if task is expired
3. Check if user has selected the required platform
4. Check if user already completed it (and it's not repeatable)
5. Check if user skipped it

### Cleanup not running

1. Check cron is configured: `ssh clickforcharity 'crontab -l'`
2. Check cleanup logs: `tail -f /var/log/clickforcharity-cleanup.log`
3. Run manually: `curl https://clickforcharity.net/api/cleanup-expired-tasks.php`
4. Check status: `curl https://clickforcharity.net/api/cleanup-status.php`

### Email alerts not working

1. Check config: `cat /var/clickforcharity-data/config/alerts.json`
2. Verify `enabled: true`
3. Check alert logs: `tail -f /var/log/cleanup-alerts.log`
4. Test manually: `ssh clickforcharity 'php /var/www/clickforcharity.net/api/send-cleanup-alert.php'`

### User profiles growing too large

Run cleanup script more frequently:
```bash
# Change cron to run every 6 hours instead of daily
0 */6 * * * curl -s https://clickforcharity.net/api/cleanup-expired-tasks.php >> /var/log/clickforcharity-cleanup.log 2>&1
```

## Best Practices

1. **Set expiry dates** for time-limited campaigns
2. **Use platform filtering** to show relevant tasks
3. **Mark repeatable tasks** appropriately (engagements usually yes, follows usually no)
4. **Test tasks** before enabling (create disabled, test, then enable)
5. **Monitor cleanup** regularly via status endpoint
6. **Keep tasks.json** backed up
7. **Use "Other" category** for non-social tasks (SEO, surveys, etc.)
8. **Set realistic timers** (20-60 seconds typical)
9. **Clear instructions** - users should know exactly what to do
10. **Reasonable rewards** - balance effort vs. reward

## Future Enhancements

Potential improvements for future development:

- Task scheduling (show task at specific date/time)
- Task prerequisites (complete task A before task B unlocks)
- User task history page
- Admin analytics dashboard
- Bulk task import/export
- Task templates
- A/B testing different rewards
- Leaderboards based on taskStats
- Achievement badges

## Support

For issues or questions:
- Check this documentation
- Review `CRON-SETUP.md` for cron configuration
- Check API logs and status endpoints
- Contact: andy@clickforcharity.net
