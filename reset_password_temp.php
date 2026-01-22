<?php
// reset_password_temp.php
require_once 'config.php';

$username = 'lightninglova';
$newPassword = 'Lightning2026!';

echo "Attempting to reset password for user: $username\n";

try {
    $db = getAuthDB();
    
    // Check if user exists first
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();
    
    if (!$user) {
        die("ERROR: User '$username' not found in database.\n");
    }
    
    echo "User found (ID: " . $user['id'] . ").\n";
    
    // Hash new password
    $hash = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Update
    $update = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $update->execute([$hash, $user['id']]);
    
    echo "SUCCESS: Password updated.\n";
    echo "New Password: $newPassword\n";
    
} catch (Exception $e) {
    die("ERROR: " . $e->getMessage() . "\n");
}
?>
