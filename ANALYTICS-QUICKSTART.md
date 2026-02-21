# Analytics Deployment - Quick Start

Everything is ready to deploy analytics to clickforcharity.net. Here's the fastest path:

## Files Ready for Deployment

- ✅ `analytics.py` - Log parser (generates daily JSON reports)
- ✅ `site/stats.html` - Dashboard page
- ✅ `ANALYTICS-DEPLOYMENT.md` - Detailed deployment guide
- ✅ `deploy-analytics.sh` - Automated deploy script

## Server Details

- **Host**: clickforcharity.net (SSH alias: `clickforcharity`)
- **SSH Config**: Uses `~/.ssh/warp` key (already configured)
- **Web Root**: `/var/www/clickforcharity.net/public_html`
- **Data Directory**: `/var/www/clickforcharity.net/data` (private)
- **Apache Log**: `/var/log/apache2/clickforcharity_ssl_access.log`

## Fastest Deployment (5 minutes)

### Option 1: Automated Deploy Script

```bash
cd /home/andy/work/projects/clickforcharity.net
./deploy-analytics.sh
```

This script:
1. Copies files to server
2. Installs parser to `/usr/local/bin/`
3. Creates data directory
4. Deploys dashboard to public_html
5. Tests the parser

### Option 2: Manual Deployment

See `ANALYTICS-DEPLOYMENT.md` for step-by-step instructions.

## After Deployment

### Verify It Works

```bash
ssh clickforcharity
curl https://clickforcharity.net/stats.html | head -20
```

### Set Up Daily Cron Job

```bash
ssh clickforcharity
sudo crontab -e -u www-data
```

Add this line (runs daily at 2 AM):
```
0 2 * * * /usr/bin/python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/data/analytics >> /var/log/analytics-cron.log 2>&1
```

### Access Dashboard

After cron runs once (or test runs manually):
- Visit: **https://clickforcharity.net/stats.html**

## Dashboard Features

- **Day view**: Today's stats
- **Week view**: Week of selected day (Sun-Sat)
- **Month view**: Full calendar month
- **Navigation**: Previous/Next arrows to browse periods
- **Metrics**: Visitors, pageviews, avg/day, bandwidth
- **Charts**: Traffic trend, top pages
- **Tables**: Referrers, browsers

## Data Location

- **JSON files**: `/var/www/clickforcharity.net/data/analytics/report-YYYY-MM-DD.json`
- **Dashboard**: `/var/www/clickforcharity.net/public_html/stats.html`
- **Cron logs**: `/var/log/analytics-cron.log`

## Troubleshooting

**Dashboard shows "No data"**
```bash
# Check if JSON files exist
ssh clickforcharity
ls -lh /var/www/clickforcharity.net/data/analytics/

# Try running parser manually
python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/data/analytics
```

**Cron not running**
```bash
ssh clickforcharity
sudo grep CRON /var/log/syslog | grep analytics
```

**Parser fails**
```bash
ssh clickforcharity
python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/data/analytics
```

## Notes

- No external dependencies needed (Python 3 standard library only)
- JSON files are tiny (~1-5 KB each), keep forever for historical trends
- Apache is configured to deny web access to `/data` directory (privacy)
- Dashboard loads JSON files from `../data/analytics/` (relative path)
- All period aggregation happens client-side (week/month views)

## Next Steps

1. Run: `./deploy-analytics.sh`
2. Set up cron job (Step 4 above)
3. Wait 24 hours or test manually
4. Visit https://clickforcharity.net/stats.html ✨
