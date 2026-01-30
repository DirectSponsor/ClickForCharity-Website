<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ad ID']);
    exit;
}

$adId = (int)$data['id'];
$adsDir = '/var/clickforcharity-data/ads';
$filePath = $adsDir . '/' . $adId . '.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Ad not found']);
    exit;
}

// Soft delete: mark as deleted but keep file for 30 minutes
try {
    $ad = json_decode(file_get_contents($filePath), true);
    if (!$ad) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read ad file']);
        exit;
    }
    
    // Mark as deleted with cleanup timestamp
    $ad['deletedAt'] = time();
    $ad['deletedUntil'] = time() + (30 * 60); // 30 minutes from now
    
    $result = file_put_contents($filePath, json_encode($ad, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark ad as deleted']);
        exit;
    }
    
    http_response_code(200);
    echo json_encode(['success' => true, 'id' => $adId, 'message' => 'Ad marked for deletion (will be permanently removed in 30 minutes)']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to soft delete ad']);
}
