// ============================================================
// NEON RUSH (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the drones are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loadingScreen = document.getElementById("loading-screen");
const homeScreen = document.getElementById("home-screen");
const homePanel = document.getElementById("home-panel");
const gameOverPanel = document.getElementById("game-over-panel");
const startButton = document.getElementById("start-button");
const playAgainButton = document.getElementById("play-again-button");
const gameStoreButton = document.getElementById("game-store-button");
const menuStoreButton = document.getElementById("menu-store-button");
const storeDialog = document.getElementById("store-screen");
const closeStoreButton = document.getElementById("close-store-button");
const storeBalance = document.getElementById("store-balance");
const gameStoreBalance = document.getElementById("game-store-balance");
const menuStoreBalance = document.getElementById("menu-store-balance");
const coinsEarnedResult = document.getElementById("coins-earned-result");
const levelResult = document.getElementById("level-result");
const upgradeButtons = {
  paddleWidth: document.getElementById("buy-wide-paddle"),
  paddleSpeed: document.getElementById("buy-paddle-boost"),
  extraLife: document.getElementById("buy-extra-life"),
  blockBlaster: document.getElementById("buy-block-blaster"),
  pulseCannon: document.getElementById("buy-pulse-cannon"),
  scatterShot: document.getElementById("buy-scatter-shot"),
  railCannon: document.getElementById("buy-rail-cannon"),
  ballSpeed: document.getElementById("buy-ball-speed"),
  coinBonus: document.getElementById("buy-coin-bonus"),
  paddleGrip: document.getElementById("buy-paddle-grip"),
  scoreBoost: document.getElementById("buy-score-boost"),
  arcShield: document.getElementById("buy-arc-shield"),
  chainBonus: document.getElementById("buy-chain-bonus")
};
const activeUpgradeButtons = Object.fromEntries(
  Object.entries(upgradeButtons).filter(([, button]) => button)
);
const settingsToggle = document.getElementById("settings-toggle");
const settingsPanel = document.getElementById("settings-panel");
const ballSpeedControl = document.getElementById("ball-speed");
const ballSpeedValue = document.getElementById("ball-speed-value");
const paddleSpeedControl = document.getElementById("paddle-speed");
const paddleSpeedValue = document.getElementById("paddle-speed-value");
const canvasSizeControl = document.getElementById("canvas-size");
const main = document.querySelector("main");

const WIDTH = canvas.width;   // 600
const HEIGHT = canvas.height; // 450
const STARTING_LIVES = 3;
const HIGH_SCORE_KEY = "neon-rush-high-score";
const STORE_KEY = "neon-rush-store";
const NEON_CYAN = "#42f5e9";
const PADDLE_COLOR = "#54a8ff";
const BALL_COLOR = "#ffdc4a";
const BASE_PADDLE_WIDTH = 90;
const UPGRADE_DEFINITIONS = {
  paddleWidth: { baseCost: 120, costStep: 100, maxLevel: 4 },
  paddleSpeed: { baseCost: 100, costStep: 120, maxLevel: 5 },
  extraLife: { baseCost: 250, costStep: 150, maxLevel: 3 },
  blockBlaster: { baseCost: 300, costStep: 200, maxLevel: 3 },
  pulseCannon: { baseCost: 360, costStep: 220, maxLevel: 3 },
  scatterShot: { baseCost: 420, costStep: 240, maxLevel: 3 },
  railCannon: { baseCost: 520, costStep: 280, maxLevel: 3 },
  ballSpeed: { baseCost: 160, costStep: 130, maxLevel: 4 },
  coinBonus: { baseCost: 180, costStep: 150, maxLevel: 4 },
  paddleGrip: { baseCost: 210, costStep: 170, maxLevel: 4 },
  scoreBoost: { baseCost: 220, costStep: 180, maxLevel: 4 },
  arcShield: { baseCost: 260, costStep: 220, maxLevel: 3 },
  chainBonus: { baseCost: 200, costStep: 160, maxLevel: 4 }
};


// ------------------------------------------------------------
// THE BALL
// x and y are the top-left corner. vx and vy are how many pixels
// the ball moves each update (vx = sideways, vy = up/down).
// A positive vy means the ball is moving DOWN the screen.
// ------------------------------------------------------------
let BALL_SPEED = 4;

const ball = {
  x: 0,
  y: 0,
  width: 12,
  height: 12,
  vx: 0,
  vy: 0
};

// Put the ball in the center and reset its speed and direction.
function resetBall() {
  ball.x = WIDTH / 2 - ball.width / 2;
  ball.y = HEIGHT / 2 - ball.height / 2;
  ball.vx = BALL_SPEED;  // right
  ball.vy = BALL_SPEED;  // down
}


// ------------------------------------------------------------
// THE PADDLE
// ------------------------------------------------------------
const paddle = {
  x: WIDTH / 2 - 45,
  y: HEIGHT - 30,
  width: BASE_PADDLE_WIDTH,
  height: 12,
  speed: 8
};

let coins = 0;
let coinsEarnedThisRun = 0;
let shieldCharges = 0;
let blasterCooldown = 0;
let muzzleFlash = 0;
const projectiles = [];
const enemyProjectiles = [];
const upgradeLevels = {
  paddleWidth: 0,
  paddleSpeed: 0,
  extraLife: 0,
  blockBlaster: 0,
  pulseCannon: 0,
  scatterShot: 0,
  railCannon: 0,
  ballSpeed: 0,
  coinBonus: 0,
  paddleGrip: 0,
  scoreBoost: 0,
  arcShield: 0,
  chainBonus: 0
};
let storeWasPlaying = false;

function applySettings() {
  BALL_SPEED = Number(ballSpeedControl.value);
  ballSpeedValue.value = BALL_SPEED;
  ballSpeedValue.textContent = BALL_SPEED;
  paddleSpeedValue.value = Number(paddleSpeedControl.value);
  paddleSpeedValue.textContent = paddleSpeedControl.value;
  main.dataset.canvasSize = canvasSizeControl.value;
  applyUpgrades();
}

function applyUpgrades() {
  const center = paddle.x + paddle.width / 2;
  paddle.width = BASE_PADDLE_WIDTH + upgradeLevels.paddleWidth * 18;
  paddle.speed = Number(paddleSpeedControl.value) + upgradeLevels.paddleSpeed;

  const baseBallSpeed = Number(ballSpeedControl.value) + upgradeLevels.ballSpeed * 0.8;
  BALL_SPEED = baseBallSpeed;

  const currentSpeed = Math.hypot(ball.vx, ball.vy) || BALL_SPEED;
  if (ball.vx !== 0 || ball.vy !== 0) {
    const speedScale = BALL_SPEED / currentSpeed;
    ball.vx *= speedScale;
    ball.vy *= speedScale;
  }

  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, center - paddle.width / 2));
}

function getActiveWeaponLevel() {
  return upgradeLevels.blockBlaster + upgradeLevels.pulseCannon + upgradeLevels.scatterShot + upgradeLevels.railCannon;
}

function awardCoins(amount) {
  const bonusMultiplier = 1 + upgradeLevels.coinBonus * 0.2 + upgradeLevels.chainBonus * 0.1;
  const earned = Math.max(0, Math.floor(amount * bonusMultiplier));
  if (earned === 0) {
    return;
  }

  coins += earned;
  coinsEarnedThisRun += earned;
  saveStore();
  updateStoreUI();
}

function getUpgradeCost(name) {
  const definition = UPGRADE_DEFINITIONS[name];
  if (!definition) {
    return Infinity;
  }
  return definition.baseCost + upgradeLevels[name] * definition.costStep;
}

function updateMenuStats() {
  const menuHighScore = document.getElementById("menu-high-score");
  const menuCoins = document.getElementById("menu-coins");
  const menuBestLevel = document.getElementById("menu-best-level");

  if (menuHighScore) {
    menuHighScore.textContent = highScore.toLocaleString();
  }
  if (menuCoins) {
    menuCoins.textContent = coins.toLocaleString();
  }
  if (menuBestLevel) {
    menuBestLevel.textContent = String(Math.max(1, level));
  }
}

function updateStoreUI() {
  storeBalance.textContent = coins.toLocaleString();
  gameStoreBalance.textContent = coins.toLocaleString();
  menuStoreBalance.textContent = coins.toLocaleString();
  updateMenuStats();

  for (const [name, button] of Object.entries(upgradeButtons)) {
    if (!button) {
      continue;
    }

    const definition = UPGRADE_DEFINITIONS[name];
    const level = upgradeLevels[name];
    const atMaxLevel = level >= definition.maxLevel;
    const cost = getUpgradeCost(name);
    button.disabled = atMaxLevel || coins < cost;
    button.textContent = atMaxLevel ? "Max level" : `Buy ${cost}`;
  }
}

function buyUpgrade(name) {
  const definition = UPGRADE_DEFINITIONS[name];
  if (!definition) {
    return;
  }
  const cost = getUpgradeCost(name);
  if (upgradeLevels[name] >= definition.maxLevel || coins < cost) {
    return;
  }

  coins -= cost;
  upgradeLevels[name]++;

  if (name === "extraLife" && storeWasPlaying) {
    lives++;
  }
  if (name === "arcShield") {
    shieldCharges += 1;
  }

  applyUpgrades();
  saveStore();
  updateStoreUI();
}

function saveStore() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ coins, upgrades: upgradeLevels, shieldCharges }));
  } catch {
    // Store progress remains available for the current session.
  }
}

function loadStore() {
  try {
    const savedStore = JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}");
    coins = Number.isSafeInteger(savedStore.coins) ? Math.max(0, savedStore.coins) : 0;
    for (const [name, definition] of Object.entries(UPGRADE_DEFINITIONS)) {
      const savedLevel = Number(savedStore.upgrades && savedStore.upgrades[name]);
      upgradeLevels[name] = Number.isInteger(savedLevel)
        ? Math.max(0, Math.min(definition.maxLevel, savedLevel))
        : 0;
    }
    shieldCharges = Number.isInteger(savedStore.shieldCharges) ? Math.max(0, savedStore.shieldCharges) : upgradeLevels.arcShield;
    if (shieldCharges < upgradeLevels.arcShield) {
      shieldCharges = upgradeLevels.arcShield;
    }
  } catch {
    coins = 0;
    for (const name of Object.keys(upgradeLevels)) {
      upgradeLevels[name] = 0;
    }
    shieldCharges = 0;
  }
}

function openStore() {
  if (storeDialog.open) {
    return;
  }

  storeWasPlaying = gameState === "playing";
  if (storeWasPlaying) {
    gameState = "store";
  }
  closeStoreButton.textContent = storeWasPlaying ? "Resume game" : "Close store";
  updateStoreUI();
  storeDialog.showModal();
}

function closeStore() {
  if (storeDialog.open) {
    storeDialog.close();
  }

  if (gameState === "store") {
    gameState = "playing";
    storeWasPlaying = false;
    lastTime = performance.now();
    leftover = 0;
    requestAnimationFrame(frame);
  }
}


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
const particles = [];
let score = 0;
let bricksBroken = 0;
let level = 1;
let lives = STARTING_LIVES;
let highScore = 0;
let runStartedAt = 0;


// ------------------------------------------------------------
// KEYBOARD
// keys["arrowleft"] is true while the left arrow is held down.
// ------------------------------------------------------------
const keys = {};
let gameState = "home";

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  keys[key] = true;
  const activeTag = document.activeElement && document.activeElement.tagName;

  if (gameState !== "playing" && activeTag === "BODY" && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    beginGame();
  }

  if (gameState === "playing" && (event.code === "Space" || key === " ")) {
    event.preventDefault();
  }

  // Stop the arrow keys from scrolling the page.
  if (event.key.startsWith("Arrow") && activeTag !== "INPUT" && activeTag !== "SELECT") {
    event.preventDefault();
  }
});

document.addEventListener("keyup", function (event) {
  keys[event.key.toLowerCase()] = false;
});


// ------------------------------------------------------------
// UPDATE: runs 60 times every second. Move things, then check
// what they touched.
// ------------------------------------------------------------
function fireBlaster() {
  const totalWeaponLevel = getActiveWeaponLevel();
  if (totalWeaponLevel <= 0 || blasterCooldown > 0 || gameState !== "playing") {
    return;
  }

  const shotWidth = 6;
  const shotHeight = 12;
  const baseSpeed = 8 + Math.max(upgradeLevels.blockBlaster, upgradeLevels.pulseCannon) * 1.5;

  const patterns = [];

  if (upgradeLevels.blockBlaster > 0) {
    patterns.push({ count: 1 + Math.min(1, upgradeLevels.blockBlaster - 1), speed: baseSpeed, color: "#d6ff58", width: shotWidth, height: shotHeight, spread: 0 });
  }

  if (upgradeLevels.pulseCannon > 0) {
    patterns.push({ count: 1 + Math.min(1, upgradeLevels.pulseCannon - 1), speed: baseSpeed + 2.5, color: "#42f5e9", width: 5, height: 10, spread: 0 });
  }

  if (upgradeLevels.scatterShot > 0) {
    patterns.push({ count: 3 + Math.min(1, upgradeLevels.scatterShot - 1), speed: 6 + upgradeLevels.scatterShot * 1.3, color: "#ff4bd8", width: 5, height: 10, spread: 10 });
  }

  if (upgradeLevels.railCannon > 0) {
    patterns.push({ count: 1, speed: 12 + upgradeLevels.railCannon * 2, color: "#ff7a45", width: 7, height: 16, spread: 0 });
  }

  for (const pattern of patterns) {
    for (let i = 0; i < pattern.count; i++) {
      const offset = pattern.spread > 0 ? (i - (pattern.count - 1) / 2) * pattern.spread : 0;
      projectiles.push({
        x: paddle.x + paddle.width / 2 - pattern.width / 2 + offset,
        y: paddle.y - pattern.height,
        width: pattern.width,
        height: pattern.height,
        vy: -pattern.speed,
        color: pattern.color,
        damage: 1 + Math.floor((upgradeLevels.blockBlaster + upgradeLevels.pulseCannon + upgradeLevels.railCannon) / 2)
      });
    }
  }

  muzzleFlash = 1;
  blasterCooldown = 180 - Math.min(60, totalWeaponLevel * 12);
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];
    projectile.y += projectile.vy;

    if (projectile.y + projectile.height < 0) {
      projectiles.splice(i, 1);
      continue;
    }

    let hitBrick = false;
    for (let j = 0; j < bricks.length; j++) {
      const brick = bricks[j];
      if (!boxesTouch(projectile, brick)) {
        continue;
      }

      brick.hits -= projectile.damage || 1;
      if (brick.hits <= 0) {
        createBrickExplosion(brick);
        bricks.splice(j, 1);
        if (bricks.length === 0) {
          advanceLevel();
        }
      }

      projectiles.splice(i, 1);
      hitBrick = true;
      break;
    }

    if (hitBrick) {
      continue;
    }
  }
}

function updateEnemyProjectiles() {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const projectile = enemyProjectiles[i];
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;

    if (projectile.y > HEIGHT + projectile.height) {
      enemyProjectiles.splice(i, 1);
      continue;
    }

    if (boxesTouch(projectile, paddle)) {
      enemyProjectiles.splice(i, 1);

      if (shieldCharges > 0) {
        shieldCharges--;
        return;
      }

      lives--;
      if (lives <= 0) {
        finishGame();
        return;
      }
      resetBall();
      continue;
    }
  }

  for (const brick of bricks) {
    brick.fireCooldown = (brick.fireCooldown ?? brick.fireRate) - 1;
    if (brick.fireCooldown > 0) {
      continue;
    }

    const targetX = paddle.x + paddle.width / 2;
    const originX = brick.x + brick.width / 2;
    const originY = brick.y + brick.height;
    const dx = targetX - originX;
    const dy = paddle.y - originY;
    const distance = Math.max(12, Math.hypot(dx, dy));

    if (distance > 260) {
      brick.fireCooldown = Math.max(20, brick.fireRate * 0.5);
      continue;
    }

    const speed = 2.6 + level * 0.25;
    enemyProjectiles.push({
      x: originX - 3,
      y: originY,
      width: 6,
      height: 10,
      vx: (dx / distance) * speed,
      vy: (dy / distance) * speed,
      color: brick.accent || brick.color
    });

    brick.fireCooldown = brick.fireRate + Math.random() * (brick.fireRate * 0.7);
  }
}

function update() {
  movePaddle();
  moveBall();

  if (keys[" "] && getActiveWeaponLevel() > 0) {
    fireBlaster();
  }

  blasterCooldown = Math.max(0, blasterCooldown - 1000 / 60);
  muzzleFlash = Math.max(0, muzzleFlash - 0.12);

  bounceOffWalls();   // collisions.js
  bounceOffPaddle();  // collisions.js
  bounceOffBricks();  // collisions.js
  updateProjectiles();
  updateEnemyProjectiles();
  updateParticles();

  // The ball fell off the bottom: lose a life or end the run.
  if (ball.y > HEIGHT) {
    if (shieldCharges > 0) {
      shieldCharges--;
      resetBall();
      return;
    }

    lives--;
    if (lives <= 0) {
      finishGame();
    } else {
      resetBall();
    }
  }
}

function advanceLevel() {
  level++;
  bricks = makeBricks(level);
  enemyProjectiles.length = 0;
  awardCoins(25 + level * 5);
}

function movePaddle() {
  if (keys["arrowleft"] || keys["a"]) {
    paddle.x = paddle.x - paddle.speed;
  }
  if (keys["arrowright"] || keys["d"]) {
    paddle.x = paddle.x + paddle.speed;
  }

  // Keep the paddle on the screen.
  if (paddle.x < 0) {
    paddle.x = 0;
  }
  if (paddle.x + paddle.width > WIDTH) {
    paddle.x = WIDTH - paddle.width;
  }
}

function moveBall() {
  ball.x = ball.x + ball.vx;
  ball.y = ball.y + ball.vy;
}

function createBrickExplosion(brick) {
  const scoreMultiplier = 1 + upgradeLevels.scoreBoost * 0.12;
  score += Math.round(100 * scoreMultiplier);
  bricksBroken++;
  awardCoins(10);
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }

  const particleCount = 14;
  const colors = ["#42f5e9", "#d6ff58", "#ff4bd8"];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.3;
    const speed = 1.5 + Math.random() * 3.5;
    const life = 18 + Math.floor(Math.random() * 12);

    particles.push({
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life,
      maxLife: life,
      color: colors[i % colors.length]
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vx *= 0.96;
    particle.vy *= 0.96;
    particle.life--;

    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const particle of particles) {
    ctx.globalAlpha = particle.life / particle.maxLife;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawLives() {
  const barWidth = 14;
  const barHeight = 8;
  const barGap = 5;
  const labelWidth = 40;
  const labelGap = 10;
  const maxLives = STARTING_LIVES + upgradeLevels.extraLife;
  const barsWidth = maxLives * barWidth + (maxLives - 1) * barGap;
  const left = WIDTH - 16 - labelWidth - labelGap - barsWidth;
  const barsLeft = left + labelWidth + labelGap;

  ctx.save();
  ctx.font = "bold 11px Courier New, monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#a7c3c5";
  ctx.fillText("LIVES", left, 22);

  ctx.textAlign = "center";
  ctx.fillText(`LEVEL ${level}`, WIDTH / 2, 22);

  ctx.fillStyle = NEON_CYAN;
  ctx.shadowColor = NEON_CYAN;
  ctx.shadowBlur = 8;
  for (let i = 0; i < lives; i++) {
    const x = barsLeft + i * (barWidth + barGap);
    ctx.fillRect(x, 18, barWidth, barHeight);
  }
  ctx.restore();
}


// ------------------------------------------------------------
// DRAW: paints the dark playfield and neon game pieces.
// ------------------------------------------------------------
function drawProjectiles() {
  for (const projectile of projectiles) {
    ctx.fillStyle = projectile.color;
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
  }

  ctx.shadowBlur = 0;
}

function drawEnemyProjectiles() {
  for (const projectile of enemyProjectiles) {
    ctx.fillStyle = projectile.color;
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 14;
    ctx.fillRect(projectile.x, projectile.y, projectile.width, projectile.height);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(projectile.x + 1, projectile.y + 1, 2, 2);
  }

  ctx.shadowBlur = 0;
}

function drawRadar() {
  const radarX = WIDTH - 120;
  const radarY = HEIGHT - 90;
  const radarW = 98;
  const radarH = 72;
  const radarPadding = 6;
  const scaleX = (radarW - radarPadding * 2) / WIDTH;
  const scaleY = (radarH - radarPadding * 2) / HEIGHT;

  ctx.save();
  ctx.fillStyle = "rgba(7, 18, 22, 0.8)";
  ctx.strokeStyle = "rgba(66, 245, 233, 0.7)";
  ctx.lineWidth = 1;
  ctx.fillRect(radarX, radarY, radarW, radarH);
  ctx.strokeRect(radarX, radarY, radarW, radarH);

  ctx.beginPath();
  ctx.moveTo(radarX + radarW / 2, radarY + 2);
  ctx.lineTo(radarX + radarW / 2, radarY + radarH - 2);
  ctx.moveTo(radarX + 2, radarY + radarH / 2);
  ctx.lineTo(radarX + radarW - 2, radarY + radarH / 2);
  ctx.strokeStyle = "rgba(66, 245, 233, 0.35)";
  ctx.stroke();

  ctx.fillStyle = "#d6ff58";
  ctx.fillRect(
    radarX + radarPadding + paddle.x * scaleX,
    radarY + radarPadding + paddle.y * scaleY,
    4,
    4
  );

  for (const brick of bricks) {
    const dotX = radarX + radarPadding + brick.x * scaleX + brick.width * scaleX / 2;
    const dotY = radarY + radarPadding + brick.y * scaleY + brick.height * scaleY / 2;
    ctx.fillStyle = brick.color;
    ctx.fillRect(dotX, dotY, 3, 3);
  }

  ctx.fillStyle = "#edfdfd";
  ctx.font = "bold 8px Courier New, monospace";
  ctx.fillText("RADAR", radarX + 8, radarY + 12);
  ctx.restore();
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = PADDLE_COLOR;
  ctx.shadowColor = PADDLE_COLOR;
  ctx.shadowBlur = 14;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  drawBlasterFlash();
  drawPaddleStatus();
  ctx.fillStyle = BALL_COLOR;
  ctx.shadowColor = BALL_COLOR;
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  ctx.shadowBlur = 0;

  drawBricks();  // bricks.js
  drawEnemyProjectiles();
  drawProjectiles();
  drawParticles();
  drawRadar();
  drawLives();
}


// ------------------------------------------------------------
// THE GAME LOOP
// The browser calls frame() every time it is ready to draw.
// Some screens are faster than others, so we make sure update()
// always runs exactly 60 times per second on every computer.
// ------------------------------------------------------------
const STEP = 1000 / 60;
let lastTime = 0;
let leftover = 0;

function frame(now) {
  if (gameState !== "playing") {
    return;
  }

  leftover = leftover + (now - lastTime);
  lastTime = now;

  // If the tab was hidden for a while, don't try to catch up.
  if (leftover > 250) {
    leftover = 250;
  }

  while (leftover >= STEP && gameState === "playing") {
    update();
    leftover = leftover - STEP;
  }

  draw();
  if (gameState === "playing") {
    requestAnimationFrame(frame);
  }
}

function beginGame() {
  if (gameState === "playing") {
    return;
  }

  gameState = "playing";
  level = 1;
  bricks = makeBricks(level);
  particles.length = 0;
  projectiles.length = 0;
  enemyProjectiles.length = 0;
  muzzleFlash = 0;
  score = 0;
  bricksBroken = 0;
  coinsEarnedThisRun = 0;
  shieldCharges = upgradeLevels.arcShield;
  blasterCooldown = 0;
  lives = STARTING_LIVES + upgradeLevels.extraLife;
  applyUpgrades();
  runStartedAt = performance.now();
  resetBall();
  leftover = 0;

  homePanel.hidden = false;
  gameOverPanel.hidden = true;
  startButton.hidden = false;
  playAgainButton.hidden = true;
  gameStoreButton.hidden = false;
  homeScreen.setAttribute("aria-label", "Neon Rush menu");
  homeScreen.hidden = true;
  lastTime = runStartedAt;
  requestAnimationFrame(frame);
}

function loadHighScore() {
  try {
    const savedScore = Number.parseInt(window.localStorage.getItem(HIGH_SCORE_KEY), 10);
    highScore = Number.isFinite(savedScore) ? Math.max(0, savedScore) : 0;
  } catch {
    highScore = 0;
  }
}

function saveHighScore() {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    // The current run still keeps its high score if storage is unavailable.
  }
}

function finishGame() {
  gameState = "game-over";
  particles.length = 0;
  projectiles.length = 0;
  enemyProjectiles.length = 0;
  muzzleFlash = 0;

  const elapsedSeconds = Math.floor((performance.now() - runStartedAt) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  awardCoins(Math.floor(score / 1000) * 25 + Math.floor(elapsedSeconds / 30) * 5);

  document.getElementById("high-score-result").textContent = highScore.toLocaleString();
  document.getElementById("run-score-result").textContent = score.toLocaleString();
  levelResult.textContent = level;
  document.getElementById("bricks-broken-result").textContent = bricksBroken;
  coinsEarnedResult.textContent = coinsEarnedThisRun.toLocaleString();
  document.getElementById("run-time-result").textContent = `${minutes}:${seconds}`;
  document.getElementById("lives-used-result").textContent = STARTING_LIVES + upgradeLevels.extraLife - lives;

  homePanel.hidden = true;
  gameOverPanel.hidden = false;
  startButton.hidden = true;
  playAgainButton.hidden = false;
  gameStoreButton.hidden = true;
  homeScreen.setAttribute("aria-label", "Neon Rush game over");
  homeScreen.hidden = false;
}

function start() {
  loadHighScore();
  loadStore();
  applySettings();
  level = 1;
  bricks = makeBricks(level);  // bricks.js
  enemyProjectiles.length = 0;
  resetBall();
  updateStoreUI();
  draw();
  window.setTimeout(() => {
    loadingScreen.hidden = true;
    homeScreen.inert = false;
  }, 700);
}

// Wait until all three script files have loaded, then start.
for (const [name, button] of Object.entries(activeUpgradeButtons)) {
  button.addEventListener("click", () => buyUpgrade(name));
}

gameStoreButton.addEventListener("click", openStore);
menuStoreButton.addEventListener("click", openStore);
closeStoreButton.addEventListener("click", closeStore);
storeDialog.addEventListener("cancel", event => {
  event.preventDefault();
  closeStore();
});
storeDialog.addEventListener("click", event => {
  if (event.target === storeDialog) {
    closeStore();
  }
});
ballSpeedControl.addEventListener("input", applySettings);
paddleSpeedControl.addEventListener("input", applySettings);
canvasSizeControl.addEventListener("change", applySettings);
settingsToggle.addEventListener("click", function () {
  const isExpanded = settingsToggle.getAttribute("aria-expanded") === "true";
  settingsToggle.setAttribute("aria-expanded", String(!isExpanded));
  settingsPanel.hidden = isExpanded;
});
startButton.addEventListener("click", beginGame);
playAgainButton.addEventListener("click", beginGame);
window.addEventListener("load", start);
