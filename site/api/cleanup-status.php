<?php
/**
 * Cleanup Status Monitor
 * Shows the status of the last cleanup run
 */

header('Content-Type: application/json');

$statusFile = '/var/clickforcharity-data/status/last-cleanup.json';
$errorLogFile = '/var/clickforcharity-data/logs/cleanup-errors.log';

// Load last cleanup status
$lastCleanup = null;
if (file_exists($statusFile)) {
    $lastCleanup = json_decode(file_get_contents($statusFile), true);
}

// Load recent errors (last 10)
$recentErrors = [];
if (file_exists($errorLogFile)) {
    $lines = file($errorLogFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $recentErrors = array_slice(array_reverse($lines), 0, 10);
}

// Calculate time since last cleanup
$timeSinceCleanup = null;
$cleanupOverdue = false;
if ($lastCleanup && isset($lastCleanup['timestamp'])) {
    $lastTime = strtotime($lastCleanup['timestamp']);
    $timeSinceCleanup = time() - $lastTime;
    $hoursSince = $timeSinceCleanup / 3600;
    
    // Alert if no cleanup in 48 hours
    $cleanupOverdue = $hoursSince > 48;
}

$response = [
    'last_cleanup' => $lastCleanup,
    'time_since_cleanup_seconds' => $timeSinceCleanup,
    'time_since_cleanup_hours' => $timeSinceCleanup ? round($timeSinceCleanup / 3600, 1) : null,
    'cleanup_overdue' => $cleanupOverdue,
    'recent_errors' => $recentErrors,
    'error_count' => count($recentErrors),
    'status' => $lastCleanup && $lastCleanup['success'] ? 'healthy' : 'error',
    'checked_at' => date('Y-m-d H:i:s')
];

// Set HTTP status based on health
if ($cleanupOverdue || ($lastCleanup && !$lastCleanup['success'])) {
    http_response_code(500);
}

echo json_encode($response, JSON_PRETTY_PRINT);
?>
