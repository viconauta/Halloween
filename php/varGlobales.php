<?php
// Iniciar sesión si no está activa
if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// Inicialización de matrices de sesión principales
if (!isset($_SESSION['mimatriz']) || !is_array($_SESSION['mimatriz'])) {
    $_SESSION['mimatriz'] = [];
}

if (!isset($_SESSION['usuarios']) || !is_array($_SESSION['usuarios'])) {
    $_SESSION['usuarios'] = [];
}

/**
 * Función auxiliar para escapar texto de forma segura en las vistas HTML.
 */
function escapar(string $valor): string
{
    return htmlspecialchars($valor, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Obtiene o establece el usuario actualmente autenticado en la sesión.
 */
function currentUser(?array $usuario = null): ?array
{
    if ($usuario !== null) {
        $nombre = $usuario['Usuario'] ?? $usuario['usuario'] ?? '';
        unset($usuario['Contraseña'], $usuario['password_hash']);

        // Si faltan campos y el usuario ya está registrado en la matriz, completamos los datos
        if (!empty($nombre)) {
            foreach ($_SESSION['mimatriz'] as $registro) {
                if (isset($registro['Usuario']) && strcasecmp($registro['Usuario'], $nombre) === 0) {
                    $usuario = array_merge($registro, $usuario);
                    unset($usuario['Contraseña'], $usuario['password_hash']);
                    break;
                }
            }
            $_SESSION['usuario'] = $nombre;
        }

        $_SESSION['currentUser'] = $usuario;
        return $usuario;
    }

    if (isset($_SESSION['currentUser']) && is_array($_SESSION['currentUser'])) {
        return $_SESSION['currentUser'];
    }

    $nombreSesion = $_SESSION['usuario'] ?? null;
    if (!empty($nombreSesion)) {
        foreach ($_SESSION['mimatriz'] as $registro) {
            if (isset($registro['Usuario']) && strcasecmp($registro['Usuario'], $nombreSesion) === 0) {
                unset($registro['Contraseña'], $registro['password_hash']);
                $_SESSION['currentUser'] = $registro;
                return $registro;
            }
        }
    }

    return null;
}

/**
 * Devuelve el correo electrónico del usuario autenticado actual.
 */
function currentUserEmail(): ?string
{
    $usuario = currentUser();
    $email = $usuario['Email'] ?? $usuario['email'] ?? null;

    if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return $email;
    }

    $nombre = $_SESSION['usuario'] ?? '';
    if (!empty($nombre)) {
        foreach ($_SESSION['mimatriz'] as $registro) {
            if (isset($registro['Usuario']) && strcasecmp($registro['Usuario'], $nombre) === 0) {
                $emailMatriz = $registro['Email'] ?? '';
                if (!empty($emailMatriz) && filter_var($emailMatriz, FILTER_VALIDATE_EMAIL)) {
                    return $emailMatriz;
                }
            }
        }
    }

    return null;
}

/**
 * Devuelve los datos visibles del perfil actual (sin contraseñas).
 */
function datosPerfilActual(): ?array
{
    $usuario = currentUser();
    if ($usuario === null) {
        return null;
    }

    return [
        'nombre'    => (string) ($usuario['Usuario'] ?? $usuario['usuario'] ?? ''),
        'fecha'     => (string) ($usuario['FechaNacimiento'] ?? $usuario['fecha'] ?? ''),
        'email'     => (string) ($usuario['Email'] ?? $usuario['email'] ?? ''),
        'seguridad' => (string) ($usuario['Pregunta'] ?? $usuario['pregunta'] ?? ''),
    ];
}

/**
 * Actualiza los datos del perfil del usuario autenticado en la sesión.
 */
function actualizarPerfilActual(array $datos): bool
{
    $usuarioActual = currentUser();
    if ($usuarioActual === null) {
        return false;
    }

    $nombreActual = $usuarioActual['Usuario'] ?? $usuarioActual['usuario'] ?? '';
    $nombreNuevo  = trim($datos['nombre'] ?? '');
    $fecha        = trim($datos['fecha'] ?? '');
    $email        = trim($datos['email'] ?? '');
    $pregunta     = trim($datos['seguridad'] ?? '');

    if (empty($nombreNuevo)) {
        return false;
    }

    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    // Comprobar que el nuevo nombre no esté en uso por otro usuario
    foreach ($_SESSION['mimatriz'] as $registro) {
        if (
            isset($registro['Usuario']) &&
            strcasecmp($registro['Usuario'], $nombreNuevo) === 0 &&
            strcasecmp($nombreActual, $nombreNuevo) !== 0
        ) {
            return false;
        }
    }

    // Actualizar registro en $_SESSION['mimatriz']
    $encontrado = false;
    foreach ($_SESSION['mimatriz'] as $indice => $registro) {
        if (isset($registro['Usuario']) && strcasecmp($registro['Usuario'], $nombreActual) === 0) {
            $_SESSION['mimatriz'][$indice]['Usuario'] = $nombreNuevo;
            $_SESSION['mimatriz'][$indice]['FechaNacimiento'] = $fecha;
            $_SESSION['mimatriz'][$indice]['Email'] = $email;
            $_SESSION['mimatriz'][$indice]['Pregunta'] = $pregunta;
            $encontrado = true;
            break;
        }
    }

    if (!$encontrado) {
        return false;
    }

    // Actualizar estado en sesión actual
    $_SESSION['usuario'] = $nombreNuevo;
    $_SESSION['currentUser']['Usuario'] = $nombreNuevo;
    $_SESSION['currentUser']['FechaNacimiento'] = $fecha;
    $_SESSION['currentUser']['Email'] = $email;
    $_SESSION['currentUser']['Pregunta'] = $pregunta;

    return true;
}

/**
 * Registra un nuevo usuario en la matriz de sesión si el nombre no existe.
 */
function AltaUsuario(array $nuevoUser): bool
{
    $nombre     = trim($nuevoUser['Usuario'] ?? '');
    $contraseña = trim($nuevoUser['Contraseña'] ?? '');
    $email      = trim($nuevoUser['Email'] ?? '');
    $pregunta   = trim($nuevoUser['Pregunta'] ?? '');
    $respuesta  = trim($nuevoUser['Respuesta'] ?? '');

    if (empty($nombre) || empty($contraseña) || empty($email)) {
        return false;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    // Comprobar si ya existe el usuario
    foreach ($_SESSION['mimatriz'] as $u) {
        if (isset($u['Usuario']) && strcasecmp($u['Usuario'], $nombre) === 0) {
            return false;
        }
    }

    $hashPassword  = password_hash($contraseña, PASSWORD_DEFAULT);
    $hashRespuesta = !empty($respuesta) ? password_hash($respuesta, PASSWORD_DEFAULT) : '';

    $registro = [
        'Usuario'         => $nombre,
        'Contraseña'      => $contraseña,
        'password_hash'   => $hashPassword,
        'Email'           => $email,
        'FechaNacimiento' => $nuevoUser['FechaNacimiento'] ?? '',
        'Pregunta'        => $pregunta,
        'Respuesta'       => $respuesta,
        'respuesta_hash'  => $hashRespuesta,
        'Perfil'          => $nuevoUser['Perfil'] ?? 'user',
    ];

    $_SESSION['mimatriz'][] = $registro;
    $_SESSION['usuarios'][$nombre] = $registro;

    return true;
}

/**
 * Devuelve la pregunta de seguridad configurada para un usuario.
 */
function preguntaSeguridadUsuario(string $nombre): ?string
{
    $nombre = trim($nombre);
    if (empty($nombre)) {
        return null;
    }

    foreach ($_SESSION['mimatriz'] as $u) {
        if (isset($u['Usuario']) && strcasecmp($u['Usuario'], $nombre) === 0) {
            return !empty($u['Pregunta']) ? $u['Pregunta'] : null;
        }
    }

    return null;
}

/**
 * Comprueba si la respuesta de seguridad introducida coincide con la guardada.
 */
function verificarRespuestaSeguridad(string $nombre, string $respuesta): bool
{
    $nombre    = trim($nombre);
    $respuesta = trim($respuesta);

    if (empty($nombre) || empty($respuesta)) {
        return false;
    }

    foreach ($_SESSION['mimatriz'] as $u) {
        if (isset($u['Usuario']) && strcasecmp($u['Usuario'], $nombre) === 0) {
            $hash = $u['respuesta_hash'] ?? '';
            $plano = $u['Respuesta'] ?? '';

            if (!empty($hash) && password_verify($respuesta, $hash)) {
                return true;
            }
            if (!empty($plano) && strcasecmp($plano, $respuesta) === 0) {
                return true;
            }
            return false;
        }
    }

    return false;
}

/**
 * Actualiza la contraseña de un usuario tras haber sido verificado.
 */
function actualizarContraseñaVerificada(string $nombre, string $nuevaContraseña): bool
{
    $nombre          = trim($nombre);
    $nuevaContraseña = trim($nuevaContraseña);

    if (empty($nombre) || strlen($nuevaContraseña) < 4) {
        return false;
    }

    $hash = password_hash($nuevaContraseña, PASSWORD_DEFAULT);
    $actualizado = false;

    foreach ($_SESSION['mimatriz'] as $indice => $u) {
        if (isset($u['Usuario']) && strcasecmp($u['Usuario'], $nombre) === 0) {
            $_SESSION['mimatriz'][$indice]['Contraseña']    = $nuevaContraseña;
            $_SESSION['mimatriz'][$indice]['password_hash'] = $hash;
            $actualizado = true;
            break;
        }
    }

    if (isset($_SESSION['usuarios'][$nombre])) {
        $_SESSION['usuarios'][$nombre]['password_hash'] = $hash;
    }

    return $actualizado;
}

/**
 * Cambia la contraseña comprobando previamente la respuesta de seguridad.
 */
function cambioContraseña(string $respuesta, string $nuevaContraseña, ?string $usuario = null): bool
{
    $nombre = !empty($usuario) ? trim($usuario) : ($_SESSION['usuario'] ?? '');

    if (empty($nombre)) {
        return false;
    }

    if (!verificarRespuestaSeguridad($nombre, $respuesta)) {
        return false;
    }

    return actualizarContraseñaVerificada($nombre, $nuevaContraseña);
}
