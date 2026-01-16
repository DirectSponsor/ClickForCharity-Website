<?php
/**
 * Update User Platforms API
 * Updates user's platform memberships and awards coins for new rewarded platforms
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('REWARD_PER_PLATFORM', 25);

$REWARDED_PLATFORMS = [
    'odysee' => 'Odysee',
    'publish0x' => 'Publish0x',
    'rumble' => 'Rumble',
    'bitchute' => 'BitChute',
    'minds' => 'Minds',
    'gab' => 'Gab',
    'lbry' => 'LBRY',
    'mastodon' => 'Mastodon',
    'substack' => 'Substack',
    'medium' => 'Medium'
];

function getProfileFilePath($userId) {
    return '/var/clickforcharity-data/userdata/profiles/' . $userId . '.txt';
}

function getBalanceFilePath($userId) {
    return '/var/clickforcharity-data/userdata/balances/' . $userId . '.txt';
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

function loadBalance($userId) {
    $balanceFile = getBalanceFilePath($userId);
    
    if (file_exists($balanceFile)) {
        $data = json_decode(file_get_contents($balanceFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return [
        'balance' => 0,
        'last_updated' => time(),
        'recent_transactions' => []
    ];
}

function saveBalance($userId, $balanceData) {
    $balanceFile = getBalanceFilePath($userId);
    $dir = dirname($balanceFile);
    
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($balanceFile, json_encode($balanceData, JSON_PRETTY_PRINT));
}

function addTransaction($balanceData, $amount, $description) {
    if (!isset($balanceData['recent_transactions'])) {
        $balanceData['recent_transactions'] = [];
    }
    
    $transaction = [
        'amount' => $amount,
        'description' => $description,
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s')
    ];
    
    array_unshift($balanceData['recent_transactions'], $transaction);
    
    $balanceData['recent_transactions'] = array_slice($balanceData['recent_transactions'], 0, 50);
    
    return $balanceData;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    
    $userId = $input['user_id'] ?? null;
    $platforms = $input['platforms'] ?? [];
    
    if (!$userId) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required - user_id missing']);
        exit;
    }
    
    if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user_id format (expected: id-username)']);
        exit;
    }
    
    if (!is_array($platforms)) {
        http_response_code(400);
        echo json_encode(['error' => 'Platforms must be an array']);
        exit;
    }
    
    $userData = loadUserProfile($userId);
    
    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    $oldRewardedPlatforms = $userData['rewardedPlatforms'] ?? [];
    $newRewardedPlatforms = [];
    $rewardedPlatformNames = [];
    $totalReward = 0;
    
    foreach ($platforms as $platformId) {
        if (isset($REWARDED_PLATFORMS[$platformId]) && !in_array($platformId, $oldRewardedPlatforms)) {
            $newRewardedPlatforms[] = $platformId;
            $rewardedPlatformNames[] = $REWARDED_PLATFORMS[$platformId];
            $totalReward += REWARD_PER_PLATFORM;
        }
    }
    
    $userData['memberPlatforms'] = $platforms;
    
    if (!empty($newRewardedPlatforms)) {
        $userData['rewardedPlatforms'] = array_merge($oldRewardedPlatforms, $newRewardedPlatforms);
        
        $balanceData = loadBalance($userId);
        $balanceData['balance'] += $totalReward;
        $balanceData['last_updated'] = time();
        
        $platformList = implode(', ', $rewardedPlatformNames);
        $balanceData = addTransaction(
            $balanceData,
            $totalReward,
            "Platform membership reward: $platformList"
        );
        
        saveBalance($userId, $balanceData);
    } else {
        $userData['rewardedPlatforms'] = $oldRewardedPlatforms;
    }
    
    if (saveUserProfile($userId, $userData)) {
        echo json_encode([
            'success' => true,
            'memberPlatforms' => $userData['memberPlatforms'],
            'rewardedPlatforms' => $userData['rewardedPlatforms'],
            'reward' => $totalReward,
            'rewardedPlatformNames' => $rewardedPlatformNames
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save profile']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use POST']);
}
?>
