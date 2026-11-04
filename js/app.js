import { historias, audios } from "./datos.js";
import { numeroAleatorio, cargarHistoria, crearBtn } from "./funciones.js";

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

//cerrar ventanas
document.querySelectorAll(".cerrar-ventana").forEach((btn) => {
    btn.addEventListener("click", () => {
        ventanaRegistro.classList.add("oculto");
        ventanaLogin.classList.add("oculto");
        ventanaRecuperacion.classList.add("oculto");
    });
});

//cargar historia diaria
if (document.querySelector(".video") && document.querySelector(".descripcion")) {
    const num = numeroAleatorio(historias.length);
    cargarHistoria(historias, num);
}


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