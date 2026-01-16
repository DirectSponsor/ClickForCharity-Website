<?php
/**
 * Cleanup Expired Tasks
 * Removes expired task data from user profiles and updates stats
 * Run this periodically (e.g., daily cron job)
 */

header('Content-Type: application/json');

// Error logging
function logError($message, $context = []) {
    $logDir = '/var/clickforcharity-data/logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $logFile = $logDir . '/cleanup-errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $contextStr = !empty($context) ? json_encode($context) : '';
    $logEntry = "[$timestamp] $message $contextStr\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND);
}

// Save cleanup status for monitoring
function saveCleanupStatus($status) {
    $statusDir = '/var/clickforcharity-data/status';
    if (!is_dir($statusDir)) {
        mkdir($statusDir, 0755, true);
    }
    
    $statusFile = $statusDir . '/last-cleanup.json';
    file_put_contents($statusFile, json_encode($status, JSON_PRETTY_PRINT));
}

function getProfileFilePath($userId) {
    return '/var/clickforcharity-data/userdata/profiles/' . $userId . '.txt';
}

function loadTasks() {
    $tasksFile = __DIR__ . '/../data/complex-tasks/tasks.json';
    
    if (file_exists($tasksFile)) {
        $data = json_decode(file_get_contents($tasksFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return [];
}

function getInvalidTaskIds() {
    $allTasks = loadTasks();
    $validIds = [];
    $expiredIds = [];
    
    // Collect all valid task IDs and expired task IDs
    foreach ($allTasks as $task) {
        $validIds[] = $task['id'];
        
        if (isset($task['expiryDate']) && $task['expiryDate']) {
            $expiryDate = strtotime($task['expiryDate']);
            if ($expiryDate && $expiryDate < time()) {
                $expiredIds[] = $task['id'];
            }
        }
    }
    
    return [
        'valid_ids' => $validIds,
        'expired_ids' => $expiredIds
    ];
}

function cleanupUserProfile($userId, $validTaskIds) {
    $profileFile = getProfileFilePath($userId);
    
    if (!file_exists($profileFile)) {
        return null;
    }
    
    $userData = json_decode(file_get_contents($profileFile), true);
    if (!$userData) {
        return null;
    }
    
    $cleaned = false;
    $stats = [
        'completed_removed' => 0,
        'skipped_removed' => 0
    ];
    
    // Initialize stats if not present
    if (!isset($userData['taskStats'])) {
        $userData['taskStats'] = [
            'totalCompleted' => 0,
            'byCategory' => [
                'follows' => 0,
                'engagements' => 0,
                'other' => 0
            ]
        ];
    }
    
    // Clean completed tasks - keep only valid task IDs (removes both expired and deleted)
    if (isset($userData['completedComplexTasks'])) {
        $originalCount = count($userData['completedComplexTasks']);
        $userData['completedComplexTasks'] = array_values(array_filter(
            $userData['completedComplexTasks'],
            function($taskId) use ($validTaskIds) {
                return in_array($taskId, $validTaskIds);
            }
        ));
        $stats['completed_removed'] = $originalCount - count($userData['completedComplexTasks']);
        if ($stats['completed_removed'] > 0) {
            $cleaned = true;
        }
    }
    
    // Clean skipped tasks - keep only valid task IDs (removes both expired and deleted)
    if (isset($userData['skippedComplexTasks'])) {
        $originalCount = count($userData['skippedComplexTasks']);
        $userData['skippedComplexTasks'] = array_values(array_filter(
            $userData['skippedComplexTasks'],
            function($taskId) use ($validTaskIds) {
                return in_array($taskId, $validTaskIds);
            }
        ));
        $stats['skipped_removed'] = $originalCount - count($userData['skippedComplexTasks']);
        if ($stats['skipped_removed'] > 0) {
            $cleaned = true;
        }
    }
    
    // Save if changes were made
    if ($cleaned) {
        file_put_contents($profileFile, json_encode($userData, JSON_PRETTY_PRINT));
    }
    
    return $stats;
}

// Main execution
try {
    $taskData = getInvalidTaskIds();
    $validTaskIds = $taskData['valid_ids'];
    $expiredTaskIds = $taskData['expired_ids'];

    // Get all user profile files
    $profileDir = '/var/clickforcharity-data/userdata/profiles/';
    $profileFiles = glob($profileDir . '*.txt');

    $totalCleaned = 0;
    $totalCompletedRemoved = 0;
    $totalSkippedRemoved = 0;

    foreach ($profileFiles as $profileFile) {
        $userId = basename($profileFile, '.txt');
        $stats = cleanupUserProfile($userId, $validTaskIds);
        
        if ($stats && ($stats['completed_removed'] > 0 || $stats['skipped_removed'] > 0)) {
            $totalCleaned++;
            $totalCompletedRemoved += $stats['completed_removed'];
            $totalSkippedRemoved += $stats['skipped_removed'];
        }
    }

    $result = [
        'success' => true,
        'message' => 'Cleanup completed - removed expired and deleted tasks from user profiles',
        'timestamp' => date('Y-m-d H:i:s'),
        'valid_task_count' => count($validTaskIds),
        'expired_task_ids' => $expiredTaskIds,
        'expired_task_count' => count($expiredTaskIds),
        'users_cleaned' => $totalCleaned,
        'total_completed_removed' => $totalCompletedRemoved,
        'total_skipped_removed' => $totalSkippedRemoved
    ];
    
    saveCleanupStatus($result);
    echo json_encode($result);
    
} catch (Exception $e) {
    $error = [
        'success' => false,
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    logError('Cleanup failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
    saveCleanupStatus($error);
    
    http_response_code(500);
    echo json_encode($error);
}
?>
