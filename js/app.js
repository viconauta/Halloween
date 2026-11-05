import { historias, recetas } from "./datos.js";
import { numeroAleatorio, cargarHistoria, recetasTop, recetasSaladas, recetasDulces } from "./funciones.js";

/* ==============================================================================
DESPLEGABLES
================================================================================*/

//aparece la barra de navegacion
const btnMenuLateral = document.querySelector(".hamburger");
const menuDesplegable = document.getElementById("menu-desplegable");

btnMenuLateral.addEventListener("click", () => {
    menuDesplegable.classList.toggle("oculto");
});

//para que aparezca la ventana del inicio de sesion
const btnLogin = document.querySelector(".login");
const ventanaLogin = document.getElementById("ventana-login");

btnLogin.addEventListener("click", () => {
    ventanaRegistro.classList.add("oculto");
    ventanaRecuperacion.classList.add("oculto");
    ventanaLogin.classList.remove("oculto");
});

//aparece la ventana de registro de nuevo usuario
const btnRegistro = document.querySelector(".registro");
const ventanaRegistro = document.getElementById("ventana-registro");

btnRegistro.addEventListener("click", () => {
    ventanaLogin.classList.add("oculto");
    ventanaRecuperacion.classList.add("oculto");
    ventanaRegistro.classList.remove("oculto");
});

//aparece la ventana de recuperar contraseña
const btnRecuperarContraseña = document.querySelector(".recuperar-contraseña");
const ventanaRecuperacion = document.getElementById("ventana-recuperacion");

btnRecuperarContraseña.addEventListener("click", () => {
    ventanaRegistro.classList.add("oculto");
    ventanaLogin.classList.add("oculto");
    ventanaRecuperacion.classList.remove("oculto");
});

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
        ventanaRegistro.classList.add("oculto");
        ventanaLogin.classList.add("oculto");
        ventanaRecuperacion.classList.add("oculto");
    });
});

/* ==============================================================================
HISTORIA
================================================================================*/

//cargar historia diaria
const num = numeroAleatorio(historias.length);
cargarHistoria(historias, num);

/* ==============================================================================
TELON DE HISTORIA
================================================================================*/

const teatroHistoria = document.getElementById("teatro-historia");
if (teatroHistoria) {
    const botonAbrirHistoria = document.getElementById("abrir-historia");
    const videoHistoria = document.getElementById("video-historia");

    botonAbrirHistoria.addEventListener("click", () => {
        const urlVideo = new URL(videoHistoria.src);
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
