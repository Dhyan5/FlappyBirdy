const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreVal');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const leaderboardSection = document.getElementById('leaderboardSection');
const leaderboardList = document.getElementById('leaderboardList');

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Assets ---
const birdImg = new Image(); birdImg.src = 'bird.png'; 
const bgImg = new Image(); bgImg.src = 'background.png'; 
const pillarDownImg = new Image(); pillarDownImg.src = 'pillardown.svg'; 
const pillarUpImg = new Image(); pillarUpImg.src = 'pillarup.svg'; 

const bgMusic = new Audio('backround.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

const hitSound = new Audio('game audio.mp3');

// --- Constants ---
const GRAVITY = 0.35;
const JUMP = -7.5;
const INITIAL_PIPE_SPEED = 3.8;
const MAX_PIPE_SPEED = 5.5;
const INITIAL_PIPE_GAP = 180; // Harder gap, more like original
const MIN_PIPE_GAP = 140;   
const PIPE_WIDTH = 100;
const BIRD_SIZE = 55; 

// --- Variables ---
let bird, pipes, score, frame, gameOver, gameStarted, bgX;
let currentPipeSpeed = INITIAL_PIPE_SPEED;
let currentPipeGap = INITIAL_PIPE_GAP;
let spawnInterval = 110; 
let leaderboard = JSON.parse(localStorage.getItem('flappyLeaderboard')) || [];

function initVariables() {
    bird = { 
        x: 120, // Moved back slightly
        y: canvas.height / 2, 
        velocity: 0, 
        rotation: 0,
        radius: 18 // Tighter radius for fairer collision
    };
    pipes = [];
    score = 0;
    bgX = 0;
    frame = 0;
    gameOver = false;
    gameStarted = false;
    currentPipeSpeed = INITIAL_PIPE_SPEED;
    currentPipeGap = INITIAL_PIPE_GAP;
    spawnInterval = 110;
    scoreElement.innerText = score;
}

initVariables();

function createPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - currentPipeGap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    pipes.push({ x: canvas.width, top: topHeight, gap: currentPipeGap, passed: false });
}

function updateLeaderboard(newScore) {
    if (newScore > 0) {
        leaderboard.push(newScore);
        leaderboard.sort((a, b) => b - a);
        leaderboard = leaderboard.slice(0, 5);
        localStorage.setItem('flappyLeaderboard', JSON.stringify(leaderboard));
    }
    showLeaderboard();
}

function showLeaderboard() {
    leaderboardList.innerHTML = '';
    leaderboard.forEach((s, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>RANK #${i+1}</span> <span>${s}</span>`;
        leaderboardList.appendChild(li);
    });
    if (leaderboard.length > 0) {
        leaderboardSection.classList.remove('hidden');
    } else {
        leaderboardSection.classList.add('hidden');
    }
}

function endGame() {
    if (!gameOver) {
        gameOver = true;
        bgMusic.pause();
        hitSound.play();
        updateLeaderboard(score);
        overlayTitle.innerText = "GAME OVER";
        overlaySubtitle.innerText = "CLICK TO RESTART";
        overlay.classList.remove('hidden');
    }
}

function resetGame() {
    initVariables();
    gameStarted = true;
    overlay.classList.add('hidden');
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log("Audio play blocked"));
    loop();
}

function update() {
    if (gameOver || !gameStarted) return;

    // Subtle difficulty scaling - gap gets narrower, speed slightly increases
    currentPipeSpeed = Math.min(MAX_PIPE_SPEED, INITIAL_PIPE_SPEED + (score * 0.05));
    currentPipeGap = Math.max(MIN_PIPE_GAP, INITIAL_PIPE_GAP - (score * 1.5));
    spawnInterval = Math.max(70, 110 - (score * 0.8));

    bgX -= currentPipeSpeed * 0.3; 
    if (bgX <= -canvas.width) bgX = 0;

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 8, bird.velocity * 0.1));

    // Boundary check
    if (bird.y + BIRD_SIZE > canvas.height || bird.y < 0) {
        endGame();
    }

    // Pipe spawning
    if (frame % Math.floor(spawnInterval) === 0) createPipe();

    // Pipe updates and collision
    pipes.forEach(pipe => {
        pipe.x -= currentPipeSpeed;
        
        // Improved collision detection
        const birdCenterX = bird.x + BIRD_SIZE/2;
        const birdCenterY = bird.y + BIRD_SIZE/2;
        
        const inPipeX = birdCenterX + bird.radius > pipe.x && birdCenterX - bird.radius < pipe.x + PIPE_WIDTH;
        const hitTop = birdCenterY - bird.radius < pipe.top;
        const hitBottom = birdCenterY + bird.radius > pipe.top + pipe.gap;

        if (inPipeX && (hitTop || hitBottom)) {
            endGame();
        }

        // Score update
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
            score++;
            scoreElement.innerText = score;
            pipe.passed = true;
        }
    });

    pipes = pipes.filter(p => p.x > -PIPE_WIDTH);
    frame++;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    if (bgImg.complete) {
        ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
        ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#4ec0ca";
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }

    // Pipes
    pipes.forEach(pipe => {
        if (pillarDownImg.complete && pillarUpImg.complete) {
            // Top pipe - stretch from 0 to pipe.top
            ctx.drawImage(pillarDownImg, pipe.x, 0, PIPE_WIDTH, pipe.top);
            // Bottom pipe - stretch from pipe.top + gap to bottom
            ctx.drawImage(pillarUpImg, pipe.x, pipe.top + pipe.gap, PIPE_WIDTH, canvas.height - (pipe.top + pipe.gap));
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
            ctx.fillRect(pipe.x, pipe.top + pipe.gap, PIPE_WIDTH, canvas.height);
        }
    });


    // Bird
    ctx.save();
    ctx.translate(bird.x + BIRD_SIZE/2, bird.y + BIRD_SIZE/2);
    ctx.rotate(bird.rotation);
    
    // Shadow for depth
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    
    if (birdImg.complete) {
        ctx.drawImage(birdImg, -BIRD_SIZE/2, -BIRD_SIZE/2, BIRD_SIZE, BIRD_SIZE);
    } else {
        ctx.fillStyle = "yellow";
        ctx.fillRect(-BIRD_SIZE/2, -BIRD_SIZE/2, BIRD_SIZE, BIRD_SIZE);
    }
    ctx.restore();
}

function loop() {
    if (gameOver) return;
    update();
    draw();
    requestAnimationFrame(loop);
}

function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    
    if (!gameStarted || gameOver) {
        resetGame();
    } else {
        bird.velocity = JUMP;
    }
    
    // Prevent scrolling or zooming
    if (e.type === 'touchstart' || e.code === 'Space') {
        if (e.cancelable) e.preventDefault();
    }
}

window.addEventListener('mousedown', handleInput);
window.addEventListener('touchstart', handleInput, { passive: false });
window.addEventListener('keydown', handleInput);

// Initial draw
showLeaderboard();
draw();
