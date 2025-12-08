// Get the canvas and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const instructions = document.getElementById('instructions');

// --- Game Constants and Variables ---

// Bird
let birdX = 50;
let birdY = canvas.height / 2;
const birdRadius = 20;
const gravity = 0.5;
const jumpStrength = -10;
let velocity = 0;

// Pipes
const pipeWidth = 70;
const pipeGap = 200;
const pipeSpeed = 3;
let pipes = [];
let frameCount = 0;
const pipeSpawnInterval = 100; // Frames

// Game State
let score = 0;
let gameActive = true;
let hasStarted = false; // To handle start screen

// --- Utility Functions (Drawing) ---

function drawBird() {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    // 
    ctx.arc(birdX, birdY, birdRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
}

function drawPipe(pipe) {
    ctx.fillStyle = 'green';
    ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);
    ctx.strokeStyle = 'darkgreen';
    ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);
}

function drawPipes() {
    pipes.forEach(drawPipe);
}

function drawScore() {
    scoreDisplay.textContent = Math.floor(score);
}

// --- Game Logic ---

function jump() {
    if (!gameActive) {
        restartGame();
        return;
    }
    hasStarted = true;
    velocity = jumpStrength;
    instructions.style.display = 'none';
}

function createPipe() {
    // Determine a random height for the top pipe
    const minHeight = 100;
    const maxHeight = canvas.height - pipeGap - 100;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    // Top pipe
    pipes.push({
        x: canvas.width,
        y: 0,
        width: pipeWidth,
        height: topHeight
    });
    
    // Bottom pipe
    pipes.push({
        x: canvas.width,
        y: topHeight + pipeGap,
        width: pipeWidth,
        height: canvas.height - topHeight - pipeGap,
        passed: false // Custom property for score tracking
    });
}

function movePipes() {
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= pipeSpeed;

        // Check for scoring (only on the bottom pipe of the pair)
        if (pipes[i].y > pipeGap && pipes[i].x < birdX && !pipes[i].passed) {
            score += 0.5; // Count once per pipe pair
            pipes[i].passed = true;
        }
    }
    // Remove pipes that are off-screen
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function checkCollision() {
    // Check floor/ceiling
    if (birdY + birdRadius >= canvas.height || birdY - birdRadius <= 0) {
        return true;
    }
    
    // Check pipes
    for (let i = 0; i < pipes.length; i++) {
        const p = pipes[i];
        
        // Simple rectangular collision check for the bird and the pipe
        if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + p.width &&
            birdY + birdRadius > p.y && birdY - birdRadius < p.y + p.height) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameActive = false;
    // You could display a more complex "Game Over" screen here
    instructions.textContent = `Game Over! Score: ${Math.floor(score)}. Press SPACE or click to restart.`;
    instructions.style.display = 'block';
}

function restartGame() {
    birdY = canvas.height / 2;
    velocity = 0;
    pipes = [];
    score = 0;
    gameActive = true;
    hasStarted = true;
    frameCount = 0;
    instructions.style.display = 'none';
    scoreDisplay.textContent = '0';
}

// --- Main Game Loop ---

function gameLoop() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameActive && hasStarted) {
        // 1. Update Physics
        velocity += gravity;
        birdY += velocity;
        
        // 2. Spawn Pipes
        if (frameCount % pipeSpawnInterval === 0) {
            createPipe();
        }
        
        // 3. Move Pipes
        movePipes();
        
        // 4. Check for Game Over
        if (checkCollision()) {
            gameOver();
        }
        
        frameCount++;
    } else if (!hasStarted && gameActive) {
        // Draw initial screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        instructions.textContent = "Press SPACE or click to start!";
        instructions.style.display = 'block';
    }

    // 5. Drawing
    drawPipes();
    drawBird();
    drawScore();
    
    // Request the next frame
    requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---

// Handle spacebar press
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        jump();
    }
});

// Handle mouse click/touch
canvas.addEventListener('click', jump);

// Start the game loop
gameLoop();