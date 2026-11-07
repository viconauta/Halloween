<?php
/**
 * perfilCuenta.php
 * Endpoint JSON para consultar y actualizar los datos del perfil de usuario autenticado.
 */
include __DIR__ . '/varGlobales.php';

header('Content-Type: application/json; charset=utf-8');

$datosPerfil = datosPerfilActual();

// Verificar autenticación
if ($datosPerfil === null) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Inicia sesión para consultar o actualizar tu cuenta.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Petición GET: Obtener datos del perfil actual
if ($metodo === 'GET') {
    echo json_encode([
        'perfil' => $datosPerfil,
        'token'  => 'perfil_activo',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Petición POST: Actualizar datos del perfil
if ($metodo === 'POST') {
    $cuerpo = file_get_contents('php://input');
    $datos = json_decode($cuerpo, true);

    if (!is_array($datos)) {
        http_response_code(400);
        echo json_encode(['error' => 'Los datos recibidos no son válidos.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $nombre    = trim($datos['nombre'] ?? '');
    $fecha     = trim($datos['fecha'] ?? '');
    $email     = trim($datos['email'] ?? '');
    $seguridad = trim($datos['seguridad'] ?? '');

    if (empty($nombre)) {
        http_response_code(400);
        echo json_encode(['error' => 'El nombre de usuario no puede estar vacío.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'El correo electrónico no es válido.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $actualizado = actualizarPerfilActual([
        'nombre'    => $nombre,
        'fecha'     => $fecha,
        'email'     => $email,
        'seguridad' => $seguridad,
    ]);

    if (!$actualizado) {
        http_response_code(400);
        echo json_encode([
            'error' => 'No se pudieron guardar los cambios. Puede que el nombre ya esté en uso.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode([
        'perfil'  => datosPerfilActual(),
        'mensaje' => 'Cambios guardados correctamente.',
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido.'], JSON_UNESCAPED_UNICODE);
