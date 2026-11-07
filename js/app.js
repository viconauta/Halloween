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
 * 1. NAVEGACIÓN Y MENÚ LATERAL (HAMBURGER)
 * ============================================================================== */

const btnMenu = document.querySelector(".hamburger");
const menuDesplegable = document.getElementById("menu-desplegable");

if (btnMenu && menuDesplegable) {
    btnMenu.addEventListener("click", () => {
        menuDesplegable.classList.toggle("oculto");
    });
}

// Ocultar encabezado al hacer scroll hacia abajo, mostrar al subir
const header = document.querySelector("header");
if (header) {
    let ultimaPosicionScroll = window.scrollY;
    window.addEventListener("scroll", () => {
        const posicionActual = window.scrollY;
        if (posicionActual > ultimaPosicionScroll && posicionActual > header.offsetHeight) {
            header.classList.add("header-oculto");
        } else {
            header.classList.remove("header-oculto");
        }
        ultimaPosicionScroll = posicionActual;
    }, { passive: true });
}

/* ==============================================================================
 * 2. GESTIÓN DEL ESTADO DE SESIÓN (LOGIN / LOGOUT)
 * ============================================================================== */

const btnLogin = document.querySelector(".login");
const ventanaLogin = document.getElementById("ventana-login");
const ventanaRegistro = document.getElementById("ventana-registro");
const ventanaRecuperacion = document.getElementById("ventana-recuperacion");
const enlacesCuenta = document.querySelectorAll(".enlace-cuenta");

let usuarioLogueado = false;

// Comprobar estado de la sesión en el servidor
async function verificarSesion() {
    try {
        const resp = await fetch("./php/estadoSesion.php");
        const data = await resp.json();

        usuarioLogueado = Boolean(data.sesionIniciada);

        // Mostrar u ocultar enlaces que requieren inicio de sesión
        enlacesCuenta.forEach(enlace => {
            enlace.classList.toggle("oculto", !usuarioLogueado);
        });

        // Actualizar texto del botón de sesión
        if (btnLogin) {
            btnLogin.textContent = usuarioLogueado ? "Cerrar sesión" : "Iniciar sesión";
        }
    } catch (e) {
        console.warn("No se pudo verificar el estado de la sesión:", e);
    }
}

verificarSesion();

// Acción del botón de login / logout en el encabezado
if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
        if (usuarioLogueado) {
            // Cerrar sesión
            try {
                const resp = await fetch("./php/estadoSesion.php", { method: "POST" });
                const data = await resp.json();
                usuarioLogueado = false;
                verificarSesion();
                alert(data.mensaje || "Has cerrado sesión correctamente.");
                window.location.reload();
            } catch (err) {
                console.error("Error al cerrar sesión:", err);
            }
        } else if (ventanaLogin) {
            cerrarModales();
            ventanaLogin.classList.remove("oculto");
        }
    });
}

/* ==============================================================================
 * 3. CONTROL DE MODALES (LOGIN, REGISTRO Y RECUPERACIÓN)
 * ============================================================================== */

function cerrarModales() {
    ventanaLogin?.classList.add("oculto");
    ventanaRegistro?.classList.add("oculto");
    ventanaRecuperacion?.classList.add("oculto");
}

// Botones de cierre 'X'
document.querySelectorAll(".cerrar-ventana").forEach(btn => {
    btn.addEventListener("click", cerrarModales);
});

// Cambiar de ventana login a registro
const btnIrRegistro = document.querySelector(".registro");
if (btnIrRegistro && ventanaRegistro) {
    btnIrRegistro.addEventListener("click", () => {
        cerrarModales();
        ventanaRegistro.classList.remove("oculto");
    });
}

// Abrir asistente de recuperación de contraseña
document.querySelectorAll(".recuperar-contraseña").forEach(btn => {
    btn.addEventListener("click", () => {
        cerrarModales();
        if (ventanaRecuperacion) {
            iniciarAsistenteRecuperacion();
            ventanaRecuperacion.classList.remove("oculto");
        }
    });
});

/* Asistente limpio paso a paso para recuperar contraseña por pregunta de seguridad. */
function iniciarAsistenteRecuperacion() {
    if (!ventanaRecuperacion) return;

    ventanaRecuperacion.innerHTML = `
        <button class="cerrar-ventana" type="button" aria-label="Cerrar">×</button>
        <h2>Recuperar contraseña</h2>
        <div id="cuerpo-recuperacion">
            <p>Escribe tu usuario para responder a tu pregunta de seguridad:</p>
            <form id="form-recuperar-paso1" style="display: flex; flex-direction: column; gap: 0.6rem;">
                <label for="recup-user">Usuario:</label>
                <input type="text" id="recup-user" required placeholder="Tu nombre de usuario">
                <button type="submit" class="btn">Continuar</button>
            </form>
            <p id="error-recuperacion" style="color: #ff9a9a; margin-top: 0.5rem; display: none;"></p>
        </div>
    `;

    ventanaRecuperacion.querySelector(".cerrar-ventana").addEventListener("click", cerrarModales);

    const formPaso1 = document.getElementById("form-recuperar-paso1");
    const errorP = document.getElementById("error-recuperacion");

    formPaso1.addEventListener("submit", async e => {
        e.preventDefault();
        const usuario = document.getElementById("recup-user").value.trim();
        errorP.style.display = "none";

        try {
            const resp = await fetch("./php/cambioPass.php", {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ fase: "pregunta", usuario })
            });

            const data = await resp.json();
            if (!resp.ok) throw new Error(data.error || "Usuario no encontrado.");

            // Paso 2: Mostrar pregunta y pedir respuesta
            mostrarPaso2(usuario, data.pregunta);
        } catch (err) {
            errorP.textContent = err.message;
            errorP.style.display = "block";
        }
    });

    function mostrarPaso2(usuario, pregunta) {
        const contenedor = document.getElementById("cuerpo-recuperacion");
        contenedor.innerHTML = `
            <p><strong>Pregunta:</strong> ${pregunta}</p>
            <form id="form-recuperar-paso2" style="display: flex; flex-direction: column; gap: 0.6rem;">
                <label for="recup-resp">Tu respuesta de seguridad:</label>
                <input type="password" id="recup-resp" required placeholder="Respuesta secreta">
                <button type="submit" class="btn">Verificar</button>
            </form>
            <p id="error-recuperacion2" style="color: #ff9a9a; margin-top: 0.5rem; display: none;"></p>
        `;

        const formPaso2 = document.getElementById("form-recuperar-paso2");
        const err2 = document.getElementById("error-recuperacion2");

        formPaso2.addEventListener("submit", async e => {
            e.preventDefault();
            const respuesta = document.getElementById("recup-resp").value.trim();

            try {
                const resp = await fetch("./php/cambioPass.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({ fase: "verificar", usuario, respuesta })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || "Respuesta incorrecta.");

                // Paso 3: Introducir nueva contraseña
                mostrarPaso3();
            } catch (err) {
                err2.textContent = err.message;
                err2.style.display = "block";
            }
        });
    }

    function mostrarPaso3() {
        const contenedor = document.getElementById("cuerpo-recuperacion");
        contenedor.innerHTML = `
            <p>¡Identidad verificada! Elige tu nueva contraseña:</p>
            <form id="form-recuperar-paso3" style="display: flex; flex-direction: column; gap: 0.6rem;">
                <label for="nueva-pass">Nueva contraseña:</label>
                <input type="password" id="nueva-pass" required placeholder="Mínimo 4 caracteres">
                <label for="conf-pass">Confirmar contraseña:</label>
                <input type="password" id="conf-pass" required placeholder="Repite la contraseña">
                <button type="submit" class="btn">Guardar contraseña</button>
            </form>
            <p id="error-recuperacion3" style="color: #ff9a9a; margin-top: 0.5rem; display: none;"></p>
        `;

        const formPaso3 = document.getElementById("form-recuperar-paso3");
        const err3 = document.getElementById("error-recuperacion3");

        formPaso3.addEventListener("submit", async e => {
            e.preventDefault();
            const nueva = document.getElementById("nueva-pass").value;
            const conf = document.getElementById("conf-pass").value;

            if (nueva !== conf) {
                err3.textContent = "Las contraseñas no coinciden.";
                err3.style.display = "block";
                return;
            }

            try {
                const resp = await fetch("./php/cambioPass.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Accept: "application/json" },
                    body: JSON.stringify({
                        fase: "cambiar",
                        nueva_contrasena: nueva,
                        confirmar_contrasena: conf
                    })
                });

                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || "Error al actualizar contraseña.");

                contenedor.innerHTML = `
                    <p style="color: #b8f23a; font-weight: bold;">${data.mensaje}</p>
                    <button type="button" class="btn" id="btn-listo">Cerrar</button>
                `;
                document.getElementById("btn-listo").addEventListener("click", cerrarModales);
            } catch (err) {
                err3.textContent = err.message;
                err3.style.display = "block";
            }
        });
    }
}

/* ==============================================================================
 * 4. SUSTO DE PANTALLA INICIAL (JUMPSCARE)
 * ============================================================================== */

const paginaInicio = document.getElementById("pagina-inicio");
const imagenSusto = document.getElementById("susto-pantalla");
const sonidoSusto = document.getElementById("sonido-susto");

if (paginaInicio && imagenSusto && sonidoSusto) {
    let sustoEjecutado = false;

    document.addEventListener("click", e => {
        // Ejecutar sólo una vez al hacer el primer clic en la página
        if (sustoEjecutado || e.target.closest("a, button, input, textarea")) return;

        sustoEjecutado = true;
        imagenSusto.hidden = false;
        document.body.classList.add("susto-activo");

        sonidoSusto.currentTime = 0;
        sonidoSusto.play().catch(() => {});

        setTimeout(() => {
            imagenSusto.classList.add("visible");
        }, 20);
    });

    imagenSusto.addEventListener("click", () => {
        imagenSusto.classList.remove("visible");
        imagenSusto.classList.add("cerrando");
        sonidoSusto.pause();
        sonidoSusto.currentTime = 0;

        setTimeout(() => {
            imagenSusto.hidden = true;
            imagenSusto.classList.remove("cerrando");
            document.body.classList.remove("susto-activo");
        }, 400);
    });
}

/* ==============================================================================
 * 5. SECCIÓN HISTORIAS DE MIEDO Y TELÓN
 * ============================================================================== */

if (document.querySelector(".video") && document.querySelector(".descripcion")) {
    const num = numeroAleatorio(historias.length);
    cargarHistoria(historias, num);

    // Evento para abrir el telón del teatro
    const teatro = document.getElementById("teatro-historia");
    const btnTelon = document.getElementById("abrir-historia");
    const videoIframe = document.getElementById("video-historia");

    if (btnTelon && teatro && videoIframe) {
        btnTelon.addEventListener("click", () => {
            videoIframe.src = `${videoIframe.dataset.src}?autoplay=1`;
            teatro.classList.add("abierto");
            setTimeout(() => {
                teatro.hidden = true;
            }, 1200);
        });
    }
}

/* ==============================================================================
 * 6. SECCIÓN RECETAS DE HALLOWEEN (TARJETAS REVERSIBLES)
 * ============================================================================== */

if (document.querySelector(".recetas-populares")) {
    recetasTop(recetas);
    recetasSaladas(recetas, "salado");
    recetasDulces(recetas, "dulce");

    // Delegación de eventos para voltear cualquier tarjeta de receta al hacer clic
    document.addEventListener("click", e => {
        const tarjeta = e.target.closest(".contenedor-tarjeta");
        if (tarjeta) {
            tarjeta.classList.toggle("back");
        }
    });
}

/* ==============================================================================
 * 7. SECCIÓN AUDIOS Y BANDAS SONORAS DE TERROR
 * ============================================================================== */

const contenedorEfectos = document.getElementById("efectos-sonido");
const contenedorTemas = document.getElementById("temas-musicales");

if (contenedorEfectos) {
    const efectos = audios.filter(a => a.descripcion === "Efecto de sonido");
    crearBtn(efectos, contenedorEfectos);
}

if (contenedorTemas) {
    const temas = audios.filter(a => a.descripcion === "Tema musical de Película");
    crearBtn(temas, contenedorTemas);
}

/* ==============================================================================
 * 8. LUGARES DE GRANADA Y MI CUENTA
 * ============================================================================== */

if (document.getElementById("lugares")) {
    mostrarLugares(granada);
    cerrarMapa();
}

if (document.getElementById("datos")) {
    inicializarMiCuenta();
}
