<?php
/**
 * One-time Backup Script: User Data
 * Creates a ZIP backup of /var/clickforcharity-data/userdata/
 */

$sourceDir = '/var/clickforcharity-data/userdata';
$backupFile = '/var/clickforcharity-data/userdata_backup_' . date('Ymd_His') . '.zip';

echo "Starting backup of $sourceDir...\n";

if (!is_dir($sourceDir)) {
    die("Error: Source directory $sourceDir not found.\n");
}

// Using system zip command if available
$cmd = "zip -r " . escapeshellarg($backupFile) . " " . escapeshellarg($sourceDir);
exec($cmd, $output, $returnVar);

if ($returnVar === 0) {
    echo "Success: Backup created at $backupFile\n";
    chmod($backupFile, 0644);
} else {
    echo "Error: Failed to create ZIP backup. Return code: $returnVar\n";
    echo "Output: " . implode("\n", $output) . "\n";
    echo "Trying alternative method (manual directory copy)...\n";
    
    $backupDir = $sourceDir . '_backup_' . date('Ymd_His');
    $cmd2 = "cp -r " . escapeshellarg($sourceDir) . " " . escapeshellarg($backupDir);
    exec($cmd2, $output2, $returnVar2);
    
    if ($returnVar2 === 0) {
        echo "Success: Manual directory backup created at $backupDir\n";
    } else {
        echo "Error: Manual backup failed too.\n";
    }
}
