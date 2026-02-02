<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['type']) || !isset($input['index'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$type = $input['type'];
$index = intval($input['index']);

// Validate type
if (!in_array($type, ['desktop', 'mobile', 'floating'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid type']);
    exit;
}

// Determine file path
$files = [
    'desktop' => '../../data/ads-desktop.txt',
    'mobile' => '../../data/ads-mobile.txt',
    'floating' => '../../data/ads-floating.txt'
];
$file = $files[$type];

// Check if file exists
if (!file_exists($file)) {
    echo json_encode(['success' => false, 'error' => 'File not found']);
    exit;
}

// Read and parse ads
$content = file_get_contents($file);
$ads = array_filter(
    array_map('trim', explode('---', $content)),
    function($ad) { return !empty($ad); }
);
$ads = array_values($ads); // Re-index

// Validate index
if ($index < 0 || $index >= count($ads)) {
    echo json_encode(['success' => false, 'error' => 'Invalid index']);
    exit;
}

// Remove the ad at the specified index
array_splice($ads, $index, 1);

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

echo json_encode(['success' => true, 'message' => 'Banner ad deleted successfully']);
