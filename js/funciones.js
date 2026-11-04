/* ==============================================================================
HISTORIA
================================================================================*/
export function cargarHistoria(historia, num) {
    const contenedorVideo = document.querySelector(".video");
    if(contenedorVideo){
        const contenidoVideo = `
        <iframe width="560" height="315" src=${historia[num].enlace} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        `;
        
        const contenedorDesc = document.querySelector(".descripcion");
        const contenidoDesc = `
            <h3>${historia[num].titulo}</h3>
            <p>${historia[num].descripcion}</p>
        `;

        contenedorVideo.innerHTML += contenidoVideo;
        contenedorDesc.innerHTML += contenidoDesc;
    }
}

export function numeroAleatorio(num) {
    return Math.floor(Math.random() * num);
}


/* ==============================================================================
RECETAS
================================================================================*/
//mostrar tarjeta para las recetas
function mostrarTarjeta(a) {
    return `
        <article class="contenedor-tarjeta">
            <div class="front tarjeta">
                <div class="contenedor-img">
                    <img src="${a.imagen}" alt="${a.nombre}">
                </div>
                <div class="contenedor-datos">
                    <h3>${a.nombre}</h3>
                    <p>${a.descripcion}</p>
                </div>
            </div>
            <div class="back tarjeta">
                <h3>Ingredientes</h3>
                ${a.ingredientes.map(ingrediente => `<p>${ingrediente}</p>`).join("")}
            </div>
        </article>`;
}

//funcion para mostrar las recetas top
export function recetasTop(recetas) {
    const seccionTop = document.querySelector(".recetas-populares");
    if(seccionTop) {
        const recetasPopulares = [...recetas].sort((a, b) => b.puntuacion - a.puntuacion).slice(0, 3);
        const contenido = recetasPopulares.map((a) => mostrarTarjeta(a)).join("");
        seccionTop.innerHTML += contenido;
    }
}

//funcion para mostrar las recetas saladas
export function recetasSaladas(recetas, tipo) {
    const seccionSalada = document.querySelector(".salados");
    if(seccionSalada) {
        const recetaSalada = recetas.filter(a => a.tipo === tipo);
        const contenido = recetaSalada.map(a => mostrarTarjeta(a)).join("");
        seccionSalada.innerHTML += contenido;
    }
}

//funcion para mostrar las recetas de pasteles
export function recetasDulces(recetas, tipo) {
    const seccionDulce = document.querySelector(".dulces");
    if(seccionDulce) {
        const recetaDulce = recetas.filter(a => a.tipo === tipo);
        const contenido = recetaDulce.map(a => mostrarTarjeta(a)).join("");
        seccionDulce.innerHTML += contenido;
    }
}

/* ========================================================================
AUDIOS DE TERROR
=========================================================================== */


// Variables para controlar el audio actual
let audioActual = null;
let btnActual = null;

export function crearBtn(datos, contenedor) {

    datos.forEach(sonido => {

        const btn = document.createElement("button");

        btn.type = "button";
        btn.classList.add("circulo-sonido");
        btn.title = sonido.nombre;
        btn.setAttribute("aria-label", sonido.nombre);

        const imagen = document.createElement("img");
        imagen.src = sonido.imagen;
        imagen.alt = "";
        imagen.setAttribute("aria-hidden", "true");
        btn.appendChild(imagen);

        btn.addEventListener("click", () => {

            if (btnActual === btn && audioActual) {
                if (audioActual.paused) {
                    reproducirAudio(audioActual, btn);
                } else {
                    audioActual.pause();
                    btn.classList.remove("sonando");
                }
                return;
            }

            if (audioActual) {
                audioActual.pause();
                audioActual.currentTime = 0;
                btnActual.classList.remove("sonando");
            }

            const audio = new Audio(sonido.audio);
            audioActual = audio;
            btnActual = btn;

            audio.addEventListener("ended", () => {
                btn.classList.remove("sonando");
                if (audioActual === audio) {
                    audioActual = null;
                    btnActual = null;
                }
            });

            reproducirAudio(audio, btn);
        });

        contenedor.appendChild(btn);

    });
}

function reproducirAudio(audio, btn) {
    audio.play()
        .then(() => {
            if (audioActual === audio) {
                btn.classList.add("sonando");
            }
        })
        .catch(error => {
            if (audioActual !== audio) {
                return;
            }

            if (error.name === "AbortError" && audio.paused) {
                return;
            }

            btn.classList.remove("sonando");
            audioActual = null;
            btnActual = null;
            alert("No se ha podido reproducir el audio.");
        });
}

/* ==============================================================================
LUGARES DE GRANADA
================================================================================*/

// Mostrar las tarjetas de los lugares
export function mostrarLugares(granada) {

    const contenedor = document.getElementById("lugares");

    if (!contenedor) {
        return;
    }

    const contenido = granada.map((lugar, indice) => `
        <article class="tarjeta-lugar">

            <div class="imagen-lugar">

                <img src="${lugar.imagen}" alt="${lugar.nombre}">

                <button 
                    class="boton-mapa"
                    data-indice="${indice}"
                    title="Ver ubicación en Google Maps"
                    aria-label="Ver ubicación de ${lugar.nombre}">
                    <span>⌖</span>
                </button>

            </div>

            <div class="informacion-lugar">

                <h2>${lugar.nombre}</h2>

                <p>${lugar.descripcion}</p>

            </div>

        </article>
    `).join("");

    contenedor.innerHTML = contenido;

    // Eventos de los botones del mapa
    contenedor.querySelectorAll(".boton-mapa").forEach(boton => {

        boton.addEventListener("click", () => {

            const indice = boton.dataset.indice;
            const lugar = granada[indice];

            abrirMapa(lugar);

        });

    });

}


// Abrir la ventana del mapa
function abrirMapa(lugar) {

    const modal = document.getElementById("modal-mapa");
    const iframe = document.getElementById("iframe-mapa");
    const titulo = document.getElementById("titulo-mapa");
    const ampliar = document.getElementById("ampliar-mapa");

    const busqueda = `${lugar.nombre}, Granada`;

    iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(busqueda)}&output=embed`;

    titulo.textContent = lugar.nombre;

    ampliar.href = lugar.enlace;

    modal.classList.add("activo");

}


// Cerrar la ventana del mapa
export function cerrarMapa() {

    const modal = document.getElementById("modal-mapa");
    const iframe = document.getElementById("iframe-mapa");
    const botonCerrar = document.getElementById("cerrar-mapa");

    if (!modal || !iframe || !botonCerrar) {
        return;
    }

    botonCerrar.addEventListener("click", () => {

        modal.classList.remove("activo");
        iframe.src = "";

    });

    // Cerrar al pulsar fuera del mapa
    modal.addEventListener("click", evento => {

        if (evento.target === modal) {

            modal.classList.remove("activo");
            iframe.src = "";

        }

    });

    // Cerrar pulsando Escape
    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {

            modal.classList.remove("activo");
            iframe.src = "";

        }

    });

}