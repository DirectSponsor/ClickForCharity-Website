<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// position maps to the two ad placements
$position = isset($_GET['type']) ? $_GET['type'] : 'desktop';

if (!in_array($position, ['desktop', 'floating'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid position']);
    exit;
}

$adsDir = '/var/clickforcharity-data/banner-ads';

if (!is_dir($adsDir)) {
    echo json_encode(['success' => true, 'ads' => [], 'meta' => []]);
    exit;
}

$files = array_reverse(glob($adsDir . '/*.json'));
$rotation = [];
$meta = [];
$now = time();

foreach ($files as $file) {
    $content = file_get_contents($file);
    if ($content === false) continue;

    $ad = json_decode($content, true);
    if (!$ad || !isset($ad['id'], $ad['position'], $ad['html'], $ad['slots'])) continue;

    // Only include ads for the requested position
    if ($ad['position'] !== $position) continue;

    // Skip expired ads
    if (isset($ad['expiresAt']) && $ad['expiresAt'] !== null && $ad['expiresAt'] < $now) continue;

    $slots = max(1, min(10, (int)$ad['slots']));
    $paused = !empty($ad['paused']);

    // Only add to rotation if not paused
    if (!$paused) {
        for ($i = 0; $i < $slots; $i++) {
            $rotation[] = $ad['html'];
        }
    }

    $meta[] = [
        'id'           => $ad['id'],
        'advertiser'   => $ad['advertiser'] ?? '',
        'slots'        => $slots,
        'position'     => $ad['position'],
        'createdAt'    => $ad['createdAt'] ?? null,
        'expiresAt'    => $ad['expiresAt'] ?? null,
        'paused'       => $paused,
    ];
}

// Pad remaining slots with fallback banners from the fallback folder
$totalPaidSlots = array_sum(array_column($meta, 'slots'));
$remainingSlots = max(0, 10 - $totalPaidSlots);

if ($remainingSlots > 0) {
    $fallbackDirs = [
        'desktop'  => __DIR__ . '/../../data/fallback-desktop',
        'floating' => __DIR__ . '/../../data/fallback-floating',
    ];
    $fallbackDir = $fallbackDirs[$position] ?? null;

    if ($fallbackDir && is_dir($fallbackDir)) {
        $fallbackFiles = glob($fallbackDir . '/*.html');
        $fallbacks = [];
        foreach ($fallbackFiles as $f) {
            $html = trim(file_get_contents($f));
            if (!empty($html)) $fallbacks[] = $html;
        }

        if (!empty($fallbacks)) {
            // Pick randomly to fill remaining slots
            for ($i = 0; $i < $remainingSlots; $i++) {
                $rotation[] = $fallbacks[array_rand($fallbacks)];
            }
        }
    }
}

echo json_encode([
    'success' => true,
    'ads'     => $rotation,
    'meta'    => $meta,
]);
