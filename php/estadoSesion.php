<?php
declare(strict_types=1);

include __DIR__ . '/VarGlobales.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

if (!isset($_SESSION['csrf_estado_sesion']) || !is_string($_SESSION['csrf_estado_sesion'])) {
    $_SESSION['csrf_estado_sesion'] = bin2hex(random_bytes(32));
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'POST') {
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';

    if (!is_string($token) || !hash_equals($_SESSION['csrf_estado_sesion'], $token)) {
        http_response_code(403);
        echo json_encode([
            'sesionIniciada' => isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']),
            'mensaje' => 'La solicitud no es válida. Recarga la página e inténtalo de nuevo.',
        ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    unset($_SESSION['currentUser'], $_SESSION['usuario']);

    echo json_encode([
        'sesionIniciada' => false,
        'mensaje' => 'Has cerrado sesión correctamente.',
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

if ($metodo !== 'GET') {
    http_response_code(405);
    header('Allow: GET, POST');
    echo json_encode([
        'sesionIniciada' => isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']),
        'mensaje' => 'Método no permitido.',
    ], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

$mensaje = $_SESSION['mensaje_flash'] ?? '';
unset($_SESSION['mensaje_flash']);

echo json_encode([
    'sesionIniciada' => isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']),
    'mensaje' => is_string($mensaje) ? $mensaje : '',
    'token' => $_SESSION['csrf_estado_sesion'],
], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);