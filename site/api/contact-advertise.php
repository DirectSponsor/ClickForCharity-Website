<?php
header('Content-Type: application/json');

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/apache2/clickforcharity_contact_errors.log');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// --- Bot traps ---

// 1. Honeypot: hidden field must be empty
$honeypot = isset($_POST['website']) ? $_POST['website'] : '';
if (!empty($honeypot)) {
    // Silently accept so bots think it worked
    echo json_encode(['success' => true]);
    exit;
}

// 2. "Are you a bot?" field must equal "no" (case-insensitive)
$botAnswer = strtolower(trim(isset($_POST['bot_check']) ? $_POST['bot_check'] : ''));
if ($botAnswer !== 'no') {
    echo json_encode(['success' => true]);
    exit;
}

// --- Validate real fields ---
$name    = trim(isset($_POST['name'])    ? $_POST['name']    : '');
$email   = trim(isset($_POST['email'])   ? $_POST['email']   : '');
$message = trim(isset($_POST['message']) ? $_POST['message'] : '');

if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please fill in all required fields.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Please enter a valid email address.']);
    exit;
}

// Sanitise for email headers
$name    = preg_replace('/[\r\n]/', '', $name);
$email   = preg_replace('/[\r\n]/', '', $email);

// Use PHPMailer for SMTP
require_once __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/../lib/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // Load SMTP config from secure file outside web root
    $smtpConfig = require '/var/www/clickforcharity.net/config/smtp-config.php';
    
    // Server settings
    $mail->isSMTP();
    $mail->Host       = $smtpConfig['host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $smtpConfig['username'];
    $mail->Password   = $smtpConfig['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $smtpConfig['port'];
    
    // Recipients
    $mail->setFrom('andy@clickforcharity.net', 'ClickForCharity Contact Form');
    $mail->addAddress('ads@clickforcharity.net');
    $mail->addReplyTo($email, $name);
    
    // Content
    $mail->isHTML(false);
    $mail->Subject = 'Advertising enquiry from ' . $name;
    $mail->Body    = "Name: $name\nEmail: $email\n\nMessage:\n$message";
    
    // Log the attempt
    error_log("[" . date('Y-m-d H:i:s') . "] Attempting to send email via SMTP to: ads@clickforcharity.net, from: $email");
    
    $mail->send();
    
    error_log("[" . date('Y-m-d H:i:s') . "] Email sent successfully via SMTP to: ads@clickforcharity.net");
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    error_log("[" . date('Y-m-d H:i:s') . "] Email failed to send via SMTP. Error: {$mail->ErrorInfo}");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message. Please email us directly at ads@clickforcharity.net']);
}
