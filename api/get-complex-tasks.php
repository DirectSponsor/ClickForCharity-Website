<?php
/**
 * Get Complex Tasks API
 * Returns complex tasks filtered by user's platform memberships
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
    $userPlatforms = $userData['memberPlatforms'] ?? [];
    $completedTasks = $userData['completedComplexTasks'] ?? [];
    $skippedTasks = $userData['skippedComplexTasks'] ?? [];
    
    // Filter tasks based on user's platforms and completion status
    $availableTasks = array_filter($allTasks, function($task) use ($userPlatforms, $completedTasks, $skippedTasks) {
        // Only show enabled tasks
        if (!isset($task['enabled']) || !$task['enabled']) {
            return false;
        }
        
        // Platform membership filtering depends on task category
        if ($task['category'] === 'signups') {
            // Sign-up tasks: only show if user is NOT a member yet
            if (in_array($task['platform'], $userPlatforms)) {
                return false;
            }
        } else {
            // Follow/engagement tasks: only show if user IS a member
            if (!in_array($task['platform'], $userPlatforms)) {
                return false;
            }
        }
        
        // Must not be skipped
        if (in_array($task['id'], $skippedTasks)) {
            return false;
        }
        
        // If non-repeatable, must not be completed
        if (!$task['repeatable'] && in_array($task['id'], $completedTasks)) {
            return false;
        }
        
        return true;
    });
    
    // Re-index array to ensure proper JSON array format
    $availableTasks = array_values($availableTasks);
    
    echo json_encode([
        'success' => true,
        'tasks' => $availableTasks,
        'userPlatforms' => $userPlatforms,
        'totalTasks' => count($availableTasks)
    ]);
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use GET']);
}
?>
