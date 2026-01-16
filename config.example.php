<?php
/**
 * Configuration Template
 * Copy this to config.php and fill in your actual values
 * NEVER commit config.php to git!
 */

return [
    // Google API Configuration
    'google' => [
        'api_key' => 'YOUR_GOOGLE_API_KEY_HERE',
        'analytics_id' => 'YOUR_GA_ID_HERE',
    ],
    
    // Email Configuration
    'email' => [
        'from' => 'noreply@clickforcharity.net',
        'admin' => 'andy@clickforcharity.net',
    ],
    
    // Database/Data Paths
    'paths' => [
        'userdata' => '/var/clickforcharity-data/userdata',
        'logs' => '/var/clickforcharity-data/logs',
        'status' => '/var/clickforcharity-data/status',
    ],
    
    // Feature Flags
    'features' => [
        'cleanup_alerts' => true,
        'debug_mode' => false,
    ],
];
?>
