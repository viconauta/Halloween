<?php
declare(strict_types=1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

if (!isset($_SESSION['usuarios'])) {
    $_SESSION['usuarios'] = [];
}

if (!is_array($_SESSION['usuarios'])) {
    throw new UnexpectedValueException('La matriz de usuarios de la sesión no es válida.');
}

if (!isset($_SESSION['csrf_cambio_pass']) || !is_string($_SESSION['csrf_cambio_pass'])) {
    $_SESSION['csrf_cambio_pass'] = bin2hex(random_bytes(32));
}

if (!isset($_SESSION['csrf_correo']) || !is_string($_SESSION['csrf_correo'])) {
    $_SESSION['csrf_correo'] = bin2hex(random_bytes(32));
}

/**
 * Devuelve los datos de la cuenta autenticada o null si no hay una sesión válida.
 *
 * Cada usuario debe estar indexado por su identificador en $_SESSION['usuarios']
 * e incluir, como mínimo, una dirección en la clave "email".
 *
 * @return array<string, mixed>|null
 */
function currentUser(): ?array
{
    $nombreUsuario = $_SESSION['usuario'] ?? null;
    $usuarios = $_SESSION['usuarios'] ?? null;

    if (
        !is_string($nombreUsuario)
        || $nombreUsuario === ''
        || !is_array($usuarios)
        || !isset($usuarios[$nombreUsuario])
        || !is_array($usuarios[$nombreUsuario])
    ) {
        return null;
    }

    return $usuarios[$nombreUsuario];
}

/**
 * Devuelve el correo de la cuenta autenticada si es válido.
 */
function currentUserEmail(): ?string
{
    $usuario = currentUser();
    $email = $usuario['email'] ?? null;

    if (
        !is_string($email)
        || filter_var($email, FILTER_VALIDATE_EMAIL) === false
    ) {
        return null;
    }

    return $email;
}

/**
 * Cambia la contraseña tras verificar la respuesta de seguridad del usuario.
 *
 * Cada entrada de $_SESSION['usuarios'] debe estar indexada por nombre de usuario
 * y contener las claves "password_hash" y "respuesta_hash", ambas creadas con
 * password_hash(). Si no se indica usuario, se usa $_SESSION['usuario'].
 */
function cambioContraseña(string $respuesta, string $nuevaContraseña, ?string $usuario = null): bool
{
    $usuario = $usuario ?? ($_SESSION['usuario'] ?? null);
    $respuesta = trim($respuesta);
    if (is_string($usuario)) {
        $usuario = trim($usuario);
    }

    $maxBytesContraseña = defined('PASSWORD_ARGON2ID') ? 1024 : 72;
    $numeroCaracteresContraseña = preg_match('//u', $nuevaContraseña) === 1
        ? preg_match_all('/./us', $nuevaContraseña)
        : false;

    if (
        !is_string($usuario)
        || $usuario === ''
        || $respuesta === ''
        || $nuevaContraseña === ''
        || strlen($usuario) > 100
        || strlen($respuesta) > 512
        || strlen($nuevaContraseña) > $maxBytesContraseña
        || $numeroCaracteresContraseña === false
        || $numeroCaracteresContraseña < 12
        || preg_match('//u', $usuario) !== 1
        || preg_match('//u', $respuesta) !== 1
        || preg_match('//u', $nuevaContraseña) !== 1
        || str_contains($usuario, "\0")
        || str_contains($respuesta, "\0")
        || str_contains($nuevaContraseña, "\0")
    ) {
        return false;
    }

    $usuarios = $_SESSION['usuarios'] ?? null;
    if (!is_array($usuarios) || !isset($usuarios[$usuario]) || !is_array($usuarios[$usuario])) {
        return false;
    }

    $datosUsuario = $usuarios[$usuario];
    if (
        !isset($datosUsuario['password_hash'])
        || !is_string($datosUsuario['password_hash'])
        || $datosUsuario['password_hash'] === ''
        || !isset($datosUsuario['respuesta_hash'])
        || !is_string($datosUsuario['respuesta_hash'])
        || $datosUsuario['respuesta_hash'] === ''
        || !password_verify($respuesta, $datosUsuario['respuesta_hash'])
    ) {
        return false;
    }

    $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $hashContraseña = password_hash($nuevaContraseña, $algoritmo);
    if ($hashContraseña === false) {
        throw new RuntimeException('No se pudo generar el hash de la contraseña.');
    }

    $datosUsuario['password_hash'] = $hashContraseña;
    $_SESSION['usuarios'][$usuario] = $datosUsuario;

    return true;
}