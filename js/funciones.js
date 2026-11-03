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