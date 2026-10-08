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
const MAX_BRICK_ROWS = 8;
const DRONE_TYPES = [
  { name: "scout", color: "#42f5e9", accent: "#d6ff58", fireRate: 150, hits: 1 },
  { name: "striker", color: "#ff4bd8", accent: "#ffdc4a", fireRate: 120, hits: 2 },
  { name: "warden", color: "#54a8ff", accent: "#42f5e9", fireRate: 170, hits: 2 },
  { name: "heavy", color: "#d6ff58", accent: "#ff7a45", fireRate: 200, hits: 3 }
];

// Builds the list of bricks. Each brick is an object with an
// x, y, width, and height.
function makeBricks(level = 1) {
  const list = [];
  const rowCount = Math.min(MAX_BRICK_ROWS, Math.max(BRICK_ROWS, BRICK_ROWS + Math.floor((level - 1) / 2)));
  const patternShift = (level - 1) % 4;

  // Center the whole block of bricks on the screen.
  const totalWidth = BRICK_COLUMNS * BRICK_WIDTH + (BRICK_COLUMNS - 1) * BRICK_GAP;
  const left = (WIDTH - totalWidth) / 2;

  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < BRICK_COLUMNS; col++) {
      const staggeredGap = level > 2 && ((row + patternShift) % 3 === 0) && (col === 1 || col === 6);
      const alternatingGap = level > 4 && (row + col + patternShift) % 5 === 0 && row % 2 === 0;

      if (staggeredGap || alternatingGap) {
        continue;
      }

      const droneType = DRONE_TYPES[(row + col + level) % DRONE_TYPES.length];
      const hits = Math.min(5, Math.max(1, droneType.hits + Math.floor(level / 3) + (row >= rowCount - 2 ? 1 : 0)));

      list.push({
        x: left + col * (BRICK_WIDTH + BRICK_GAP),
        y: BRICKS_TOP + row * (BRICK_HEIGHT + BRICK_GAP),
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        color: droneType.color,
        accent: droneType.accent,
        droneType: droneType.name,
        hits,
        maxHits: hits,
        fireCooldown: Math.random() * droneType.fireRate,
        fireRate: droneType.fireRate
      });
    }
  }

  if (list.length === 0) {
    return makeBricks(Math.max(1, level - 1));
  }

  return list;
}

// Draws every brick in the list as a tiny neon alien drone.
function drawBricks() {
  for (const brick of bricks) {
    const droneType = DRONE_TYPES.find(type => type.name === brick.droneType) || DRONE_TYPES[0];

    ctx.save();
    ctx.translate(brick.x, brick.y);
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = 12;

    const w = brick.width;
    const h = brick.height;

    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, h * 0.55);
    ctx.lineTo(w * 0.28, h * 0.24);
    ctx.lineTo(w * 0.72, h * 0.24);
    ctx.lineTo(w * 0.9, h * 0.55);
    ctx.lineTo(w * 0.73, h * 0.72);
    ctx.lineTo(w * 0.27, h * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(6, 17, 22, 0.8)";
    ctx.fillRect(w * 0.28, h * 0.26, w * 0.18, h * 0.18);
    ctx.fillRect(w * 0.54, h * 0.26, w * 0.18, h * 0.18);

    if (droneType.name === "striker") {
      ctx.fillStyle = brick.accent;
      ctx.fillRect(w * 0.43, h * 0.14, w * 0.14, h * 0.22);
    } else if (droneType.name === "warden") {
      ctx.fillStyle = brick.accent;
      ctx.fillRect(w * 0.19, h * 0.39, w * 0.12, h * 0.22);
      ctx.fillRect(w * 0.69, h * 0.39, w * 0.12, h * 0.22);
    } else if (droneType.name === "heavy") {
      ctx.fillStyle = brick.accent;
      ctx.fillRect(w * 0.18, h * 0.54, w * 0.12, h * 0.18);
      ctx.fillRect(w * 0.7, h * 0.54, w * 0.12, h * 0.18);
      ctx.fillRect(w * 0.42, h * 0.2, w * 0.16, h * 0.14);
    }

    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.moveTo(w * 0.22, h * 0.74);
    ctx.lineTo(w * 0.4, h * 0.92);
    ctx.lineTo(w * 0.55, h * 0.92);
    ctx.lineTo(w * 0.78, h * 0.74);
    ctx.lineTo(w * 0.7, h * 0.8);
    ctx.lineTo(w * 0.3, h * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#061116";
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, w * 0.12, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = brick.accent;
    ctx.fillRect(w * 0.45, h * 0.54, w * 0.1, h * 0.12);

    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(w * 0.34, h * 0.34, w * 0.32, h * 0.08);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#edfdfd";
    ctx.font = "bold 11px Courier New, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(brick.hits), w / 2, h * 0.5);
    ctx.restore();
  }
}
