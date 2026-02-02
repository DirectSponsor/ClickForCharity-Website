<?php
header('Content-Type: application/json; charset=utf-8');

// Allow CORS if needed (adjust origin as required)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['title'], $data['instructions'], $data['url'], $data['reward'], $data['duration'], $data['campaignDuration'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$adsDir = '/var/clickforcharity-data/ads';

if (!is_dir($adsDir)) {
    mkdir($adsDir, 0755, true);
}

// Find next available ID
$files = glob($adsDir . '/*.json');
$ids = [];
foreach ($files as $file) {
    $basename = basename($file, '.json');
    if (is_numeric($basename)) {
        $ids[] = (int)$basename;
    }
}
$nextId = empty($ids) ? 1 : max($ids) + 1;

$campaignDays = (int)$data['campaignDuration'];
$expiresAt = $campaignDays > 0 ? time() + ($campaignDays * 86400) : null;

$ad = [
    'id' => $nextId,
    'title' => trim($data['title']),
    'instructions' => trim($data['instructions']),
    'url' => trim($data['url']),
    'reward' => (int)$data['reward'],
    'duration' => (int)$data['duration'],
    'campaignDuration' => $campaignDays,
    'createdAt' => time(),
    'expiresAt' => $expiresAt
];

$filePath = $adsDir . '/' . $nextId . '.json';
$result = file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write file']);
    exit;
}

http_response_code(201);
echo json_encode(['success' => true, 'id' => $nextId, 'file' => $nextId . '.json']);
