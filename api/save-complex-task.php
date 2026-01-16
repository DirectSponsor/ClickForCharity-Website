<?php
/**
 * Save Complex Task API
 * Adds a new task to the complex tasks JSON file
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    
    // Validate required fields
    $required = ['title', 'shortDescription', 'instructions', 'url', 'reward', 'duration', 'category', 'platform'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    $tasksFile = __DIR__ . '/../data/complex-tasks/tasks.json';
    
    // Load existing tasks
    $tasks = [];
    if (file_exists($tasksFile)) {
        $data = json_decode(file_get_contents($tasksFile), true);
        if ($data && is_array($data)) {
            $tasks = $data;
        }
    }
    
    // Generate new task ID
    $maxId = 0;
    foreach ($tasks as $task) {
        if (isset($task['id']) && preg_match('/task_(\d+)/', $task['id'], $matches)) {
            $maxId = max($maxId, (int)$matches[1]);
        }
    }
    $newId = 'task_' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);
    
    // Create new task
    $newTask = [
        'id' => $newId,
        'title' => trim($input['title']),
        'shortDescription' => trim($input['shortDescription']),
        'instructions' => trim($input['instructions']),
        'url' => trim($input['url']),
        'reward' => (int)$input['reward'],
        'duration' => (int)$input['duration'],
        'category' => $input['category'],
        'platform' => $input['platform'],
        'repeatable' => isset($input['repeatable']) ? (bool)$input['repeatable'] : false,
        'enabled' => isset($input['enabled']) ? (bool)$input['enabled'] : true,
        'expiryDate' => isset($input['expiryDate']) && $input['expiryDate'] ? $input['expiryDate'] : null
    ];
    
    // Add to tasks array
    $tasks[] = $newTask;
    
    // Save to file
    if (file_put_contents($tasksFile, json_encode($tasks, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Task created successfully',
            'task_id' => $newId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save task to file']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use POST']);
}
?>
