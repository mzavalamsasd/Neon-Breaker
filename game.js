// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
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
  extraLife: document.getElementById("buy-extra-life")
};
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
const HIGH_SCORE_KEY = "neon-breaker-high-score";
const STORE_KEY = "neon-breaker-store";
const NEON_CYAN = "#42f5e9";
const PADDLE_COLOR = "#54a8ff";
const BALL_COLOR = "#ffdc4a";
const BASE_PADDLE_WIDTH = 90;
const UPGRADE_DEFINITIONS = {
  paddleWidth: { baseCost: 120, costStep: 100, maxLevel: 4 },
  paddleSpeed: { baseCost: 100, costStep: 120, maxLevel: 5 },
  extraLife: { baseCost: 250, costStep: 150, maxLevel: 3 }
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
const upgradeLevels = { paddleWidth: 0, paddleSpeed: 0, extraLife: 0 };
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
  paddle.x = Math.max(0, Math.min(WIDTH - paddle.width, center - paddle.width / 2));
}

function awardCoins(amount) {
  const earned = Math.max(0, Math.floor(amount));
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

function updateStoreUI() {
  storeBalance.textContent = coins.toLocaleString();
  gameStoreBalance.textContent = coins.toLocaleString();
  menuStoreBalance.textContent = coins.toLocaleString();

  for (const [name, button] of Object.entries(upgradeButtons)) {
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

  applyUpgrades();
  saveStore();
  updateStoreUI();
}

function saveStore() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify({ coins, upgrades: upgradeLevels }));
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
  } catch {
    coins = 0;
    for (const name of Object.keys(upgradeLevels)) {
      upgradeLevels[name] = 0;
    }
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
  keys[event.key.toLowerCase()] = true;
  const activeTag = document.activeElement && document.activeElement.tagName;

  if (gameState !== "playing" && activeTag === "BODY" && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    beginGame();
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
function update() {
  movePaddle();
  moveBall();

  bounceOffWalls();   // collisions.js
  bounceOffPaddle();  // collisions.js
  bounceOffBricks();  // collisions.js
  updateParticles();

  // The ball fell off the bottom: lose a life or end the run.
  if (ball.y > HEIGHT) {
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
  score += 100;
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
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = PADDLE_COLOR;
  ctx.shadowColor = PADDLE_COLOR;
  ctx.shadowBlur = 14;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillStyle = BALL_COLOR;
  ctx.shadowColor = BALL_COLOR;
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  ctx.shadowBlur = 0;

  drawBricks();  // bricks.js
  drawParticles();
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
  score = 0;
  bricksBroken = 0;
  coinsEarnedThisRun = 0;
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
  homeScreen.setAttribute("aria-label", "Neon Breaker menu");
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
  homeScreen.setAttribute("aria-label", "Neon Breaker game over");
  homeScreen.hidden = false;
}

function start() {
  loadHighScore();
  loadStore();
  applySettings();
  level = 1;
  bricks = makeBricks(level);  // bricks.js
  resetBall();
  updateStoreUI();
  draw();
  window.setTimeout(() => {
    loadingScreen.hidden = true;
    homeScreen.inert = false;
  }, 700);
}

// Wait until all three script files have loaded, then start.
for (const [name, button] of Object.entries(upgradeButtons)) {
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
