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
$adsDir = '/var/clickforcharity-data/ads';
$filePath = $adsDir . '/' . $id . '.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Ad not found']);
    exit;
}

$content = file_get_contents($filePath);
$ad = json_decode($content, true);
if (!$ad) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to read ad data']);
    exit;
}

// Update only the fields that were provided
if (isset($input['title'])) {
    $ad['title'] = trim($input['title']);
}
if (isset($input['instructions'])) {
    $ad['instructions'] = trim($input['instructions']);
}
if (isset($input['url'])) {
    $ad['url'] = trim($input['url']);
}
if (isset($input['reward'])) {
    $ad['reward'] = (int)$input['reward'];
}
if (isset($input['duration'])) {
    $ad['duration'] = (int)$input['duration'];
}
if (isset($input['campaignDuration'])) {
    $campaignDays = (int)$input['campaignDuration'];
    $ad['campaignDuration'] = $campaignDays;
    // Recalculate expiry if campaign duration changed
    if ($campaignDays > 0) {
        $createdAt = $ad['createdAt'] ?? time();
        $ad['expiresAt'] = $createdAt + ($campaignDays * 86400);
    } else {
        $ad['expiresAt'] = null;
    }
}

// Add last updated timestamp
$ad['updatedAt'] = time();

if (file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update ad']);
    exit;
}

echo json_encode(['success' => true, 'ad' => $ad]);
