// Game configuration
const config = {
    gridSize: 20,
    cellSize: 20,
    initialSpeed: 150,
    speedIncrease: 2,
    minSpeed: 50,
    wrapMode: true  // If true, snake wraps around edges; if false, walls cause game over
};

// Game state
let canvas, ctx;
let snake = [];
let food = { x: 0, y: 0 };
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let speed = config.initialSpeed;
let isPaused = false;
let isGameOver = false;

// Colors (default Nokia green style)
let colors = {
    background: '#8bac0f',
    snake: '#0f380f',
    food: '#306230'
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // Set fixed canvas size (will be scaled by CSS)
    canvas.width = 600;
    canvas.height = 600;

    // Load saved high score
    document.getElementById('highScore').textContent = highScore;

    // Setup event listeners
    setupControls();
    setupColorPickers();
    setupDifficulty();
    setupFullscreen();
    setupCollapsiblePanel();

    // Handle canvas sizing and scaling
    handleHiDPICanvas();

    // Start game
    resetGame();
    startGame();
}

function handleHiDPICanvas() {
    const dpr = window.devicePixelRatio || 1;

    // Get the content area size (excluding border)
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Resize canvas buffer for retina displays
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Reset transform and scale for high DPI
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Calculate cell size based on available content area
    config.cellSize = Math.floor(width / config.gridSize);
}

function resetGame() {
    // Initialize snake in the middle
    const startX = Math.floor(config.gridSize / 2);
    const startY = Math.floor(config.gridSize / 2);

    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];

    direction = 'right';
    nextDirection = 'right';
    score = 0;
    speed = config.initialSpeed;
    isPaused = false;
    isGameOver = false;

    document.getElementById('score').textContent = score;
    document.getElementById('gameOver').classList.add('hidden');

    spawnFood();
}

function startGame() {
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, speed);
}

function update() {
    if (isPaused || isGameOver) return;

    // Update direction
    direction = nextDirection;

    // Calculate new head position
    const head = { ...snake[0] };

    switch (direction) {
        case 'up': head.y -= 1; break;
        case 'down': head.y += 1; break;
        case 'left': head.x -= 1; break;
        case 'right': head.x += 1; break;
    }

    // Handle boundary based on wrap mode
    if (config.wrapMode) {
        // Wrap around edges
        if (head.x < 0) head.x = config.gridSize - 1;
        if (head.x >= config.gridSize) head.x = 0;
        if (head.y < 0) head.y = config.gridSize - 1;
        if (head.y >= config.gridSize) head.y = 0;
    } else {
        // Wall collision = game over
        if (head.x < 0 || head.x >= config.gridSize ||
            head.y < 0 || head.y >= config.gridSize) {
            gameOver();
            return;
        }
    }

    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    // Add new head
    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        document.getElementById('score').textContent = score;

        // Increase speed
        if (speed > config.minSpeed) {
            speed -= config.speedIncrease;
            clearInterval(gameLoop);
            gameLoop = setInterval(update, speed);
        }

        spawnFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    render();
}

function render() {
    const cellSize = config.cellSize;

    // Clear canvas with background color
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    // Draw grid (optional - subtle lines)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= config.gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, config.gridSize * cellSize);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(config.gridSize * cellSize, i * cellSize);
        ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = colors.food;
    ctx.fillRect(
        food.x * cellSize + 1,
        food.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
    );

    // Draw snake
    snake.forEach((segment, index) => {
        // Head is slightly different shade
        if (index === 0) {
            ctx.fillStyle = adjustBrightness(colors.snake, -10);
        } else {
            ctx.fillStyle = colors.snake;
        }

        ctx.fillRect(
            segment.x * cellSize + 1,
            segment.y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
        );

        // Add subtle highlight to head
        if (index === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(
                segment.x * cellSize + 1,
                segment.y * cellSize + 1,
                cellSize - 2,
                (cellSize - 2) / 4
            );
        }
    });
}

function spawnFood() {
    let newFood;
    let isOnSnake;

    do {
        newFood = {
            x: Math.floor(Math.random() * config.gridSize),
            y: Math.floor(Math.random() * config.gridSize)
        };

        isOnSnake = snake.some(segment =>
            segment.x === newFood.x && segment.y === newFood.y
        );
    } while (isOnSnake);

    food = newFood;
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('highScore').textContent = highScore;
    }

    document.getElementById('finalScore').textContent = score;
    document.getElementById('gameOver').classList.remove('hidden');
}

function togglePause() {
    if (isGameOver) return;

    isPaused = !isPaused;
}

function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (isGameOver && e.code === 'Enter') {
            resetGame();
            startGame();
            return;
        }

        switch (e.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (direction !== 'down') nextDirection = 'up';
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                if (direction !== 'up') nextDirection = 'down';
                e.preventDefault();
                break;
            case 'ArrowLeft':
            case 'KeyA':
                if (direction !== 'right') nextDirection = 'left';
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (direction !== 'left') nextDirection = 'right';
                e.preventDefault();
                break;
            case 'Space':
            case 'KeyP':
                togglePause();
                e.preventDefault();
                break;
        }
    });

    // Mobile button controls - use pointerdown for immediate response
    const arrowBtns = document.querySelectorAll('.arrow-btn');
    arrowBtns.forEach(btn => {
        const handleDirection = (e) => {
            e.preventDefault();
            const dir = btn.dataset.direction;
            if (isGameOver) {
                resetGame();
                startGame();
                return;
            }

            switch (dir) {
                case 'up':
                    if (direction !== 'down') nextDirection = 'up';
                    break;
                case 'down':
                    if (direction !== 'up') nextDirection = 'down';
                    break;
                case 'left':
                    if (direction !== 'right') nextDirection = 'left';
                    break;
                case 'right':
                    if (direction !== 'left') nextDirection = 'right';
                    break;
            }
        };

        btn.addEventListener('pointerdown', handleDirection);
        // Also keep click as fallback for accessibility
        btn.addEventListener('click', handleDirection);
    });

    // Touch swipe controls
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (isGameOver) {
            resetGame();
            startGame();
            return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > 30 || absDy > 30) {
            if (absDx > absDy) {
                // Horizontal swipe
                if (dx > 0 && direction !== 'left') {
                    nextDirection = 'right';
                } else if (dx < 0 && direction !== 'right') {
                    nextDirection = 'left';
                }
            } else {
                // Vertical swipe
                if (dy > 0 && direction !== 'up') {
                    nextDirection = 'down';
                } else if (dy < 0 && direction !== 'down') {
                    nextDirection = 'up';
                }
            }
        }
    }, { passive: true });

    // Restart button
    document.getElementById('restartBtn').addEventListener('click', () => {
        resetGame();
        startGame();
    });
}

function setupFullscreen() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Listen for fullscreen changes (escape key, etc)
    document.addEventListener('fullscreenchange', updateFullscreenButton);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
}

function setupCollapsiblePanel() {
    const panelHeader = document.getElementById('panelHeader');
    const panelContent = document.getElementById('panelContent');
    const collapseBtn = document.getElementById('collapseBtn');

    // Check saved state from localStorage
    const isCollapsed = localStorage.getItem('controlsPanelCollapsed') === 'true';

    if (isCollapsed) {
        panelContent.classList.add('hidden');
        collapseBtn.classList.add('collapsed');
        collapseBtn.classList.remove('expanded');
    } else {
        collapseBtn.classList.add('expanded');
        collapseBtn.classList.remove('collapsed');
    }

    panelHeader.addEventListener('click', (e) => {
        // Don't toggle if clicking on interactive elements inside the header
        if (e.target.closest('button, input, select')) {
            return;
        }

        const isHidden = panelContent.classList.toggle('hidden');
        collapseBtn.classList.toggle('collapsed');
        collapseBtn.classList.toggle('expanded');

        // Save state to localStorage
        localStorage.setItem('controlsPanelCollapsed', isHidden);
    });

    // Allow button to toggle directly
    collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = panelContent.classList.toggle('hidden');
        collapseBtn.classList.toggle('collapsed');
        collapseBtn.classList.remove('expanded');
        localStorage.setItem('controlsPanelCollapsed', isHidden);
    });
}

function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        // Enter fullscreen
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
            docEl.requestFullscreen();
        } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
        }
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFullscreen) {
        fullscreenBtn.title = 'Exit Fullscreen';
        fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛶</span>';
    } else {
        fullscreenBtn.title = 'Enter Fullscreen';
        fullscreenBtn.innerHTML = '<span class="fullscreen-icon">⛶</span>';
    }
}

function setupColorPickers() {
    const bgPicker = document.getElementById('bgColorPicker');
    const snakePicker = document.getElementById('snakeColorPicker');
    const foodPicker = document.getElementById('foodColorPicker');

    bgPicker.value = colors.background;
    snakePicker.value = colors.snake;
    foodPicker.value = colors.food;

    bgPicker.addEventListener('input', (e) => {
        colors.background = e.target.value;
        render();
    });

    snakePicker.addEventListener('input', (e) => {
        colors.snake = e.target.value;
        render();
    });

    foodPicker.addEventListener('input', (e) => {
        colors.food = e.target.value;
        render();
    });

    // Preset buttons
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const bg = btn.dataset.bg;
            const snake = btn.dataset.snake;
            const food = btn.dataset.food;

            colors.background = bg;
            colors.snake = snake;
            colors.food = food;

            bgPicker.value = bg;
            snakePicker.value = snake;
            foodPicker.value = food;

            render();
        });
    });
}

function setupDifficulty() {
    const difficultySelect = document.getElementById('difficulty');
    const wrapToggle = document.getElementById('wrapToggle');

    // Set grid sizes for each difficulty
    const gridSizes = {
        easy: 15,
        medium: 20,
        hard: 10
    };

    // Set default wrap modes for each difficulty
    const defaultWrapByDifficulty = {
        easy: true,
        medium: true,
        hard: false
    };

    // Initialize from saved settings or defaults
    const savedDifficulty = localStorage.getItem('snakeDifficulty') || 'medium';
    difficultySelect.value = savedDifficulty;
    config.gridSize = gridSizes[savedDifficulty];
    config.wrapMode = defaultWrapByDifficulty[savedDifficulty];
    wrapToggle.checked = config.wrapMode;

    const savedWrap = localStorage.getItem('snakeWrapMode');
    if (savedWrap !== null) {
        config.wrapMode = savedWrap === 'true';
        wrapToggle.checked = config.wrapMode;
    }

    // Update canvas and restart when difficulty changes
    difficultySelect.addEventListener('change', () => {
        const newDifficulty = difficultySelect.value;
        config.gridSize = gridSizes[newDifficulty];
        config.wrapMode = defaultWrapByDifficulty[newDifficulty];
        wrapToggle.checked = config.wrapMode;
        localStorage.setItem('snakeDifficulty', newDifficulty);
        localStorage.setItem('snakeWrapMode', config.wrapMode);

        // Update canvas sizing and reset game
        handleHiDPICanvas();
        resetGame();
        startGame();
    });

    // Toggle wrap mode
    wrapToggle.addEventListener('change', () => {
        config.wrapMode = wrapToggle.checked;
        localStorage.setItem('snakeWrapMode', config.wrapMode);
        // No need to reset game - applies to next collision
    });
}

// Utility: Adjust hex color brightness
function adjustBrightness(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;

    const newR = Math.max(0, Math.min(255, R));
    const newG = Math.max(0, Math.min(255, G));
    const newB = Math.max(0, Math.min(255, B));

    return '#' + (0x1000000 + newR * 0x10000 + newG * 0x100 + newB).toString(16).slice(1);
}

// Handle window resize
window.addEventListener('resize', () => {
    handleHiDPICanvas();
    render();
});

// Start when page loads
window.addEventListener('load', init);
