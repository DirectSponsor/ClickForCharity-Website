<?php
/**
 * Lightweight endpoint to check if a specific user has recent changes
 * Returns: 'n' if not found, or age in seconds if found
 */

header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo 'n';
    exit;
}

$file = __DIR__ . '/recent_changes.txt';

if (!file_exists($file)) {
    echo 'n';
    exit;
}

$content = file_get_contents($file);
if ($content === false) {
    echo 'n';
    exit;
}

$lines = explode("\n", trim($content));
foreach ($lines as $line) {
    if (empty($line)) continue;
    
    // Format: timestamp:userId
    if (strpos($line, ':' . $userId) !== false) {
        list($timestamp) = explode(':', $line, 2);
        $age = time() - intval($timestamp);
        echo $age;
        exit;
    }
}

echo 'n';
