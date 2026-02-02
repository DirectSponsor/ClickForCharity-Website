<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['type']) || !isset($input['html'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$type = $input['type'];
$html = trim($input['html']);
$index = isset($input['index']) ? intval($input['index']) : null;

// Validate type
if (!in_array($type, ['desktop', 'mobile', 'floating'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid type']);
    exit;
}

// Validate HTML is not empty
if (empty($html)) {
    echo json_encode(['success' => false, 'error' => 'HTML cannot be empty']);
    exit;
}

// Determine file path
$files = [
    'desktop' => '../data/ads-desktop.txt',
    'mobile' => '../data/ads-mobile.txt',
    'floating' => '../data/ads-floating.txt'
];
$file = $files[$type];

// Read existing content
$content = "";
if (file_exists($file)) {
    $content = file_get_contents($file);
}

// Prepare new entry
$entry = $html;
if (!empty($content) && substr(trim($content), -3) !== '---') {
    $newContent = trim($content) . "\n---\n" . $entry . "\n";
} else {
    $newContent = trim($content) . ($content ? "\n---\n" : "") . $entry . "\n";
}
$message = 'Banner ad added successfully';

// Rebuild content with separators
$newContent = implode("\n---\n", $ads);
if (!empty($newContent)) {
    $newContent .= "\n";
}

// Write to file
if (file_put_contents($file, $newContent) === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to write file']);
    exit;
}

echo json_encode(['success' => true, 'message' => $message]);
