<?php
/**
 * Delete Complex Task API
 * Removes a task from the complex tasks JSON file
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
    
    if (!$input || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing task ID']);
        exit;
    }
    
    $taskId = $input['id'];
    $tasksFile = '/var/clickforcharity-data/complex-tasks/tasks.json';
    
    // Load existing tasks
    $tasks = [];
    if (file_exists($tasksFile)) {
        $data = json_decode(file_get_contents($tasksFile), true);
        if ($data && is_array($data)) {
            $tasks = $data;
        }
    }
    
    // Filter out the task to delete
    $originalCount = count($tasks);
    $tasks = array_values(array_filter($tasks, function($task) use ($taskId) {
        return $task['id'] !== $taskId;
    }));
    
    if (count($tasks) === $originalCount) {
        http_response_code(404);
        echo json_encode(['error' => 'Task not found']);
        exit;
    }
    
    // Save to file
    if (file_put_contents($tasksFile, json_encode($tasks, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Task deleted successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save changes']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use POST']);
}
?>
