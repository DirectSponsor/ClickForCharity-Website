<?php
/**
 * ClickForCharity Balance API with Lazy Loading
 * 
 * Handles balance updates with automatic user profile creation from auth server
 * Uses ROFLFaucet-compatible structure: data/userdata/balances/{user_id}.txt
 */

header('Content-Type: application/json');

// POST method required for balance updates
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'POST method required.']);
    exit;
}

// Get the raw POST data
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$userId = $data['userId'] ?? '';
$reward = $data['reward'] ?? 0;

if (empty($userId) || !is_numeric($reward) || $reward <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid userId or reward amount.']);
    exit;
}

// Sanitize the userId (format: id-username)
if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid userId format (expected: id-username)']);
    exit;
}

/**
 * Fetch profile data from auth server sync API
 * @param string $userId User ID (format: id-username)
 * @return array|null Profile data from auth server, or null on failure
 */
function fetchProfileFromAuthServer($userId) {
    $authUrl = "https://auth.directsponsor.org/api/sync.php?action=get&user_id=" . urlencode($userId) . "&data_type=profile";
    
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
 * Create user profile and balance files from auth server data
 * @param string $userId User ID
 * @return bool Success status
 */
function createUserFromAuthServer($userId) {
    // Fetch profile from auth server
    $authProfile = fetchProfileFromAuthServer($userId);
    if (!$authProfile || !isset($authProfile['username'])) {
        return false;
    }
    
    // Create profile file
    $profileFile = __DIR__ . '/../../../clickforcharity-data/userdata/profiles/' . $userId . '.txt';
    $profileDir = dirname($profileFile);
    if (!is_dir($profileDir)) {
        mkdir($profileDir, 0755, true);
    }
    
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
    
    file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT));
    
    // Create balance file
    $balanceFile = __DIR__ . '/../../../clickforcharity-data/userdata/balances/' . $userId . '.txt';
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
    
    return true;
}

// Main balance update logic
$balance_file_path = __DIR__ . '/../../../clickforcharity-data/userdata/balances/' . $userId . '.txt';

// LAZY LOADING: Create user from auth server if they don't exist
if (!file_exists($balance_file_path)) {
    if (!createUserFromAuthServer($userId)) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found in auth server.']);
        exit;
    }
}

// Read the user's balance file
$user_data_json = file_get_contents($balance_file_path);
$user_data = json_decode($user_data_json, true);

if (!$user_data) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not read user data.']);
    exit;
}

// Update the balance
$user_data['balance'] += $reward;
$user_data['last_updated'] = time();

// Add to recent transactions (keep last 10)
if (!isset($user_data['recent_transactions'])) {
    $user_data['recent_transactions'] = [];
}

$user_data['recent_transactions'][] = [
    'amount' => $reward,
    'timestamp' => time(),
    'type' => 'ad_view'
];

// Keep only last 10 transactions
if (count($user_data['recent_transactions']) > 10) {
    $user_data['recent_transactions'] = array_slice($user_data['recent_transactions'], -10);
}

// Write the updated data back to the file
if (file_put_contents($balance_file_path, json_encode($user_data, JSON_PRETTY_PRINT), LOCK_EX)) {
    echo json_encode([
        'success' => true,
        'newBalance' => $user_data['balance'],
        'reward' => $reward
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save updated user data.']);
}
?>
