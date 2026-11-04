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
    return Math.floor(Math.random() * num);
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
