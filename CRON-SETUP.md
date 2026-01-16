# Cron Job Setup for Task Cleanup

## Quick Setup

Add this line to your crontab to run cleanup daily at 2 AM:

```bash
0 2 * * * curl -s https://clickforcharity.net/api/cleanup-expired-tasks.php >> /var/log/clickforcharity-cleanup.log 2>&1
```

## Step-by-Step Instructions

### 1. Open crontab editor
```bash
crontab -e
```

### 2. Add the cleanup job
Choose one of these schedules:

**Daily at 2 AM (recommended):**
```
0 2 * * * curl -s https://clickforcharity.net/api/cleanup-expired-tasks.php >> /var/log/clickforcharity-cleanup.log 2>&1
```

**Every 6 hours:**
```
0 */6 * * * curl -s https://clickforcharity.net/api/cleanup-expired-tasks.php >> /var/log/clickforcharity-cleanup.log 2>&1
```

**Weekly on Sunday at 3 AM:**
```
0 3 * * 0 curl -s https://clickforcharity.net/api/cleanup-expired-tasks.php >> /var/log/clickforcharity-cleanup.log 2>&1
```

### 3. Save and exit
- In nano: `Ctrl+X`, then `Y`, then `Enter`
- In vim: `Esc`, then `:wq`, then `Enter`

### 4. Verify cron is scheduled
```bash
crontab -l
```

## Manual Testing

Test the cleanup script manually before scheduling:

```bash
curl https://clickforcharity.net/api/cleanup-expired-tasks.php
```

Expected output:
```json
{
  "success": true,
  "message": "Cleanup completed - removed expired and deleted tasks from user profiles",
  "valid_task_count": 7,
  "expired_task_ids": [],
  "expired_task_count": 0,
  "users_cleaned": 0,
  "total_completed_removed": 0,
  "total_skipped_removed": 0
}
```

## Monitoring

### Check cleanup logs
```bash
tail -f /var/log/clickforcharity-cleanup.log
```

### Check last cleanup status
Visit: https://clickforcharity.net/api/cleanup-status.php

Example response:
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

### Email notifications

**1. Enable email alerts:**

Copy the example config:
```bash
cp data/config/alerts.json.example /var/clickforcharity-data/config/alerts.json
```

Edit the config:
```bash
nano /var/clickforcharity-data/config/alerts.json
```

Set your email:
```json
{
  "enabled": true,
  "email": "your-email@example.com",
  "from": "noreply@clickforcharity.net"
}
```

**2. Add alert cron job:**

This checks every 5 minutes and sends email if cleanup failed or is overdue:
```
*/5 * * * * php /path/to/clickforcharity.net/api/send-cleanup-alert.php >> /var/log/cleanup-alerts.log 2>&1
```

**3. Test email alerts:**
```bash
php api/send-cleanup-alert.php
```

## Troubleshooting

### Cron not running?
```bash
# Check if cron service is running
sudo systemctl status cron

# Restart cron if needed
sudo systemctl restart cron
```

### Check cron logs
```bash
grep CRON /var/log/syslog
```

### Permissions issues
```bash
# Ensure log directory exists and is writable
sudo mkdir -p /var/log
sudo chmod 755 /var/log
```
