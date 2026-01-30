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
    echo json_encode(['error' => 'Missing task ID']);
    exit;
}

$taskId = trim($data['id']);

// Validate task ID format (simple_X)
if (!preg_match('/^simple_\d+$/', $taskId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid task ID format']);
    exit;
}

$simpleTasksDir = '/var/clickforcharity-data/simple-tasks';
$filePath = $simpleTasksDir . '/' . $taskId . '.json';

if (!file_exists($filePath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Task not found']);
    exit;
}

// Soft delete: mark as deleted but keep file for 30 minutes
try {
    $task = json_decode(file_get_contents($filePath), true);
    if (!$task) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to read task file']);
        exit;
    }
    
    // Mark as deleted with cleanup timestamp
    $task['deletedAt'] = time();
    $task['deletedUntil'] = time() + (30 * 60); // 30 minutes from now
    
    $result = file_put_contents($filePath, json_encode($task, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to mark task as deleted']);
        exit;
    }
    
    http_response_code(200);
    echo json_encode(['success' => true, 'id' => $taskId, 'message' => 'Task marked for deletion (will be permanently removed in 30 minutes)']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to soft delete task']);
}
