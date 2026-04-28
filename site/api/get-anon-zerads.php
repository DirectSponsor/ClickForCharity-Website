<?php
/**
 * Get and claim pending ZerAds coins for an anonymous user.
 *
 * Called by the frontend after page load to credit guest tokens that
 * the ZerAds callback stored while the user was on the ZerAds site.
 *
 * GET /api/get-anon-zerads.php?id=anon_a1b2c3d4e5f6
 *
 * Response:
 *   { "coins": 5 }    — coins to add to guest balance (0 if nothing pending)
 *
 * Side-effect: deletes (clears) the pending balance file on read.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

define('ANON_DIR', '/var/clickforcharity-data/anon');

$id = trim($_GET['id'] ?? '');

if (!preg_match('/^anon_[a-f0-9]{12}$/', $id)) {
    echo json_encode(['coins' => 0]);
    exit;
}

$file = ANON_DIR . '/' . $id . '.txt';

if (!file_exists($file)) {
    echo json_encode(['coins' => 0]);
    exit;
}

// Atomically read and clear the pending balance
$fp = fopen($file, 'r+');
if (!$fp) {
    echo json_encode(['coins' => 0]);
    exit;
}

$coins = 0;
if (flock($fp, LOCK_EX)) {
    $coins = max(0, (int) stream_get_contents($fp));
    ftruncate($fp, 0); // Clear after reading
    flock($fp, LOCK_UN);
}
fclose($fp);

// Remove the now-empty file
@unlink($file);

echo json_encode(['coins' => $coins]);
