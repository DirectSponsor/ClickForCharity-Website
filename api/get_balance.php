<?php
/**
 * ClickForCharity Get Balance API
 * 
 * Read-only endpoint to fetch user balance
 * Queries centralized auth server for current balance
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

// Query centralized auth server
$authServerUrl = 'https://auth.directsponsor.org/api/get_balance.php?user_id=' . urlencode($userId);

$ch = curl_init($authServerUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch balance from auth server',
        'details' => $curlError
    ]);
    exit;
}

// Return auth server response
echo $response;
?>
