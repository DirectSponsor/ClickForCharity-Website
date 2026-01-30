<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$adsDir = '/var/clickforcharity-data/ads';

if (!is_dir($adsDir)) {
    echo json_encode([]);
    exit;
}

$files = glob($adsDir . '/*.json');
$ads = [];
$now = time();

foreach ($files as $file) {
    $content = file_get_contents($file);
    if ($content !== false) {
        $ad = json_decode($content, true);
        if ($ad && isset($ad['id'])) {
            // Skip soft-deleted ads that are past their grace period
            if (isset($ad['deletedUntil']) && $ad['deletedUntil'] < $now) {
                // Permanently remove expired soft-deleted ads
                unlink($file);
                continue;
            }
            
            // Skip ads that are currently soft-deleted (within grace period)
            if (isset($ad['deletedAt']) && $ad['deletedAt'] <= $now && (!isset($ad['deletedUntil']) || $ad['deletedUntil'] > $now)) {
                continue; // Don't include soft-deleted ads in results
            }
            
            // Auto-delete expired ads
            if (isset($ad['expiresAt']) && $ad['expiresAt'] !== null && $ad['expiresAt'] < $now) {
                unlink($file);
                continue;
            }
            $ads[] = $ad;
        }
    }
}

// Sort by ID
usort($ads, function($a, $b) {
    return $a['id'] - $b['id'];
});

echo json_encode($ads);
