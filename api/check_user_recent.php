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
$cutoff = time() - 15;
$validLines = [];
$found = false;
$foundAge = 0;

foreach ($lines as $line) {
    if (empty($line)) continue;
    
    $parts = explode(':', $line, 2);
    if (!isset($parts[0]) || !is_numeric($parts[0])) continue;
    
    $timestamp = intval($parts[0]);
    
    // Skip expired entries
    if ($timestamp <= $cutoff) continue;
    
    $validLines[] = $line;
    
    // Check if this is the user we're looking for
    if (isset($parts[1]) && $parts[1] === $userId && !$found) {
        $foundAge = time() - $timestamp;
        $found = true;
    }
}

// Write back cleaned list
if (count($validLines) !== count($lines)) {
    file_put_contents($file, implode("\n", $validLines) . "\n");
}

echo $found ? $foundAge : 'n';
