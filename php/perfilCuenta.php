<?php
declare(strict_types=1);

include __DIR__ . '/varGlobales.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');

$responder = static function (array $respuesta, int $codigo = 200): never {
    http_response_code($codigo);
    echo json_encode($respuesta, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
};

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$datosPerfil = datosPerfilActual();

if ($datosPerfil === null) {
    $responder(['error' => 'Inicia sesión para consultar o actualizar tu cuenta.'], 401);
}

if ($metodo === 'GET') {
    $responder([
        'perfil' => $datosPerfil,
        'token' => $_SESSION['csrf_estado_sesion'],
    ]);
}

if ($metodo !== 'POST') {
    header('Allow: GET, POST');
    $responder(['error' => 'Método no permitido.'], 405);
}

$contenido = file_get_contents('php://input');
$datos = is_string($contenido) ? json_decode($contenido, true) : null;
if (!is_array($datos)) {
    $responder(['error' => 'La solicitud no contiene datos válidos.'], 400);
}

$token = $datos['token'] ?? null;
if (!is_string($token) || !hash_equals($_SESSION['csrf_estado_sesion'], $token)) {
    $responder(['error' => 'La solicitud ha caducado. Recarga la página e inténtalo de nuevo.'], 403);
}

$campos = ['nombre', 'fecha', 'email', 'seguridad'];
foreach ($campos as $campo) {
    if (!isset($datos[$campo]) || !is_string($datos[$campo])) {
        $responder(['error' => 'Revisa los datos del formulario e inténtalo de nuevo.'], 400);
    }
}

$datosActualizados = [
    'nombre' => trim($datos['nombre']),
    'fecha' => trim($datos['fecha']),
    'email' => trim($datos['email']),
    'seguridad' => trim($datos['seguridad']),
];

if (
    $datosActualizados['nombre'] === ''
    || strlen($datosActualizados['nombre']) > 100
    || strlen($datosActualizados['fecha']) > 10
    || strlen($datosActualizados['email']) > 254
    || strlen($datosActualizados['seguridad']) > 200
    || ($datosActualizados['email'] !== '' && filter_var($datosActualizados['email'], FILTER_VALIDATE_EMAIL) === false)
    || (
        $datosActualizados['fecha'] !== ''
        && (
            !preg_match('/^\d{4}-\d{2}-\d{2}$/', $datosActualizados['fecha'])
            || !checkdate(
                (int) substr($datosActualizados['fecha'], 5, 2),
                (int) substr($datosActualizados['fecha'], 8, 2),
                (int) substr($datosActualizados['fecha'], 0, 4)
            )
        )
    )
) {
    $responder(['error' => 'Comprueba que el nombre, la fecha y el correo sean válidos.'], 400);
}

if (!actualizarPerfilActual($datosActualizados)) {
    $responder(['error' => 'No se pudieron guardar los cambios. Puede que el nombre ya esté en uso.'], 409);
}

$responder([
    'perfil' => datosPerfilActual(),
    'mensaje' => 'Cambios guardados correctamente.',
]);
