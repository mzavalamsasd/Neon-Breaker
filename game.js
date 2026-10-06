// ============================================================
// BLOCK BREAKER (base game)
//
// game.js  = the canvas, the ball, the paddle, and the game loop
// bricks.js     = where the bricks are and how they are drawn
// collisions.js = what happens when the ball touches things
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const homeScreen = document.getElementById("home-screen");
const homePanel = document.getElementById("home-panel");
const gameOverPanel = document.getElementById("game-over-panel");
const startButton = document.getElementById("start-button");
const playAgainButton = document.getElementById("play-again-button");
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
const NEON_CYAN = "#42f5e9";


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
  width: 90,
  height: 12,
  speed: 8
};

function applySettings() {
  BALL_SPEED = Number(ballSpeedControl.value);
  paddle.speed = Number(paddleSpeedControl.value);
  ballSpeedValue.value = BALL_SPEED;
  ballSpeedValue.textContent = BALL_SPEED;
  paddleSpeedValue.value = paddle.speed;
  paddleSpeedValue.textContent = paddle.speed;
  main.dataset.canvasSize = canvasSizeControl.value;
}


// ------------------------------------------------------------
// THE BRICKS (the list is filled in by makeBricks() in bricks.js)
// ------------------------------------------------------------
let bricks = [];
const particles = [];
let score = 0;
let bricksBroken = 0;
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


// ------------------------------------------------------------
// DRAW: paints the dark playfield and neon game pieces.
// ------------------------------------------------------------
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = NEON_CYAN;
  ctx.shadowColor = NEON_CYAN;
  ctx.shadowBlur = 14;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  ctx.shadowBlur = 0;

  drawBricks();  // bricks.js
  drawParticles();
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
  bricks = makeBricks();
  particles.length = 0;
  score = 0;
  bricksBroken = 0;
  lives = STARTING_LIVES;
  runStartedAt = performance.now();
  resetBall();
  leftover = 0;

  homePanel.hidden = false;
  gameOverPanel.hidden = true;
  startButton.hidden = false;
  playAgainButton.hidden = true;
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

  document.getElementById("high-score-result").textContent = highScore.toLocaleString();
  document.getElementById("run-score-result").textContent = score.toLocaleString();
  document.getElementById("bricks-broken-result").textContent = bricksBroken;
  document.getElementById("run-time-result").textContent = `${minutes}:${seconds}`;
  document.getElementById("lives-used-result").textContent = STARTING_LIVES - lives;

  homePanel.hidden = true;
  gameOverPanel.hidden = false;
  startButton.hidden = true;
  playAgainButton.hidden = false;
  homeScreen.setAttribute("aria-label", "Neon Breaker game over");
  homeScreen.hidden = false;
}

function start() {
  loadHighScore();
  applySettings();
  bricks = makeBricks();  // bricks.js
  resetBall();
  draw();
}

// Wait until all three script files have loaded, then start.
ballSpeedControl.addEventListener("input", applySettings);
paddleSpeedControl.addEventListener("input", applySettings);
canvasSizeControl.addEventListener("change", applySettings);
startButton.addEventListener("click", beginGame);
playAgainButton.addEventListener("click", beginGame);
window.addEventListener("load", start);
