<?php
// Write Balance API - Proxy to centralized auth server
// Receives net change and forwards to auth server for centralized balance management

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['user_id']) || !isset($input['net_change'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing user_id or net_change']);
    exit();
}

$userId = $input['user_id'];
$amount = floatval($input['net_change']);
$source = isset($input['source']) ? $input['source'] : 'unknown';
$serverId = isset($input['server_id']) ? $input['server_id'] : 'clickforcharity';

// Validate user_id format
if (!preg_match('/^\d+-[a-zA-Z0-9_-]+$/', $userId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user_id format']);
    exit();
}

// Forward to centralized auth server
$authServerUrl = 'https://auth.directsponsor.net/api/update_balance.php';

$postData = json_encode([
    'user_id' => $userId,
    'amount' => $amount,
    'source' => $source,
    'server_id' => $serverId
]);

$ch = curl_init($authServerUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to update balance on auth server',
        'details' => $curlError
    ]);
    exit();
}

// Return auth server response
echo $response;
?>
