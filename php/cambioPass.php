<?php
declare(strict_types=1);

include __DIR__ . '/varGlobales.php';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
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
        } elseif ($numeroCaracteresContraseña < 8) {
            http_response_code(400);
            $error = 'La contraseña debe tener al menos 8 caracteres.';
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