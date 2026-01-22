<?php
/**
 * Mark a user's balance as recently changed
 * Maintains a list of user IDs that changed in the last 30 seconds
 * This allows other sites to detect cross-site balance updates
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

if (!$userId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'user_id required']);
    exit;
}

// Sanitize user ID
$userId = preg_replace('/[^a-zA-Z0-9_-]/', '', $userId);

$changesFile = __DIR__ . '/recent_changes.txt';

// Read existing changes
$lines = [];
if (file_exists($changesFile)) {
    $content = file_get_contents($changesFile);
    if ($content) {
        $lines = explode("\n", trim($content));
    }
}

// Add new entry: timestamp:userId
$newLine = time() . ':' . $userId;
array_unshift($lines, $newLine);

// Remove entries older than 30 seconds
$cutoff = time() - 30;
$lines = array_filter($lines, function($line) use ($cutoff) {
    if (empty($line)) return false;
    $parts = explode(':', $line, 2);
    return isset($parts[0]) && is_numeric($parts[0]) && $parts[0] > $cutoff;
});

// Write back to file
file_put_contents($changesFile, implode("\n", $lines) . "\n");

echo json_encode([
    'success' => true,
    'timestamp' => time(),
    'user_id' => $userId
]);
