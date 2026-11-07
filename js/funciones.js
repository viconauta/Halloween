/* ==============================================================================
 * 1. SECCIÓN DE HISTORIAS DE TERROR
 * ============================================================================== */

/* Carga el vídeo y la descripción de una historia aleatoria en la página. */
export function cargarHistoria(historia, num) {
    const contenedorVideo = document.querySelector(".video");
    const contenedorDesc = document.querySelector(".descripcion");

    if (!contenedorVideo || !contenedorDesc || !historia[num]) {
        return;
    }

    const item = historia[num];

    contenedorVideo.innerHTML = `
        <div class="teatro-historia" id="teatro-historia" aria-label="Telón de la historia">
            <div class="telon telon-izquierdo" aria-hidden="true"></div>
            <div class="telon telon-derecho" aria-hidden="true"></div>
            <button class="btn boton-telon" id="abrir-historia" type="button">Abrir el telón</button>
        </div>
        <iframe id="video-historia"
            width="560" height="315"
            data-src="${item.enlace}"
            title="${item.titulo}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;

    contenedorDesc.innerHTML = `
        <h3>${item.titulo}</h3>
        <p>${item.descripcion}</p>
    `;
}

/* Devuelve un número entero aleatorio entre 0 y (max - 1). */
export function numeroAleatorio(max) {
    return Math.floor(Math.random() * max);
}

/* ==============================================================================
 * 2. SECCIÓN DE RECETAS
 * ============================================================================== */

/**
 * Genera la estructura HTML de una tarjeta de receta reversible.
 */
function generarTarjetaReceta(receta) {
    const ingredientesHtml = receta.ingredientes
        .map(ing => `<p>• ${ing}</p>`)
        .join("");

    return `
        <article class="contenedor-tarjeta">
            <div class="front tarjeta">
                <div class="contenedor-img">
                    <img src="${receta.imagen}" alt="${receta.nombre}" loading="lazy">
                </div>
                <div class="contenedor-datos">
                    <h3>${receta.nombre}</h3>
                    <p>${receta.descripcion}</p>
                </div>
            </div>
            <div class="back tarjeta">
                <h3>Ingredientes</h3>
                ${ingredientesHtml}
            </div>
        </article>
    `;
}

/**
 * Muestra las 3 recetas con mayor puntuación en el contenedor de populares.
 */
export function recetasTop(recetas) {
    const seccion = document.querySelector(".recetas-populares");
    if (!seccion) return;

    const top = [...recetas]
        .sort((a, b) => b.puntuacion - a.puntuacion)
        .slice(0, 3);

    seccion.innerHTML = top.map(generarTarjetaReceta).join("");
}

/**
 * Muestra las recetas saladas.
 */
export function recetasSaladas(recetas, tipo = "salado") {
    const seccion = document.querySelector(".salados");
    if (!seccion) return;

    const filtradas = recetas.filter(r => r.tipo === tipo);
    seccion.innerHTML = `<h2>Aperitivos Salados</h2>` + filtradas.map(generarTarjetaReceta).join("");
}

/**
 * Muestra los postres y dulces de Halloween.
 */
export function recetasDulces(recetas, tipo = "dulce") {
    const seccion = document.querySelector(".dulces");
    if (!seccion) return;

    const filtradas = recetas.filter(r => r.tipo === tipo);
    seccion.innerHTML = `<h2>Dulces y Pasteles</h2>` + filtradas.map(generarTarjetaReceta).join("");
}

/* ==============================================================================
 * 3. REPRODUCTOR DE AUDIOS Y EFECTOS DE TERROR
 * ============================================================================== */

let audioActivo = null;
let botonActivo = null;

/**
 * Crea botones interactivos con imagen para reproducir efectos y bandas sonoras.
 */
export function crearBtn(listaSonidos, contenedor) {
    if (!contenedor) return;

    listaSonidos.forEach(sonido => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "circulo-sonido";
        btn.title = sonido.nombre;
        btn.setAttribute("aria-label", sonido.nombre);

        const img = document.createElement("img");
        img.src = sonido.imagen;
        img.alt = sonido.nombre;
        btn.appendChild(img);

        btn.addEventListener("click", () => {
            // Si el mismo botón ya está activo, alternar pausa y reproducción
            if (botonActivo === btn && audioActivo) {
                if (audioActivo.paused) {
                    audioActivo.play();
                    btn.classList.add("sonando");
                } else {
                    audioActivo.pause();
                    btn.classList.remove("sonando");
                }
                return;
            }

            // Si hay otro audio sonando, detenerlo
            if (audioActivo) {
                audioActivo.pause();
                audioActivo.currentTime = 0;
                botonActivo?.classList.remove("sonando");
            }

            // Reproducir nuevo sonido
            const nuevoAudio = new Audio(sonido.audio);
            audioActivo = nuevoAudio;
            botonActivo = btn;

            nuevoAudio.play()
                .then(() => btn.classList.add("sonando"))
                .catch(err => console.warn("No se pudo reproducir el audio:", err));

            nuevoAudio.addEventListener("ended", () => {
                btn.classList.remove("sonando");
                if (audioActivo === nuevoAudio) {
                    audioActivo = null;
                    botonActivo = null;
                }
            });
        });

        contenedor.appendChild(btn);
    });
}

/* ==============================================================================
 * 4. LUGARES MISTERIOSOS EN GRANADA (GOOGLE MAPS MODAL)
 * ============================================================================== */

/**
 * Renderiza los lugares de terror de Granada y gestiona el modal del mapa.
 */
export function mostrarLugares(lugares) {
    const contenedor = document.getElementById("lugares");
    if (!contenedor) return;

    contenedor.innerHTML = lugares.map((lugar, i) => `
        <article class="tarjeta-lugar">
            <div class="imagen-lugar">
                <img src="${lugar.imagen}" alt="${lugar.nombre}" loading="lazy">
                <button
                    type="button"
                    class="boton-mapa"
                    data-indice="${i}"
                    title="Ver ubicación en Google Maps"
                    aria-label="Ver ubicación de ${lugar.nombre}">
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

    // Asignar evento para abrir el mapa
    contenedor.querySelectorAll(".boton-mapa").forEach(boton => {
        boton.addEventListener("click", () => {
            const index = Number(boton.dataset.indice);
            abrirMapa(lugares[index]);
        });
    });
}

/**
 * Muestra el iframe de Google Maps dentro del modal interactivo.
 */
function abrirMapa(lugar) {
    const modal = document.getElementById("modal-mapa");
    const iframe = document.getElementById("iframe-mapa");
    const titulo = document.getElementById("titulo-mapa");
    const enlaceAmpliar = document.getElementById("ampliar-mapa");

    if (!modal || !iframe || !titulo) return;

    const busqueda = `${lugar.nombre}, Granada`;
    let urlEmbed = `https://www.google.com/maps?q=${encodeURIComponent(busqueda)}&output=embed`;

    if (lugar.enlace.includes("/maps/embed")) {
        urlEmbed = lugar.enlace;
    }

    iframe.src = urlEmbed;
    titulo.textContent = lugar.nombre;
    if (enlaceAmpliar) {
        enlaceAmpliar.href = lugar.enlace;
    }

    modal.classList.add("activo");
}

/**
 * Asigna los eventos de cierre del modal del mapa (botón, clic fuera o Escape).
 */
export function cerrarMapa() {
    const modal = document.getElementById("modal-mapa");
    const botonCerrar = document.getElementById("cerrar-mapa");
    const iframe = document.getElementById("iframe-mapa");

    if (!modal) return;

    const ocultar = () => {
        modal.classList.remove("activo");
        if (iframe) iframe.src = "";
    };

    botonCerrar?.addEventListener("click", ocultar);

    modal.addEventListener("click", e => {
        if (e.target === modal) ocultar();
    });

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && modal.classList.contains("activo")) {
            ocultar();
        }
    });
}

/* ==============================================================================
 * 5. SECCIÓN MI CUENTA (PERFIL DE USUARIO)
 * ============================================================================== */

/**
 * Inicializa la consulta y edición de datos del usuario en miCuenta.html.
 */
export async function inicializarMiCuenta() {
    const contenedorDatos = document.getElementById("datos");
    const estado = document.getElementById("estado-cuenta");
    const formularioContenedor = document.getElementById("formulario-edicion");
    const botonesEdicion = document.querySelectorAll("#editar-datos [data-campo]");

    if (!contenedorDatos || !estado) return;

    let perfil = {
        nombre: "No indicado",
        fecha: "",
        email: "No indicado",
        seguridad: "No configurada"
    };

    // Actualiza los elementos del DOM con los valores en memoria
    function renderizarPerfil() {
        document.getElementById("nombre").textContent = perfil.nombre || "No indicado";
        document.getElementById("email").textContent = perfil.email || "No indicado";
        document.getElementById("seguridad").textContent = perfil.seguridad || "No configurada";

        const elemFecha = document.getElementById("fecha");
        if (elemFecha) {
            if (perfil.fecha) {
                const f = new Date(`${perfil.fecha}T00:00:00`);
                elemFecha.textContent = !isNaN(f.getTime())
                    ? f.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
                    : perfil.fecha;
            } else {
                elemFecha.textContent = "No indicada";
            }
        }
    }

    // Cargar datos actuales desde el servidor
    try {
        const respuesta = await fetch("./php/perfilCuenta.php", {
            headers: { Accept: "application/json" }
        });

        if (!respuesta.ok) {
            throw new Error("Inicia sesión para consultar o modificar tu perfil.");
        }

        const data = await respuesta.json();
        if (data.perfil) {
            perfil = { ...perfil, ...data.perfil };
            renderizarPerfil();
        }
    } catch (err) {
        estado.textContent = err.message;
        botonesEdicion.forEach(b => (b.disabled = true));
        return;
    }

    // Configuración de los campos editables
    const configCampos = {
        nombre: { titulo: "Cambiar nombre", tipo: "text", etiqueta: "Nuevo nombre:" },
        fecha: { titulo: "Cambiar fecha de nacimiento", tipo: "date", etiqueta: "Nueva fecha de nacimiento:" },
        email: { titulo: "Cambiar correo electrónico", tipo: "email", etiqueta: "Nuevo correo electrónico:" },
        seguridad: { titulo: "Cambiar pregunta de seguridad", tipo: "text", etiqueta: "Nueva pregunta de seguridad:" }
    };

    // Abrir formulario para un campo específico
    function abrirEdicion(campo) {
        const config = configCampos[campo];
        if (!config || !formularioContenedor) return;

        estado.textContent = "";
        formularioContenedor.innerHTML = `
            <form id="form-edicion">
                <h3>${config.titulo}</h3>
                <label for="input-editar">${config.etiqueta}</label>
                <input type="${config.tipo}" id="input-editar" name="${campo}" value="${perfil[campo] || ''}" required>
                <div class="acciones-formulario">
                    <button type="submit" class="btn">Guardar cambios</button>
                    <button type="button" id="btn-cancelar" class="boton-secundario">Cancelar</button>
                </div>
            </form>
        `;

        const form = document.getElementById("form-edicion");
        const input = document.getElementById("input-editar");
        const btnCancelar = document.getElementById("btn-cancelar");

        btnCancelar.addEventListener("click", () => {
            formularioContenedor.innerHTML = "";
            estado.textContent = "Edición cancelada.";
        });

        form.addEventListener("submit", async e => {
            e.preventDefault();
            const nuevoValor = input.value.trim();
            if (!nuevoValor && campo === "nombre") return;

            const perfilActualizado = { ...perfil, [campo]: nuevoValor };
            estado.textContent = "Guardando cambios...";

            try {
                const resp = await fetch("./php/perfilCuenta.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(perfilActualizado)
                });

                const resultado = await resp.json();
                if (!resp.ok) {
                    throw new Error(resultado.error || "No se pudieron guardar los cambios.");
                }

                if (resultado.perfil) {
                    perfil = { ...perfil, ...resultado.perfil };
                    renderizarPerfil();
                }

                estado.textContent = resultado.mensaje || "¡Perfil actualizado con éxito!";
                formularioContenedor.innerHTML = "";
            } catch (errorGuardar) {
                estado.textContent = errorGuardar.message;
            }
        });
    }

    botonesEdicion.forEach(b => {
        b.addEventListener("click", () => abrirEdicion(b.dataset.campo));
    });
}
