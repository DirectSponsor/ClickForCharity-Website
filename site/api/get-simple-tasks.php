<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$simpleTasksDir = '/var/clickforcharity-data/simple-tasks';

if (!is_dir($simpleTasksDir)) {
    echo json_encode([]);
    exit;
}

$files = glob($simpleTasksDir . '/*.json');
$tasks = [];
$now = time();

foreach ($files as $file) {
    $content = file_get_contents($file);
    if ($content !== false) {
        $task = json_decode($content, true);
        if ($task && isset($task['id'])) {
            // Skip soft-deleted tasks that are past their grace period
            if (isset($task['deletedUntil']) && $task['deletedUntil'] < $now) {
                // Permanently remove expired soft-deleted tasks
                unlink($file);
                continue;
            }
            
            // Skip tasks that are currently soft-deleted (within grace period)
            if (isset($task['deletedAt']) && $task['deletedAt'] <= $now && (!isset($task['deletedUntil']) || $task['deletedUntil'] > $now)) {
                continue; // Don't include soft-deleted tasks in results
            }
            
            // Auto-delete expired tasks (if they have expiry)
            if (isset($task['expiresAt']) && $task['expiresAt'] !== null && $task['expiresAt'] < $now) {
                unlink($file);
                continue;
            }
            
            $tasks[] = $task;
        }
    }
}

// Sort by ID
usort($tasks, function($a, $b) {
    return strnatcmp($a['id'], $b['id']);
});

echo json_encode($tasks);
