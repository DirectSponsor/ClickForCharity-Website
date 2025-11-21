<?php
// Write Balance API - Local file write for balance updates
// Receives net change, applies it to current balance, writes to file

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
$netChange = floatval($input['net_change']);

// Validate user_id format (should be "123-username")
if (!preg_match('/^\d+-[a-zA-Z0-9_-]+$/', $userId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid user_id format']);
    exit();
}

// Balance file path
$dataDir = '/var/clickforcharity-data/userdata/balances';
$balanceFile = $dataDir . '/' . $userId . '.txt';

// Ensure directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Read current balance
$currentBalance = 0;
if (file_exists($balanceFile)) {
    $data = json_decode(file_get_contents($balanceFile), true);
    if ($data && isset($data['balance'])) {
        $currentBalance = floatval($data['balance']);
    }
}

// Calculate new balance
$newBalance = $currentBalance + $netChange;

// Prevent negative balance
if ($newBalance < 0) {
    $newBalance = 0;
}

// Prepare balance data
$balanceData = [
    'user_id' => $userId,
    'balance' => $newBalance,
    'last_updated' => time()
];

// Write to file
$writeSuccess = file_put_contents($balanceFile, json_encode($balanceData, JSON_PRETTY_PRINT));

if ($writeSuccess === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to write balance file']);
    exit();
}

// Return success with new balance and timestamp
echo json_encode([
    'success' => true,
    'balance' => $newBalance,
    'previous_balance' => $currentBalance,
    'net_change' => $netChange,
    'timestamp' => time()
]);
?>
