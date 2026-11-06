<?php
declare(strict_types=1);

include __DIR__ . '/varGlobales.php';

/**
 * Redirige al destino indicado y detiene la ejecución.
 */
function redirect(string $url): void
{
    header('Location: ' . $url);
    die();
}

$errores = [];
$nombre = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombreEntrada = $_POST['nombre'] ?? null;
    $passwordEntrada = $_POST['password'] ?? null;

    // Comprueba los tipos y limpia los valores antes de usarlos.
    if (!is_string($nombreEntrada)) {
        $errores[] = 'Escribe un nombre de usuario válido.';
        $nombre = '';
    } else {
        $nombre = trim($nombreEntrada);
        if ($nombre === '') {
            $errores[] = 'El nombre de usuario es obligatorio.';
        }
    }

    if (!is_string($passwordEntrada)) {
        $errores[] = 'Escribe una contraseña válida.';
        $password = '';
    } else {
        $password = trim($passwordEntrada);
        if ($password === '') {
            $errores[] = 'La contraseña es obligatoria.';
        }
    }

    if ($errores === []) {
        $usuarios = $_SESSION['mimatriz'] ?? [];
        $usuarioEncontrado = null;

        if (is_array($usuarios)) {
            foreach ($usuarios as $usuario) {
                if (
                    is_array($usuario)
                    && isset($usuario['Usuario'])
                    && is_string($usuario['Usuario'])
                    && $usuario['Usuario'] === $nombre
                ) {
                    $passwordHash = $usuario['password_hash'] ?? null;
                    $passwordCorrecta = is_string($passwordHash)
                        ? password_verify($password, $passwordHash)
                        : (
                            isset($usuario['Contraseña'])
                            && is_string($usuario['Contraseña'])
                            && hash_equals($usuario['Contraseña'], $password)
                        );

                    if ($passwordCorrecta) {
                        $usuarioEncontrado = $usuario;
                        break;
                    }
                }
            }
        }

        if ($usuarioEncontrado === null) {
            $usuariosSeguros = $_SESSION['usuarios'] ?? [];
            if (is_array($usuariosSeguros)) {
                foreach ($usuariosSeguros as $claveUsuario => $usuarioSeguro) {
                    if (!is_array($usuarioSeguro)) {
                        continue;
                    }

                    $nombreGuardado = $usuarioSeguro['usuario'] ?? $claveUsuario;
                    $passwordHash = $usuarioSeguro['password_hash'] ?? null;
                    if (
                        is_string($nombreGuardado)
                        && $nombreGuardado === $nombre
                        && is_string($passwordHash)
                        && password_verify($password, $passwordHash)
                    ) {
                        $usuarioEncontrado = [
                            'Usuario' => $nombreGuardado,
                            'Email' => $usuarioSeguro['email'] ?? '',
                            'Perfil' => $usuarioSeguro['perfil'] ?? 'user',
                        ];
                        break;
                    }
                }
            }
        }

        if ($usuarioEncontrado !== null) {
            currentUser($usuarioEncontrado);
            $_SESSION['mensaje_flash'] = 'Has iniciado sesión correctamente.';
            redirect('../index.html');
        }

        $errores[] = 'El nombre de usuario o la contraseña son incorrectos.';
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
    <title>Iniciar sesión - GranaWeen</title>
    <link rel="stylesheet" href="../css/styles.css">
</head>
<body class="page">
    <main>
        <section>
            <div class="titulo">
                <h1>Iniciar sesión</h1>
            </div>

            <?php if ($errores !== []): ?>
                <ul role="alert">
                    <?php foreach ($errores as $error): ?>
                        <li><?= $escapar($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>

            <form action="./login.php" method="post">
                <label for="nombre">Nombre de usuario:</label>
                <input
                    type="text"
                    name="nombre"
                    id="nombre"
                    value="<?= $escapar($nombre) ?>"
                    required
                >

                <label for="password">Contraseña:</label>
                <input type="password" name="password" id="password" required>

                <button type="submit" class="btn">Iniciar sesión</button>
            </form>

            <nav aria-label="Opciones de cuenta">
                <p><a href="./altaUsuario.php">Registrar usuario</a></p>
                <p><a href="./cambioPass.php">Cambiar contraseña</a></p>
            </nav>

            <p><a href="../index.html">Volver al inicio</a></p>
        </section>
    </main>
</body>
</html>
