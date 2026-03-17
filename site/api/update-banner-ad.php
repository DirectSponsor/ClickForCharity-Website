<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required field: id']);
    exit;
}

$id = (int)$input['id'];
$adsDir = '/var/clickforcharity-data/banner-ads';
$filePath = "$adsDir/$id.json";

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Banner ad not found']);
    exit;
}

$content = file_get_contents($filePath);
$ad = json_decode($content, true);
if (!$ad) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to read banner ad data']);
    exit;
}

// Update only the fields that were provided
if (isset($input['advertiser'])) {
    $ad['advertiser'] = trim($input['advertiser']);
}
if (isset($input['html'])) {
    $ad['html'] = trim($input['html']);
}
if (isset($input['slots'])) {
    $ad['slots'] = (int)$input['slots'];
}
if (isset($input['days'])) {
    $days = (int)$input['days'];
    $ad['days'] = $days;
    // Recalculate expiry if duration changed
    if ($days > 0) {
        $createdAt = $ad['createdAt'] ?? time();
        $ad['expiresAt'] = $createdAt + ($days * 86400);
    } else {
        $ad['expiresAt'] = null;
    }
}

// Add last updated timestamp
$ad['updatedAt'] = time();

if (file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update banner ad']);
    exit;
}

echo json_encode(['success' => true, 'ad' => $ad]);
