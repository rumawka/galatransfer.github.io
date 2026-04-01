<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// ── TELEGRAM CREDENTIALS (hidden from browser) ──
define('TG_TOKEN',   '8772133903:AAHPXEKuXFrzSBQWt8L60Nk1uO6Iqe4IEbw');
define('TG_CHAT_ID', '699505010');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);
$message = isset($body['message']) ? trim($body['message']) : '';

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Empty message']);
    exit;
}

// Sanitize
$message = mb_substr($message, 0, 4096);

$url = 'https://api.telegram.org/bot' . TG_TOKEN . '/sendMessage';

$payload = json_encode([
    'chat_id'    => TG_CHAT_ID,
    'text'       => $message,
    'parse_mode' => 'Markdown',
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 10,
]);
$result   = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code($httpCode === 200 ? 200 : 502);
echo $result ?: json_encode(['ok' => false, 'error' => 'Telegram API error']);
?>