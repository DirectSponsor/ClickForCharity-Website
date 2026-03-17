# API Key Security Guide

## 🔴 URGENT: Exposed Google API Key

**Key Found:** `AIzaSyA65lEHUEizIsNtlbNo-l2K18dT680nsaM`

**Location:** Git history (commits 9004478 and a636f38)

### Immediate Action Required

1. **Revoke the exposed key:**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Find the key ending in `...nsaM`
   - Click the three dots (⋮) → Delete

2. **Generate a new key:**
   - Click "Create Credentials" → "API Key"
   - Restrict the key to specific APIs (Google Analytics, etc.)
   - Copy the new key

3. **Store the new key securely:**
   - Create `config.php` from `config.example.php`
   - Add your new key to the config
   - Never commit `config.php` to git

## Secure Configuration System

### Setup Instructions

1. **Copy the example config:**
   ```bash
   cp config.example.php config.php
   ```

2. **Edit config.php with your actual keys:**
   ```bash
   nano config.php
   ```

3. **Update your code to use the config:**
   ```php
   <?php
   $config = require_once __DIR__ . '/config.php';
   $apiKey = $config['google']['api_key'];
   ?>
   ```

4. **Verify config.php is gitignored:**
   ```bash
   git check-ignore config.php
   # Should output: config.php
   ```

### What's Protected

The `.gitignore` file now prevents these from being committed:

- `config.php` - Your actual configuration with secrets
- `.env` files - Environment variables
- `/var/clickforcharity-data/config/` - Server-side configs
- `deploy.sh` - Deployment script (keep local)

### Using the Config

**In PHP files:**
```php
<?php
$config = require_once __DIR__ . '/config.php';

// Access values
$googleApiKey = $config['google']['api_key'];
$adminEmail = $config['email']['admin'];
?>
```

**In JavaScript (via PHP endpoint):**
```javascript
// Create api/get-config.php that returns safe public values
fetch('/api/get-config.php')
  .then(r => r.json())
  .then(config => {
    // Use config.analyticsId, etc.
  });
```

## SMTP Email Configuration

### Secure Setup (Implemented)

The contact form uses SMTP to send emails. Credentials are stored securely outside the web root.

**Server Configuration:**
```bash
# Config file location (outside web root)
/var/www/clickforcharity.net/config/smtp-config.php

# Permissions (only www-data can read)
chmod 600 smtp-config.php
chown www-data:www-data smtp-config.php
```

**Config File Structure:**
```php
<?php
return [
    'host' => 'mail.clickforcharity.net',
    'username' => 'andy@clickforcharity.net',
    'password' => 'YOUR_PASSWORD_HERE',
    'port' => 465,
    'encryption' => 'ssl'
];
```

**Usage in Code:**
```php
// Load secure config from outside web root
$smtpConfig = require '/var/www/clickforcharity.net/config/smtp-config.php';

$mail->Host = $smtpConfig['host'];
$mail->Username = $smtpConfig['username'];
$mail->Password = $smtpConfig['password'];
```

**Files:**
- ✅ `config.example-smtp.php` - Example file in git (no real password)
- ❌ `smtp-config.php` - Never committed (in .gitignore)
- ✅ Server file: `/var/www/clickforcharity.net/config/smtp-config.php`

**Protected Components:**
- Contact form: `site/api/contact-advertise.php`
- PHPMailer library: `site/lib/PHPMailer/`
- SMTP credentials: Stored outside public_html

**Error Logs:**
```bash
# Check email sending attempts
ssh es1 "tail -f /var/log/apache2/clickforcharity_ssl_error.log | grep SMTP"
```

## Best Practices

1. **Never hardcode API keys or passwords** in source files
2. **Use config.php** for all secrets
3. **Keep config.example.php** updated with structure (but no real values)
4. **Store SMTP credentials** outside the web root
5. **Restrict API keys** in Google Cloud Console to specific domains/IPs
6. **Rotate keys regularly** (every 6-12 months)
7. **Use different keys** for development vs production
8. **Check .gitignore** before committing
9. **Set proper file permissions** (600 for config files)

## Deployment

The deploy script now:
1. Commits changes
2. Pushes to GitHub
3. Deploys to server

**Important:** `config.php` stays local and on the server only. Never in git.

To deploy config changes:
```bash
# Edit config.php locally
nano config.php

# Manually copy to server
scp config.php clickforcharity:/var/www/clickforcharity.net/public_html/
```

## Checking for Exposed Secrets

Before committing:
```bash
# Check for potential API keys
git diff | grep -i "api.*key\|AIza\|secret"

# Use git-secrets (install first)
git secrets --scan
```

## Recovery from Exposure

If you accidentally commit a secret:

1. **Revoke the secret immediately** (don't wait)
2. **Generate a new one**
3. **Update config.php** (don't commit)
4. **Deploy the new config** to server
5. **Don't try to remove from git history** (it's already public)

## Questions?

- Check this guide
- Review `config.example.php` for structure
- Contact: andy@clickforcharity.net
