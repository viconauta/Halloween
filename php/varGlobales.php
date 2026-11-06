<?php
declare(strict_types=1);

/**
 * Añade un usuario al final de la matriz de sesión.
 *
 * @param array<string, string> $nuevoUser
 */
function AltaUsuario(array $nuevoUser): void
{
    $usuarios = $_SESSION['mimatriz'] ?? [];

    if (!is_array($usuarios)) {
        trigger_error('La matriz de usuarios de la sesión no es válida.', E_USER_ERROR);
        return;
    }

    $usuarios[] = $nuevoUser;
    $_SESSION['mimatriz'] = $usuarios;
}

/**
 * Guarda en la sesión el registro del usuario que ha iniciado sesión.
 *
 * @param array<string, string> $usuario
 */
function currentUser(array $usuario): void
{
    $_SESSION['currentUser'] = $usuario;
}
