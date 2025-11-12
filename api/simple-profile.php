<?php
/**
 * ClickForCharity Simple Profile API with Lazy Loading
 * 
 * Fetches user profile from auth server on first access, creates local cache
 * Uses ROFLFaucet-compatible userdata structure:
 * - data/userdata/profiles/{user_id}.txt - Profile data (username, level, stats, settings)
 * - data/userdata/balances/{user_id}.txt - Balance data (separate for efficient sync)
 * 
 * ENDPOINTS:
 * GET ?action=profile&user_id={id} - Returns user profile data (lazy loads from auth server if needed)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Get user ID from request
 * @return string|null User ID or null if not provided
 */
function getUserId() {
    if (!empty($_GET['user_id'])) {
        return $_GET['user_id'];
    }
    if (!empty($_POST['user_id'])) {
        return $_POST['user_id'];
    }
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['user_id'])) {
        return $input['user_id'];
    }
    return null;
}

/**
 * Fetch profile data from auth server sync API
 * @param string $userId User ID (format: id-username)
 * @return array|null Profile data from auth server, or null on failure
 */
function fetchProfileFromAuthServer($userId) {
    $authUrl = "https://auth.directsponsor.org/api/sync.php?action=get&user_id=" . urlencode($userId) . "&data_type=profile";
    
    // Use curl for better error handling
    $ch = curl_init($authUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        if ($data && $data['success'] && isset($data['data'])) {
            return $data['data'];
        }
    }
    
    return null;
}

/**
 * Get user profile file path (ROFLFaucet-compatible structure)
 * @param string $userId User ID (format: id-username)
 * @return string Path to profile .txt file
 */
function getProfileFilePath($userId) {
    return __DIR__ . '/../../data/userdata/profiles/' . $userId . '.txt';
}

/**
 * Get user balance file path (ROFLFaucet-compatible structure)
 * @param string $userId User ID (format: id-username)
 * @return string Path to balance .txt file
 */
function getBalanceFilePath($userId) {
    return __DIR__ . '/../../data/userdata/balances/' . $userId . '.txt';
}

/**
 * Load user profile data with lazy loading from auth server
 * @param string $userId User ID (format: id-username)
 * @return array Profile data or null if not found
 */
function loadUserProfile($userId) {
    $profileFile = getProfileFilePath($userId);
    
    // Check if profile file exists locally
    if (file_exists($profileFile)) {
        $data = json_decode(file_get_contents($profileFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    // LAZY LOADING: File doesn't exist locally, try fetching from auth server
    $authProfile = fetchProfileFromAuthServer($userId);
    if ($authProfile && isset($authProfile['username'])) {
        // Create profile with ROFLFaucet-compatible format
        $profileData = [
            'user_id' => $userId,
            'level' => 1,
            'username' => $authProfile['username'],
            'display_name' => $authProfile['display_name'] ?? '',
            'avatar' => $authProfile['avatar'] ?? '👤',
            'email' => $authProfile['email'] ?? '',
            'bio' => $authProfile['bio'] ?? '',
            'location' => $authProfile['location'] ?? '',
            'website' => $authProfile['website'] ?? '',
            'joined_date' => time(),
            'settings' => [
                'notifications' => true,
                'theme' => 'default'
            ],
            'stats' => [
                'total_ads_viewed' => 0,
                'total_surveys_completed' => 0,
                'total_earned' => 0
            ],
            'roles' => ['member'],
            'last_profile_update' => time()
        ];
        
        // Ensure directory exists
        $dir = dirname($profileFile);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        // Save profile file
        file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT));
        
        // Create initial balance file
        $balanceFile = getBalanceFilePath($userId);
        $balanceDir = dirname($balanceFile);
        if (!is_dir($balanceDir)) {
            mkdir($balanceDir, 0755, true);
        }
        
        $balanceData = [
            'balance' => 0,
            'last_updated' => time(),
            'recent_transactions' => []
        ];
        file_put_contents($balanceFile, json_encode($balanceData, JSON_PRETTY_PRINT));
        
        return $profileData;
    }
    
    return null;
}

// Main API Logic
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'profile') {
    // GET PROFILE - Return user profile data (with lazy loading from auth server)
    $userId = getUserId();
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required - user_id parameter missing']);
        exit;
    }
    
    // Sanitize user_id to prevent directory traversal
    if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user_id format (expected: id-username)']);
        exit;
    }
    
    $userData = loadUserProfile($userId);
    
    if ($userData) {
        echo json_encode([
            'success' => true,
            'user' => $userData
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'error' => 'User not found',
            'message' => 'User does not exist in auth server'
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request - Use GET ?action=profile&user_id={id}']);
}
?>
