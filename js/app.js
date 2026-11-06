import { historias, recetas, audios, granada } from "./datos.js";

import {
    numeroAleatorio,
    cargarHistoria,
    crearBtn,
    recetasTop,
    recetasSaladas,
    recetasDulces,
    mostrarLugares,
    cerrarMapa
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
const btnRecuperarContraseña = document.querySelector(".recuperar-contraseña");
const ventanaRecuperacion = document.getElementById("ventana-recuperacion");

if (btnMenuLateral && menuDesplegable) {
    btnMenuLateral.addEventListener("click", () => {
        menuDesplegable.classList.toggle("oculto");
    });
}

if (btnLogin && ventanaLogin) {
    btnLogin.addEventListener("click", () => {
        ventanaRegistro?.classList.add("oculto");
        ventanaRecuperacion?.classList.add("oculto");
        ventanaLogin.classList.remove("oculto");
    });
}

if (btnRegistro && ventanaLogin && ventanaRegistro && ventanaRecuperacion) {
    btnRegistro.addEventListener("click", () => {
        ventanaLogin.classList.add("oculto");
        ventanaRecuperacion.classList.add("oculto");
        ventanaRegistro.classList.remove("oculto");
    });
}

if (btnRecuperarContraseña && ventanaRecuperacion) {
    btnRecuperarContraseña.addEventListener("click", () => {
        ventanaRegistro?.classList.add("oculto");
        ventanaLogin?.classList.add("oculto");
        ventanaRecuperacion.classList.remove("oculto");
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