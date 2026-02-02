const EMOJIS = ['⚽', '🍔', '🎧', '🧊', '🧼', '🍺', '💡', '📎', '🧽', '🧯'];
const WORDS = ['福', '春', '財', '安', '旺', '吉', '祥', '賀', '馬', '年'];
const DRAGON = new Image();
DRAGON.src = 'https://i.imgur.com/YPvNu1s.png'; // Replace with your dragon PNG with transparency

// Background Image
const BACKGROUND = new Image();
BACKGROUND.src = 'image_1.png'; // Replace with the path to your background image

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

function drawDragon(ctx, x, y, scale) {
  ctx.save();  // Save transformation state
  
  ctx.translate(x, y);  // Translate starting position
  ctx.scale(scale, scale); // Scale dragon dynamically
  
  // Draw Dragon Head
  drawDragonHead(ctx);

  // Draw Spiky Body
  drawDragonBody(ctx);

  // Draw Tail
  drawDragonTail(ctx);

  ctx.restore();  // Restore original state
}

function drawDragonHead(ctx) {
  ctx.save();
  
  // Dragon Head Base
  ctx.beginPath();
  ctx.arc(0, 0, 50, Math.PI * 0.2, Math.PI * 1.8);
  ctx.fillStyle = '#A0522D'; // Brownish base
  ctx.fill();
  
  // Dragon Eye
  ctx.beginPath();
  ctx.arc(-30, -10, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#000'; // Eye Color
  ctx.fill();
  
  // Spikes Around Head
  for (let i = 0; i < 10; i++) {
    const angle = Math.PI * 0.2 + (Math.PI * 0.16) * i;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 50, Math.sin(angle) * 50);
    ctx.lineTo(Math.cos(angle) * 70, Math.sin(angle) * 70);
    ctx.strokeStyle = '#FFD700'; // Golden spike color
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawDragonBody(ctx) {
  ctx.save();
  let bodyLength = 8; // Number of body sections
  let spikeFrequency = 30; // Spikes per section
  let bodyWidth = 40; // The width of the curve
  
  ctx.translate(0, 50); // Offset body below head

  for (let section = 0; section < bodyLength; section++) {
    const yOffset = section % 2 === 0 ? -bodyWidth : bodyWidth; // Alternating body shape like a sine wave
    
    // Draw body curve
    ctx.beginPath();
    ctx.moveTo(-bodyWidth, yOffset);
    ctx.lineTo(0, 0);
    ctx.lineTo(bodyWidth, yOffset);
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 6;
    ctx.stroke();
    
    // Add spikes along body
    for (let s = 0; s < spikeFrequency; s++) {
      const spikeAngle = 2 * Math.PI * (s / spikeFrequency);
      const xPos = Math.sin(spikeAngle) * bodyWidth;
      const yPos = yOffset + Math.cos(spikeAngle) * bodyWidth * 0.5;

      ctx.beginPath();
      ctx.moveTo(xPos, yPos);
      ctx.lineTo(xPos + 15, yPos + 15); // Draw Each Spiky arrow flaring outward direction.
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.translate(0, yOffset); // Adjust body movement curve below last rendered body
  }

  ctx.restore();
}

function drawDragonTail(ctx) {
  ctx.save();
  
  ctx.translate(0, 50); // Offset tail
  ctx.beginPath();
  ctx.arc(0, -40, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#A0522D'; // Tail Base color
  ctx.fill();

  for (let spike = 0; spike < 12; spike++) {
    const angle = Math.PI * 2 * (spike / 12);
    const xPos = Math.cos(angle) * 20;
    const yPos = Math.sin(angle) * 20;

    ctx.beginPath();
    ctx.moveTo(xPos, yPos);
    ctx.lineTo(xPos * 1.4, yPos * 1.4);
    ctx.strokeStyle = '#FFD700'; // Spiky glowing tail spikes
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

function drawBackground() {
  ctx.drawImage(BACKGROUND, 0, 0, canvas.width, canvas.height);
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

  // Clear Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw the background
  drawBackground();

  // Draw bubbles
  drawBubbles();

  // Draw Dragon
  drawDragon(ctx, dragonPos.x, dragonPos.y, 0.8); // Scale factor makes dragon dynamic

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
        let x = wristMarker.x * canvas.width);
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
    BACKGROUND.onload = function() {
      bgm.play(); // Start background music
      startHandTracking();
      requestAnimationFrame(gameLoop);
    }
  }
}

window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

startGame();
