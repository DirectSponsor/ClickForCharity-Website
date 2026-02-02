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
$existingContent = file_exists($file) ? file_get_contents($file) : '';

// Append new ad with separator
$newContent = $existingContent;
if (!empty($existingContent) && !preg_match('/---\s*$/', $existingContent)) {
    $newContent .= "\n---\n";
}
$newContent .= $html . "\n";

// Write to file
if (file_put_contents($file, $newContent) === false) {
    echo json_encode(['success' => false, 'error' => 'Failed to write file']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Banner ad added successfully']);
