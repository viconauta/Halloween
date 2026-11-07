<?php
/**
 * correo.php
 * Formulario y procesamiento de envío de mensajes a Jack Skellington.
 */
include __DIR__ . '/varGlobales.php';

$error = '';
$envioCorrecto = false;

// Obtener correo del usuario si ha iniciado sesión
$correoRemitente = currentUserEmail() ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $asunto          = trim($_POST['asunto'] ?? '');
    $correoRemitente = trim($_POST['email'] ?? $correoRemitente);
    $mensaje         = trim($_POST['mensaje'] ?? '');

    if (empty($asunto) || empty($correoRemitente) || empty($mensaje)) {
        $error = 'Por favor, rellena todos los campos del formulario.';
    } elseif (!filter_var($correoRemitente, FILTER_VALIDATE_EMAIL)) {
        $error = 'El correo electrónico introducido no es válido.';
    } else {
        $destinoJack = 'jack.skellington@dawlloween.com';
        $cabeceras = "From: " . $correoRemitente . "\r\n" .
                     "Reply-To: " . $correoRemitente . "\r\n" .
                     "X-Mailer: PHP/" . phpversion();

        // En entornos locales de XAMPP sendmail puede no estar configurado.
        // Usamos @mail para suprimir warnings y aseguramos que la experiencia no se bloquee.
        @mail($destinoJack, $asunto, $mensaje, $cabeceras);
        $envioCorrecto = true;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Escribir a Jack | GranaWeen</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body class="page">
    <main>
        <section>
            <div class="titulo">
                <h1>Escribir a Jack Skellington</h1>
            </div>

            <?php if ($envioCorrecto): ?>
                <p style="color: #b8f23a; font-weight: bold; font-size: 1.1rem;" role="status">
                    ¡Tu mensaje de pesadillas se ha enviado correctamente a Jack! 🎃
                </p>
                <p><a href="correo.php" class="btn">Enviar otro mensaje</a> | <a href="../index.html">Volver al inicio</a></p>
            <?php else: ?>
                <?php if (!empty($error)): ?>
                    <p style="color: #ff9a9a; font-weight: bold;" role="alert"><?= htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
                <?php endif; ?>

                <form action="correo.php" method="post">
                    <label for="asunto">Asunto:</label>
                    <input type="text" id="asunto" name="asunto" placeholder="Asunto de tu mensaje" required>

                    <label for="email">Tu correo electrónico:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value="<?= htmlspecialchars($correoRemitente, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                        placeholder="tuemail@ejemplo.com"
                        required
                    >

                    <label for="mensaje">Tus peores pesadillas:</label>
                    <textarea id="mensaje" name="mensaje" rows="6" placeholder="Cuéntale a Jack lo que no te deja dormir..." required></textarea>

                    <button type="submit" class="btn">Enviar mensaje</button>
                </form>

                <p><a href="../index.html">← Volver al inicio</a></p>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>
