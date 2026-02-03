<?php
/**
 * Update User Tasks API
 * Handles completing and skipping complex tasks
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getProfileFilePath($userId) {
    return '/var/clickforcharity-data/userdata/profiles/' . $userId . '.txt';
}

function getBalanceFilePath($userId) {
    return '/var/clickforcharity-data/userdata/balances/' . $userId . '.txt';
}

function loadUserProfile($userId) {
    $profileFile = getProfileFilePath($userId);
    
    if (file_exists($profileFile)) {
        $data = json_decode(file_get_contents($profileFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return null;
}

function saveUserProfile($userId, $profileData) {
    $profileFile = getProfileFilePath($userId);
    $dir = dirname($profileFile);
    
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($profileFile, json_encode($profileData, JSON_PRETTY_PRINT));
}

function loadBalance($userId) {
    $balanceFile = getBalanceFilePath($userId);
    
    if (file_exists($balanceFile)) {
        $data = json_decode(file_get_contents($balanceFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return [
        'balance' => 0,
        'last_updated' => time(),
        'recent_transactions' => []
    ];
}

function saveBalance($userId, $balanceData) {
    $balanceFile = getBalanceFilePath($userId);
    $dir = dirname($balanceFile);
    
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return file_put_contents($balanceFile, json_encode($balanceData, JSON_PRETTY_PRINT));
}

function addTransaction($balanceData, $amount, $description) {
    if (!isset($balanceData['recent_transactions'])) {
        $balanceData['recent_transactions'] = [];
    }
    
    $transaction = [
        'amount' => $amount,
        'description' => $description,
        'timestamp' => time(),
        'date' => date('Y-m-d H:i:s')
    ];
    
    array_unshift($balanceData['recent_transactions'], $transaction);
    
    $balanceData['recent_transactions'] = array_slice($balanceData['recent_transactions'], 0, 50);
    
    return $balanceData;
}

function loadTasks() {
    $tasksFile = '/var/clickforcharity-data/tasks/tasks.json';
    
    if (file_exists($tasksFile)) {
        $data = json_decode(file_get_contents($tasksFile), true);
        if ($data && is_array($data)) {
            return $data;
        }
    }
    
    return [];
}

function getTaskById($taskId) {
    $tasks = loadTasks();
    foreach ($tasks as $task) {
        if ($task['id'] === $taskId) {
            return $task;
        }
    }
    return null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON input']);
        exit;
    }
    
    $userId = $input['user_id'] ?? null;
    $taskId = $input['task_id'] ?? null;
    $action = $input['action'] ?? null; // 'complete' or 'skip'
    
    if (!$userId || !$taskId || !$action) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameters: user_id, task_id, action']);
        exit;
    }
    
    if (!preg_match('/^[0-9]+-[a-zA-Z0-9_-]+$/', $userId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid user_id format (expected: id-username)']);
        exit;
    }
    
    if (!in_array($action, ['complete', 'skip'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action - must be "complete" or "skip"']);
        exit;
    }
    
    $userData = loadUserProfile($userId);
    
    if (!$userData) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Initialize arrays if they don't exist
    if (!isset($userData['completedTasks'])) {
        $userData['completedTasks'] = [];
    }
    if (!isset($userData['skippedTasks'])) {
        $userData['skippedTasks'] = [];
    }
    
    // Initialize stats tracking
    if (!isset($userData['taskStats'])) {
        $userData['taskStats'] = [
            'totalCompleted' => 0,
            'byCategory' => [
                'follows' => 0,
                'engagements' => 0,
                'other' => 0
            ]
        ];
    }
    
    $reward = 0;
    $taskTitle = '';
    
    if ($action === 'complete') {
        // Get task details for reward
        $task = getTaskById($taskId);
        
        if (!$task) {
            http_response_code(404);
            echo json_encode(['error' => 'Task not found']);
            exit;
        }
        
        $taskTitle = $task['title'];
        $reward = $task['reward'];
        
        // Add to completed tasks
        if (!in_array($taskId, $userData['completedTasks'])) {
            $userData['completedTasks'][] = $taskId;
            
            // Update stats
            $userData['taskStats']['totalCompleted']++;
            $category = $task['category'] ?? 'other';
            if (isset($userData['taskStats']['byCategory'][$category])) {
                $userData['taskStats']['byCategory'][$category]++;
            }
        }
        
        // Award coins
        $balanceData = loadBalance($userId);
        $balanceData['balance'] += $reward;
        $balanceData['last_updated'] = time();
        $balanceData = addTransaction($balanceData, $reward, "Completed task: $taskTitle");
        saveBalance($userId, $balanceData);
        
    } elseif ($action === 'skip') {
        // Add to skipped tasks
        if (!in_array($taskId, $userData['skippedTasks'])) {
            $userData['skippedTasks'][] = $taskId;
        }
    }
    
    // Save profile
    if (saveUserProfile($userId, $userData)) {
        echo json_encode([
            'success' => true,
            'action' => $action,
            'task_id' => $taskId,
            'reward' => $reward,
            'message' => $action === 'complete' 
                ? "Task completed! You earned $reward coins." 
                : "Task skipped."
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save user data']);
    }
    
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request method - Use POST']);
}
?>
