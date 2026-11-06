<?php
declare(strict_types=1);

include __DIR__ . '/varGlobales.php';

$peticionApi = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
header('Content-Type: ' . ($peticionApi ? 'application/json' : 'text/html') . '; charset=UTF-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($peticionApi && $metodo === 'POST') {
    $contenido = file_get_contents('php://input');
    $datos = is_string($contenido) ? json_decode($contenido, true) : null;
    if (!is_array($datos)) {
        http_response_code(400);
        echo json_encode(['error' => 'La solicitud no contiene datos válidos.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $fase = $datos['fase'] ?? null;
    if ($fase === 'pregunta') {
        $tokenCsrf = $datos['token'] ?? null;
        $nombre = $datos['usuario'] ?? null;
        if (
            !is_string($tokenCsrf)
            || !hash_equals($_SESSION['csrf_estado_sesion'], $tokenCsrf)
            || !is_string($nombre)
            || trim($nombre) === ''
            || strlen($nombre) > 100
            || preg_match('//u', $nombre) !== 1
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Introduce un nombre de usuario válido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $pregunta = preguntaSeguridadUsuario($nombre);
        if ($pregunta === null || trim($pregunta) === '') {
            http_response_code(400);
            echo json_encode(['error' => 'No hay una pregunta de seguridad configurada para esa cuenta.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['pregunta' => $pregunta], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
        exit;
    }

    if ($fase === 'verificar') {
        unset($_SESSION['usuario_recuperacion'], $_SESSION['token_recuperacion'], $_SESSION['expira_recuperacion']);
        $tokenCsrf = $datos['token'] ?? null;
        $nombre = $datos['usuario'] ?? null;
        $respuesta = $datos['respuesta'] ?? null;
        if (
            !is_string($tokenCsrf)
            || !hash_equals($_SESSION['csrf_estado_sesion'], $tokenCsrf)
            || !is_string($nombre)
            || !is_string($respuesta)
            || trim($nombre) === ''
            || trim($respuesta) === ''
            || strlen($nombre) > 100
            || strlen($respuesta) > 512
            || preg_match('//u', $nombre) !== 1
            || preg_match('//u', $respuesta) !== 1
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Introduce un usuario y una respuesta válidos.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!verificarRespuestaSeguridad($nombre, $respuesta)) {
            http_response_code(400);
            echo json_encode(['error' => 'El usuario o la respuesta de seguridad no coinciden.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $_SESSION['usuario_recuperacion'] = trim($nombre);
        $_SESSION['token_recuperacion'] = bin2hex(random_bytes(32));
        $_SESSION['expira_recuperacion'] = time() + 600;
        echo json_encode([
            'verificado' => true,
            'token' => $_SESSION['token_recuperacion'],
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($fase === 'cambiar') {
        $tokenRecibido = $datos['token'] ?? null;
        $nuevaContraseña = $datos['nueva_contrasena'] ?? null;
        $confirmarContraseña = $datos['confirmar_contrasena'] ?? null;
        $tokenGuardado = $_SESSION['token_recuperacion'] ?? null;
        $nombre = $_SESSION['usuario_recuperacion'] ?? null;
        $expira = $_SESSION['expira_recuperacion'] ?? 0;

        if (
            !is_string($tokenRecibido)
            || !is_string($tokenGuardado)
            || !hash_equals($tokenGuardado, $tokenRecibido)
            || !is_string($nombre)
            || !is_int($expira)
            || $expira < time()
        ) {
            unset($_SESSION['usuario_recuperacion'], $_SESSION['token_recuperacion'], $_SESSION['expira_recuperacion']);
            http_response_code(403);
            echo json_encode(['error' => 'La verificación ha caducado. Vuelve a comprobar tu respuesta de seguridad.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (
            !is_string($nuevaContraseña)
            || !is_string($confirmarContraseña)
            || !hash_equals($nuevaContraseña, $confirmarContraseña)
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Las contraseñas no coinciden.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!actualizarContraseñaVerificada($nombre, $nuevaContraseña)) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 12 caracteres válidos.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        unset($_SESSION['usuario_recuperacion'], $_SESSION['token_recuperacion'], $_SESSION['expira_recuperacion']);
        echo json_encode(['mensaje' => 'La contraseña se ha cambiado correctamente.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'La fase de recuperación no es válida.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$error = '';
$cambioCorrecto = isset($_GET['estado']) && $_GET['estado'] === 'ok';
$tokenCsrf = $_SESSION['csrf_cambio_pass'];
$nombreUsuario = '';

if ($metodo === 'POST') {
    $camposValidos = true;
    foreach (['usuario', 'respuesta', 'nueva_contrasena', 'confirmar_contrasena', 'csrf_token'] as $campo) {
        if (!isset($_POST[$campo]) || !is_string($_POST[$campo])) {
            $camposValidos = false;
            break;
        }
    }

    if (!$camposValidos) {
        http_response_code(400);
        $error = 'Revisa los datos introducidos e inténtalo de nuevo.';
    } else {
        $nombreUsuario = trim($_POST['usuario']);
        $respuesta = trim($_POST['respuesta']);
        $nuevaContraseña = $_POST['nueva_contrasena'];
        $confirmarContraseña = $_POST['confirmar_contrasena'];
        $tokenRecibido = $_POST['csrf_token'];
        $maxBytesContraseña = defined('PASSWORD_ARGON2ID') ? 1024 : 72;
        $numeroCaracteresContraseña = preg_match('//u', $nuevaContraseña) === 1
            ? preg_match_all('/./us', $nuevaContraseña)
            : false;

        if (!hash_equals($tokenCsrf, $tokenRecibido)) {
            http_response_code(403);
            $error = 'La solicitud ha caducado o no es válida. Recarga la página e inténtalo de nuevo.';
        } elseif (
            $nombreUsuario === ''
            && (!isset($_SESSION['usuario']) || !is_string($_SESSION['usuario']))
        ) {
            http_response_code(400);
            $error = 'Indica el nombre de usuario de la cuenta.';
        } elseif (
            $nombreUsuario !== ''
            && (
                strlen($nombreUsuario) > 100
                || preg_match('//u', $nombreUsuario) !== 1
                || str_contains($nombreUsuario, "\0")
            )
        ) {
            http_response_code(400);
            $error = 'Revisa los datos introducidos e inténtalo de nuevo.';
        } elseif (
            $respuesta === ''
            || strlen($respuesta) > 512
            || preg_match('//u', $respuesta) !== 1
            || str_contains($respuesta, "\0")
            || $nuevaContraseña === ''
            || strlen($nuevaContraseña) > $maxBytesContraseña
            || preg_match('//u', $nuevaContraseña) !== 1
            || str_contains($nuevaContraseña, "\0")
            || $numeroCaracteresContraseña === false
            || !hash_equals($nuevaContraseña, $confirmarContraseña)
        ) {
            http_response_code(400);
            $error = 'Comprueba que todos los campos estén completos y que las contraseñas coincidan.';
        } elseif ($numeroCaracteresContraseña < 12) {
            http_response_code(400);
            $error = 'La contraseña debe tener al menos 12 caracteres.';
        } elseif (cambioContraseña($respuesta, $nuevaContraseña, $nombreUsuario !== '' ? $nombreUsuario : null)) {
            header('Location: cambioPass.php?estado=ok', true, 303);
            exit;
        } else {
            http_response_code(400);
            $error = 'No se pudo cambiar la contraseña. Comprueba el usuario y la respuesta de seguridad.';
        }
    }
} elseif ($metodo !== 'GET') {
    header('Allow: GET, POST');
    http_response_code(405);
    $error = 'Método no permitido.';
}

$escapar = static fn (string $valor): string => htmlspecialchars(
    $valor,
    ENT_QUOTES | ENT_SUBSTITUTE,
    'UTF-8'
);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cambiar contraseña | GranaWeen</title>
</head>
<body>
    <main>
        <h1>Cambiar contraseña</h1>

        <?php if ($cambioCorrecto): ?>
            <p role="status">La contraseña se ha cambiado correctamente.</p>
            <p><a href="../miCuenta.html">Volver a mi cuenta</a></p>
        <?php else: ?>
            <?php if ($error !== ''): ?>
                <p role="alert"><?= $escapar($error) ?></p>
            <?php endif; ?>

            <p>Verifica la respuesta de seguridad para establecer una nueva contraseña.</p>
            <form action="cambioPass.php" method="post" accept-charset="UTF-8">
                <input
                    type="hidden"
                    name="csrf_token"
                    value="<?= $escapar($tokenCsrf) ?>"
                >

                <label for="usuario">Nombre de usuario (si has iniciado sesión, puedes dejarlo vacío):</label>
                <input
                    type="text"
                    id="usuario"
                    name="usuario"
                    maxlength="100"
                    autocomplete="username"
                    value="<?= $escapar($nombreUsuario) ?>"
                >

                <label for="respuesta">Respuesta de seguridad:</label>
                <input
                    type="password"
                    id="respuesta"
                    name="respuesta"
                    maxlength="512"
                    autocomplete="off"
                    required
                >

                <label for="nueva-contrasena">Nueva contraseña (mínimo 12 caracteres):</label>
                <input
                    type="password"
                    id="nueva-contrasena"
                    name="nueva_contrasena"
                    minlength="12"
                    maxlength="1024"
                    autocomplete="new-password"
                    required
                >

                <label for="confirmar-contrasena">Confirma la nueva contraseña:</label>
                <input
                    type="password"
                    id="confirmar-contrasena"
                    name="confirmar_contrasena"
                    minlength="12"
                    maxlength="1024"
                    autocomplete="new-password"
                    required
                >

                <button type="submit">Cambiar contraseña</button>
            </form>
        <?php endif; ?>
    </main>
</body>
</html>