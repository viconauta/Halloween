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

if (!isset($_SESSION['mimatriz'])) {
    $_SESSION['mimatriz'] = [];
}

if (!is_array($_SESSION['mimatriz'])) {
    throw new UnexpectedValueException('La matriz de usuarios de la sesión no es válida.');
}

if (!isset($_SESSION['usuarios'])) {
    $_SESSION['usuarios'] = [];
}

if (!is_array($_SESSION['usuarios'])) {
    throw new UnexpectedValueException('La matriz de usuarios de la sesión no es válida.');
}

foreach (['csrf_cambio_pass', 'csrf_correo', 'csrf_estado_sesion'] as $nombreToken) {
    if (!isset($_SESSION[$nombreToken]) || !is_string($_SESSION[$nombreToken])) {
        $_SESSION[$nombreToken] = bin2hex(random_bytes(32));
    }
}

/**
 * Guarda o devuelve el usuario autenticado.
 *
 * @param array<string, mixed>|null $usuario
 * @return array<string, mixed>|null
 */
function currentUser(?array $usuario = null): ?array
{
    if ($usuario !== null) {
        session_regenerate_id(true);
        $nombre = $usuario['Usuario'] ?? $usuario['usuario'] ?? null;

        unset(
            $usuario['Contraseña'],
            $usuario['password'],
            $usuario['password_hash'],
            $usuario['Respuesta'],
            $usuario['respuesta_hash']
        );
        $_SESSION['currentUser'] = $usuario;

        if (is_string($nombre) && $nombre !== '') {
            $_SESSION['usuario'] = $nombre;
        }

        return $usuario;
    }

    $usuarioActual = $_SESSION['currentUser'] ?? null;
    if (is_array($usuarioActual)) {
        unset(
            $usuarioActual['Contraseña'],
            $usuarioActual['password'],
            $usuarioActual['password_hash'],
            $usuarioActual['Respuesta'],
            $usuarioActual['respuesta_hash']
        );
        return $usuarioActual;
    }

    $nombre = $_SESSION['usuario'] ?? null;
    $usuarios = $_SESSION['usuarios'] ?? null;
    if (
        is_string($nombre)
        && is_array($usuarios)
        && isset($usuarios[$nombre])
        && is_array($usuarios[$nombre])
    ) {
        $usuarioActual = $usuarios[$nombre];
        unset(
            $usuarioActual['Contraseña'],
            $usuarioActual['password'],
            $usuarioActual['password_hash'],
            $usuarioActual['Respuesta'],
            $usuarioActual['respuesta_hash']
        );
        return $usuarioActual;
    }

    if (is_string($nombre)) {
        foreach ($_SESSION['mimatriz'] as $registro) {
            if (
                is_array($registro)
                && isset($registro['Usuario'])
                && is_string($registro['Usuario'])
                && strcasecmp($registro['Usuario'], $nombre) === 0
            ) {
                unset(
                    $registro['Contraseña'],
                    $registro['password_hash'],
                    $registro['Respuesta'],
                    $registro['respuesta_hash']
                );
                return $registro;
            }
        }
    }

    return null;
}

/**
 * Devuelve el correo de la cuenta autenticada.
 */
function currentUserEmail(): ?string
{
    $usuario = currentUser();
    $email = $usuario['email'] ?? $usuario['Email'] ?? null;

    if (!is_string($email) || filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
        return null;
    }

    return $email;
}

/**
 * Devuelve los datos visibles del usuario autenticado, sin credenciales.
 *
 * @return array<string, string>|null
 */
function datosPerfilActual(): ?array
{
    $usuarioActual = currentUser();
    if ($usuarioActual === null) {
        return null;
    }

    $nombre = $usuarioActual['Usuario'] ?? $usuarioActual['usuario'] ?? '';
    $fecha = $usuarioActual['FechaNacimiento'] ?? $usuarioActual['fecha'] ?? '';
    $email = $usuarioActual['Email'] ?? $usuarioActual['email'] ?? '';
    $pregunta = $usuarioActual['Pregunta'] ?? $usuarioActual['pregunta'] ?? '';

    return [
        'nombre' => is_string($nombre) ? $nombre : '',
        'fecha' => is_string($fecha) ? $fecha : '',
        'email' => is_string($email) ? $email : '',
        'seguridad' => is_string($pregunta) ? $pregunta : '',
    ];
}

/**
 * Actualiza el perfil del usuario autenticado en las estructuras de sesión.
 *
 * @param array<string, string> $datos
 */
function actualizarPerfilActual(array $datos): bool
{
    $usuarioActual = currentUser();
    $nombreActual = $usuarioActual['Usuario'] ?? $usuarioActual['usuario'] ?? null;

    if (!is_string($nombreActual) || $nombreActual === '') {
        return false;
    }

    $nombreNuevo = $datos['nombre'] ?? '';
    $fecha = $datos['fecha'] ?? '';
    $email = $datos['email'] ?? '';
    $pregunta = $datos['seguridad'] ?? '';

    if (
        trim($nombreNuevo) === ''
        || strlen($nombreNuevo) > 100
        || preg_match('//u', $nombreNuevo) !== 1
        || str_contains($nombreNuevo, "\0")
        || ($email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL) === false)
        || ($fecha !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha))
        || strlen($pregunta) > 200
    ) {
        return false;
    }

    foreach ($_SESSION['mimatriz'] as $registro) {
        if (
            is_array($registro)
            && isset($registro['Usuario'])
            && is_string($registro['Usuario'])
            && strcasecmp($registro['Usuario'], $nombreNuevo) === 0
            && strcasecmp($nombreActual, $nombreNuevo) !== 0
        ) {
            return false;
        }
    }

    foreach ($_SESSION['usuarios'] as $claveUsuario => $registroUsuario) {
        $nombreRegistrado = is_array($registroUsuario)
            ? ($registroUsuario['usuario'] ?? $claveUsuario)
            : null;
        if (
            is_string($nombreRegistrado)
            && strcasecmp($nombreRegistrado, $nombreNuevo) === 0
            && strcasecmp($nombreActual, $nombreNuevo) !== 0
        ) {
            return false;
        }
    }

    $registroEncontrado = false;
    foreach ($_SESSION['mimatriz'] as $indice => $registro) {
        if (
            !is_array($registro)
            || !isset($registro['Usuario'])
            || !is_string($registro['Usuario'])
            || strcasecmp($registro['Usuario'], $nombreActual) !== 0
        ) {
            continue;
        }

        $_SESSION['mimatriz'][$indice]['Usuario'] = $nombreNuevo;
        $_SESSION['mimatriz'][$indice]['FechaNacimiento'] = $fecha;
        $_SESSION['mimatriz'][$indice]['Email'] = $email;
        $_SESSION['mimatriz'][$indice]['Pregunta'] = $pregunta;
        $registroEncontrado = true;
        break;
    }

    $nombreClaveUsuarios = null;
    foreach ($_SESSION['usuarios'] as $clave => $usuario) {
        $nombreGuardado = is_array($usuario) ? ($usuario['usuario'] ?? $clave) : null;
        if (is_string($nombreGuardado) && strcasecmp($nombreGuardado, $nombreActual) === 0) {
            $nombreClaveUsuarios = $clave;
            break;
        }
    }

    if ($nombreClaveUsuarios !== null) {
        $usuarioSeguro = $_SESSION['usuarios'][$nombreClaveUsuarios];
        $usuarioSeguro['usuario'] = $nombreNuevo;
        $usuarioSeguro['fecha'] = $fecha;
        $usuarioSeguro['email'] = $email;
        $usuarioSeguro['pregunta'] = $pregunta;
        unset($_SESSION['usuarios'][$nombreClaveUsuarios]);
        $_SESSION['usuarios'][$nombreNuevo] = $usuarioSeguro;
        $registroEncontrado = true;
    }

    if (!$registroEncontrado) {
        return false;
    }

    $usuarioActual['Usuario'] = $nombreNuevo;
    $usuarioActual['FechaNacimiento'] = $fecha;
    $usuarioActual['Email'] = $email;
    $usuarioActual['Pregunta'] = $pregunta;
    unset($usuarioActual['usuario'], $usuarioActual['email'], $usuarioActual['fecha'], $usuarioActual['pregunta']);
    $_SESSION['currentUser'] = $usuarioActual;
    $_SESSION['usuario'] = $nombreNuevo;

    return true;
}

/**
 * Comprueba la respuesta de seguridad para una cuenta en cualquiera de los esquemas.
 */
function verificarRespuestaSeguridad(string $nombre, string $respuesta): bool
{
    $nombre = trim($nombre);
    $respuesta = trim($respuesta);
    if ($nombre === '' || $respuesta === '') {
        return false;
    }

    foreach ($_SESSION['mimatriz'] as $registro) {
        if (
            !is_array($registro)
            || !isset($registro['Usuario'])
            || !is_string($registro['Usuario'])
            || strcasecmp($registro['Usuario'], $nombre) !== 0
        ) {
            continue;
        }

        $hash = $registro['respuesta_hash'] ?? null;
        $texto = $registro['Respuesta'] ?? null;
        return (is_string($hash) && password_verify($respuesta, $hash))
            || (!is_string($hash) && is_string($texto) && hash_equals($texto, $respuesta));
    }

    foreach ($_SESSION['usuarios'] as $clave => $usuario) {
        $nombreGuardado = is_array($usuario) ? ($usuario['usuario'] ?? $clave) : null;
        if (
            is_array($usuario)
            && is_string($nombreGuardado)
            && strcasecmp($nombreGuardado, $nombre) === 0
            && isset($usuario['respuesta_hash'])
            && is_string($usuario['respuesta_hash'])
        ) {
            return password_verify($respuesta, $usuario['respuesta_hash']);
        }
    }

    return false;
}

/**
 * Devuelve la pregunta de seguridad asociada a un usuario, si está configurada.
 */
function preguntaSeguridadUsuario(string $nombre): ?string
{
    $nombre = trim($nombre);
    if ($nombre === '') {
        return null;
    }

    foreach ($_SESSION['mimatriz'] as $registro) {
        if (
            is_array($registro)
            && isset($registro['Usuario'], $registro['Pregunta'])
            && is_string($registro['Usuario'])
            && is_string($registro['Pregunta'])
            && strcasecmp($registro['Usuario'], $nombre) === 0
        ) {
            return $registro['Pregunta'];
        }
    }

    foreach ($_SESSION['usuarios'] as $clave => $usuario) {
        $nombreGuardado = is_array($usuario) ? ($usuario['usuario'] ?? $clave) : null;
        if (
            is_array($usuario)
            && is_string($nombreGuardado)
            && strcasecmp($nombreGuardado, $nombre) === 0
            && isset($usuario['pregunta'])
            && is_string($usuario['pregunta'])
        ) {
            return $usuario['pregunta'];
        }
    }

    return null;
}

/**
 * Cambia la contraseña después de que la respuesta de seguridad haya sido verificada.
 */
function actualizarContraseñaVerificada(string $nombre, string $nuevaContraseña): bool
{
    $maxBytesContraseña = defined('PASSWORD_ARGON2ID') ? 1024 : 72;
    $numeroCaracteres = preg_match('//u', $nuevaContraseña) === 1
        ? preg_match_all('/./us', $nuevaContraseña)
        : false;

    if (
        $nuevaContraseña === ''
        || strlen($nuevaContraseña) > $maxBytesContraseña
        || $numeroCaracteres === false
        || $numeroCaracteres < 12
        || str_contains($nuevaContraseña, "\0")
    ) {
        return false;
    }

    $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $hash = password_hash($nuevaContraseña, $algoritmo);
    if ($hash === false) {
        throw new RuntimeException('No se pudo proteger la contraseña actualizada.');
    }

    $actualizado = false;
    foreach ($_SESSION['mimatriz'] as $indice => $registro) {
        if (
            is_array($registro)
            && isset($registro['Usuario'])
            && is_string($registro['Usuario'])
            && strcasecmp($registro['Usuario'], $nombre) === 0
        ) {
            $_SESSION['mimatriz'][$indice]['Contraseña'] = $nuevaContraseña;
            $_SESSION['mimatriz'][$indice]['password_hash'] = $hash;
            $actualizado = true;
        }
    }

    foreach ($_SESSION['usuarios'] as $clave => $usuario) {
        $nombreGuardado = is_array($usuario) ? ($usuario['usuario'] ?? $clave) : null;
        if (is_array($usuario) && is_string($nombreGuardado) && strcasecmp($nombreGuardado, $nombre) === 0) {
            $_SESSION['usuarios'][$clave]['password_hash'] = $hash;
            $actualizado = true;
        }
    }

    return $actualizado;
}

/**
 * Añade un usuario si su nombre todavía no está registrado.
 *
 * @param array<string, string> $nuevoUser
 */
function AltaUsuario(array $nuevoUser): bool
{
    $usuarios = $_SESSION['mimatriz'] ?? [];
    $nombre = $nuevoUser['Usuario'] ?? null;
    $contraseña = $nuevoUser['Contraseña'] ?? null;
    $email = $nuevoUser['Email'] ?? null;
    $respuesta = $nuevoUser['Respuesta'] ?? null;

    if (
        !is_array($usuarios)
        || !is_string($nombre)
        || trim($nombre) === ''
        || !is_string($contraseña)
        || $contraseña === ''
        || !is_string($email)
        || filter_var($email, FILTER_VALIDATE_EMAIL) === false
    ) {
        return false;
    }

    foreach ($usuarios as $usuario) {
        if (
            is_array($usuario)
            && isset($usuario['Usuario'])
            && is_string($usuario['Usuario'])
            && strcasecmp($usuario['Usuario'], $nombre) === 0
        ) {
            return false;
        }
    }

    foreach ($_SESSION['usuarios'] as $nombreExistente => $usuarioExistente) {
        if (!is_string($nombreExistente) && is_array($usuarioExistente)) {
            $nombreExistente = $usuarioExistente['usuario'] ?? null;
        }
        if (is_string($nombreExistente) && strcasecmp($nombreExistente, $nombre) === 0) {
            return false;
        }
    }

    $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $passwordHash = password_hash($contraseña, $algoritmo);
    if ($passwordHash === false) {
        throw new RuntimeException('No se pudo proteger la contraseña del usuario.');
    }

    $registro = $nuevoUser;
    $registro['password_hash'] = $passwordHash;
    $usuarioSeguro = [
        'usuario' => $nombre,
        'email' => $email,
        'password_hash' => $passwordHash,
        'pregunta' => is_string($respuesta) ? ($nuevoUser['Pregunta'] ?? '') : '',
    ];

    if (is_string($respuesta) && trim($respuesta) !== '') {
        $respuestaHash = password_hash(trim($respuesta), $algoritmo);
        if ($respuestaHash === false) {
            throw new RuntimeException('No se pudo proteger la respuesta de seguridad.');
        }

        $registro['respuesta_hash'] = $respuestaHash;
        $usuarioSeguro['respuesta_hash'] = $respuestaHash;
    }

    $usuarios[] = $registro;
    $_SESSION['mimatriz'] = $usuarios;
    $_SESSION['usuarios'][$nombre] = $usuarioSeguro;

    return true;
}

/**
 * Cambia la contraseña tras validar la respuesta de seguridad.
 */
function cambioContraseña(string $respuesta, string $nuevaContraseña, ?string $usuario = null): bool
{
    $nombre = $usuario ?? ($_SESSION['usuario'] ?? null);
    $nombre = is_string($nombre) ? trim($nombre) : '';
    $respuesta = trim($respuesta);
    $maxBytesContraseña = defined('PASSWORD_ARGON2ID') ? 1024 : 72;
    $numeroCaracteresContraseña = preg_match('//u', $nuevaContraseña) === 1
        ? preg_match_all('/./us', $nuevaContraseña)
        : false;

    if (
        $nombre === ''
        || $respuesta === ''
        || $nuevaContraseña === ''
        || strlen($nombre) > 100
        || strlen($respuesta) > 512
        || strlen($nuevaContraseña) > $maxBytesContraseña
        || $numeroCaracteresContraseña === false
        || $numeroCaracteresContraseña < 12
        || preg_match('//u', $nombre) !== 1
        || preg_match('//u', $respuesta) !== 1
        || preg_match('//u', $nuevaContraseña) !== 1
        || str_contains($nombre, "\0")
        || str_contains($respuesta, "\0")
        || str_contains($nuevaContraseña, "\0")
    ) {
        return false;
    }

    $registroEncontrado = null;
    foreach ($_SESSION['mimatriz'] as $indice => $registro) {
        if (
            !is_array($registro)
            || !isset($registro['Usuario'])
            || !is_string($registro['Usuario'])
        ) {
            continue;
        }

        if (strcasecmp($registro['Usuario'], $nombre) === 0) {
            $registroEncontrado = $indice;
            $respuestaHash = $registro['respuesta_hash'] ?? null;
            $respuestaPlana = $registro['Respuesta'] ?? null;

            if (
                (is_string($respuestaHash) && password_verify($respuesta, $respuestaHash))
                || (
                    !is_string($respuestaHash)
                    && is_string($respuestaPlana)
                    && hash_equals($respuestaPlana, $respuesta)
                )
            ) {
                break;
            }

            return false;
        }
    }

    if ($registroEncontrado === null) {
        $usuarios = $_SESSION['usuarios'] ?? [];
        if (is_array($usuarios)) {
            foreach ($usuarios as $claveUsuario => $datosUsuario) {
                if (
                    !is_array($datosUsuario)
                    || !is_string($claveUsuario)
                    || strcasecmp($claveUsuario, $nombre) !== 0
                    || !isset($datosUsuario['respuesta_hash'])
                    || !is_string($datosUsuario['respuesta_hash'])
                    || !password_verify($respuesta, $datosUsuario['respuesta_hash'])
                ) {
                    continue;
                }

                $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
                $passwordHash = password_hash($nuevaContraseña, $algoritmo);
                $respuestaHash = password_hash($respuesta, $algoritmo);
                if ($passwordHash === false || $respuestaHash === false) {
                    throw new RuntimeException('No se pudieron proteger las credenciales actualizadas.');
                }

                $_SESSION['usuarios'][$claveUsuario]['password_hash'] = $passwordHash;
                $_SESSION['usuarios'][$claveUsuario]['respuesta_hash'] = $respuestaHash;
                return true;
            }
        }

        return false;
    }

    $algoritmo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_DEFAULT;
    $passwordHash = password_hash($nuevaContraseña, $algoritmo);
    $respuestaHash = password_hash($respuesta, $algoritmo);
    if ($passwordHash === false || $respuestaHash === false) {
        throw new RuntimeException('No se pudieron proteger las credenciales actualizadas.');
    }

    $_SESSION['mimatriz'][$registroEncontrado]['Contraseña'] = $nuevaContraseña;
    $_SESSION['mimatriz'][$registroEncontrado]['password_hash'] = $passwordHash;
    $_SESSION['mimatriz'][$registroEncontrado]['respuesta_hash'] = $respuestaHash;

    $datosUsuario = $_SESSION['usuarios'][$nombre] ?? [];
    if (!is_array($datosUsuario)) {
        $datosUsuario = [];
    }
    $datosUsuario['usuario'] = $_SESSION['mimatriz'][$registroEncontrado]['Usuario'];
    $datosUsuario['email'] = $_SESSION['mimatriz'][$registroEncontrado]['Email'] ?? '';
    $datosUsuario['password_hash'] = $passwordHash;
    $datosUsuario['respuesta_hash'] = $respuestaHash;
    $_SESSION['usuarios'][$nombre] = $datosUsuario;

    return true;
}
