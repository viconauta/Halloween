// Configuración inicial del juego
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elementos de la interfaz de usuario
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

// Tamaño del grid
const GRID_SIZE = 20; // Rejilla de 20x20
const TILE_COUNT = canvas.width / GRID_SIZE; // 400 / 20 = 20 celdas

// Estado del Juego
let snake = [];
let food = { x: 0, y: 0 };
let dx = GRID_SIZE; // Dirección X (empieza moviéndose a la derecha)
let dy = 0;         // Dirección Y
let nextDx = GRID_SIZE; // Para evitar cambios bruscos de dirección en el mismo frame
let nextDy = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('snake_high_score')) || 0;
let gameLoopTimer = null;
let isRunning = false;
let isPaused = false;
const GAME_SPEED = 120; // Milisegundos por frame (menor = más rápido)

// Inicializar pantalla con récord guardado
highScoreEl.textContent = highScore;

// --- Funciones Principales ---

// Inicia o reinicia el estado de las variables
function initGame() {
// Posición inicial de la serpiente (3 segmentos centrados)
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
scoreEl.textContent = score;

spawnFood();
draw();
}

// Genera comida en una posición aleatoria sin colisionar con la serpiente
function spawnFood() {
let validPosition = false;
while (!validPosition) {
    food.x = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;
    food.y = Math.floor(Math.random() * TILE_COUNT) * GRID_SIZE;

    // Comprobar que no aparezca sobre la serpiente
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
}
}

// Bucle principal de actualización
function update() {
if (!isRunning || isPaused) return;

// Aplicar dirección elegida
dx = nextDx;
dy = nextDy;

// Calcular nueva posición de la cabeza
const head = { x: snake[0].x + dx, y: snake[0].y + dy };

// 1. Colisión con Paredes
if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    gameOver();
    return;
}

// 2. Colisión con el propio cuerpo
if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
}

// Mover serpiente insertando nueva cabeza
snake.unshift(head);

// 3. Comprobar si come la fruta
if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;

    // Actualizar Récord si corresponde
    if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snake_high_score', highScore);
    }

    spawnFood();
} else {
    // Eliminar el último segmento si no comió
    snake.pop();
}

draw();
}

// Dibujar elementos en el canvas
function draw() {
// Fondo
ctx.fillStyle = '#0f172a';
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Dibujar rejilla suave
ctx.strokeStyle = '#1e293b';
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

// Dibujar Comida (Manzana roja con borde brillante)
ctx.fillStyle = '#ef4444';
ctx.beginPath();
ctx.arc(
    food.x + GRID_SIZE / 2, 
    food.y + GRID_SIZE / 2, 
    GRID_SIZE / 2 - 2, 
    0, 
    Math.PI * 2
);
ctx.fill();

// Dibujar Serpiente
snake.forEach((segment, index) => {
    // La cabeza tiene un verde diferente a las partes del cuerpo
    if (index === 0) {
        ctx.fillStyle = '#4ade80'; // Cabeza verde brillante
    } else {
        ctx.fillStyle = '#22c55e'; // Cuerpo verde estándar
    }

    // Dibujar bloque redondeado
    ctx.beginPath();
    ctx.roundRect(
        segment.x + 1, 
        segment.y + 1, 
        GRID_SIZE - 2, 
        GRID_SIZE - 2, 
        index === 0 ? 6 : 4
    );
    ctx.fill();

    // Ojos en la cabeza
    if (index === 0) {
        ctx.fillStyle = '#022c22';
        const eyeOffset = 5;
        const eyeSize = 3;

        let eye1 = { x: 0, y: 0 };
        let eye2 = { x: 0, y: 0 };

        if (dx > 0) { // Derecha
            eye1 = { x: segment.x + 14, y: segment.y + 5 };
            eye2 = { x: segment.x + 14, y: segment.y + 13 };
        } else if (dx < 0) { // Izquierda
            eye1 = { x: segment.x + 4, y: segment.y + 5 };
            eye2 = { x: segment.x + 4, y: segment.y + 13 };
        } else if (dy < 0) { // Arriba
            eye1 = { x: segment.x + 5, y: segment.y + 4 };
            eye2 = { x: segment.x + 13, y: segment.y + 4 };
        } else if (dy > 0) { // Abajo
            eye1 = { x: segment.x + 5, y: segment.y + 14 };
            eye2 = { x: segment.x + 13, y: segment.y + 14 };
        }

        ctx.beginPath();
        ctx.arc(eye1.x, eye1.y, eyeSize / 2, 0, Math.PI * 2);
        ctx.arc(eye2.x, eye2.y, eyeSize / 2, 0, Math.PI * 2);
        ctx.fill();
    }
});
}

// Cambiar la dirección evitando giros de 180°
function changeDirection(newDx, newDy) {
// Evitar revertir dirección (e.g. ir a la izquierda cuando vas a la derecha)
if (newDx === -dx && newDx !== 0) return;
if (newDy === -dy && newDy !== 0) return;

nextDx = newDx;
nextDy = newDy;
}

// Iniciar el juego
function startGame() {
initGame();
isRunning = true;
isPaused = false;
overlay.classList.add('hidden');
pauseBtn.innerHTML = '<span>⏸️</span> Pausar';

if (gameLoopTimer) clearInterval(gameLoopTimer);
gameLoopTimer = setInterval(update, GAME_SPEED);
}

// Alternar pausa
function togglePause() {
if (!isRunning) return;

isPaused = !isPaused;
if (isPaused) {
    overlayTitle.textContent = 'PAUSA';
    overlaySubtitle.textContent = 'El juego está en pausa.';
    startBtn.textContent = 'CONTINUAR';
    overlay.classList.remove('hidden');
    pauseBtn.innerHTML = '<span>▶️</span> Reanudar';
} else {
    overlay.classList.add('hidden');
    pauseBtn.innerHTML = '<span>⏸️</span> Pausar';
}
}

// Fin de la partida
function gameOver() {
isRunning = false;
clearInterval(gameLoopTimer);

overlayTitle.textContent = '¡GAME OVER!';
overlaySubtitle.innerHTML = `Puntuación obtenida: <span class="text-yellow-400 font-bold">${score}</span>`;
startBtn.textContent = 'REINTENTAR';
overlay.classList.remove('hidden');
}

// --- Manejo de Eventos ---

// Controles de teclado
window.addEventListener('keydown', (e) => {
// Si se presiona una tecla de dirección y la pantalla superpuesta está activa, iniciar juego
if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
    if (!isRunning) {
        startGame();
        return;
    }
}

switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
        changeDirection(0, -GRID_SIZE);
        break;
    case 'ArrowDown':
    case 's':
    case 'S':
        changeDirection(0, GRID_SIZE);
        break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
        changeDirection(-GRID_SIZE, 0);
        break;
    case 'ArrowRight':
    case 'd':
    case 'D':
        changeDirection(GRID_SIZE, 0);
        break;
    case ' ':
        togglePause();
        break;
}
});

// Controles Táctiles (D-Pad en pantalla)
document.getElementById('btnUp').addEventListener('click', () => {
if (!isRunning) startGame();
changeDirection(0, -GRID_SIZE);
});
document.getElementById('btnDown').addEventListener('click', () => {
if (!isRunning) startGame();
changeDirection(0, GRID_SIZE);
});
document.getElementById('btnLeft').addEventListener('click', () => {
if (!isRunning) startGame();
changeDirection(-GRID_SIZE, 0);
});
document.getElementById('btnRight').addEventListener('click', () => {
if (!isRunning) startGame();
changeDirection(GRID_SIZE, 0);
});

// Botones de UI
startBtn.addEventListener('click', () => {
if (isPaused) {
    togglePause();
} else {
    startGame();
}
});

pauseBtn.addEventListener('click', togglePause);
restartBtn.addEventListener('click', startGame);

// Renderizado inicial en pantalla
initGame();