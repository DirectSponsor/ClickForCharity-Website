<?php
/**
 * Unskip Task API
 * Removes a task from the user's skipped tasks list
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

function saveUserProfile($userId, $profileData) {
    $profileFile = getProfileFilePath($userId);
    $dir = dirname($profileFile);
    
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT));
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    
    $userId = $input['user_id'] ?? null;
    $taskId = $input['task_id'] ?? null;
    
    if (!$userId || !$taskId) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters: user_id, task_id']);
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
    
    // Initialize array if it doesn't exist
    if (!isset($userData['skippedTasks'])) {
        $userData['skippedTasks'] = [];
    }
    
    // Remove task from skipped list
    $userData['skippedTasks'] = array_values(
        array_filter($userData['skippedTasks'], function($id) use ($taskId) {
            return $id !== $taskId;
        })
    );
    
    // Save profile
    if (saveUserProfile($userId, $userData)) {
        echo json_encode([
            'success' => true,
            'message' => 'Task restored successfully',
            'task_id' => $taskId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save user data']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use POST']);
}
?>
