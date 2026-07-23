/* ══════════════════════════════════════
   SNAKE — Premium Arcade Snake Game
   - Juicy particle effects on food consumption
   - Floating score popups (+10)
   - Golden bonus apples
   - On-screen touch D-pad controls for mobile/tablet
   - Pause feature (P / Pause button) & Audio Mute toggle
   - Glossy snake with tongue flick & glowing food
══════════════════════════════════════ */
GamesPlay.register({
  name: "Retro Snake",
  icon: "&#128013;",
  desc: "Juicy arcade snake with particle effects, golden apples & touch controls.",
  available: true,

  init(canvas, updateScore) {
    const ctx = canvas.getContext("2d");
    let audioCtx = null, soundEnabled = true;

    function getAudio() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      return audioCtx;
    }

    function playEat(isGolden = false) {
      if (!soundEnabled) return;
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = isGolden ? "triangle" : "sine";
        o.frequency.setValueAtTime(isGolden ? 880 : 520, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(isGolden ? 1760 : 1046, a.currentTime + 0.12);
        g.gain.setValueAtTime(0.2, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.15);
        o.connect(g);
        g.connect(a.destination);
        o.start(a.currentTime);
        o.stop(a.currentTime + 0.15);
      } catch (_) {}
    }

    function playGameOver() {
      if (!soundEnabled) return;
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "sawtooth";
        o.frequency.setValueAtTime(280, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, a.currentTime + 0.4);
        g.gain.setValueAtTime(0.25, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.4);
        o.connect(g);
        g.connect(a.destination);
        o.start(a.currentTime);
        o.stop(a.currentTime + 0.4);
      } catch (_) {}
    }

    const TILE_SIZE = 24;
    let W, H, cols, rows;
    let snake, food, dir, nextDir, score, highScore, gameOver, playing, paused, frameId, lastTime, stepInterval, tick;
    let particles = [], floatTexts = [], eatenCount = 0;

    // Create UI overlay controls container if not present
    let uiWrap = document.getElementById("snakeUIOverlay");
    if (!uiWrap) {
      uiWrap = document.createElement("div");
      uiWrap.id = "snakeUIOverlay";
      uiWrap.className = "snake-ui-overlay";
      uiWrap.innerHTML = `
        <div class="snake-top-bar">
          <button id="snakeMuteBtn" class="snake-hud-btn" title="Toggle Sound">🔊 Sound</button>
          <button id="snakePauseBtn" class="snake-hud-btn" title="Pause Game">⏸ Pause</button>
        </div>
        <div class="snake-dpad">
          <div class="snake-dpad-row">
            <button id="dpadUp" class="dpad-btn">▲</button>
          </div>
          <div class="snake-dpad-row">
            <button id="dpadLeft" class="dpad-btn">◀</button>
            <button id="dpadDown" class="dpad-btn">▼</button>
            <button id="dpadRight" class="dpad-btn">▶</button>
          </div>
        </div>
      `;
      canvas.parentElement.style.position = "relative";
      canvas.parentElement.appendChild(uiWrap);
    }

    // Inject CSS for UI overlay
    let styleEl = document.getElementById("snakeUIStyle");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "snakeUIStyle";
      styleEl.textContent = `
        .snake-ui-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem;
        }
        .snake-top-bar {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          pointer-events: auto;
        }
        .snake-hud-btn {
          background: var(--bg-soft, #1a2022);
          color: var(--text, #ecf3ef);
          border: 1px solid var(--line, #2a3336);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.85rem;
          transition: background 0.2s, border-color 0.2s;
        }
        .snake-hud-btn:hover {
          background: rgba(37, 126, 67, 0.2);
          border-color: var(--primary-2, #36a85d);
        }
        .snake-dpad {
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          pointer-events: auto;
          margin-bottom: 0.5rem;
        }
        .snake-dpad-row {
          display: flex;
          gap: 40px;
        }
        .dpad-btn {
          background: rgba(26, 32, 34, 0.85);
          color: #ecf3ef;
          border: 1px solid #36a85d;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          font-size: 1.2rem;
          font-weight: bold;
          cursor: pointer;
          display: grid;
          place-items: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          user-select: none;
        }
        .dpad-btn:active {
          background: #36a85d;
          color: #fff;
          transform: scale(0.95);
        }
        @media (max-width: 900px) {
          .snake-dpad { display: flex; }
        }
      `;
      document.head.appendChild(styleEl);
    }

    const muteBtn = document.getElementById("snakeMuteBtn");
    const pauseBtn = document.getElementById("snakePauseBtn");

    muteBtn.onclick = () => {
      soundEnabled = !soundEnabled;
      muteBtn.textContent = soundEnabled ? "🔊 Sound" : "🔇 Muted";
    };

    pauseBtn.onclick = () => {
      if (!playing && !gameOver) return;
      paused = !paused;
      pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
    };

    document.getElementById("dpadUp").onclick = () => { if (dir.y === 0) nextDir = { x: 0, y: -1 }; };
    document.getElementById("dpadDown").onclick = () => { if (dir.y === 0) nextDir = { x: 0, y: 1 }; };
    document.getElementById("dpadLeft").onclick = () => { if (dir.x === 0) nextDir = { x: -1, y: 0 }; };
    document.getElementById("dpadRight").onclick = () => { if (dir.x === 0) nextDir = { x: 1, y: 0 }; };

    function resize() {
      const cw = Math.min(880, window.innerWidth - 32);
      const ch = Math.min(640, window.innerHeight - 200);
      cols = Math.max(16, Math.floor(cw / TILE_SIZE));
      rows = Math.max(16, Math.floor(ch / TILE_SIZE));
      W = canvas.width = cols * TILE_SIZE;
      H = canvas.height = rows * TILE_SIZE;
    }

    function reset() {
      const startX = Math.floor(cols / 2);
      const startY = Math.floor(rows / 2);
      snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      highScore = parseInt(localStorage.getItem("snake-hi")) || 0;
      gameOver = false;
      playing = false;
      paused = false;
      lastTime = 0;
      stepInterval = 110;
      tick = 0;
      eatenCount = 0;
      particles = [];
      floatTexts = [];
      spawnFood();
      updateScore("0");
    }

    function spawnFood() {
      let valid = false;
      const isGolden = (++eatenCount % 5 === 0);
      while (!valid) {
        food = {
          x: Math.floor(Math.random() * cols),
          y: Math.floor(Math.random() * rows),
          isGolden,
        };
        valid = true;
        for (const seg of snake) {
          if (seg.x === food.x && seg.y === food.y) {
            valid = false;
            break;
          }
        }
      }
    }

    function startGame() {
      if (gameOver) reset();
      playing = true;
      paused = false;
    }

    function update() {
      if (!playing || gameOver || paused) return;
      tick++;

      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      // Wall collision
      if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
        handleGameOver();
        return;
      }

      // Self collision
      for (const seg of snake) {
        if (head.x === seg.x && head.y === seg.y) {
          handleGameOver();
          return;
        }
      }

      snake.unshift(head);

      // Eat food
      if (head.x === food.x && head.y === food.y) {
        const pts = food.isGolden ? 30 : 10;
        score += pts;
        updateScore(String(score));
        playEat(food.isGolden);

        // Spawn particles
        const fx = food.x * TILE_SIZE + TILE_SIZE / 2;
        const fy = food.y * TILE_SIZE + TILE_SIZE / 2;
        for (let i = 0; i < 16; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2 + Math.random() * 4;
          particles.push({
            x: fx,
            y: fy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: food.isGolden ? "#fbbf24" : "#ef4444",
            life: 1.0,
            decay: 0.03 + Math.random() * 0.03,
          });
        }

        // Floating text
        floatTexts.push({
          x: fx,
          y: fy,
          text: `+${pts}`,
          color: food.isGolden ? "#fbbf24" : "#4ade80",
          life: 1.0,
        });

        if (score > highScore) {
          highScore = score;
          localStorage.setItem("snake-hi", String(highScore));
        }
        spawnFood();
        if (stepInterval > 60) stepInterval -= 1;
      } else {
        snake.pop();
      }

      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // Update floating texts
      for (let i = floatTexts.length - 1; i >= 0; i--) {
        const ft = floatTexts[i];
        ft.y -= 0.8;
        ft.life -= 0.02;
        if (ft.life <= 0) floatTexts.splice(i, 1);
      }
    }

    function handleGameOver() {
      gameOver = true;
      playing = false;
      playGameOver();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem("snake-hi", String(highScore));
      }
    }

    function draw() {
      // Vibrant Arcade Arena Background
      ctx.fillStyle = "#080e0b";
      ctx.fillRect(0, 0, W, H);

      // Glowing Neon Grid Lines
      ctx.strokeStyle = "rgba(54, 168, 93, 0.07)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * TILE_SIZE, 0);
        ctx.lineTo(c * TILE_SIZE, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE_SIZE);
        ctx.lineTo(W, r * TILE_SIZE);
        ctx.stroke();
      }

      // Glowing Pulsating Food (Apple / Golden Apple)
      const fx = food.x * TILE_SIZE + TILE_SIZE / 2;
      const fy = food.y * TILE_SIZE + TILE_SIZE / 2;
      const pulse = Math.sin(tick * 0.18) * 3;

      const grad = ctx.createRadialGradient(fx, fy, 2, fx, fy, TILE_SIZE * 1.2);
      grad.addColorStop(0, food.isGolden ? "rgba(251, 191, 36, 0.5)" : "rgba(239, 68, 68, 0.5)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, TILE_SIZE * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Food Body
      ctx.fillStyle = food.isGolden ? "#fbbf24" : "#ef4444";
      ctx.beginPath();
      ctx.arc(fx, fy + 1, (TILE_SIZE / 2 - 3) + pulse * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Stem & Leaf
      ctx.strokeStyle = "#84cc16";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 5);
      ctx.quadraticCurveTo(fx + 4, fy - 12, fx + 6, fy - 10);
      ctx.stroke();

      ctx.fillStyle = "#84cc16";
      ctx.beginPath();
      ctx.ellipse(fx + 6, fy - 8, 4, 2, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Snake Body & Head
      snake.forEach((seg, idx) => {
        const sx = seg.x * TILE_SIZE + 2;
        const sy = seg.y * TILE_SIZE + 2;
        const sw = TILE_SIZE - 4;
        const sh = TILE_SIZE - 4;

        if (idx === 0) {
          // Snake Head with glossy gradient & eyes
          const hGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
          hGrad.addColorStop(0, "#4ade80");
          hGrad.addColorStop(1, "#15803d");
          ctx.fillStyle = hGrad;

          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, 9);
          ctx.fill();

          // Glossy highlight
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.beginPath();
          ctx.roundRect(sx + 3, sy + 3, sw - 6, 4, 2);
          ctx.fill();

          // Eyes
          ctx.fillStyle = "#ffffff";
          let e1x = sx + 6, e1y = sy + 6;
          let e2x = sx + sw - 10, e2y = sy + 6;

          if (dir.x === 1) { e1x = sx + sw - 8; e1y = sy + 4; e2x = sx + sw - 8; e2y = sy + sh - 8; }
          else if (dir.x === -1) { e1x = sx + 4; e1y = sy + 4; e2x = sx + 4; e2y = sy + sh - 8; }
          else if (dir.y === 1) { e1x = sx + 4; e1y = sy + sh - 8; e2x = sx + sw - 8; e2y = sy + sh - 8; }

          ctx.fillRect(e1x, e1y, 4, 4);
          ctx.fillRect(e2x, e2y, 4, 4);

          ctx.fillStyle = "#090d0b";
          ctx.fillRect(e1x + (dir.x === 1 ? 1 : 1), e1y + 1, 2, 2);
          ctx.fillRect(e2x + (dir.x === 1 ? 1 : 1), e2y + 1, 2, 2);

          // Tiny tongue flick when moving
          if (playing && tick % 15 < 8) {
            ctx.fillStyle = "#ef4444";
            if (dir.x === 1) ctx.fillRect(sx + sw, sy + sh / 2 - 1, 4, 2);
            else if (dir.x === -1) ctx.fillRect(sx - 4, sy + sh / 2 - 1, 4, 2);
            else if (dir.y === 1) ctx.fillRect(sx + sw / 2 - 1, sy + sh, 2, 4);
            else if (dir.y === -1) ctx.fillRect(sx + sw / 2 - 1, sy - 4, 2, 4);
          }
        } else {
          // Snake Body Segments
          const bGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
          bGrad.addColorStop(0, "#22c55e");
          bGrad.addColorStop(1, "#16a34a");
          ctx.fillStyle = bGrad;

          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, 7);
          ctx.fill();

          // Subtle body highlight
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.fillRect(sx + 4, sy + 4, sw - 8, 3);
        }
      });

      // Render Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Render Floating Text (+10 / +30)
      for (const ft of floatTexts) {
        ctx.save();
        ctx.globalAlpha = ft.life;
        ctx.fillStyle = ft.color;
        ctx.font = "bold 15px monospace";
        ctx.textAlign = "center";
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // High-Contrast Neon HUD for Score & High Score
      ctx.fillStyle = "rgba(12, 20, 16, 0.88)";
      ctx.fillRect(W - 225, 12, 210, 38);
      ctx.strokeStyle = "#36a85d";
      ctx.lineWidth = 1.8;
      ctx.strokeRect(W - 225, 12, 210, 38);

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`HI: ${highScore}   SCORE: ${score}`, W - 30, 36);

      // Overlays (Pause / Game Over / Start)
      if (paused) {
        ctx.fillStyle = "rgba(8, 14, 11, 0.75)";
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 26px monospace";
        ctx.fillText("PAUSED", W / 2, H / 2);
        ctx.font = "13px monospace";
        ctx.fillStyle = "#ecf3ef";
        ctx.fillText("Press P or Resume to continue", W / 2, H / 2 + 30);
      } else if (gameOver) {
        ctx.fillStyle = "rgba(8, 14, 11, 0.85)";
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = "center";
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 26px monospace";
        ctx.fillText("G A M E   O V E R", W / 2, H / 2 - 24);

        ctx.fillStyle = "#4ade80";
        ctx.font = "14px monospace";
        ctx.fillText(`Final Score: ${score}   (Best: ${highScore})`, W / 2, H / 2 + 10);

        ctx.fillStyle = "#ecf3ef";
        ctx.font = "13px monospace";
        ctx.fillText("Press Arrow Keys or Tap to Restart", W / 2, H / 2 + 42);
      } else if (!playing) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#4ade80";
        ctx.font = "16px monospace";
        ctx.fillText("Press Arrow Keys or Tap to Start", W / 2, H / 2);
      }
    }

    let accumulator = 0;
    function loop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      accumulator += delta;
      while (accumulator >= stepInterval) {
        update();
        accumulator -= stepInterval;
      }

      draw();
      frameId = requestAnimationFrame(loop);
    }

    function onKey(e) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "p" || e.key === "P") {
        if (playing || gameOver) {
          paused = !paused;
          pauseBtn.textContent = paused ? "▶ Resume" : "⏸ Pause";
        }
        return;
      }
      if (!playing && !gameOver) startGame();
      if (gameOver) { reset(); playing = true; return; }
      if (paused) return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (dir.y === 0) nextDir = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (dir.y === 0) nextDir = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (dir.x === 0) nextDir = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (dir.x === 0) nextDir = { x: 1, y: 0 };
          break;
      }
    }

    function onTap(e) {
      e.preventDefault();
      if (paused) return;
      if (!playing) startGame();
      if (gameOver) { reset(); playing = true; }
    }

    resize();
    reset();

    window.addEventListener("resize", resize);
    document.addEventListener("keydown", onKey);
    canvas.addEventListener("mousedown", onTap);
    canvas.addEventListener("touchstart", onTap, { passive: false });

    frameId = requestAnimationFrame(loop);

    this.destroy = function () {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", onKey);
      canvas.removeEventListener("mousedown", onTap);
      canvas.removeEventListener("touchstart", onTap);
      if (uiWrap && uiWrap.parentNode) uiWrap.parentNode.removeChild(uiWrap);
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (audioCtx) audioCtx.close();
    };
  },

  destroy: null,
});
