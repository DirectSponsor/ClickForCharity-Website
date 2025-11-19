<?php
// Simple API to serve data from the /data directory

header('Content-Type: application/json');

// A real app would have routing, but for this prototype, we'll use a query parameter.
$type = $_GET['type'] ?? '';
$userId = $_GET['userId'] ?? '';

function read_json_files($dir) {
    $data = [];
    $files = glob($dir . '/*.json');
    foreach ($files as $file) {
        $content = file_get_contents($file);
        $json = json_decode($content, true);
        if ($json) {
            // Use filename as part of the ID, e.g., "1-testuser1"
            $id = basename($file, '.json');
            $data[] = array_merge(['id' => $id], $json);
        }
    }
    return $data;
}

if ($type === 'ads') {
    // The data directory is two levels above this script's location (src/api)
    $ads_data = read_json_files('/var/clickforcharity-data/ads');
    echo json_encode($ads_data);
} elseif ($type === 'user' && !empty($userId)) {
    $user_file = '/var/clickforcharity-data/users/' . $userId . '.json';
    if (file_exists($user_file)) {
        echo file_get_contents($user_file);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
    }
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
}
