<?php
/**
 * Migration Script: Initialize Complex Tasks Data
 * Copies tasks.json from the project folder to /var/clickforcharity-data/
 * MUST BE RUN MANUALLY OR VIA DEPLOYMENT
 */

$source = __DIR__ . '/../../data/complex-tasks/tasks.json';
$targetDir = '/var/clickforcharity-data/complex-tasks';
$targetFile = $targetDir . '/tasks.json';

echo "Starting migration...\n";
echo "Source: $source\n";
echo "Target: $targetFile\n";

if (!file_exists($source)) {
    die("Error: Source file not found at $source\n");
}

if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true)) {
        die("Error: Failed to create target directory $targetDir\n");
    }
    echo "Created directory: $targetDir\n";
}

if (copy($source, $targetFile)) {
    echo "Success: Copied tasks.json to $targetFile\n";
    echo "Setting permissions...\n";
    chmod($targetFile, 0664);
    // Note: chown to www-data might be needed on server
    echo "Done.\n";
} else {
    echo "Error: Failed to copy file.\n";
}
