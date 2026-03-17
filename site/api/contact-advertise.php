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

$to      = 'ads@clickforcharity.net';
$subject = 'Advertising enquiry from ' . $name;
$body    = "Name: $name\nEmail: $email\n\nMessage:\n$message";
$headers = "From: noreply@clickforcharity.net\r\n"
         . "Reply-To: $email\r\n"
         . "X-Mailer: PHP/" . phpversion();

// Log the attempt
error_log("[" . date('Y-m-d H:i:s') . "] Attempting to send email to: $to, from: $email");

$mailResult = mail($to, $subject, $body, $headers);

if ($mailResult) {
    error_log("[" . date('Y-m-d H:i:s') . "] Email sent successfully to: $to");
    echo json_encode(['success' => true]);
} else {
    $lastError = error_get_last();
    error_log("[" . date('Y-m-d H:i:s') . "] Email failed to send. Error: " . json_encode($lastError));
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message. Please email us directly at ads@clickforcharity.net']);
}
