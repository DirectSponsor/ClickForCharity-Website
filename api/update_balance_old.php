<?php
// API to handle updating a user's balance.

header('Content-Type: application/json');

// We should use POST for actions that change data.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['error' => 'POST method required.']);
    exit;
}

// Get the raw POST data
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

$userId = $data['userId'] ?? '';
$reward = $data['reward'] ?? 0;

if (empty($userId) || !is_numeric($reward) || $reward <= 0) {
    http_response_code(400); // Bad Request
    echo json_encode(['error' => 'Invalid userId or reward amount.']);
    exit;
}

// IMPORTANT: Sanitize the userId to prevent directory traversal attacks.
// This ensures the path can only contain alphanumeric characters, dashes, and underscores.
if (!preg_match('/^[a-zA-Z0-9_-]+$/', $userId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid userId format.']);
    exit;
}

$user_file_path = __DIR__ . '/../../../clickforcharity-data/users/' . $userId . '.json';

if (!file_exists($user_file_path)) {
    http_response_code(404);
    echo json_encode(['error' => 'User not found.']);
    exit;
}

// Read the user's data file.
$user_data_json = file_get_contents($user_file_path);
$user_data = json_decode($user_data_json, true);

if (!$user_data) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not read user data.']);
    exit;
}

// Update the balance.
$user_data['balance'] += $reward;

// Write the updated data back to the file.
// file_put_contents is atomic, which is good. We also use LOCK_EX for extra safety.
if (file_put_contents($user_file_path, json_encode($user_data, JSON_PRETTY_PRINT), LOCK_EX)) {
    // Success. Return the new balance.
    echo json_encode(['success' => true, 'newBalance' => $user_data['balance']]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save updated user data.']);
}
