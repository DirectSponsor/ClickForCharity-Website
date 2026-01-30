<?php
/**
 * Get User Platforms API
 * Returns user's platform memberships and rewarded platforms
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getUserId() {
    if (!empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    return null;
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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $userId = getUserId();
    
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
    
    if ($userData) {
        $memberPlatforms = $userData['memberPlatforms'] ?? [];
        $rewardedPlatforms = $userData['rewardedPlatforms'] ?? [];
        
        echo json_encode([
            'success' => true,
            'memberPlatforms' => $memberPlatforms,
            'rewardedPlatforms' => $rewardedPlatforms
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'error' => 'User not found',
            'memberPlatforms' => [],
            'rewardedPlatforms' => []
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use GET']);
}
?>
