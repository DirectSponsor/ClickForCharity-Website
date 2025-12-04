<?php
/**
 * Temporary script to check and update user roles
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$userId = $_GET['user_id'] ?? 'andytest2';
$action = $_GET['action'] ?? 'check';

$profileDir = '/var/clickforcharity-data/userdata/profiles';
$profileFile = $profileDir . '/' . $userId . '.txt';

if ($action === 'check') {
    if (file_exists($profileFile)) {
        $profile = json_decode(file_get_contents($profileFile), true);
        echo json_encode([
            'user_id' => $userId,
            'profile_exists' => true,
            'roles' => $profile['roles'] ?? ['none'],
            'profile' => $profile
        ]);
    } else {
        echo json_encode([
            'user_id' => $userId,
            'profile_exists' => false,
            'message' => 'Profile not found - user may not have used the site yet'
        ]);
    }
} elseif ($action === 'make_admin') {
    if (file_exists($profileFile)) {
        $profile = json_decode(file_get_contents($profileFile), true);
        $profile['roles'] = ['admin', 'member'];
        file_put_contents($profileFile, json_encode($profile, JSON_PRETTY_PRINT));
        echo json_encode([
            'user_id' => $userId,
            'updated' => true,
            'new_roles' => $profile['roles']
        ]);
    } else {
        // Create new profile with admin role
        $profile = [
            'username' => $userId,
            'level' => 1,
            'experience' => 0,
            'joined' => time(),
            'last_active' => time(),
            'settings' => [
                'notifications' => true,
                'theme' => 'default'
            ],
            'stats' => [
                'total_ads_viewed' => 0,
                'total_surveys_completed' => 0,
                'total_earned' => 0
            ],
            'roles' => ['admin', 'member'],
            'last_profile_update' => time()
        ];
        
        // Ensure directory exists
        if (!is_dir($profileDir)) {
            mkdir($profileDir, 0755, true);
        }
        
        file_put_contents($profileFile, json_encode($profile, JSON_PRETTY_PRINT));
        echo json_encode([
            'user_id' => $userId,
            'created' => true,
            'new_roles' => $profile['roles']
        ]);
    }
} else {
    echo json_encode(['error' => 'Invalid action']);
}
?>
