<?php
/**
 * estadoSesion.php
 * Endpoint JSON para verificar el estado de la sesión y gestionar el cierre de sesión (logout).
 */
include __DIR__ . '/varGlobales.php';

header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Petición POST: Cerrar sesión
if ($metodo === 'POST') {
    unset($_SESSION['currentUser'], $_SESSION['usuario']);

    echo json_encode([
        'sesionIniciada' => false,
        'mensaje'        => 'Has cerrado sesión correctamente.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Petición GET: Consultar estado de sesión y mensajes flash
$estaLogueado = isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser']);
$usuarioActual = $estaLogueado ? ($_SESSION['usuario'] ?? '') : '';

$mensajeFlash = $_SESSION['mensaje_flash'] ?? '';
unset($_SESSION['mensaje_flash']);

echo json_encode([
    'sesionIniciada' => $estaLogueado,
    'usuario'        => $usuarioActual,
    'mensaje'        => $mensajeFlash,
    'token'          => 'sesion_activa',
    'tokenCorreo'    => 'correo_activo',
], JSON_UNESCAPED_UNICODE);
