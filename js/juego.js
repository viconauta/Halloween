/**
 * juego.js
 * Lógica del minijuego Snake de Halloween para DAWlloween.
 * JavaScript vainilla puro, renderizado con HTML5 Canvas.
 */

// Elementos del DOM y contexto Canvas
const canvas = document.getElementById("gameCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;

const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlaySubtitle = document.getElementById("overlaySubtitle");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

// Constantes de configuración de la cuadrícula
const GRID_SIZE = 20; // 20px por celda
const TILE_COUNT = canvas ? canvas.width / GRID_SIZE : 20; // 400 / 20 = 20 celdas
const GAME_SPEED = 120; // Milisegundos entre fotogramas

// Variables de estado del juego
let snake = [];
let food = { x: 0, y: 0 };
let dx = GRID_SIZE;
let dy = 0;
let nextDx = GRID_SIZE;
let nextDy = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem("snake_high_score"), 10) || 0;
let gameLoopTimer = null;
let isRunning = false;
let isPaused = false;

// Inicializar récord visual
if (highScoreEl) {
    highScoreEl.textContent = highScore;
}

/**
 * Reinicia las variables al estado inicial de la partida.
 */
function initGame() {
    snake = [
        { x: 10 * GRID_SIZE, y: 10 * GRID_SIZE },
        { x: 9 * GRID_SIZE, y: 10 * GRID_SIZE },
        { x: 8 * GRID_SIZE, y: 10 * GRID_SIZE }
    ];

    dx = GRID_SIZE;
    dy = 0;
    nextDx = GRID_SIZE;
    nextDy = 0;
    score = 0;

    if (scoreEl) scoreEl.textContent = score;

    spawnFood();
    draw();
}

/**
 * Genera una nueva calabaza de comida en una posición libre de la cuadrícula.
 */
function spawnFood() {
    let validPosition = false;
    while (!validPosition) {
        food.x = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;
        food.y = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;

        // Comprobar que no coincida con ningún segmento del cuerpo
        validPosition = !snake.some(seg => seg.x === food.x && seg.y === food.y);
    }
}

/**
 * Actualiza la posición de la serpiente y comprueba colisiones.
 */
function update() {
    if (!isRunning || isPaused || !canvas) return;

    dx = nextDx;
    dy = nextDy;

    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 1. Colisión con los bordes del canvas
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }

    // 2. Colisión con su propio cuerpo
    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver();
        return;
    }

    // Avanzar la cabeza
    snake.unshift(head);

    // 3. Comprobar si come la calabaza
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (scoreEl) scoreEl.textContent = score;

        if (score > highScore) {
            highScore = score;
            if (highScoreEl) highScoreEl.textContent = highScore;
            localStorage.setItem("snake_high_score", highScore);
        }

        spawnFood();
    } else {
        // Eliminar cola si no ha comido en este paso
        snake.pop();
    }

    draw();
}

/**
 * Dibuja el escenario, la calabaza y la serpiente en el Canvas.
 */
function draw() {
    if (!ctx || !canvas) return;

    // Fondo oscuro
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rejilla sutil
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Dibujar calabaza (comida)
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.ellipse(
        food.x + GRID_SIZE / 2,
        food.y + GRID_SIZE / 2 + 2,
        GRID_SIZE / 2 - 2,
        GRID_SIZE / 2 - 3,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Tallo verde de la calabaza
    ctx.fillStyle = "#4d7c0f";
    ctx.fillRect(food.x + GRID_SIZE / 2 - 1, food.y + 2, 3, 5);

    // Dibujar serpiente
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? "#4ade80" : "#22c55e";

        // Segmento redondeado
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2, index === 0 ? 6 : 4);
        } else {
            ctx.rect(segment.x + 1, segment.y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
        }
        ctx.fill();

        // Ojos de la cabeza
        if (index === 0) {
            ctx.fillStyle = "#022c22";
            const eyeSize = 3;
            let e1 = { x: segment.x + 5, y: segment.y + 5 };
            let e2 = { x: segment.x + 14, y: segment.y + 5 };

            if (dx > 0) { // Derecha
                e1 = { x: segment.x + 14, y: segment.y + 5 };
                e2 = { x: segment.x + 14, y: segment.y + 13 };
            } else if (dx < 0) { // Izquierda
                e1 = { x: segment.x + 5, y: segment.y + 5 };
                e2 = { x: segment.x + 5, y: segment.y + 13 };
            } else if (dy > 0) { // Abajo
                e1 = { x: segment.x + 5, y: segment.y + 14 };
                e2 = { x: segment.x + 13, y: segment.y + 14 };
            }

            ctx.beginPath();
            ctx.arc(e1.x, e1.y, eyeSize / 2, 0, Math.PI * 2);
            ctx.arc(e2.x, e2.y, eyeSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

/**
 * Cambia la dirección evitando giros suicidas de 180 grados.
 */
function changeDirection(newDx, newDy) {
    if (newDx === -dx && newDx !== 0) return;
    if (newDy === -dy && newDy !== 0) return;

    nextDx = newDx;
    nextDy = newDy;
}

/**
 * Inicia o reanuda la partida.
 */
function startGame() {
    initGame();
    isRunning = true;
    isPaused = false;

    overlay?.classList.add("hidden");
    if (pauseBtn) pauseBtn.innerHTML = "<span>⏸️</span> Pausar";

    if (gameLoopTimer) clearInterval(gameLoopTimer);
    gameLoopTimer = setInterval(update, GAME_SPEED);
}

/**
 * Alterna entre pausa y juego activo.
 */
function togglePause() {
    if (!isRunning) return;

    isPaused = !isPaused;
    if (isPaused) {
        if (overlayTitle) overlayTitle.textContent = "PAUSA";
        if (overlaySubtitle) overlaySubtitle.textContent = "El juego está en pausa.";
        if (startBtn) startBtn.textContent = "CONTINUAR";
        overlay?.classList.remove("hidden");
        if (pauseBtn) pauseBtn.innerHTML = "<span>▶️</span> Reanudar";
    } else {
        overlay?.classList.add("hidden");
        if (pauseBtn) pauseBtn.innerHTML = "<span>⏸️</span> Pausar";
    }
}

/**
 * Gestiona el final de la partida.
 */
function gameOver() {
    isRunning = false;
    clearInterval(gameLoopTimer);

    if (overlayTitle) overlayTitle.textContent = "¡GAME OVER!";
    if (overlaySubtitle) {
        overlaySubtitle.innerHTML = `Puntuación obtenida: <strong style="color: #facc15;">${score}</strong>`;
    }
    if (startBtn) startBtn.textContent = "REINTENTAR";
    overlay?.classList.remove("hidden");
}

/* ==============================================================================
 * GESTIÓN DE CONTROLES (TECLADO Y PANTALLA TÁCTIL)
 * ============================================================================== */

// Teclado
window.addEventListener("keydown", e => {
    const direcciones = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"];

    if (direcciones.includes(e.key) && !isRunning) {
        startGame();
        return;
    }

    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            changeDirection(0, -GRID_SIZE);
            break;
        case "ArrowDown":
        case "s":
        case "S":
            changeDirection(0, GRID_SIZE);
            break;
        case "ArrowLeft":
        case "a":
        case "A":
            changeDirection(-GRID_SIZE, 0);
            break;
        case "ArrowRight":
        case "d":
        case "D":
            changeDirection(GRID_SIZE, 0);
            break;
        case " ":
            togglePause();
            break;
    }
});

// Controles en pantalla para dispositivos móviles (D-Pad)
const setupTouchBtn = (id, newDx, newDy) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("click", () => {
        if (!isRunning) startGame();
        changeDirection(newDx, newDy);
    });
};

setupTouchBtn("btnUp", 0, -GRID_SIZE);
setupTouchBtn("btnDown", 0, GRID_SIZE);
setupTouchBtn("btnLeft", -GRID_SIZE, 0);
setupTouchBtn("btnRight", GRID_SIZE, 0);

// Botones de interfaz
startBtn?.addEventListener("click", () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

pauseBtn?.addEventListener("click", togglePause);
restartBtn?.addEventListener("click", startGame);

// Render inicial
if (canvas) {
    initGame();
}
