<?php
/**
 * login.php
 * Procesa el inicio de sesión de usuarios y muestra el formulario correspondiente.
 */
include __DIR__ . '/varGlobales.php';

$error = '';
$nombre = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre   = trim($_POST['nombre'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (empty($nombre) || empty($password)) {
        $error = 'Por favor, introduce tu usuario y contraseña.';
    } else {
        $usuarioEncontrado = null;

        foreach ($_SESSION['mimatriz'] as $usuario) {
            if (isset($usuario['Usuario']) && strcasecmp($usuario['Usuario'], $nombre) === 0) {
                $hash = $usuario['password_hash'] ?? '';
                $plano = $usuario['Contraseña'] ?? '';

                $esCorrecta = (!empty($hash) && password_verify($password, $hash))
                    || (!empty($plano) && $plano === $password);

                if ($esCorrecta) {
                    $usuarioEncontrado = $usuario;
                    break;
                }
            }
        }

        if ($usuarioEncontrado !== null) {
            currentUser($usuarioEncontrado);
            $_SESSION['mensaje_flash'] = 'Has iniciado sesión correctamente.';
            header('Location: ../index.html');
            exit;
        }

        $error = 'El nombre de usuario o la contraseña son incorrectos.';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar sesión - GranaWeen</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body class="page">
    <main>
        <section>
            <div class="titulo">
                <h1>Iniciar sesión</h1>
            </div>

            <?php if (!empty($error)): ?>
                <p style="color: #ff9a9a; font-weight: bold;" role="alert"><?= htmlspecialchars($error, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
            <?php endif; ?>

            <form action="login.php" method="post">
                <label for="nombre">Nombre de usuario:</label>
                <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    value="<?= htmlspecialchars($nombre, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"
                    required
                >

                <label for="password">Contraseña:</label>
                <input type="password" name="password" id="password" required>

                <button type="submit" class="btn">Iniciar sesión</button>
            </form>

            <nav aria-label="Opciones de cuenta">
                <p><a href="./altaUsuario.php">Registrar nuevo usuario</a></p>
                <p><a href="./cambioPass.php">Cambiar o recuperar contraseña</a></p>
            </nav>

            <p><a href="../index.html">← Volver al inicio</a></p>
        </section>
    </main>
</body>
</html>
