<?php
declare(strict_types=1);

include __DIR__ . '/VarGlobales.php';

header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$correoCuenta = currentUserEmail() ?? '';
$correoRemitente = $correoCuenta;
$asunto = '';
$mensaje = '';
$error = '';
$envioCorrecto = isset($_GET['estado']) && $_GET['estado'] === 'ok';
$tokenCsrf = $_SESSION['csrf_correo'] ?? '';

// Las direcciones del destinatario y del servidor se configuran fuera del código.
$destinoJack = getenv('JACK_EMAIL');
$correoAplicacion = getenv('MAIL_FROM_ADDRESS');
$configuracionCorreoValida = is_string($destinoJack)
    && filter_var($destinoJack, FILTER_VALIDATE_EMAIL) !== false
    && is_string($correoAplicacion)
    && filter_var($correoAplicacion, FILTER_VALIDATE_EMAIL) !== false;

if ($metodo === 'POST') {
    $tokenEntrada = $_POST['csrf_token'] ?? null;
    $asuntoEntrada = $_POST['asunto'] ?? null;
    $correoEntrada = $_POST['email'] ?? null;
    $mensajeEntrada = $_POST['mensaje'] ?? null;

    if (
        !is_string($tokenEntrada)
        || !is_string($asuntoEntrada)
        || !is_string($correoEntrada)
        || !is_string($mensajeEntrada)
    ) {
        http_response_code(400);
        $error = 'Completa el asunto, el correo electrónico y el mensaje.';
    } else {
        $asunto = trim($asuntoEntrada);
        $correoRemitente = trim($correoEntrada);
        $mensaje = trim($mensajeEntrada);

        if (!is_string($tokenCsrf) || !hash_equals($tokenCsrf, $tokenEntrada)) {
            http_response_code(403);
            $error = 'La solicitud ha caducado o no es válida. Recarga la página e inténtalo de nuevo.';
        } elseif (
            $asunto === ''
            || strlen($asunto) > 200
            || preg_match('//u', $asunto) !== 1
            || preg_match('/[\r\n\x00]/', $asunto) === 1
            || $correoRemitente === ''
            || strlen($correoRemitente) > 254
            || filter_var($correoRemitente, FILTER_VALIDATE_EMAIL) === false
            || $mensaje === ''
            || strlen($mensaje) > 10000
            || preg_match('//u', $mensaje) !== 1
            || str_contains($mensaje, "\0")
        ) {
            http_response_code(400);
            $error = 'Revisa que el asunto, el correo y el mensaje sean válidos y no estén vacíos.';
        } elseif (!$configuracionCorreoValida) {
            http_response_code(503);
            error_log('Correo no disponible: configura JACK_EMAIL y MAIL_FROM_ADDRESS con direcciones válidas.');
            $error = 'El servicio de correo no está configurado. Inténtalo más tarde.';
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
            $cuerpo = "Mensaje enviado desde el formulario de GranaWeen.\n"
                . "Correo de contacto: {$correoRemitente}\n\n"
                . $mensaje;

            if (mail($destinoJack, $asuntoCodificado, $cuerpo, $cabeceras)) {
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
        <h1>Escribir a Jack Skellington</h1>

        <?php if ($envioCorrecto && $error === ''): ?>
            <p role="status">Tu mensaje se ha enviado correctamente.</p>
        <?php else: ?>
            <?php if ($error !== ''): ?>
                <p role="alert"><?= $escapar($error) ?></p>
            <?php endif; ?>

            <form action="correo.php" method="post" accept-charset="UTF-8">
                <input
                    type="hidden"
                    name="csrf_token"
                    value="<?= $escapar(is_string($tokenCsrf) ? $tokenCsrf : '') ?>"
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

                <label for="email">Nuestro email:</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    maxlength="254"
                    autocomplete="email"
                    value="<?= $escapar($correoRemitente) ?>"
                    required
                >

                <label for="mensaje">Mensaje con tus peores pesadillas:</label>
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
    </main>
</body>
</html>
