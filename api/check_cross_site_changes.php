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
    'roflfaucet' => 'https://roflfaucet.com/api/recent_changes.txt',
    'clickforcharity' => 'https://clickforcharity.net/api/recent_changes.txt'
];

$currentSite = $_SERVER['HTTP_HOST'];

foreach ($sites as $siteName => $url) {
    // Skip checking our own site
    if (strpos($currentSite, $siteName) !== false) continue;
    
    try {
        $content = @file_get_contents($url);
        if ($content === false) continue;
        
        $lines = explode("\n", trim($content));
        foreach ($lines as $line) {
            if (empty($line)) continue;
            
            // Format: timestamp:userId
            if (strpos($line, ':' . $userId) !== false) {
                list($timestamp) = explode(':', $line, 2);
                $age = time() - intval($timestamp);
                
                echo json_encode([
                    'success' => true,
                    'has_changes' => true,
                    'site' => $siteName,
                    'age_seconds' => $age,
                    'timestamp' => intval($timestamp)
                ]);
                exit;
            }
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
