<?php
/**
 * ClickForCharity Get Balance API
 * 
 * Read-only endpoint to fetch user balance
 * Uses ROFLFaucet-compatible userdata structure
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'GET method required']);
    exit;
}

$userId = $_GET['user_id'] ?? '';

if (empty($userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'user_id parameter required']);
    exit;
}

// Sanitize user_id (format: id-username)
if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid user_id format (expected: id-username)']);
    exit;
}

$balanceFile = __DIR__ . '/../../data/userdata/balances/' . $userId . '.txt';

if (!file_exists($balanceFile)) {
    // User doesn't exist yet - return 0 balance
    echo json_encode([
        'success' => true,
        'balance' => 0,
        'user_id' => $userId
    ]);
    exit;
}

// Read balance file
$data = json_decode(file_get_contents($balanceFile), true);

if (!$data) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not read balance data']);
    exit;
}

echo json_encode([
    'success' => true,
    'balance' => $data['balance'] ?? 0,
    'last_updated' => $data['last_updated'] ?? null,
    'user_id' => $userId
]);
?>
