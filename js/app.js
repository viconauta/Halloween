import { historias, recetas, audios, granada } from "./datos.js";

import {
    numeroAleatorio,
    cargarHistoria,
    crearBtn,
    recetasTop,
    recetasSaladas,
    recetasDulces,
    mostrarLugares,
    cerrarMapa,
    inicializarMiCuenta
} from "./funciones.js";

/* ==============================================================================
DESPLEGABLES
================================================================================*/

//aparece la barra de navegacion
const btnMenuLateral = document.querySelector(".hamburger");
const menuDesplegable = document.getElementById("menu-desplegable");

const btnLogin = document.querySelector(".login");
const ventanaLogin = document.getElementById("ventana-login");
const btnRegistro = document.querySelector(".registro");
const ventanaRegistro = document.getElementById("ventana-registro");
const botonesRecuperarContraseña = document.querySelectorAll(".recuperar-contraseña");
const ventanaRecuperacion = document.getElementById("ventana-recuperacion");
const enlacesCuenta = document.querySelectorAll(".enlace-cuenta");
let sesionIniciada = false;
let tokenSesion = "";

const mensajeSesion = document.createElement("p");
mensajeSesion.className = "mensaje-sesion";
mensajeSesion.setAttribute("role", "status");
mensajeSesion.setAttribute("aria-live", "polite");
mensajeSesion.hidden = true;
document.querySelector("header")?.insertAdjacentElement("afterend", mensajeSesion);

function mostrarMensajeSesion(mensaje) {
    if (typeof mensaje !== "string" || mensaje === "") {
        return;
    }

    mensajeSesion.textContent = mensaje;
    mensajeSesion.hidden = false;
}

function actualizarInterfazSesion(iniciada) {
    sesionIniciada = iniciada;
    enlacesCuenta.forEach((enlace) => {
        enlace.classList.toggle("oculto", !sesionIniciada);
    });

    if (btnLogin) {
        btnLogin.textContent = sesionIniciada ? "Cerrar sesión" : "Iniciar sesión";
        btnLogin.setAttribute("aria-label", btnLogin.textContent);
    }
}

if (btnMenuLateral && menuDesplegable) {
    btnMenuLateral.addEventListener("click", () => {
        menuDesplegable.classList.toggle("oculto");
    });
}

if (btnLogin && ventanaLogin) {
    btnLogin.addEventListener("click", () => {
        if (sesionIniciada) {
            fetch("./php/estadoSesion.php", {
                method: "POST",
                headers: { "X-CSRF-Token": tokenSesion }
            })
                .then((respuesta) => {
                    if (!respuesta.ok) {
                        throw new Error(`Error al cerrar sesión: ${respuesta.status}`);
                    }
                    return respuesta.json();
                })
                .then((estado) => {
                    actualizarInterfazSesion(false);
                    mostrarMensajeSesion(estado.mensaje);
                })
                .catch((error) => {
                    console.error(error);
                    mostrarMensajeSesion("No se pudo cerrar sesión. Inténtalo de nuevo.");
                });
            return;
        }

        ventanaRegistro?.classList.add("oculto");
        ventanaRecuperacion?.classList.add("oculto");
        ventanaLogin.classList.remove("oculto");
    });
}

fetch("./php/estadoSesion.php")
    .then((respuesta) => {
        if (!respuesta.ok) {
            throw new Error(`Error al consultar la sesión: ${respuesta.status}`);
        }
        return respuesta.json();
    })
    .then((estado) => {
        actualizarInterfazSesion(estado.sesionIniciada === true);
        tokenSesion = typeof estado.token === "string" ? estado.token : "";
        const tokenCorreo = typeof estado.tokenCorreo === "string" ? estado.tokenCorreo : "";
        document.querySelectorAll('form[action="./php/correo.php"] input[name="csrf_token"]').forEach((campo) => {
            campo.value = tokenCorreo;
        });
        mostrarMensajeSesion(estado.mensaje);
    })
    .catch((error) => {
        console.error(error);
    });

if (btnRegistro && ventanaLogin && ventanaRegistro && ventanaRecuperacion) {
    btnRegistro.addEventListener("click", () => {
        ventanaLogin.classList.add("oculto");
        ventanaRecuperacion.classList.add("oculto");
        ventanaRegistro.classList.remove("oculto");
    });
}

function abrirRecuperacionContraseña() {
    if (!ventanaRecuperacion) {
        return;
    }

    const botonCerrar = ventanaRecuperacion.querySelector(".cerrar-ventana");
    if (!botonCerrar) {
        console.error("La ventana de recuperación no tiene botón de cierre.");
        return;
    }

    const titulo = document.createElement("h2");
    titulo.textContent = "Recuperar contraseña";

    const descripcion = document.createElement("p");
    descripcion.textContent = "Escribe el nombre de usuario para ver su pregunta de seguridad.";

    const formulario = document.createElement("form");
    formulario.id = "formulario-verificar-recuperacion";

    const etiquetaUsuario = document.createElement("label");
    etiquetaUsuario.htmlFor = "recuperacion-usuario";
    etiquetaUsuario.textContent = "Nombre de usuario:";
    const entradaUsuario = document.createElement("input");
    entradaUsuario.id = "recuperacion-usuario";
    entradaUsuario.name = "usuario";
    entradaUsuario.type = "text";
    entradaUsuario.maxLength = 100;
    entradaUsuario.autocomplete = "username";
    entradaUsuario.required = true;

    const pregunta = document.createElement("p");
    pregunta.className = "pregunta-recuperacion";
    pregunta.hidden = true;
    const etiquetaRespuesta = document.createElement("label");
    etiquetaRespuesta.htmlFor = "recuperacion-respuesta";
    etiquetaRespuesta.textContent = "Respuesta de seguridad:";
    etiquetaRespuesta.hidden = true;
    const entradaRespuesta = document.createElement("input");
    entradaRespuesta.id = "recuperacion-respuesta";
    entradaRespuesta.name = "respuesta";
    entradaRespuesta.type = "password";
    entradaRespuesta.maxLength = 512;
    entradaRespuesta.autocomplete = "off";
    entradaRespuesta.required = false;
    entradaRespuesta.hidden = true;
    const error = document.createElement("p");
    error.className = "error-recuperacion";
    error.setAttribute("role", "alert");
    error.hidden = true;

    const enviar = document.createElement("button");
    enviar.type = "submit";
    enviar.className = "btn";
    enviar.textContent = "Mostrar pregunta";

    formulario.append(etiquetaUsuario, entradaUsuario, pregunta, etiquetaRespuesta, entradaRespuesta, error, enviar);
    ventanaRecuperacion.replaceChildren(botonCerrar, titulo, descripcion, formulario);
    ventanaRecuperacion.classList.remove("oculto");
    entradaUsuario.focus();

    let preguntaMostrada = false;
    const obtenerTokenSesion = () => {
        if (tokenSesion) {
            return Promise.resolve(tokenSesion);
        }

        return fetch("./php/estadoSesion.php")
            .then(async respuesta => {
                const estado = await respuesta.json();
                if (!respuesta.ok || typeof estado.token !== "string") {
                    throw new Error("No se pudo validar la solicitud. Recarga la página e inténtalo de nuevo.");
                }
                tokenSesion = estado.token;
                return tokenSesion;
            });
    };

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        error.hidden = true;
        enviar.disabled = true;

        obtenerTokenSesion()
            .then(token => {
                if (!preguntaMostrada) {
                    return fetch("./php/cambioPass.php", {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            fase: "pregunta",
                            usuario: entradaUsuario.value.trim(),
                            token
                        })
                    }).then(async respuesta => {
                        const datos = await respuesta.json();
                        if (!respuesta.ok) {
                            throw new Error(datos.error || `No se pudo obtener la pregunta: ${respuesta.status}`);
                        }

                        pregunta.textContent = datos.pregunta;
                        pregunta.hidden = false;
                        entradaRespuesta.hidden = false;
                        entradaRespuesta.required = true;
                        etiquetaRespuesta.hidden = false;
                        preguntaMostrada = true;
                        enviar.textContent = "Comprobar respuesta";
                        enviar.disabled = false;
                        entradaRespuesta.focus();
                        return null;
                    });
                }

                return fetch("./php/cambioPass.php", {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fase: "verificar",
                        usuario: entradaUsuario.value.trim(),
                        respuesta: entradaRespuesta.value.trim(),
                        token
                    })
                }).then(async respuesta => {
                    const datos = await respuesta.json();
                    if (!respuesta.ok) {
                        throw new Error(datos.error || `No se pudo verificar la respuesta: ${respuesta.status}`);
                    }
                    if (typeof datos.token !== "string" || datos.verificado !== true) {
                        throw new TypeError("El servidor no confirmó la verificación de seguridad.");
                    }

                    ventanaRecuperacion.classList.add("oculto");
                    abrirDialogoNuevaContraseña(datos.token);
                    return null;
                });
            })
            .catch(errorSolicitud => {
                console.error("No se pudo verificar la respuesta de seguridad.", errorSolicitud);
                error.textContent = errorSolicitud.message;
                error.hidden = false;
                enviar.disabled = false;
            });
    });
}

function abrirDialogoNuevaContraseña(token) {
    const dialogo = document.createElement("dialog");
    dialogo.className = "dialogo-recuperacion";
    dialogo.setAttribute("aria-labelledby", "titulo-nueva-contrasena");

    const formulario = document.createElement("form");
    const titulo = document.createElement("h2");
    titulo.id = "titulo-nueva-contrasena";
    titulo.textContent = "Elige una nueva contraseña";

    const crearCampo = (id, texto, autocomplete) => {
        const etiqueta = document.createElement("label");
        etiqueta.htmlFor = id;
        etiqueta.textContent = texto;
        const entrada = document.createElement("input");
        entrada.id = id;
        entrada.type = "password";
        entrada.minLength = 12;
        entrada.maxLength = 1024;
        entrada.autocomplete = autocomplete;
        entrada.required = true;
        return [etiqueta, entrada];
    };

    const [etiquetaNueva, nueva] = crearCampo(
        "nueva-contrasena-recuperada",
        "Nueva contraseña (mínimo 12 caracteres):",
        "new-password"
    );
    const [etiquetaConfirmar, confirmar] = crearCampo(
        "confirmar-contrasena-recuperada",
        "Confirma la nueva contraseña:",
        "new-password"
    );

    const error = document.createElement("p");
    error.className = "error-recuperacion";
    error.setAttribute("role", "alert");
    error.hidden = true;

    const acciones = document.createElement("div");
    acciones.className = "acciones-formulario";
    const guardar = document.createElement("button");
    guardar.type = "submit";
    guardar.className = "btn";
    guardar.textContent = "Guardar contraseña";
    const cancelar = document.createElement("button");
    cancelar.type = "button";
    cancelar.className = "boton-secundario";
    cancelar.textContent = "Cancelar";
    acciones.append(guardar, cancelar);
    formulario.append(titulo, etiquetaNueva, nueva, etiquetaConfirmar, confirmar, error, acciones);
    dialogo.appendChild(formulario);
    document.body.appendChild(dialogo);

    const eliminarDialogo = () => {
        if (dialogo.open) {
            dialogo.close();
        }
        dialogo.remove();
    };
    cancelar.addEventListener("click", eliminarDialogo);
    dialogo.addEventListener("close", () => dialogo.remove(), { once: true });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        error.hidden = true;
        if (nueva.value !== confirmar.value) {
            error.textContent = "Las contraseñas no coinciden.";
            error.hidden = false;
            confirmar.focus();
            return;
        }

        guardar.disabled = true;
        fetch("./php/cambioPass.php", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fase: "cambiar",
                token,
                nueva_contrasena: nueva.value,
                confirmar_contrasena: confirmar.value
            })
        })
            .then(async respuesta => {
                const datos = await respuesta.json();
                if (!respuesta.ok) {
                    throw new Error(datos.error || `No se pudo cambiar la contraseña: ${respuesta.status}`);
                }

                formulario.replaceChildren();
                const mensaje = document.createElement("p");
                mensaje.setAttribute("role", "status");
                mensaje.textContent = datos.mensaje || "La contraseña se ha cambiado correctamente.";
                const cerrar = document.createElement("button");
                cerrar.type = "button";
                cerrar.className = "btn";
                cerrar.textContent = "Cerrar";
                cerrar.addEventListener("click", eliminarDialogo);
                formulario.append(mensaje, cerrar);
            })
            .catch(errorSolicitud => {
                console.error("No se pudo actualizar la contraseña.", errorSolicitud);
                error.textContent = errorSolicitud.message;
                error.hidden = false;
                guardar.disabled = false;
            });
    });

    dialogo.showModal();
    nueva.focus();
}

if (botonesRecuperarContraseña.length > 0 && ventanaRecuperacion) {
    botonesRecuperarContraseña.forEach(boton => {
        boton.addEventListener("click", () => {
        ventanaRegistro?.classList.add("oculto");
        ventanaLogin?.classList.add("oculto");
            abrirRecuperacionContraseña();
        });
    });
}

/* ==============================================================================
SUSTO DEL INICIO
================================================================================*/

const inicio = document.getElementById("pagina-inicio");
const imagenSusto = document.getElementById("susto-pantalla");
const sonidoSusto = document.getElementById("sonido-susto");

if (inicio && imagenSusto && sonidoSusto) {
    let sustoMostrado = false;

    document.addEventListener("click", (evento) => {
        if (sustoMostrado) {
            return;
        }

        sustoMostrado = true;
        evento.preventDefault();
        evento.stopImmediatePropagation();
        imagenSusto.hidden = false;
        document.body.classList.add("susto-activo");
        sonidoSusto.currentTime = 0;
        sonidoSusto.play().catch(() => {
            console.error("No se pudo reproducir el sonido de terror.");
        });
        window.setTimeout(() => {
            imagenSusto.classList.add("visible");
            imagenSusto.focus({ preventScroll: true });
        }, 20);
    }, true);

    imagenSusto.addEventListener("click", () => {
        if (imagenSusto.classList.contains("cerrando")) {
            return;
        }

        imagenSusto.classList.remove("visible");
        imagenSusto.classList.add("cerrando");
        sonidoSusto.pause();
        sonidoSusto.currentTime = 0;

        window.setTimeout(() => {
            imagenSusto.hidden = true;
            imagenSusto.classList.remove("cerrando");
            document.body.classList.remove("susto-activo");
        }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : 600);
    });
}

//cerrar ventanas
document.querySelectorAll(".cerrar-ventana").forEach((btn) => {
    btn.addEventListener("click", () => {
        ventanaRegistro?.classList.add("oculto");
        ventanaLogin?.classList.add("oculto");
        ventanaRecuperacion?.classList.add("oculto");
    });
});

/* ==============================================================================
HISTORIA
================================================================================*/

//cargar historia diaria
if (document.querySelector(".video") && document.querySelector(".descripcion")) {
    const num = numeroAleatorio(historias.length);
    cargarHistoria(historias, num);
}

/* ==============================================================================
TELON DE HISTORIA
================================================================================*/

const teatroHistoria = document.getElementById("teatro-historia");
if (teatroHistoria) {
    const botonAbrirHistoria = document.getElementById("abrir-historia");
    const videoHistoria = document.getElementById("video-historia");

    botonAbrirHistoria.addEventListener("click", () => {
        const urlVideo = new URL(videoHistoria.dataset.src);
        urlVideo.searchParams.set("autoplay", "1");
        urlVideo.searchParams.set("playsinline", "1");
        videoHistoria.src = urlVideo.toString();
        botonAbrirHistoria.disabled = true;
        teatroHistoria.classList.add("abierto");

        const duracionAnimacion = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 20 : 1600;
        window.setTimeout(() => {
            teatroHistoria.hidden = true;
        }, duracionAnimacion);
    });
}

/* ==============================================================================
RECETAS
================================================================================*/

//obtener recetas top
recetasTop(recetas);

//obtener aperitivos salados
let tipo = "salado";
recetasSaladas(recetas, tipo);

//obtener dulces y pasteles
tipo = "dulce";
recetasDulces(recetas, tipo);

//eventos para la tarjeta reversible
document.querySelectorAll(".contenedor-tarjeta").forEach((tarjeta) => {
    tarjeta.addEventListener("click", () => {
        tarjeta.classList.toggle("back");
    });
});

//Mostrar el encabezado al subir y ocultarlo al bajar
const header = document.querySelector("header");
let ultimaPosicion = window.scrollY;

window.addEventListener("scroll", () => {
    const posicionActual = window.scrollY;
    header.classList.toggle("header-oculto", posicionActual > ultimaPosicion && posicionActual > header.offsetHeight);
    ultimaPosicion = posicionActual;
}, { passive: true });

const contenedorEfectos = document.getElementById("efectos-sonido");
const contenedorTemas = document.getElementById("temas-musicales");

if (contenedorEfectos) {
    const efectos = audios.filter(sonido => sonido.descripcion === "Efecto de sonido");
    crearBtn(efectos, contenedorEfectos);
}

if (contenedorTemas) {
    const temas = audios.filter(sonido => sonido.descripcion === "Tema musical de Película");
    crearBtn(temas, contenedorTemas);
}

/* ==============================================================================
LUGARES DE GRANADA
================================================================================*/

if (document.getElementById("lugares")) {
    mostrarLugares(granada);

    cerrarMapa();
}

if (document.getElementById("datos")) {
    inicializarMiCuenta();
}