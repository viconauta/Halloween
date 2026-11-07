<?php
/**
 * cambioPass.php
 * Permite cambiar la contraseña verificando la pregunta de seguridad.
 * Admite peticiones API JSON (desde los modales de JS) y envíos directos de formulario HTML.
 */
include __DIR__ . '/varGlobales.php';

$esPeticionJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json')
    || str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json');

// -------------------------------------------------------------
// GESTIÓN DE PETICIONES API (JSON)
// -------------------------------------------------------------
if ($esPeticionJson && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');

    $contenido = file_get_contents('php://input');
    $datos = json_decode($contenido, true);

    if (!is_array($datos)) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos de solicitud no válidos.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $fase = $datos['fase'] ?? '';

    // Fase 1: Solicitar pregunta de seguridad del usuario
    if ($fase === 'pregunta') {
        $nombre = trim($datos['usuario'] ?? '');
        if (empty($nombre)) {
            http_response_code(400);
            echo json_encode(['error' => 'Introduce un nombre de usuario.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $pregunta = preguntaSeguridadUsuario($nombre);
        if ($pregunta === null) {
            http_response_code(400);
            echo json_encode(['error' => 'No hay una pregunta de seguridad configurada para esa cuenta.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        echo json_encode(['pregunta' => $pregunta], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Fase 2: Verificar la respuesta a la pregunta de seguridad
    if ($fase === 'verificar') {
        $nombre    = trim($datos['usuario'] ?? '');
        $respuesta = trim($datos['respuesta'] ?? '');

        if (empty($nombre) || empty($respuesta)) {
            http_response_code(400);
            echo json_encode(['error' => 'Introduce el usuario y tu respuesta.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!verificarRespuestaSeguridad($nombre, $respuesta)) {
            http_response_code(400);
            echo json_encode(['error' => 'El usuario o la respuesta de seguridad no coinciden.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $_SESSION['usuario_recuperacion'] = $nombre;
        echo json_encode([
            'verificado' => true,
            'token'      => 'token_recuperacion_ok',
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Fase 3: Establecer la nueva contraseña
    if ($fase === 'cambiar') {
        $nombre    = $_SESSION['usuario_recuperacion'] ?? ($_SESSION['usuario'] ?? '');
        $nuevaPass = trim($datos['nueva_contrasena'] ?? '');
        $confPass  = trim($datos['confirmar_contrasena'] ?? '');

        if (empty($nombre)) {
            http_response_code(403);
            echo json_encode(['error' => 'Sesión de recuperación caducada. Vuelve a empezar.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (empty($nuevaPass) || $nuevaPass !== $confPass) {
            http_response_code(400);
            echo json_encode(['error' => 'Las contraseñas no coinciden o están vacías.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (strlen($nuevaPass) < 4) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 4 caracteres.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!actualizarContraseñaVerificada($nombre, $nuevaPass)) {
            http_response_code(400);
            echo json_encode(['error' => 'No se pudo actualizar la contraseña.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        unset($_SESSION['usuario_recuperacion']);
        echo json_encode(['mensaje' => 'La contraseña se ha cambiado correctamente.'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    http_response_code(400);
    echo json_encode(['error' => 'Fase de recuperación no reconocida.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// -------------------------------------------------------------
// GESTIÓN DEL FORMULARIO HTML DIRECTO
// -------------------------------------------------------------
$error = '';
$cambioCorrecto = isset($_GET['estado']) && $_GET['estado'] === 'ok';
$nombreUsuario = trim($_SESSION['usuario'] ?? '');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombreForm    = trim($_POST['usuario'] ?? $nombreUsuario);
    $respuesta     = trim($_POST['respuesta'] ?? '');
    $nuevaPass     = trim($_POST['nueva_contrasena'] ?? '');
    $confPass      = trim($_POST['confirmar_contrasena'] ?? '');

    if (empty($nombreForm) || empty($respuesta) || empty($nuevaPass)) {
        $error = 'Por favor, completa todos los campos del formulario.';
    } elseif ($nuevaPass !== $confPass) {
        $error = 'Las nuevas contraseñas no coinciden.';
    } elseif (strlen($nuevaPass) < 4) {
        $error = 'La contraseña debe tener al menos 4 caracteres.';
    } elseif (cambioContraseña($respuesta, $nuevaPass, $nombreForm)) {
        header('Location: cambioPass.php?estado=ok');
        exit;
    } else {
        $error = 'No se pudo cambiar la contraseña. Comprueba el usuario y la respuesta de seguridad.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cambiar contraseña - GranaWeen</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body class="page">
    <main>
        <section>
            <div class="titulo">
                <h1>Cambiar contraseña</h1>
            </div>

            <?php if ($cambioCorrecto): ?>
                <p style="color: #b8f23a; font-weight: bold;" role="status">¡La contraseña se ha cambiado correctamente!</p>
                <p><a href="./login.php">Iniciar sesión</a> | <a href="../index.html">Ir al inicio</a></p>
            <?php else: ?>
                <?php if (!empty($error)): ?>
                    <p style="color: #ff9a9a; font-weight: bold;" role="alert"><?= htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
                <?php endif; ?>

                <p>Verifica tu respuesta de seguridad para establecer una nueva contraseña:</p>

                <form action="cambioPass.php" method="post">
                    <label for="usuario">Nombre de usuario:</label>
                    <input
                        type="text"
                        id="usuario"
                        name="usuario"
                        value="<?= htmlspecialchars($nombreUsuario, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                        required
                    >

                    <label for="respuesta">Respuesta de seguridad:</label>
                    <input
                        type="password"
                        id="respuesta"
                        name="respuesta"
                        required
                    >

                    <label for="nueva-contrasena">Nueva contraseña:</label>
                    <input
                        type="password"
                        id="nueva-contrasena"
                        name="nueva_contrasena"
                        required
                    >

                    <label for="confirmar-contrasena">Confirma la nueva contraseña:</label>
                    <input
                        type="password"
                        id="confirmar-contrasena"
                        name="confirmar_contrasena"
                        required
                    >

                    <button type="submit" class="btn">Cambiar contraseña</button>
                </form>

                <p><a href="../index.html">← Volver al inicio</a></p>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>
