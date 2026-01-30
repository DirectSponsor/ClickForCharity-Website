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

if (!$data || !isset($data['title'], $data['shortDescription'], $data['instructions'], $data['url'], $data['reward'], $data['duration'], $data['type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Validate data
$title = trim($data['title']);
$shortDescription = trim($data['shortDescription']);
$instructions = trim($data['instructions']);
$url = trim($data['url']);
$reward = (int)$data['reward'];
$duration = (int)$data['duration'];
$type = trim($data['type']);

if (empty($title) || empty($shortDescription) || empty($instructions) || empty($url) || $reward <= 0 || $duration <= 0 || empty($type)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid field values']);
    exit;
}

// Validate URL
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Validate duration (max 59 seconds to avoid browser throttling)
if ($duration > 59) {
    http_response_code(400);
    echo json_encode(['error' => 'Duration must be 59 seconds or less']);
    exit;
}

$simpleTasksDir = '/var/clickforcharity-data/simple-tasks';

if (!is_dir($simpleTasksDir)) {
    mkdir($simpleTasksDir, 0755, true);
}

// Find next available ID
$files = glob($simpleTasksDir . '/*.json');
$ids = [];
foreach ($files as $file) {
    $basename = basename($file, '.json');
    // Extract numeric part from simple_X format
    if (preg_match('/simple_(\d+)/', $basename, $matches)) {
        $ids[] = (int)$matches[1];
    }
}
$nextId = empty($ids) ? 1 : max($ids) + 1;

$taskId = 'simple_' . $nextId;

$task = [
    'id' => $taskId,
    'title' => $title,
    'shortDescription' => $shortDescription,
    'instructions' => $instructions,
    'url' => $url,
    'reward' => $reward,
    'duration' => $duration,
    'type' => $type,
    'createdAt' => time()
];

$filePath = $simpleTasksDir . '/' . $taskId . '.json';
$result = file_put_contents($filePath, json_encode($task, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to write file']);
    exit;
}

http_response_code(201);
echo json_encode(['success' => true, 'id' => $taskId, 'file' => $taskId . '.json']);
