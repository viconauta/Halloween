/* ==============================================================================
HISTORIA
================================================================================*/
export function cargarHistoria(historia, num) {
    const contenedorVideo = document.querySelector(".video");
    if(contenedorVideo){
        const contenidoVideo = `
        <iframe id="video-historia" width="560" height="315" data-src="${historia[num].enlace}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        `;
        
        const contenedorDesc = document.querySelector(".descripcion");
        const contenidoDesc = `
            <h3>${historia[num].titulo}</h3>
            <p>${historia[num].descripcion}</p>
        `;

        contenedorVideo.insertAdjacentHTML("beforeend", contenidoVideo);
        contenedorDesc.insertAdjacentHTML("beforeend", contenidoDesc);
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

                <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy">

                <button
                    type="button"
                    class="boton-mapa"
                    data-indice="${indice}"
                    title="Ver ubicación en Google Maps"
                    aria-label="Ver ubicación de ${lugar.nombre}"
                    aria-haspopup="dialog"
                    aria-expanded="false">
                    <span aria-hidden="true">⌖</span>
                    <span>Ver mapa</span>
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

            abrirMapa(lugar, boton);

        });

    });

}


// Abrir la ventana del mapa
function abrirMapa(lugar, botonOrigen) {

    const modal = document.getElementById("modal-mapa");
    const iframe = document.getElementById("iframe-mapa");
    const titulo = document.getElementById("titulo-mapa");
    const ampliar = document.getElementById("ampliar-mapa");

    if (!modal || !iframe || !titulo || !ampliar) {
        console.error("No se puede abrir el mapa: faltan elementos del modal.");
        return;
    }

    const busqueda = `${lugar.nombre}, Granada`;
    let urlMapa = `https://www.google.com/maps?q=${encodeURIComponent(busqueda)}&output=embed`;
    let urlAmpliar = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;

    try {
        const enlace = new URL(lugar.enlace);
        const esGoogleMaps = enlace.hostname === "google.com" || enlace.hostname.endsWith(".google.com");

        if (esGoogleMaps && enlace.pathname === "/maps/search/") {
            const consulta = enlace.searchParams.get("query") || busqueda;
            urlMapa = `https://www.google.com/maps?q=${encodeURIComponent(consulta)}&output=embed`;
            urlAmpliar = lugar.enlace;
        } else if (esGoogleMaps && enlace.pathname === "/maps/embed" && enlace.searchParams.has("pb")) {
            urlMapa = lugar.enlace;
            urlAmpliar = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(busqueda)}`;
        }
    } catch (error) {
        console.error(`Enlace de Google Maps no válido para "${lugar.nombre}".`, error);
    }

    iframe.src = urlMapa;
    titulo.textContent = lugar.nombre;
    ampliar.href = urlAmpliar;
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("activo");
    document.getElementById("cerrar-mapa")?.focus();
    botonOrigen.setAttribute("aria-expanded", "true");

    modal.dataset.botonOrigen = botonOrigen.dataset.indice;

}


// Cerrar la ventana del mapa
export function cerrarMapa() {

    const modal = document.getElementById("modal-mapa");
    const iframe = document.getElementById("iframe-mapa");
    const botonCerrar = document.getElementById("cerrar-mapa");

    if (!modal || !iframe || !botonCerrar) {
        return;
    }

    const cerrar = () => {
        if (!modal.classList.contains("activo")) {
            return;
        }

        modal.classList.remove("activo");
        modal.setAttribute("aria-hidden", "true");
        iframe.src = "";
        const botonOrigen = modal.dataset.botonOrigen;
        if (botonOrigen !== undefined) {
            const botonMapa = document.querySelector(`.boton-mapa[data-indice="${botonOrigen}"]`);
            botonMapa?.setAttribute("aria-expanded", "false");
            botonMapa?.focus();
        }
    };

    botonCerrar.addEventListener("click", () => {
        cerrar();
    });

    // Cerrar al pulsar fuera del mapa
    modal.addEventListener("click", evento => {

        if (evento.target === modal) {
            cerrar();
        }

    });

    // Cerrar pulsando Escape
    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {
            cerrar();
        }

    });

}

/*=====================================================
MI CUENTA
=======================================================*/

export function inicializarMiCuenta() {
    const contenedorDatos = document.getElementById("datos");
    const contenedorFormulario = document.getElementById("formulario-edicion");
    const estado = document.getElementById("estado-cuenta");
    const botonesEdicion = document.querySelectorAll("#editar-datos [data-campo]");

    if (!contenedorDatos || !contenedorFormulario || !estado || botonesEdicion.length === 0) {
        return;
    }

    const campos = {
        nombre: {
            titulo: "Cambiar nombre",
            etiqueta: "Nuevo nombre",
            tipo: "text",
            placeholder: "Introduce tu nombre",
            autocomplete: "name"
        },
        fecha: {
            titulo: "Cambiar fecha de nacimiento",
            etiqueta: "Nueva fecha de nacimiento",
            tipo: "date",
            placeholder: "",
            autocomplete: "bday"
        },
        email: {
            titulo: "Cambiar correo electrónico",
            etiqueta: "Nuevo correo electrónico",
            tipo: "email",
            placeholder: "nombre@ejemplo.com",
            autocomplete: "email"
        },
        seguridad: {
            titulo: "Cambiar pregunta de seguridad",
            etiqueta: "Nueva pregunta de seguridad",
            tipo: "text",
            placeholder: "Escribe tu pregunta",
            autocomplete: "off"
        }
    };

    const valoresPorDefecto = {
        nombre: "No indicado",
        fecha: "",
        email: "No indicado",
        seguridad: "No configurada"
    };
    const perfil = { ...valoresPorDefecto };

    try {
        const perfilGuardado = localStorage.getItem("granaween-perfil");
        if (perfilGuardado) {
            const datosGuardados = JSON.parse(perfilGuardado);
            if (typeof datosGuardados !== "object" || datosGuardados === null || Array.isArray(datosGuardados)) {
                throw new TypeError("El perfil guardado no tiene un formato válido.");
            }

            Object.keys(campos).forEach(campo => {
                if (typeof datosGuardados[campo] === "string") {
                    perfil[campo] = datosGuardados[campo];
                }
            });
        }
    } catch (error) {
        console.error("No se pudo cargar el perfil guardado.", error);
        estado.textContent = "No se pudieron cargar los datos guardados.";
    }

    function mostrarValor(campo) {
        const elemento = document.getElementById(campo);
        if (!elemento) {
            return;
        }

        const valor = perfil[campo];
        if (campo === "fecha" && valor) {
            const fecha = new Date(`${valor}T00:00:00`);
            elemento.textContent = Number.isNaN(fecha.getTime())
                ? valor
                : fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
            return;
        }

        elemento.textContent = valor || valoresPorDefecto[campo];
    }

    Object.keys(campos).forEach(mostrarValor);

    function cerrarFormulario() {
        contenedorFormulario.replaceChildren();
    }

    function abrirFormulario(campo) {
        const configuracion = campos[campo];
        if (!configuracion) {
            return;
        }

        estado.textContent = "";
        contenedorFormulario.replaceChildren();

        const titulo = document.createElement("h3");
        titulo.textContent = configuracion.titulo;

        const formulario = document.createElement("form");
        formulario.id = "form-edicion";

        const etiqueta = document.createElement("label");
        etiqueta.htmlFor = "nuevo-valor";
        etiqueta.textContent = configuracion.etiqueta;

        const entrada = document.createElement("input");
        entrada.type = configuracion.tipo;
        entrada.id = "nuevo-valor";
        entrada.name = campo;
        entrada.placeholder = configuracion.placeholder;
        entrada.autocomplete = configuracion.autocomplete;
        entrada.required = true;
        if (configuracion.tipo === "date") {
            entrada.value = perfil[campo];
        } else {
            entrada.maxLength = 120;
            entrada.value = perfil[campo] === valoresPorDefecto[campo] ? "" : perfil[campo];
        }

        const acciones = document.createElement("div");
        acciones.className = "acciones-formulario";

        const botonGuardar = document.createElement("button");
        botonGuardar.type = "submit";
        botonGuardar.textContent = "Guardar cambios";

        const botonCancelar = document.createElement("button");
        botonCancelar.type = "button";
        botonCancelar.className = "boton-secundario";
        botonCancelar.textContent = "Cancelar";

        acciones.append(botonGuardar, botonCancelar);
        formulario.append(titulo, etiqueta, entrada, acciones);
        contenedorFormulario.appendChild(formulario);
        entrada.focus();

        formulario.addEventListener("submit", evento => {
            evento.preventDefault();
            const nuevoValor = entrada.value.trim();

            if (!nuevoValor) {
                entrada.focus();
                return;
            }

            perfil[campo] = nuevoValor;
            mostrarValor(campo);

            try {
                localStorage.setItem("granaween-perfil", JSON.stringify(perfil));
                estado.textContent = "Cambios guardados correctamente.";
            } catch (error) {
                console.error("No se pudieron guardar los cambios del perfil.", error);
                estado.textContent = "El cambio se aplicó, pero no se pudo guardar para la próxima visita.";
            }

            cerrarFormulario();
        });

        botonCancelar.addEventListener("click", () => {
            cerrarFormulario();
            estado.textContent = "Edición cancelada.";
        });
    }

    botonesEdicion.forEach(boton => {
        boton.addEventListener("click", () => abrirFormulario(boton.dataset.campo));
    });
}
