/* ══════════════════════════════════════
   BREAKOUT CLASSIC — TI Open Arcade Port
   - Brick breaker arcade gameplay
   - Responsive canvas scaling & paddle physics
   - Web Audio API SFX (bounce, brick break, win/lose)
   - High score persistence in localStorage
══════════════════════════════════════ */
GamesPlay.register({
  name: "Breakout Classic",
  icon: "&#129521;",
  desc: "Classic brick-breaker arcade game inspired by TI Open Arcade. Destroy all bricks!",
  available: true,

  init(canvas, updateScore) {
    const ctx = canvas.getContext("2d");
    let audioCtx = null;

    function getAudio() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      return audioCtx;
    }

    function playTone(freq, type, duration, vol = 0.15) {
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, a.currentTime);
        g.gain.setValueAtTime(vol, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + duration);
        o.connect(g);
        g.connect(a.destination);
        o.start(a.currentTime);
        o.stop(a.currentTime + duration);
      } catch (_) {}
    }

    let W, H;
    const ROWS = 5;
    const COLS = 10;
    let bricks = [];
    let score = 0, highScore = 0, lives = 3;
    let playing = false, gameOver = false, gameWin = false;
    let frameId, lastTime;

    // Paddle & Ball
    let paddle = { x: 0, y: 0, w: 90, h: 12, speed: 8 };
    let ball = { x: 0, y: 0, r: 6, vx: 0, vy: 0, speed: 6 };
    let keys = { left: false, right: false };

    function resize() {
      const cw = Math.min(840, window.innerWidth - 32);
      W = canvas.width = Math.max(320, cw);
      H = canvas.height = Math.max(350, Math.min(520, window.innerHeight - 180));
    }

    function reset() {
      score = 0;
      lives = 3;
      highScore = parseInt(localStorage.getItem("breakout-hi")) || 0;
      playing = false;
      gameOver = false;
      gameWin = false;
      lastTime = 0;

      paddle.w = Math.max(70, Math.floor(W * 0.14));
      paddle.x = (W - paddle.w) / 2;
      paddle.y = H - 30;

      resetBall();
      initBricks();
      updateScore("0");
    }

    function resetBall() {
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - 12;
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 2);
      ball.vy = -5;
    }

    function initBricks() {
      bricks = [];
      const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
      const padding = 8;
      const topOffset = 50;
      const brickWidth = (W - padding * (COLS + 1)) / COLS;
      const brickHeight = 18;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          bricks.push({
            x: padding + c * (brickWidth + padding),
            y: topOffset + r * (brickHeight + padding),
            w: brickWidth,
            h: brickHeight,
            color: colors[r % colors.length],
            points: (ROWS - r) * 10,
            alive: true,
          });
        }
      }
    }

    function update(dt) {
      if (!playing || gameOver || gameWin) return;

      const normDt = dt * 60;

      // Paddle move
      if (keys.left) paddle.x -= paddle.speed * normDt;
      if (keys.right) paddle.x += paddle.speed * normDt;
      paddle.x = Math.max(0, Math.min(W - paddle.w, paddle.x));

      // Ball move
      ball.x += ball.vx * normDt;
      ball.y += ball.vy * normDt;

      // Wall bounce
      if (ball.x - ball.r <= 0) {
        ball.x = ball.r;
        ball.vx = Math.abs(ball.vx);
        playTone(300, "square", 0.05);
      } else if (ball.x + ball.r >= W) {
        ball.x = W - ball.r;
        ball.vx = -Math.abs(ball.vx);
        playTone(300, "square", 0.05);
      }

      if (ball.y - ball.r <= 0) {
        ball.y = ball.r;
        ball.vy = Math.abs(ball.vy);
        playTone(320, "square", 0.05);
      }

      // Bottom fall
      if (ball.y - ball.r > H) {
        lives--;
        playTone(150, "sawtooth", 0.2);
        if (lives <= 0) {
          gameOver = true;
          playing = false;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("breakout-hi", String(highScore));
          }
        } else {
          resetBall();
        }
        return;
      }

      // Paddle bounce
      if (
        ball.y + ball.r >= paddle.y &&
        ball.y - ball.r <= paddle.y + paddle.h &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.w &&
        ball.vy > 0
      ) {
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hitPos * 6;
        playTone(450, "sine", 0.08);
      }

      // Brick collision
      let activeBricks = 0;
      for (const b of bricks) {
        if (!b.alive) continue;
        activeBricks++;

        if (
          ball.x + ball.r >= b.x &&
          ball.x - ball.r <= b.x + b.w &&
          ball.y + ball.r >= b.y &&
          ball.y - ball.r <= b.y + b.h
        ) {
          b.alive = false;
          ball.vy = -ball.vy;
          score += b.points;
          updateScore(String(score));
          playTone(600 + b.points * 5, "sine", 0.08);

          if (score > highScore) {
            highScore = score;
            localStorage.setItem("breakout-hi", String(highScore));
          }
          break;
        }
      }

      if (activeBricks === 0) {
        gameWin = true;
        playing = false;
        playTone(880, "square", 0.3);
      }
    }

    function draw() {
      ctx.fillStyle = "#0d1315";
      ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        // Brick highlight
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
      }

      // Paddle
      ctx.fillStyle = "#36a85d";
      ctx.beginPath();
      ctx.roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
      ctx.fill();

      // Ball
      ctx.fillStyle = "#ecf3ef";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();

      // HUD
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`LIVES: ${lives}`, 15, 25);
      ctx.textAlign = "right";
      ctx.fillText(`HI: ${highScore}  SCORE: ${score}`, W - 15, 25);

      // Overlays
      if (gameOver) {
        ctx.fillStyle = "rgba(13, 19, 21, 0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 26px monospace";
        ctx.fillText("G A M E   O V E R", W / 2, H / 2 - 20);
        ctx.fillStyle = "#4ade80";
        ctx.font = "14px monospace";
        ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 10);
        ctx.fillStyle = "#ecf3ef";
        ctx.font = "13px monospace";
        ctx.fillText("Click or Press Space to Restart", W / 2, H / 2 + 40);
      } else if (gameWin) {
        ctx.fillStyle = "rgba(13, 19, 21, 0.85)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 26px monospace";
        ctx.fillText("Y O U   W I N !", W / 2, H / 2 - 20);
        ctx.font = "14px monospace";
        ctx.fillText(`Final Score: ${score}`, W / 2, H / 2 + 10);
        ctx.fillStyle = "#ecf3ef";
        ctx.font = "13px monospace";
        ctx.fillText("Click or Press Space to Play Again", W / 2, H / 2 + 40);
      } else if (!playing) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "15px monospace";
        ctx.fillText("Click or Press Space / Arrow Keys to Start", W / 2, H / 2 + 30);
      }
    }

    function loop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      update(dt);
      draw();
      frameId = requestAnimationFrame(loop);
    }

    function onKey(e) {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (!playing && !gameOver && !gameWin && (e.key === " " || e.key.startsWith("Arrow"))) {
        playing = true;
      }
      if ((gameOver || gameWin) && (e.key === " " || e.key.startsWith("Arrow"))) {
        reset();
        playing = true;
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
    }

    function onKeyUp(e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
    }

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      paddle.x = Math.max(0, Math.min(W - paddle.w, mouseX - paddle.w / 2));
      if (!playing && !gameOver && !gameWin) playing = true;
    }

    function onTap(e) {
      if (!playing && !gameOver && !gameWin) {
        playing = true;
      }
      if (gameOver || gameWin) {
        reset();
        playing = true;
      }
    }

    resize();
    reset();

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onTap);

    frameId = requestAnimationFrame(loop);

    this.destroy = function () {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onTap);
      if (audioCtx) audioCtx.close();
    };
  },

  destroy: null,
});
