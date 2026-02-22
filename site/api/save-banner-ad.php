<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success' => false, 'error' => 'Method not allowed']); exit; }

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['position'], $input['html'], $input['slots'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing required fields: position, html, slots']);
    exit;
}

$position = $input['position'];
$html     = trim($input['html']);
$slots    = max(1, min(10, (int)$input['slots']));
$advertiser = isset($input['advertiser']) ? trim($input['advertiser']) : '';
$days     = isset($input['days']) ? (int)$input['days'] : 0;

if (!in_array($position, ['desktop', 'floating'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid position. Use desktop or floating']);
    exit;
}

if (empty($html)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'HTML cannot be empty']);
    exit;
}

$adsDir = '/var/clickforcharity-data/banner-ads';
if (!is_dir($adsDir)) {
    mkdir($adsDir, 0755, true);
}

// Find next available ID
$existing = glob($adsDir . '/*.json');
$ids = [];
foreach ($existing as $f) {
    $base = basename($f, '.json');
    if (is_numeric($base)) $ids[] = (int)$base;
}
$nextId = empty($ids) ? 1 : max($ids) + 1;

$expiresAt = $days > 0 ? time() + ($days * 86400) : null;

$ad = [
    'id'         => $nextId,
    'advertiser' => $advertiser,
    'position'   => $position,
    'slots'      => $slots,
    'html'       => $html,
    'createdAt'  => time(),
    'expiresAt'  => $expiresAt,
];

$filePath = $adsDir . '/' . $nextId . '.json';
if (file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write file']);
    exit;
}

http_response_code(201);
echo json_encode(['success' => true, 'id' => $nextId]);
