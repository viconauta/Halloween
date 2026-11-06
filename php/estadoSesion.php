<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mensaje = $_SESSION['mensaje_flash'] ?? '';
    unset($_SESSION['mensaje_flash']);

    echo json_encode([
        'sesionIniciada' => isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']),
        'mensaje' => is_string($mensaje) ? $mensaje : '',
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    unset($_SESSION['currentUser']);
    $_SESSION['mensaje_flash'] = 'Has cerrado sesión correctamente.';

    echo json_encode([
        'sesionIniciada' => false,
        'mensaje' => $_SESSION['mensaje_flash'],
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

http_response_code(405);
header('Allow: GET, POST');
echo json_encode([
    'sesionIniciada' => isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']),
    'mensaje' => 'Método no permitido.',
], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
