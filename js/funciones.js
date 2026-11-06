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