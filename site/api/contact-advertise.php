<?php
header('Content-Type: application/json');

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

if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message. Please email us directly at ads@clickforcharity.net']);
}
