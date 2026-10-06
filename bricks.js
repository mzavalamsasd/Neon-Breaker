// ============================================================
// bricks.js: where the bricks are, and how they are drawn
// ============================================================

const BRICK_COLUMNS = 8;
const BRICK_ROWS = 4;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const BRICK_GAP = 6;     // empty space between bricks
const BRICKS_TOP = 50;   // how far down the first row starts
const BRICK_COLORS = ["#42f5e9", "#d6ff58", "#ff4bd8", "#ff7a45"];

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  const list = [];
  const maxHits = Math.min(Math.max(1, Math.floor(level)), 5);

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: BRICK_COLORS[row % BRICK_COLORS.length],
        hits: maxHits,
        maxHits
      });
    }
  }

  return list;
}

// Draws every brick in the list.
function drawBricks() {
  for (const brick of bricks) {
    ctx.fillStyle = brick.color;
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 12;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#061116";
    ctx.font = "bold 11px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2);
  }
  ctx.shadowBlur = 0;
}
