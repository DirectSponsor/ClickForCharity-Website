<?php
/**
 * Send Cleanup Alert Email
 * Checks cleanup status and sends email if there's a problem
 * Add this to cron to run every 5 minutes: star-slash-5-star-star-star-star
 * (Replace dashes with spaces in cron syntax)
 */

// Load configuration
$configFile = '/var/clickforcharity-data/config/alerts.json';
$config = [
    'enabled' => false,
    'email' => 'admin@clickforcharity.net',
    'from' => 'noreply@clickforcharity.net'
];

if (file_exists($configFile)) {
    $loadedConfig = json_decode(file_get_contents($configFile), true);
    if ($loadedConfig) {
        $config = array_merge($config, $loadedConfig);
    }
}

// Exit if alerts disabled
if (!$config['enabled']) {
    echo "Alerts disabled in config\n";
    exit;
}

// Check cleanup status
$statusFile = '/var/clickforcharity-data/status/last-cleanup.json';
if (!file_exists($statusFile)) {
    sendAlert($config, 'Cleanup Never Run', 'No cleanup status file found. Cleanup may have never run.');
    exit;
}

$status = json_decode(file_get_contents($statusFile), true);

// Check if last cleanup failed
if (!$status['success']) {
    $error = $status['error'] ?? 'Unknown error';
    sendAlert($config, 'Cleanup Failed', "Last cleanup failed with error: $error");
    exit;
}

// Check if cleanup is overdue (>48 hours)
$lastTime = strtotime($status['timestamp']);
$hoursSince = (time() - $lastTime) / 3600;

if ($hoursSince > 48) {
    sendAlert($config, 'Cleanup Overdue', "Last cleanup was " . round($hoursSince, 1) . " hours ago. Expected to run daily.");
    exit;
}

echo "Cleanup status healthy\n";

function sendAlert($config, $subject, $message) {
    $to = $config['email'];
    $from = $config['from'];
    
    $headers = [
        'From: ' . $from,
        'Reply-To: ' . $from,
        'X-Mailer: PHP/' . phpversion(),
        'Content-Type: text/plain; charset=UTF-8'
    ];
    
    $fullMessage = "Click for Charity - Task Cleanup Alert\n\n";
    $fullMessage .= $message . "\n\n";
    $fullMessage .= "Time: " . date('Y-m-d H:i:s') . "\n";
    $fullMessage .= "Check status: https://clickforcharity.net/api/cleanup-status.php\n";
    
    $sent = mail($to, "Alert: $subject", $fullMessage, implode("\r\n", $headers));
    
    if ($sent) {
        echo "Alert email sent to $to\n";
    } else {
        echo "Failed to send alert email\n";
    }
}
?>
