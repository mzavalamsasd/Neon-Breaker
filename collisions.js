// ============================================================
// collisions.js: what happens when the ball touches something
//
// To "bounce", we flip the ball's speed:
//   hit something sideways -> vx = -vx
//   hit something above or below -> vy = -vy
// ============================================================

// Returns true if two rectangles (like the ball and a brick) overlap.
function boxesTouch(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}


// The ball bounces off the left, right, and top walls.
// (The bottom is not a wall: falling off the bottom resets the ball.)
function bounceOffWalls() {
  if (ball.x < 0) {
    ball.x = 0;
    ball.vx = -ball.vx;
  }
  if (ball.x + ball.width > WIDTH) {
    ball.x = WIDTH - ball.width;
    ball.vx = -ball.vx;
  }
  if (ball.y < 0) {
    ball.y = 0;
    ball.vy = -ball.vy;
  }
}


// The ball bounces off the top of the paddle.
// ball.vy > 0 means "the ball is moving down", so it only bounces
// when it is falling onto the paddle.
function bounceOffPaddle() {
  if (boxesTouch(ball, paddle) && ball.vy > 0) {
    const paddleCenter = paddle.x + paddle.width / 2;
    const hitPosition = (ball.x + ball.width / 2 - paddleCenter) / (paddle.width / 2);
    const gripBoost = upgradeLevels.paddleGrip * 0.8;
    const speed = Math.max(Math.hypot(ball.vx, ball.vy), BALL_SPEED + 1);

    ball.y = paddle.y - ball.height;  // sit on top of the paddle
    ball.vy = -(Math.abs(speed) * (0.9 + gripBoost * 0.08));
    ball.vx = hitPosition * (BALL_SPEED + 1.5 + gripBoost);

    if (Math.abs(ball.vx) < 1.5) {
      ball.vx = hitPosition < 0 ? -1.5 : 1.5;
    }
  }
}


// Each brick takes one hit per collision and breaks when its hits run out.
function bounceOffBricks() {
  for (let i = 0; i < bricks.length; i++) {
    const brick = bricks[i];
    if (!boxesTouch(ball, brick)) {
      continue;  // not touching this brick, check the next one
    }

    // How far has the ball pushed into the brick on each side?
    const overlapX = Math.min(ball.x + ball.width, brick.x + brick.width) - Math.max(ball.x, brick.x);
    const overlapY = Math.min(ball.y + ball.height, brick.y + brick.height) - Math.max(ball.y, brick.y);

    if (overlapX < overlapY) {
      // The ball hit the brick's left or right side.
      ball.vx = -ball.vx;
      if (ball.x < brick.x) {
        ball.x = brick.x - ball.width;     // left of the brick
      } else {
        ball.x = brick.x + brick.width;    // right of the brick
      }
    } else {
      // The ball hit the brick's top or bottom.
      ball.vy = -ball.vy;
      if (ball.y < brick.y) {
        ball.y = brick.y - ball.height;    // above the brick
      } else {
        ball.y = brick.y + brick.height;   // below the brick
      }
    }

    brick.hits--;
    if (brick.hits <= 0) {
      createBrickExplosion(brick);
      bricks.splice(i, 1);
      if (bricks.length === 0) {
        advanceLevel();
      }
    }
    break;  // bounce off one brick per update, then stop looking
  }
}
