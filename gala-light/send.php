<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Bad request']);
    exit;
}

$token   = '8772133903:AAHPXEKuXFrzSBQWt8L60Nk1uO6Iqe4IEbw';
$chat_id = '699505010';
$message = $input['message'];

$url  = "https://api.telegram.org/bot{$token}/sendMessage";
$data = [
    'chat_id'    => $chat_id,
    'text'       => $message,
    'parse_mode' => 'Markdown',
];

$options = [
    'http' => [
        'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
        'method'  => 'POST',
        'content' => http_build_query($data),
        'timeout' => 10,
    ],
];

$context  = stream_context_create($options);
$result   = file_get_contents($url, false, $context);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send']);
    exit;
}

$response = json_decode($result, true);
if (isset($response['ok']) && $response['ok']) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $response['description'] ?? 'Unknown error']);
}
