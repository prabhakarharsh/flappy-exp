const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const instructions = document.getElementById('instructions');

const GROUND_HEIGHT = 90;
const playHeight = canvas.height - GROUND_HEIGHT;

const bird = {
    x: 60,
    y: playHeight / 2,
    radius: 18,
    velocity: 0,
    gravity: 0.45,
    jumpStrength: -8.5,
    rotation: 0,
    wingAngle: 0,
    wingDir: 1
};

const pipeWidth = 65;
const pipeGap = 190;
const pipeSpeed = 2.8;
let pipes = [];
let frameCount = 0;
const pipeSpawnInterval = 95;

let groundOffset = 0;

let score = 0;
let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
let gameActive = true;
let hasStarted = false;

function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, playHeight);
    grad.addColorStop(0, '#4dc9f6');
    grad.addColorStop(1, '#70c5ce');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, playHeight);
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    const clouds = [
        { x: 80, y: 80, w: 60, h: 25 },
        { x: 300, y: 50, w: 80, h: 30 },
        { x: 470, y: 110, w: 50, h: 20 },
        { x: 160, y: 190, w: 70, h: 28 }
    ];
    for (const c of clouds) {
        const cx = ((c.x + frameCount * 0.15) % (canvas.width + c.w * 2)) - c.w;
        ctx.beginPath();
        ctx.ellipse(cx + c.w * 0.3, c.y, c.w * 0.4, c.h * 0.6, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + c.w * 0.7, c.y, c.w * 0.5, c.h * 0.8, 0, 0, Math.PI * 2);
        ctx.ellipse(cx + c.w * 0.5, c.y - c.h * 0.3, c.w * 0.5, c.h * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    const gf = ctx.createLinearGradient(0, playHeight, 0, canvas.height);
    gf.addColorStop(0, '#7CB342');
    gf.addColorStop(0.1, '#689F38');
    gf.addColorStop(1, '#33691E');
    ctx.fillStyle = gf;
    ctx.fillRect(0, playHeight, canvas.width, GROUND_HEIGHT);

    ctx.strokeStyle = '#558B2F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, playHeight + 0.5);
    ctx.lineTo(canvas.width, playHeight + 0.5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    for (let i = -10; i < canvas.width + 15; i += 28) {
        const dx = ((i - groundOffset * 0.6) % (canvas.width + 60));
        ctx.beginPath();
        ctx.moveTo(dx, playHeight + 22);
        ctx.lineTo(dx + 14, playHeight + 22);
        ctx.stroke();
    }
}

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#F9A825';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFB300';
    ctx.beginPath();
    const wingY = Math.sin(bird.wingAngle) * 5;
    ctx.ellipse(-5, wingY - 1, 10, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(8, -5, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(11.5, -7, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(25, 2);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
}

function drawPipe(pipe) {
    const capHeight = 26;
    const capExtra = 6;

    if (pipe.type === 'top') {
        const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        grad.addColorStop(0, '#33691E');
        grad.addColorStop(0.2, '#8BC34A');
        grad.addColorStop(0.8, '#8BC34A');
        grad.addColorStop(1, '#33691E');
        ctx.fillStyle = grad;
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.height);

        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, 0, pipe.width, pipe.height);

        ctx.fillStyle = '#7CB342';
        ctx.fillRect(pipe.x - capExtra, pipe.height - capHeight, pipe.width + capExtra * 2, capHeight);
        ctx.strokeStyle = '#1B5E20';
        ctx.strokeRect(pipe.x - capExtra, pipe.height - capHeight, pipe.width + capExtra * 2, capHeight);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(pipe.x - capExtra + 5, pipe.height - capHeight + 5, 5, capHeight - 10);
    } else {
        const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
        grad.addColorStop(0, '#33691E');
        grad.addColorStop(0.2, '#8BC34A');
        grad.addColorStop(0.8, '#8BC34A');
        grad.addColorStop(1, '#33691E');
        ctx.fillStyle = grad;
        ctx.fillRect(pipe.x, pipe.y, pipe.width, pipe.height);

        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.strokeRect(pipe.x, pipe.y, pipe.width, pipe.height);

        ctx.fillStyle = '#7CB342';
        ctx.fillRect(pipe.x - capExtra, pipe.y, pipe.width + capExtra * 2, capHeight);
        ctx.strokeStyle = '#1B5E20';
        ctx.strokeRect(pipe.x - capExtra, pipe.y, pipe.width + capExtra * 2, capHeight);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(pipe.x - capExtra + 5, pipe.y + 5, 5, capHeight - 10);
    }
}

function drawPipes() {
    pipes.forEach(drawPipe);
}

function drawScoreboard() {
    scoreDisplay.textContent = Math.floor(score);
}

function jump() {
    if (!gameActive) {
        restartGame();
        return;
    }
    if (!hasStarted) {
        hasStarted = true;
        instructions.style.display = 'none';
    }
    bird.velocity = bird.jumpStrength;
}

function createPipe() {
    const gap = Math.max(140, Math.min(220, pipeGap - Math.floor(score / 10) * 5));
    const minHeight = 80;
    const maxHeight = playHeight - gap - 80;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: canvas.width,
        y: 0,
        width: pipeWidth,
        height: topHeight,
        type: 'top',
        passed: false
    });

    pipes.push({
        x: canvas.width,
        y: topHeight + gap,
        width: pipeWidth,
        height: playHeight - topHeight - gap,
        type: 'bottom',
        passed: false
    });
}

function movePipes() {
    for (const pipe of pipes) {
        pipe.x -= pipeSpeed;
        if (pipe.type === 'bottom' && pipe.x + pipeWidth < bird.x && !pipe.passed) {
            score += 0.5;
            pipe.passed = true;
        }
    }
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

function checkCollision() {
    const r = bird.radius * 0.82;

    if (bird.y - r <= 0) return true;
    if (bird.y + r >= playHeight) return true;

    for (const pipe of pipes) {
        if (bird.x + r > pipe.x &&
            bird.x - r < pipe.x + pipe.width &&
            bird.y + r > pipe.y &&
            bird.y - r < pipe.y + pipe.height) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    gameActive = false;
    const finalScore = Math.floor(score);
    if (finalScore > highScore) {
        highScore = finalScore;
        localStorage.setItem('flappyHighScore', highScore);
    }
    instructions.innerHTML = `Game Over<br>Score: ${finalScore}<br>Best: ${highScore}<br><br>Tap to restart`;
    instructions.style.display = 'block';
}

function restartGame() {
    bird.y = playHeight / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    pipes = [];
    score = 0;
    gameActive = true;
    hasStarted = true;
    frameCount = 0;
    instructions.style.display = 'none';
    scoreDisplay.textContent = '0';
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawClouds();

    if (gameActive && hasStarted) {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.05));

        bird.wingAngle += 0.15 * bird.wingDir;
        if (Math.abs(bird.wingAngle) > 0.7) bird.wingDir *= -1;

        if (frameCount % pipeSpawnInterval === 0) {
            createPipe();
        }

        movePipes();

        if (checkCollision()) {
            gameOver();
        }

        frameCount++;
    } else if (!hasStarted && gameActive) {
        bird.y = playHeight / 2 + Math.sin(Date.now() / 300) * 8;
        bird.rotation = -0.1 + Math.sin(Date.now() / 200) * 0.05;
        bird.wingAngle = Math.sin(Date.now() / 100) * 0.6;
    }

    groundOffset = (groundOffset + pipeSpeed) % 50;

    drawPipes();
    drawGround();
    drawBird();
    drawScoreboard();

    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

gameLoop();
