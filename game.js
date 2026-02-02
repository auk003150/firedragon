const EMOJIS = ['⚽', '🍔', '🎧', '🧊', '🧼', '🍺', '💡', '📎', '🧽', '🧯'];
const WORDS = ['福', '春', '財', '安', '旺', '吉', '祥', '賀', '馬', '年'];
const BACKGROUND = new Image();
BACKGROUND.src = 'image_1.png'; // Replace with your background image file

// Audio Files
const crunchSound = new Audio('Crunch.mp3'); // For emoji bubbles
const collectSound = new Audio('Collect.mp3'); // For one-word bubbles
const bgm = new Audio('bgm.mp3'); // Background music
const endMusic = new Audio('end.mp3'); // Game end music
bgm.loop = true; // Loop the background music

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0, gameTimer = 60, gameRunning = true;
let bubbles = [];
let dragonPos = {x: canvas.width / 2, y: canvas.height / 2};
let lastSpawn = 0, dragonScale = 0.6;

function spawnBubble() {
  let isEmoji = Math.random() < 0.6; // 60% emoji, 40% word
  let text = isEmoji ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : WORDS[Math.floor(Math.random() * WORDS.length)];
  let x = Math.random() * canvas.width, y = -40;
  let speed = Math.random() * 2 + 2;
  let type = isEmoji ? 'emoji' : 'word';
  bubbles.push({text, x, y, speed, type, radius: 38});
}

function updateBubbles() {
  bubbles.forEach(b => b.y += b.speed);
  bubbles = bubbles.filter(b => b.y < canvas.height + 40);
}

function drawBubbles() {
  bubbles.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.type === 'emoji' ? '#FFDF00' : '#9EFFA3';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = b.type === 'emoji' ? '36px serif' : 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.text, b.x, b.y);
  });
}

function drawDragonHead(ctx) {
  ctx.beginPath();
  ctx.arc(0, 0, 40, Math.PI * 0.3, Math.PI * 1.8); // Semi-circular head
  ctx.fillStyle = 'brown';
  ctx.fill();

  // Draw eyes
  ctx.beginPath();
  ctx.arc(-20, -10, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
}

function drawDragonBody(ctx) {
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(i * 70, 0, 30, Math.PI, Math.PI * 2); // Spike sections
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawDragon(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawDragonHead(ctx);
  ctx.translate(50, 0); // Positioning body relative to head
  drawDragonBody(ctx);
  ctx.restore();
}

function collision(bubble, x, y) {
  let dx = bubble.x - x, dy = bubble.y - y;
  return Math.sqrt(dx * dx + dy * dy) < bubble.radius + 40; // Collision logic based on sizes
}

function updateScoreAndHit() {
  bubbles.forEach((b, idx) => {
    if (collision(b, dragonPos.x, dragonPos.y)) {
      if (b.type === 'emoji') {
        score = Math.max(0, score - 5);
        crunchSound.play(); // Play crunch sound effect
      } else {
        score += 10;
        collectSound.play(); // Play collect sound effect
      }
      bubbles.splice(idx, 1);
      document.getElementById('score').textContent = score;
    }
  });
}

function drawBackground() {
  ctx.drawImage(BACKGROUND, 0, 0, canvas.width, canvas.height);
}

function gameLoop(ts) {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(); // Draw the background
  drawDragon(ctx, dragonPos.x, dragonPos.y, dragonScale); // Draw the dragon
  drawBubbles(); // Draw bubbles
  updateBubbles(); // Update bubble positions
  updateScoreAndHit(); // Check collisions and update score

  if (ts - lastSpawn > 1000) {
    spawnBubble();
    lastSpawn = ts;
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  bgm.pause();
  endMusic.play();
  document.getElementById('gameOver').classList.remove('hidden');
  document.getElementById('finalScore').textContent = score;
}

let timerInterval = setInterval(() => {
  if (!gameRunning) return;
  gameTimer--;
  document.getElementById('timer').textContent = gameTimer;
  if (gameTimer <= 0) {
    clearInterval(timerInterval);
    endGame();
  }
}, 1000);

function startGame() {
  bgm.play();
  gameLoop();
}
document.getElementById('webcam').addEventListener('loadeddata', startGame);
