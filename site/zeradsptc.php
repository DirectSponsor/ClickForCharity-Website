<?php
/**
 * ZerAds PTC Callback Handler
 *
 * ZerAds calls this URL when a user completes viewing an ad:
 *   https://clickforcharity.net/zeradsptc.php?pwd=SECRET&user=USER_ID&amount=AMOUNT&clicks=CLICKS
 *
 * Setup:
 *   1. Set your ZerAds callback password in /var/clickforcharity-data/zerads-secret.txt
 *   2. In ZerAds admin, set the callback URL to:
 *        https://clickforcharity.net/zeradsptc.php?pwd=YOUR_PASSWORD&user={USERNAME}&amount={AMOUNT}&clicks={CLICKS}
 *
 * Supported user ID formats:
 *   - Logged-in:  42-alice   (id-username, credited via auth server)
 *   - Anonymous:  anon_a1b2c3d4e5f6  (12-char hex, credited via flat file)
 *
 * Coins awarded: amount (ZER) × EXCHANGE_RATE, minimum 1 coin.
 */

// --- Configuration ---

// Exchange rate: coins per 1 ZER.
// ZerAds sends amounts in multiples of 0.001 ZER, so use a multiple of 1000
// to guarantee whole-number coin awards (no rounding surprises):
//   0.001 ZER × 1000 = 1 coin
//   0.01  ZER × 1000 = 10 coins
// Set "1 ZER = 1000" in the ZerAds admin display field to match.
define('EXCHANGE_RATE', 1000);

// ZerAds callback server IP — only accept requests from this address.
define('ZERADS_SERVER_IP', '162.0.208.108');

define('LOG_FILE',   '/var/clickforcharity-data/zerads-log.txt');
define('ANON_DIR',   '/var/clickforcharity-data/anon');
define('AUTH_URL',   'https://auth.directsponsor.org/api/update_balance.php');

// Read callback secret from file (never commit the secret to git)
$secretFile = '/var/clickforcharity-data/zerads-secret.txt';
$secret     = file_exists($secretFile) ? trim(file_get_contents($secretFile)) : '';

// --- Validate server IP ---

$callerIp = $_SERVER['REMOTE_ADDR'] ?? '';
if ($callerIp !== ZERADS_SERVER_IP) {
    http_response_code(403);
    echo 'FORBIDDEN';
    zerads_log("REJECTED: unexpected IP {$callerIp}");
    exit;
}

// --- Validate secret ---

$pwd = $_GET['pwd'] ?? '';
if ($secret === '' || $pwd !== $secret) {
    http_response_code(403);
    echo 'INVALID_PASSWORD';
    zerads_log("REJECTED: bad password (got: " . substr(htmlspecialchars($pwd), 0, 8) . "...)");
    exit;
}

// --- Parse and validate parameters ---

$userId = trim($_GET['user']   ?? '');
$amount = floatval($_GET['amount'] ?? 0);
$clicks = intval($_GET['clicks']   ?? 0);

if ($userId === '' || $amount < 0) {
    http_response_code(400);
    echo 'INVALID_PARAMS';
    zerads_log("REJECTED: missing/invalid params user={$userId} amount={$amount}");
    exit;
}

// Convert ZER amount to coins using exchange rate; minimum 1 coin
$coins = max(1, (int) round($amount * EXCHANGE_RATE));

zerads_log("CALLBACK: user={$userId} zerads_amount={$amount} clicks={$clicks} coins_awarded={$coins}");

// --- Route by user type ---

if (preg_match('/^\d+-[a-zA-Z0-9_-]+$/', $userId)) {
    // Logged-in user (format: id-username)
    credit_logged_in($userId, $coins);
} elseif (preg_match('/^anon_[a-f0-9]{12}$/', $userId)) {
    // Anonymous user — credit to flat-file pending balance
    credit_anon($userId, $coins);
} else {
    http_response_code(400);
    echo 'INVALID_USER_FORMAT';
    zerads_log("REJECTED: unrecognised user format: {$userId}");
    exit;
}

echo 'OK';

// --- Functions ---

function credit_logged_in($userId, $coins) {
    $payload = json_encode([
        'user_id'   => $userId,
        'amount'    => $coins,
        'source'    => 'zerads_ptc',
        'server_id' => 'clickforcharity'
    ]);

    $ch = curl_init(AUTH_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $status = ($response !== false && $httpCode === 200) ? 'OK' : "FAIL:{$httpCode}";
    zerads_log("  auth_server: {$status}");
}

function cleanup_old_anon_files() {
    if (!is_dir(ANON_DIR)) return;
    $cutoff = time() - (7 * 24 * 60 * 60); // 7 days
    foreach (glob(ANON_DIR . '/anon_*.txt') as $file) {
        if (filemtime($file) < $cutoff) {
            @unlink($file);
        }
    }
}

function credit_anon($userId, $coins) {
    if (!is_dir(ANON_DIR)) {
        mkdir(ANON_DIR, 0750, true);
    }

    cleanup_old_anon_files();

    $file = ANON_DIR . '/' . $userId . '.txt';

    // Atomically add coins to pending balance
    $fp = fopen($file, 'c+');
    if (!$fp) {
        zerads_log("  anon: FAIL - could not open {$file}");
        return;
    }

    if (flock($fp, LOCK_EX)) {
        $existing = (int) stream_get_contents($fp);
        $new      = $existing + $coins;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, (string) $new);
        flock($fp, LOCK_UN);
        zerads_log("  anon: pending balance {$existing} → {$new}");
    } else {
        zerads_log("  anon: FAIL - could not lock {$file}");
    }

    fclose($fp);
}

function zerads_log($message) {
    $line = date('Y-m-d H:i:s') . ' ' . $message . "\n";
    @file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}
