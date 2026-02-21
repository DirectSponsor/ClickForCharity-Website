# Deployment Guide - clickforcharity.net

Quick deployment guide for the new analytics system with per-site stats.

## Overview
- **Parser**: `analytics.py` generates daily JSON reports  
- **Dashboard**: `stats.html` loads JSON and shows day/week/month views  
- **Data location**: `/data/analytics/` (private, not web-accessible)  
- **Public page**: `/stats.html` on each site  

## Step 1: Create Analytics Data Directory

```bash
# SSH into clickforcharity.net VPS
ssh clickforcharity

# Create analytics subdirectory in data folder
sudo mkdir -p /var/www/clickforcharity.net/data/analytics
sudo chown www-data:www-data /var/www/clickforcharity.net/data/analytics
sudo chmod 750 /var/www/clickforcharity.net/data/analytics
```

## Step 2: Deploy Python Parser

```bash
# Copy analytics.py to server
scp analytics.py clickforcharity:/tmp/

# SSH in and move to final location
ssh clickforcharity
sudo cp /tmp/analytics.py /usr/local/bin/
sudo chmod +x /usr/local/bin/analytics.py
```

## Step 3: Find Apache Log Location

```bash
# SSH in
ssh clickforcharity

# Check Apache log location
ls -la /var/log/apache2/clickforcharity_ssl_access.log

# Or if you see multiple logs, find the right one:
ls -lh /var/log/apache2/ | grep clickforcharity
```

## Step 4: Test the Parser

```bash
# Test run (adjust log path if needed)
python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/data/analytics

# Check if JSON files were created
ls -lh /var/www/clickforcharity.net/data/analytics/
```

## Step 5: Deploy Dashboard

```bash
# Copy stats.html to web root
scp stats.html clickforcharity:/tmp/

# SSH in and move to web root
ssh clickforcharity
sudo cp /tmp/stats.html /var/www/clickforcharity.net/public_html/stats.html
sudo chown www-data:www-data /var/www/clickforcharity.net/public_html/stats.html
sudo chmod 644 /var/www/clickforcharity.net/public_html/stats.html
```

## Step 6: Test Dashboard Access

Visit in browser:
- https://clickforcharity.net/stats.html

The dashboard should load (may show "No data" if today's report doesn't exist yet).

## Step 7: Set Up Cron Job

```bash
# SSH in
ssh clickforcharity

# Edit crontab for www-data user
sudo crontab -e -u www-data

# Add this line (runs daily at 2 AM, adjust log path if needed):
0 2 * * * /usr/bin/python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/data/analytics >> /var/log/analytics-cron.log 2>&1
```

## Step 7: Verify After 24 Hours

```bash
# Check if cron ran
sudo tail -f /var/log/analytics-cron.log

# Check if new JSON files appear
ls -lht /data/analytics/

# Verify stats.html loads new data
```

## Dashboard Features

### Navigation
- **Day**: Shows today's stats (or selected day)
- **Week**: Aggregates Sun-Sat week containing selected date
- **Month**: Aggregates full calendar month

### Arrows
- **Previous**: Go back one period
- **Next**: Go forward one period (won't go beyond today)

### Data
- Loads JSON files from `../data/analytics/report-YYYY-MM-DD.json`
- Aggregates multiple days client-side for week/month views
- Charts update automatically when period changes

## Troubleshooting

### Dashboard shows "No data"
- Check JSON files exist: `ls /data/analytics/`
- Check browser console for fetch errors
- Verify JSON path in stats.html line 267: `../data/analytics/`

### Parser fails
- Check log file exists and is readable
- Check /data/analytics/ is writable
- Run manually to see errors: `python3 /usr/local/bin/analytics.py /path/to/access.log -d /data/analytics`

### Cron not running
- Check cron service: `sudo systemctl status cron`
- Check logs: `sudo grep CRON /var/log/syslog`
- Verify crontab: `sudo crontab -l -u www-data`

## File Structure

```
/
├── data/
│   └── analytics/
│       ├── report-2026-02-15.json
│       ├── report-2026-02-14.json
│       └── report-2026-02-13.json
├── var/
│   └── www/
│       └── html/
│           └── stats.html
└── usr/
    └── local/
        └── bin/
            └── analytics.py
```

## Notes

- JSON files are ~1-5 KB each, so 365 days = ~2-5 MB total
- Keep JSON files forever for historical trends
- Raw logs managed by server (typically auto-rotate after 7-30 days)
- No external dependencies except Python 3 standard library
- Dashboard works offline once loaded (all processing client-side)
