<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Get type parameter (desktop or mobile)
$type = isset($_GET['type']) ? $_GET['type'] : 'desktop';

// Validate type
if (!in_array($type, ['desktop', 'mobile'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid type']);
    exit;
}

// Determine file path
$file = $type === 'desktop' 
    ? '../data/ads-desktop.txt' 
    : '../data/ads-mobile.txt';

// Check if file exists
if (!file_exists($file)) {
    echo json_encode(['success' => true, 'ads' => []]);
    exit;
}

// Read file content
$content = file_get_contents($file);

// Parse ads (split by ---)
$ads = array_filter(
    array_map('trim', explode('---', $content)),
    function($ad) { return !empty($ad); }
);

echo json_encode([
    'success' => true,
    'ads' => array_values($ads)
]);
