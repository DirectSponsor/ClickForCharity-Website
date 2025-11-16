<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$adsDir = __DIR__ . '/../../../clickforcharity-data/ads';

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
