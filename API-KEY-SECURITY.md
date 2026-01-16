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

## Best Practices

1. **Never hardcode API keys** in source files
2. **Use config.php** for all secrets
3. **Keep config.example.php** updated with structure (but no real values)
4. **Restrict API keys** in Google Cloud Console to specific domains/IPs
5. **Rotate keys regularly** (every 6-12 months)
6. **Use different keys** for development vs production
7. **Check .gitignore** before committing

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
