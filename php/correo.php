<?php
declare(strict_types=1);

include __DIR__ . '/varGlobales.php';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$usuario = currentUser();
$correoRemitente = currentUserEmail();
$error = '';
$asunto = '';
$mensaje = '';
$envioCorrecto = isset($_GET['estado']) && $_GET['estado'] === 'ok';
$tokenCsrf = $_SESSION['csrf_correo'];

$destinoJack = getenv('JACK_EMAIL');
$correoAplicacion = getenv('MAIL_FROM_ADDRESS');
$configuracionCorreoValida = is_string($destinoJack)
    && filter_var($destinoJack, FILTER_VALIDATE_EMAIL) !== false
    && is_string($correoAplicacion)
    && filter_var($correoAplicacion, FILTER_VALIDATE_EMAIL) !== false;

if ($usuario === null || $correoRemitente === null) {
    http_response_code(401);
    $error = 'Inicia sesión con una cuenta que tenga un correo electrónico válido para enviar un mensaje.';
} elseif (!$configuracionCorreoValida) {
    http_response_code(503);
    error_log('Correo no disponible: configura JACK_EMAIL y MAIL_FROM_ADDRESS con direcciones válidas.');
    $error = 'El servicio de correo no está configurado. Inténtalo más tarde.';
} elseif ($metodo === 'POST') {
    $camposValidos = isset($_POST['csrf_token'], $_POST['asunto'], $_POST['mensaje'])
        && is_string($_POST['csrf_token'])
        && is_string($_POST['asunto'])
        && is_string($_POST['mensaje']);

    if (!$camposValidos) {
        http_response_code(400);
        $error = 'La solicitud no contiene todos los campos necesarios.';
    } else {
        $tokenRecibido = $_POST['csrf_token'];
        $asunto = trim($_POST['asunto']);
        $mensaje = trim($_POST['mensaje']);

        if (!hash_equals($tokenCsrf, $tokenRecibido)) {
            http_response_code(403);
            $error = 'La solicitud ha caducado o no es válida. Recarga la página e inténtalo de nuevo.';
        } elseif (
            $asunto === ''
            || strlen($asunto) > 200
            || preg_match('//u', $asunto) !== 1
            || preg_match('/[\r\n\x00]/', $asunto) === 1
            || $mensaje === ''
            || strlen($mensaje) > 10000
            || preg_match('//u', $mensaje) !== 1
            || str_contains($mensaje, "\0")
        ) {
            http_response_code(400);
            $error = 'El asunto y el mensaje son obligatorios. Revisa también la longitud del texto.';
        } elseif (!function_exists('mail')) {
            http_response_code(503);
            error_log('Correo no disponible: la función mail() no está habilitada en PHP.');
            $error = 'El servicio de correo no está disponible. Inténtalo más tarde.';
        } else {
            $asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
            $cabeceras = [
                'From' => 'GranaWeen <' . $correoAplicacion . '>',
                'Reply-To' => $correoRemitente,
                'MIME-Version' => '1.0',
                'Content-Type' => 'text/plain; charset=UTF-8',
                'Content-Transfer-Encoding' => '8bit',
            ];

            if (mail($destinoJack, $asuntoCodificado, $mensaje, $cabeceras)) {
                header('Location: correo.php?estado=ok', true, 303);
                exit;
            }

            error_log('No se pudo enviar el correo de contacto mediante mail().');
            http_response_code(502);
            $error = 'No se pudo enviar el mensaje. Inténtalo de nuevo más tarde.';
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
    <title>Escribir a Jack | GranaWeen</title>
</head>
<body>
    <main>
        <h1>Escribir a Jack</h1>

        <?php if ($envioCorrecto && $error === ''): ?>
            <p role="status">Tu mensaje se ha enviado correctamente.</p>
        <?php else: ?>
            <?php if ($error !== ''): ?>
                <p role="alert"><?= $escapar($error) ?></p>
            <?php endif; ?>

            <?php if ($usuario !== null && $correoRemitente !== null && $configuracionCorreoValida): ?>
                <p>El mensaje se enviará a Jack desde tu correo: <?= $escapar($correoRemitente) ?></p>
                <form action="correo.php" method="post" accept-charset="UTF-8">
                    <input
                        type="hidden"
                        name="csrf_token"
                        value="<?= $escapar($tokenCsrf) ?>"
                    >

                    <label for="asunto">Asunto:</label>
                    <input
                        type="text"
                        id="asunto"
                        name="asunto"
                        maxlength="200"
                        value="<?= $escapar($asunto) ?>"
                        required
                    >

                    <label for="mensaje">Mensaje:</label>
                    <textarea
                        id="mensaje"
                        name="mensaje"
                        maxlength="10000"
                        rows="8"
                        required
                    ><?= $escapar($mensaje) ?></textarea>

                    <button type="submit">Enviar mensaje</button>
                </form>
            <?php endif; ?>
        <?php endif; ?>
    </main>
</body>
</html>