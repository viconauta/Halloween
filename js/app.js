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

btnMenuLateral.addEventListener("click", () => {
    menuDesplegable.classList.toggle("oculto");
});

//para que aparezca la ventana del inicio de sesion
const btnLogin = document.querySelector(".login");
const ventanaLogin = document.getElementById("ventana-login");
const btnRegistro = document.querySelector(".registro");
const ventanaRegistro = document.getElementById("ventana-registro");
const btnRecuperarContraseña = document.querySelector(".recuperar-contraseña");
const ventanaRecuperacion = document.getElementById("ventana-recuperacion");

if (btnLogin && ventanaLogin) {
    btnLogin.addEventListener("click", () => {
        ventanaRegistro?.classList.add("oculto");
        ventanaRecuperacion?.classList.add("oculto");
        ventanaLogin.classList.remove("oculto");
    });
}

if (btnRegistro && ventanaRegistro) {
    btnRegistro.addEventListener("click", () => {
        ventanaLogin?.classList.add("oculto");
        ventanaRecuperacion?.classList.add("oculto");
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