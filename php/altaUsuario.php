<?php
/**
 * altaUsuario.php
 * Procesa el registro de nuevos usuarios en la plataforma.
 */
include __DIR__ . '/varGlobales.php';

$mensaje = '';
$error = '';
$nombre = '';
$email = '';
$pregunta = '';
$respuesta = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre    = trim($_POST['nombre'] ?? $_POST['usuario'] ?? '');
    $password  = trim($_POST['password'] ?? '');
    $email     = trim($_POST['email'] ?? '');
    $pregunta  = trim($_POST['pregunta'] ?? '');
    $respuesta = trim($_POST['respuesta'] ?? '');

    if (empty($nombre) || empty($password) || empty($email)) {
        $error = 'Por favor, rellena todos los campos obligatorios.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Introduce una dirección de correo electrónico válida.';
    } else {
        $nuevoUser = [
            'Usuario'    => $nombre,
            'Contraseña' => $password,
            'Email'      => $email,
            'Pregunta'   => $pregunta,
            'Respuesta'  => $respuesta,
            'Perfil'     => 'user',
        ];

        if (AltaUsuario($nuevoUser)) {
            $mensaje = '¡Usuario registrado correctamente! Ya puedes iniciar sesión.';
            $_SESSION['mensaje_flash'] = $mensaje;
            $nombre = $email = $pregunta = $respuesta = '';
        } else {
            $error = 'Ya existe una cuenta registrada con ese nombre de usuario.';
        }
    }
}
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

            <?php if (!empty($mensaje)): ?>
                <p style="color: #b8f23a; font-weight: bold;" role="status"><?= htmlspecialchars($mensaje, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
                <p><a href="./login.php">Ir a iniciar sesión</a></p>
            <?php endif; ?>

            <?php if (!empty($error)): ?>
                <p style="color: #ff9a9a; font-weight: bold;" role="alert"><?= htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
            <?php endif; ?>

            <form action="altaUsuario.php" method="post">
                <label for="nombre">Usuario:</label>
                <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    value="<?= htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                    required
                >

                <label for="password">Contraseña:</label>
                <input type="password" name="password" id="password" required>

                <label for="email">Correo electrónico:</label>
                <input
                    type="email"
                    name="email"
                    id="email"
                    value="<?= htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                    required
                >

                <label for="pregunta">Pregunta de seguridad:</label>
                <input
                    type="text"
                    name="pregunta"
                    id="pregunta"
                    value="<?= htmlspecialchars($pregunta, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                    placeholder="Ej: ¿Nombre de tu primera mascota?"
                >

                <label for="respuesta">Respuesta de seguridad:</label>
                <input
                    type="text"
                    name="respuesta"
                    id="respuesta"
                    value="<?= htmlspecialchars($respuesta, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                    placeholder="Tu respuesta secreta"
                >

                <button type="submit" class="btn">Registrarse</button>
            </form>

            <nav aria-label="Opciones de cuenta">
                <p><a href="./login.php">¿Ya tienes cuenta? Inicia sesión</a></p>
            </nav>

            <p><a href="../index.html">← Volver al inicio</a></p>
        </section>
    </main>
</body>
</html>
