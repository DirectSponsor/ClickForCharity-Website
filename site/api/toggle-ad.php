<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'error' => 'Method not allowed']); exit; }

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

$ad['paused'] = !($ad['paused'] ?? false);

if (file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to update ad']);
    exit;
}

echo json_encode(['success' => true, 'paused' => $ad['paused']]);
