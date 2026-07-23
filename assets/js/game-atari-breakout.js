/* ══════════════════════════════════════
   ATARI 2600 BREAKOUT — TI Open Arcade Port
   - Faithful 6-band Atari palette (Red, Orange, Dark Yellow, Light Yellow, Green, Blue)
   - Vertical column HUD (Lives left column, Score right column)
   - 5 Lives arcade rules & high-speed bounce physics
   - Web Audio API retro synth sound effects
══════════════════════════════════════ */
GamesPlay.register({
  name: "Atari 2600 Breakout",
  icon: "&#128713;",
  desc: "Atari 2600 edition from TI Open Arcade featuring 6 rainbow bands & 5 lives.",
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

    function playTone(freq, type = "square", duration = 0.06, vol = 0.15) {
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
    const BLOCKS_X = 10;
    const BLOCKS_Y = 6;
    const COLOR_BANDS = ["#d92b2b", "#e0631b", "#d4a017", "#eab308", "#22c55e", "#2563eb"];

    let blockArray = [];
    let score = 0, highScore = 0, lives = 5;
    let playing = false, gameOver = false, gameWin = false;
    let frameId, lastTime;

    let playArea = { x: 50, y: 10, w: 300, h: 360 };
    let paddle = { x: 0, w: 55, h: 10, speed: 8 };
    let ball = { x: 0, y: 0, size: 8, vx: -3, vy: 3 };
    let keys = { left: false, right: false };

    function resize() {
      const cw = Math.min(840, window.innerWidth - 32);
      W = canvas.width = Math.max(340, cw);
      H = canvas.height = Math.max(380, Math.min(500, window.innerHeight - 180));

      const sideCol = Math.max(45, Math.floor(W * 0.12));
      playArea.x = sideCol;
      playArea.w = W - sideCol * 2;
      playArea.y = 15;
      playArea.h = H - 30;
    }

    function reset() {
      score = 0;
      lives = 5;
      highScore = parseInt(localStorage.getItem("atari-breakout-hi")) || 0;
      playing = false;
      gameOver = false;
      gameWin = false;
      lastTime = 0;

      paddle.w = Math.max(50, Math.floor(playArea.w * 0.18));
      paddle.x = playArea.x + (playArea.w - paddle.w) / 2;

      resetBall();
      initBlocks();
      updateScore("0");
    }

    function resetBall() {
      ball.x = playArea.x + playArea.w / 2;
      ball.y = playArea.y + playArea.h / 2 + 30;
      ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3;
      ball.vy = -3.5;
    }

    function initBlocks() {
      blockArray = [];
      const bw = playArea.w / BLOCKS_X;
      const bh = 14;
      const topOffset = playArea.y + 35;

      for (let r = 0; r < BLOCKS_Y; r++) {
        for (let c = 0; c < BLOCKS_X; c++) {
          blockArray.push({
            x: playArea.x + c * bw,
            y: topOffset + r * bh,
            w: bw,
            h: bh,
            color: COLOR_BANDS[r],
            points: (BLOCKS_Y - r) * 10,
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
      paddle.x = Math.max(playArea.x, Math.min(playArea.x + playArea.w - paddle.w, paddle.x));

      // Ball move
      ball.x += ball.vx * normDt;
      ball.y += ball.vy * normDt;

      // Wall bounce
      if (ball.x <= playArea.x) {
        ball.x = playArea.x;
        ball.vx = Math.abs(ball.vx);
        playTone(260);
      } else if (ball.x + ball.size >= playArea.x + playArea.w) {
        ball.x = playArea.x + playArea.w - ball.size;
        ball.vx = -Math.abs(ball.vx);
        playTone(260);
      }

      if (ball.y <= playArea.y) {
        ball.y = playArea.y;
        ball.vy = Math.abs(ball.vy);
        playTone(280);
      }

      // Bottom fall
      if (ball.y + ball.size >= playArea.y + playArea.h) {
        lives--;
        playTone(120, "sawtooth", 0.2);
        if (lives <= 0) {
          gameOver = true;
          playing = false;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("atari-breakout-hi", String(highScore));
          }
        } else {
          resetBall();
        }
        return;
      }

      // Paddle hit
      const paddleY = playArea.y + playArea.h - 20;
      if (
        ball.y + ball.size >= paddleY &&
        ball.y <= paddleY + paddle.h &&
        ball.x + ball.size >= paddle.x &&
        ball.x <= paddle.x + paddle.w &&
        ball.vy > 0
      ) {
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x + ball.size / 2 - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hitPos * 5.5;
        playTone(400);
      }

      // Block collision
      let activeBlocks = 0;
      for (const b of blockArray) {
        if (!b.alive) continue;
        activeBlocks++;

        if (
          ball.x + ball.size >= b.x &&
          ball.x <= b.x + b.w &&
          ball.y + ball.size >= b.y &&
          ball.y <= b.y + b.h
        ) {
          b.alive = false;
          ball.vy = -ball.vy;
          score += b.points;
          updateScore(String(score));
          playTone(500 + b.points * 6);

          if (score > highScore) {
            highScore = score;
            localStorage.setItem("atari-breakout-hi", String(highScore));
          }
          break;
        }
      }

      if (activeBlocks === 0) {
        gameWin = true;
        playing = false;
        playTone(800, "square", 0.3);
      }
    }

    function drawVerticalText(text, x, startY) {
      ctx.fillStyle = "#ecf3ef";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      for (let i = 0; i < text.length; i++) {
        ctx.fillText(text[i], x, startY + i * 16);
      }
    }

    function draw() {
      ctx.fillStyle = "#121212";
      ctx.fillRect(0, 0, W, H);

      // Play Area Frame & Background
      ctx.fillStyle = "#000000";
      ctx.fillRect(playArea.x, playArea.y, playArea.w, playArea.h);

      ctx.strokeStyle = "#2e3830";
      ctx.lineWidth = 3;
      ctx.strokeRect(playArea.x - 2, playArea.y - 2, playArea.w + 4, playArea.h + 4);

      // Left Column: LIVES
      const leftX = playArea.x / 2;
      drawVerticalText("LIVES", leftX, 40);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 18px monospace";
      ctx.fillText(String(lives), leftX, 150);

      // Right Column: SCORE
      const rightX = playArea.x + playArea.w + (W - (playArea.x + playArea.w)) / 2;
      drawVerticalText("SCORE", rightX, 40);
      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 16px monospace";
      ctx.fillText(String(score), rightX, 150);

      // Blocks
      for (const b of blockArray) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
      }

      // Paddle
      const paddleY = playArea.y + playArea.h - 20;
      ctx.fillStyle = COLOR_BANDS[0];
      ctx.fillRect(paddle.x, paddleY, paddle.w, paddle.h);

      // Ball
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

      // Overlays
      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(playArea.x, playArea.y, playArea.w, playArea.h);
        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 22px monospace";
        ctx.fillText("G A M E   O V E R", playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 - 20);
        ctx.fillStyle = "#4ade80";
        ctx.font = "14px monospace";
        ctx.fillText(`Score: ${score}  (Hi: ${highScore})`, playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 + 10);
        ctx.fillStyle = "#ecf3ef";
        ctx.font = "12px monospace";
        ctx.fillText("Click or Press Space to Restart", playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 + 40);
      } else if (gameWin) {
        ctx.fillStyle = "rgba(0,0,0,0.85)";
        ctx.fillRect(playArea.x, playArea.y, playArea.w, playArea.h);
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 22px monospace";
        ctx.fillText("Y O U   W I N !", playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 - 20);
        ctx.font = "14px monospace";
        ctx.fillText(`Final Score: ${score}`, playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 + 10);
        ctx.fillStyle = "#ecf3ef";
        ctx.font = "12px monospace";
        ctx.fillText("Click or Press Space to Restart", playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 + 40);
      } else if (!playing) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "14px monospace";
        ctx.fillText("Click or Arrow Keys to Start", playArea.x + playArea.w / 2, playArea.y + playArea.h / 2 + 30);
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
      paddle.x = Math.max(playArea.x, Math.min(playArea.x + playArea.w - paddle.w, mouseX - paddle.w / 2));
      if (!playing && !gameOver && !gameWin) playing = true;
    }

    function onTap(e) {
      if (!playing && !gameOver && !gameWin) playing = true;
      if (gameOver || gameWin) { reset(); playing = true; }
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
