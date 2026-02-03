<?php
/**
 * Reset Tasks API
 * Clears a user's completed or skipped tasks from their server-side profile.
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
        $input = $_POST; // Fallback for standard POST
    }
    
    $userId = $input['user_id'] ?? null;
    $action = $input['action'] ?? null; // 'reset_completed', 'reset_skipped', 'reset_all'
    
    if (!$userId || !$action) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters: user_id, action']);
        exit;
    }
    
    if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user_id format']);
        exit;
    }
    
    $userData = loadUserProfile($userId);
    
    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $message = '';
    
    switch ($action) {
        case 'reset_completed':
            $userData['completedTasks'] = [];
            $message = 'Completed tasks reset';
            break;
            
        case 'reset_skipped':
            $userData['skippedTasks'] = [];
            $message = 'Skipped tasks reset';
            break;
            
        case 'reset_all':
            $userData['completedTasks'] = [];
            $userData['skippedTasks'] = [];
            $message = 'All task progress reset';
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            exit;
    }
    
    if (saveUserProfile($userId, $userData)) {
        echo json_encode([
            'success' => true,
            'message' => $message,
            'user_id' => $userId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save reset data']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method']);
}
