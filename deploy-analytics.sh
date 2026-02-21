#!/bin/bash
# Deploy analytics to clickforcharity.net

set -e

echo "🚀 Deploying analytics to clickforcharity.net..."

# Step 1: Copy files to server
echo "1️⃣ Copying files to server..."
scp analytics.py clickforcharity:/tmp/
scp site/stats.html clickforcharity:/tmp/

# Step 2: Deploy parser
echo "2️⃣ Deploying parser..."
ssh clickforcharity "sudo cp /tmp/analytics.py /usr/local/bin/ && sudo chmod +x /usr/local/bin/analytics.py"

# Step 3: Create data directory if needed
echo "3️⃣ Creating data directory..."
ssh clickforcharity "sudo mkdir -p /var/www/clickforcharity.net/public_html/data/analytics && sudo chown www-data:www-data /var/www/clickforcharity.net/public_html/data/analytics && sudo chmod 755 /var/www/clickforcharity.net/public_html/data/analytics"

# Step 4: Deploy dashboard
echo "4️⃣ Deploying dashboard..."
ssh clickforcharity "sudo cp /tmp/stats.html /var/www/clickforcharity.net/public_html/stats.html && sudo chown www-data:www-data /var/www/clickforcharity.net/public_html/stats.html && sudo chmod 644 /var/www/clickforcharity.net/public_html/stats.html"

# Step 5: Test parser
echo "5️⃣ Testing parser..."
ssh clickforcharity "python3 /usr/local/bin/analytics.py /var/log/apache2/clickforcharity_ssl_access.log -d /var/www/clickforcharity.net/public_html/data/analytics && echo 'Test successful!'"

# Step 6: Show results
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Dashboard: https://clickforcharity.net/stats.html"
echo "📁 Data directory: /var/www/clickforcharity.net/public_html/data/analytics"
echo "📝 Logs: /var/log/analytics-cron.log (after cron runs)"
echo ""
echo "⏰ Next: Set up cron job (see ANALYTICS-DEPLOYMENT.md Step 7)"
