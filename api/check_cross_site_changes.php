<?php
/**
 * Check if a user has recent balance changes on other sites
 * Returns info about which site and how long ago
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'error' => 'user_id required']);
    exit;
}

$sites = [
    'roflfaucet' => 'https://roflfaucet.com/api/check_user_recent.php',
    'clickforcharity' => 'https://clickforcharity.net/api/check_user_recent.php'
];

$currentSite = $_SERVER['HTTP_HOST'];

foreach ($sites as $siteName => $url) {
    // Skip checking our own site
    if (strpos($currentSite, $siteName) !== false) continue;
    
    try {
        $response = @file_get_contents($url . '?user_id=' . urlencode($userId));
        if ($response === false) continue;
        
        $response = trim($response);
        
        // Response is 'n' if not found, or age in seconds if found
        if ($response !== 'n') {
            $age = intval($response);
            
            echo json_encode([
                'success' => true,
                'has_changes' => true,
                'site' => $siteName,
                'age_seconds' => $age,
                'timestamp' => time() - $age
            ]);
            exit;
        }
    } catch (Exception $e) {
        // Continue to next site
        continue;
    }
}

echo json_encode([
    'success' => true,
    'has_changes' => false
]);
