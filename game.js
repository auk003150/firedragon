const EMOJIS = ['⚽', '🍔', '🎧', '🧊', '🧼', '🍺', '💡', '📎', '🧽', '🧯'];
const WORDS = ['福', '春', '財', '安', '旺', '吉', '祥', '賀', '馬', '年'];
const DRAGON = new Image();
DRAGON.src = 'https://i.imgur.com/YPvNu1s.png'; // Replace with dragon PNG with transparency

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Audio Files
const crunchSound = new Audio('Crunch.mp3'); // For emoji bubbles
const collectSound = new Audio('Collect.mp3'); // For one-word bubbles
const bgm = new Audio('bgm.mp3'); // Background music
const endMusic = new Audio('end.mp3'); // Game end music
bgm.loop = true; // Set background music to loop

let score = 0, gameTimer = 60, gameRunning = true, wristPos = {x: canvas.width/2, y: canvas.height/2};
let bubbles = [];
let lastSpawn = 0;
let dragonSize = 80;
let dragonPos = {x: canvas.width/2, y: canvas.height/2};
let rightwrist = null;

function spawnBubble() {
  let isEmoji = Math.random() < 0.6; // 60% emoji, 40% word
  let text = isEmoji ? EMOJIS[Math.floor(Math.random() * EMOJIS.length)] : WORDS[Math.floor(Math.random() * WORDS.length)];
  let x = Math.random() * (canvas.width - 80) + 40, y = -40;
  let speed = Math.random() * 2 + 2;
  let type = isEmoji ? 'emoji' : 'word';
  bubbles.push({text, x, y, speed, type, radius: 38});
}

function updateBubbles() {
  bubbles.forEach(b => b.y += b.speed);
  bubbles = bubbles.filter(b => b.y < canvas.height + 40);
}

function drawBubbles() {
  for (let b of bubbles) {
    ctx.save();
    ctx.font = b.type === 'emoji' ? '48px serif' : 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = b.type === 'emoji' ? '#fffd' : '#6fffb5';
    ctx.strokeStyle = b.type === 'emoji' ? '#353' : '#123';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#222';
    ctx.fillText(b.text, b.x, b.y + 2);
    ctx.restore();
  }
}

function drawDragon() {
  ctx.save();
  ctx.globalAlpha = 0.93;
  ctx.drawImage(DRAGON, dragonPos.x - 40, dragonPos.y - 42, dragonSize, dragonSize);
  ctx.restore();
}

function collision(bubble, dragonPos) {
  let dx = bubble.x - dragonPos.x, dy = bubble.y - dragonPos.y;
  let dist = Math.sqrt(dx * dx + dy * dy);
  return dist < (bubble.radius + dragonSize * 0.5 * 0.7);
}

function updateScoreAndHit() {
  for (let i = bubbles.length - 1; i >= 0; i--) {
    if (collision(bubbles[i], dragonPos)) {
      if (bubbles[i].type === 'emoji') {
        score -= 5; // Emoji: negative
        crunchSound.play(); // Play crunch sound
      } else {
        score += 10; // Word: positive
        collectSound.play(); // Play collect sound
      }
      bubbles.splice(i, 1);
      document.getElementById('score').textContent = Math.max(0, score);
    }
  }
}

function gameLoop(ts) {
  if (!gameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw bubbles
  drawBubbles();

  // Draw dragon at wrist position
  drawDragon();

  // Move bubbles
  updateBubbles();

  // Handle collision/score
  updateScoreAndHit();

  // Spawn bubbles at random intervals (1~1.5s)
  if (ts - lastSpawn > 1000 + Math.random() * 500) {
    spawnBubble();
    lastSpawn = ts;
  }

  requestAnimationFrame(gameLoop);
}

// Timer countdown
let timerInterval = setInterval(() => {
  if (!gameRunning) return;
  gameTimer -= 1;
  document.getElementById('timer').textContent = Math.max(0, gameTimer);
  if (gameTimer <= 0) endGame();
}, 1000);

function endGame() {
  gameRunning = false; // Stop game loop
  bgm.pause(); // Stop background music
  endMusic.play(); // Play end music
  document.getElementById('gameOver').classList.remove('hidden');
  document.getElementById('finalScore').textContent = score;
  canvas.style.filter = 'grayscale(0.6) blur(2px)';
  clearInterval(timerInterval);
}

// ==== Wrist Detection with MediaPipe ====
const videoElement = document.getElementById('webcam');
let camera;

function startHandTracking() {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75
  });

  hands.onResults(results => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Landmarks[0]-> Wrist is index 0, index finger tip is 8
      let wristMarker = results.multiHandLandmarks[0][0];
      if (wristMarker) {
        let x = -(wristMarker.x * canvas.width); // Fix mirroring issue
        let y = wristMarker.y * canvas.height;
        dragonPos.x = x;
        dragonPos.y = y;
      }
    }
  });

  camera = new Camera(videoElement, {
    onFrame: async () => {
      await hands.send({ image: videoElement });
    },
    width: canvas.width,
    height: canvas.height
  });
  camera.start();
}

function startGame() {
  DRAGON.onload = function() {
    bgm.play(); // Start background music
    startHandTracking();
    requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

startGame();
