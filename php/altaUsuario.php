<?php
declare(strict_types=1);

session_start();
include __DIR__ . '/VarGlobales.php';

$errores = [];
$mensaje = '';
$nombre = '';
$email = '';
$pregunta = '';
$respuesta = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombreEntrada = $_POST['nombre'] ?? $_POST['usuario'] ?? null;
    $passwordEntrada = $_POST['password'] ?? null;
    $emailEntrada = $_POST['email'] ?? null;
    $preguntaEntrada = $_POST['pregunta'] ?? '';
    $respuestaEntrada = $_POST['respuesta'] ?? '';

    // Comprueba los tipos antes de aplicar trim a los valores recibidos.
    if (!is_string($nombreEntrada)) {
        $errores[] = 'El usuario debe ser un texto válido.';
    } else {
        $nombre = trim($nombreEntrada);
        if ($nombre === '') {
            $errores[] = 'El usuario es obligatorio.';
        }
    }

    if (!is_string($passwordEntrada)) {
        $errores[] = 'La contraseña debe ser un texto válido.';
        $password = '';
    } else {
        $password = trim($passwordEntrada);
        if ($password === '') {
            $errores[] = 'La contraseña es obligatoria.';
        }
    }

    if (!is_string($emailEntrada)) {
        $errores[] = 'El email debe ser un texto válido.';
    } else {
        $email = trim($emailEntrada);
        if ($email === '') {
            $errores[] = 'El email es obligatorio.';
        } elseif (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $errores[] = 'Introduce una dirección de email válida.';
        }
    }

    // Estos campos se conservan porque el formulario actual los solicita.
    if (!is_string($preguntaEntrada) || !is_string($respuestaEntrada)) {
        $errores[] = 'La pregunta y la respuesta de seguridad deben ser textos válidos.';
    } else {
        $pregunta = trim($preguntaEntrada);
        $respuesta = trim($respuestaEntrada);
        if (($pregunta === '') !== ($respuesta === '')) {
            $errores[] = 'Completa tanto la pregunta como la respuesta de seguridad.';
        }
    }

    if ($errores === []) {
        $nuevoUser = [
            'Usuario' => $nombre,
            'Contraseña' => $password,
            'Email' => $email,
            'Perfil' => 'user',
        ];

        if ($pregunta !== '' || $respuesta !== '') {
            $nuevoUser['Pregunta'] = $pregunta;
            $nuevoUser['Respuesta'] = $respuesta;
        }

        AltaUsuario($nuevoUser);
        $mensaje = 'El usuario se ha registrado correctamente.';
        $_SESSION['mensaje_flash'] = $mensaje;
        $nombre = '';
        $email = '';
        $pregunta = '';
        $respuesta = '';
    }
} elseif ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Allow: GET, POST');
    $errores[] = 'Este formulario solo admite peticiones GET y POST.';
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
    <title>Alta de usuario - GranaWeen</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body class="page">
    <main>
        <section>
            <div class="titulo">
                <h1>Crear cuenta</h1>
            </div>

            <?php if ($mensaje !== ''): ?>
                <p role="status"><?= $escapar($mensaje) ?></p>
            <?php endif; ?>

            <?php if ($errores !== []): ?>
                <ul role="alert">
                    <?php foreach ($errores as $error): ?>
                        <li><?= $escapar($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>

            <form action="./altaUsuario.php" method="post">
                <label for="nombre">Usuario:</label>
                <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    value="<?= $escapar($nombre) ?>"
                    required
                >

                <label for="password">Contraseña:</label>
                <input type="password" name="password" id="password" required>

                <label for="email">Email:</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    value="<?= $escapar($email) ?>"
                    required
                >

                <label for="pregunta">Pregunta de seguridad:</label>
                <input
                    type="text"
                    name="pregunta"
                    id="pregunta"
                    value="<?= $escapar($pregunta) ?>"
                >

                <label for="respuesta">Respuesta de seguridad:</label>
                <input
                    type="text"
                    name="respuesta"
                    id="respuesta"
                    value="<?= $escapar($respuesta) ?>"
                >

                <button type="submit" class="btn">Registrarse</button>
            </form>

            <p><a href="../index.html">Volver al inicio</a></p>
        </section>
    </main>
</body>
</html>