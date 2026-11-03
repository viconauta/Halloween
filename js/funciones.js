export function cargarHistoria(historia, num) {
    const contenedorVideo = document.querySelector(".video");
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

export function numeroAleatorio(num) {
    let numero;
    return numero = Math.floor(Math.random() * num) + 1;
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

        btn.addEventListener("click", () => {

            // Si pulsamos el mismo botón, pausamos el audio
            if (btnActual === btn && audioActual && !audioActual.paused) {

                audioActual.pause();
                btn.classList.remove("sonando");

                return;
            }

            // Detenemos el audio anterior
            if (audioActual !== null) {

                audioActual.pause();
                audioActual.currentTime = 0;

                btnActual.classList.remove("sonando");
            }

            // Creamos el nuevo audio
            audioActual = new Audio(sonido.audio);
            btnActual = btn;

            // Reproducimos el audio
            audioActual.play()
                .then(() => {
                    btn.classList.add("sonando");
                })
                .catch(() => {
                    btn.classList.remove("sonando");
                    alert("No se ha podido reproducir el audio.");
                });

            // Cuando termina el audio
            audioActual.addEventListener("ended", () => {

                btn.classList.remove("sonando");
                audioActual = null;
                btnActual = null;

            });

        });

        contenedor.appendChild(btn);

    });
}
