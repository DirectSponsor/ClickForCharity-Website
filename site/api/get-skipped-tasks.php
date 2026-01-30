<?php
/**
 * Get Skipped Tasks API
 * Returns only the tasks that the user has skipped
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getProfileFilePath($userId) {
    return '/var/clickforcharity-data/userdata/profiles/' . $userId . '.txt';
}

function loadUserProfile($userId) {
    $profileFile = getProfileFilePath($userId);
    
    if (file_exists($profileFile)) {
        $data = json_decode(file_get_contents($profileFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return null;
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = $_GET['user_id'] ?? null;
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required - user_id parameter missing']);
        exit;
    }
    
    if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user_id format (expected: id-username)']);
        exit;
    }
    
    $userData = loadUserProfile($userId);
    
    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $allTasks = loadTasks();
    $skippedTaskIds = $userData['skippedComplexTasks'] ?? [];
    
    // Filter to only show skipped tasks
    $skippedTasks = array_filter($allTasks, function($task) use ($skippedTaskIds) {
        return in_array($task['id'], $skippedTaskIds);
    });
    
    // Re-index array to ensure proper JSON array format
    $skippedTasks = array_values($skippedTasks);
    
    echo json_encode([
        'success' => true,
        'tasks' => $skippedTasks,
        'skippedTaskIds' => $skippedTaskIds,
        'totalSkipped' => count($skippedTasks)
    ]);
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use GET']);
}
?>
