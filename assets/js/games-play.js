/* ══════════════════════════════════════
   GAME LAUNCHER CORE
══════════════════════════════════════ */
const GamesPlay = (() => {
  const games = [];
  let currentGame = null;
  let escHandler = null;

  function register(game) {
    games.push(game);
    if (document.getElementById("gamesGrid")) {
      renderGrid();
    }
  }

  function renderGrid() {
    const grid = document.getElementById("gamesGrid");
    if (!grid) return;
    grid.innerHTML = games
      .map(
        (g, i) =>
          `<div class="card hover-card game-card${
            g.available ? "" : " game-card--locked"
          }" data-index="${i}">
            <div class="game-card-icon">${g.icon}</div>
            <h3 class="game-card-title">${g.name}</h3>
            <p class="game-card-desc">${g.desc}</p>
            <button class="btn btn-primary game-card-btn" ${
              g.available ? "" : "disabled"
            }>
              ${g.available ? "&#9654; Play" : "&#128274; Coming Soon"}
            </button>
          </div>`
      )
      .join("");

    grid.querySelectorAll(".game-card-btn:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const card = e.target.closest(".game-card");
        if (!card) return;
        const idx = parseInt(card.dataset.index, 10);
        launchGame(idx);
      });
    });
  }

  function launchGame(index) {
    const game = games[index];
    if (!game || !game.available) return;

    if (currentGame !== null) {
      const prev = games[currentGame];
      if (prev && prev.destroy) prev.destroy();
    }

    currentGame = index;

    const grid = document.getElementById("gamesGrid");
    const wrap = document.getElementById("gameCanvasWrap");
    const canvas = document.getElementById("gameCanvas");
    const scoreEl = document.getElementById("gameScore");

    grid.hidden = true;
    wrap.hidden = false;

    const updateScore = (s) => { scoreEl.textContent = s; };

    const close = () => {
      if (game.destroy) game.destroy();
      if (escHandler) {
        document.removeEventListener("keydown", escHandler);
        escHandler = null;
      }
      wrap.hidden = true;
      grid.hidden = false;
      currentGame = null;
    };

    document.getElementById("gameCloseBtn").onclick = close;

    escHandler = function (e) {
      if (e.key === "Escape" && !wrap.hidden) {
        close();
      }
    };
    document.addEventListener("keydown", escHandler);

    game.init(canvas, updateScore);
  }

  function init() {
    if (document.getElementById("gamesGrid") && games.length > 0) {
      renderGrid();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  return { register, renderGrid, launchGame, init };
})();

/* ══════════════════════════════════════
   DINO RUN — Exact Chrome T-Rex Replica (Butter-Smooth Delta-Time Physics)
   - High-refresh rate independent (60Hz / 120Hz / 144Hz smooth)
   - Pixel-perfect Chrome Dino sprite & animations
   - Web Audio API sound effects
══════════════════════════════════════ */
GamesPlay.register({
  name: "Dino Run",
  icon: "&#129430;",
  desc: "Chrome's T-Rex — jump, duck, dodge cacti & pterodactyls (High-FPS Smooth).",
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

    function playJump() {
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "square";
        o.connect(g);
        g.connect(a.destination);
        o.frequency.setValueAtTime(360, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(680, a.currentTime + 0.08);
        g.gain.setValueAtTime(0.12, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.09);
        o.start(a.currentTime);
        o.stop(a.currentTime + 0.09);
      } catch (_) {}
    }

    function playDeath() {
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const o = a.createOscillator();
        const g = a.createGain();
        o.type = "sawtooth";
        o.connect(g);
        g.connect(a.destination);
        o.frequency.setValueAtTime(220, a.currentTime);
        o.frequency.exponentialRampToValueAtTime(60, a.currentTime + 0.25);
        g.gain.setValueAtTime(0.2, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.25);
        o.start(a.currentTime);
        o.stop(a.currentTime + 0.25);
      } catch (_) {}
    }

    function playScore() {
      try {
        const a = getAudio();
        if (!a) return;
        if (a.state === "suspended") a.resume();
        const now = a.currentTime;
        const o1 = a.createOscillator();
        const g1 = a.createGain();
        o1.type = "square";
        o1.frequency.setValueAtTime(750, now);
        o1.connect(g1);
        g1.connect(a.destination);
        g1.gain.setValueAtTime(0.08, now);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        o1.start(now);
        o1.stop(now + 0.06);

        const o2 = a.createOscillator();
        const g2 = a.createGain();
        o2.type = "square";
        o2.frequency.setValueAtTime(950, now + 0.07);
        o2.connect(g2);
        g2.connect(a.destination);
        g2.gain.setValueAtTime(0.08, now + 0.07);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o2.start(now + 0.07);
        o2.stop(now + 0.15);
      } catch (_) {}
    }

    // Tuned physics (per 60fps frame baseline)
    const GRAVITY = 0.55;
    const JUMP_VEL = -10.8;
    const INIT_SPEED = 5.0;
    const MAX_SPEED = 13.0;
    const SPEED_INCR = 0.035; // per second
    const DINO_X = 50;

    let W, H, groundY, score, speed, dead, playing, frameId, tick, lastTime;
    let obstacles, clouds, dino, cactusTimer, groundOffset;
    let blinkTimer, blinkFrame;

    function resize() {
      const cw = Math.min(1140, window.innerWidth - 32);
      W = canvas.width = Math.max(320, cw);
      H = canvas.height = Math.max(240, Math.min(420, window.innerHeight - 160));
      groundY = Math.round(H * 0.82);
    }

    function reset() {
      dino = {
        x: DINO_X,
        y: groundY - 47,
        vy: 0,
        grounded: true,
        ducking: false,
      };
      obstacles = [];
      clouds = [];
      score = 0;
      speed = INIT_SPEED;
      dead = false;
      playing = false;
      tick = 0;
      groundOffset = 0;
      blinkTimer = 0;
      blinkFrame = 0;
      lastTime = 0;
      updateScore("0");
      initClouds();
    }

    function initClouds() {
      clouds = [];
      for (let i = 0; i < 3; i++) {
        clouds.push({
          x: W + i * (W / 2 + Math.random() * 200),
          y: 25 + Math.random() * (groundY * 0.35),
          w: 46 + Math.random() * 20,
          speed: 18 + Math.random() * 20, // pixels per second
        });
      }
    }

    function scheduleObstacle() {
      const minGap = 280;
      const maxGap = 600;
      const gap = minGap + Math.random() * (maxGap - minGap);
      cactusTimer = setTimeout(spawnObstacle, (gap / speed) * 15);
    }

    function spawnObstacle() {
      const gameScore = Math.floor(score / 10);
      if (gameScore >= 100 && Math.random() < 0.35) {
        const height = Math.random() < 0.5 ? "high" : "low";
        const yPos = height === "high" ? groundY - 62 : groundY - 32;
        obstacles.push({
          type: "ptera",
          x: W + 20,
          y: yPos,
          w: 42,
          h: 24,
          wingPhase: 0,
        });
      } else {
        const isLarge = Math.random() < 0.35;
        const baseW = isLarge ? 24 : 16;
        const baseH = isLarge ? 46 : 34;
        const count = isLarge
          ? (Math.random() < 0.4 ? 2 : 1)
          : (Math.random() < 0.25 ? 3 : Math.random() < 0.5 ? 2 : 1);
        const cw = baseW * count + (count - 1) * 8;
        obstacles.push({
          type: "cactus",
          x: W + 20,
          y: groundY - baseH,
          w: cw,
          h: baseH,
          count,
          isLarge,
        });
      }
      scheduleObstacle();
    }

    function jump() {
      if (dead) { startAfterDeath(); return; }
      if (!playing) { startGame(); }
      if (dino.grounded) {
        if (dino.ducking) {
          dino.y = groundY - 47;
          dino.ducking = false;
        }
        dino.vy = JUMP_VEL;
        dino.grounded = false;
        playJump();
      }
    }

    function duck(active) {
      if (dead || !playing) return;
      dino.ducking = active;
      if (active && dino.grounded) {
        dino.y = groundY - 26;
      } else if (!active && dino.grounded) {
        dino.y = groundY - 47;
      }
      if (active && !dino.grounded) {
        dino.vy += 3.5; // Fast fall
      }
    }

    function startGame() {
      playing = true;
      scheduleObstacle();
    }

    function startAfterDeath() {
      reset();
      playing = true;
      scheduleObstacle();
    }

    function update(dt) {
      if (!playing || dead) return;

      tick++;
      const speedFactor = speed * 60; // normalize to 60fps scale
      speed = Math.min(speed + SPEED_INCR * dt, MAX_SPEED);
      groundOffset = (groundOffset - speedFactor * dt) % 20;

      const currentDisplayScore = Math.floor(score / 10);
      score += Math.max(1, Math.floor(speed * dt * 50));
      const newDisplayScore = Math.floor(score / 10);
      if (newDisplayScore > currentDisplayScore) {
        updateScore(String(newDisplayScore));
        if (newDisplayScore > 0 && newDisplayScore % 100 === 0) {
          playScore();
        }
      }

      // Gravity & Position with dt
      dino.vy += GRAVITY * (dt * 60);
      dino.y += dino.vy * (dt * 60);
      const floorY = dino.ducking ? groundY - 26 : groundY - 47;
      if (dino.y >= floorY) {
        dino.y = floorY;
        dino.vy = 0;
        dino.grounded = true;
      }

      // Clouds
      for (const c of clouds) {
        c.x -= c.speed * dt;
        if (c.x + c.w < -20) {
          c.x = W + 20 + Math.random() * 100;
          c.y = 25 + Math.random() * (groundY * 0.35);
          c.w = 46 + Math.random() * 20;
        }
      }

      // Obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speedFactor * dt;
        if (o.type === "ptera") {
          o.wingPhase = (o.wingPhase + 1) % 16;
        }
        if (o.x + o.w < -40) obstacles.splice(i, 1);
      }

      // Blink
      blinkTimer += dt * 60;
      if (blinkTimer > 120 + Math.random() * 180) {
        blinkFrame = 8;
        blinkTimer = 0;
      }
      if (blinkFrame > 0) blinkFrame--;

      // Hitbox Collision
      const dw = dino.ducking ? 59 : 44;
      const dh = dino.ducking ? 26 : 47;
      const dx = dino.x;
      const dy = dino.y;

      for (const o of obstacles) {
        const sx = o.type === "ptera" ? 6 : 4;
        const sy = o.type === "ptera" ? 4 : 4;
        if (
          dx + sx < o.x + o.w - sx &&
          dx + dw - sx > o.x + sx &&
          dy + sy < o.y + o.h - sy &&
          dy + dh - sy > o.y + sy
        ) {
          dead = true;
          playing = false;
          clearTimeout(cactusTimer);
          playDeath();
          if (newDisplayScore > (parseInt(localStorage.getItem("dino-hi")) || 0)) {
            localStorage.setItem("dino-hi", String(newDisplayScore));
          }
          break;
        }
      }
    }

    function drawDino(x, y) {
      const rx = Math.round(x);
      const ry = Math.round(y);
      const color = dead ? "#737373" : "#535353";
      ctx.fillStyle = color;

      if (dino.ducking && dino.grounded) {
        ctx.fillRect(rx, ry + 14, 8, 4);
        ctx.fillRect(rx + 4, ry + 12, 10, 8);
        ctx.fillRect(rx + 12, ry + 8, 28, 12);
        ctx.fillRect(rx + 36, ry, 23, 12);
        ctx.fillRect(rx + 40, ry + 12, 15, 4);

        if (dead) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(rx + 42, ry + 2, 5, 5);
          ctx.fillStyle = "#535353";
          ctx.fillRect(rx + 43, ry + 3, 3, 3);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(rx + 42, ry + 2, 4, 4);
          ctx.fillStyle = "#535353";
          ctx.fillRect(rx + 44, ry + 3, 2, 2);
        }
        ctx.fillStyle = color;

        const runFrame = Math.floor(tick / 6) % 2;
        if (!playing || dead) {
          ctx.fillRect(rx + 16, ry + 20, 5, 6);
          ctx.fillRect(rx + 28, ry + 20, 5, 6);
        } else if (runFrame === 0) {
          ctx.fillRect(rx + 16, ry + 20, 5, 6);
          ctx.fillRect(rx + 28, ry + 20, 5, 4);
        } else {
          ctx.fillRect(rx + 16, ry + 20, 5, 4);
          ctx.fillRect(rx + 28, ry + 20, 5, 6);
        }
        return;
      }

      ctx.fillRect(rx + 22, ry, 16, 2);
      ctx.fillRect(rx + 22, ry + 2, 22, 10);
      ctx.fillRect(rx + 22, ry + 12, 10, 4);
      ctx.fillRect(rx + 28, ry + 12, 14, 2);

      if (dead) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(rx + 26, ry + 3, 6, 6);
        ctx.fillStyle = "#121617";
        ctx.fillRect(rx + 27, ry + 4, 2, 2);
        ctx.fillRect(rx + 29, ry + 5, 2, 2);
        ctx.fillRect(rx + 27, ry + 6, 2, 2);
        ctx.fillRect(rx + 29, ry + 4, 2, 2);
      } else if (blinkFrame > 0) {
        ctx.fillStyle = color;
        ctx.fillRect(rx + 26, ry + 5, 6, 2);
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(rx + 26, ry + 3, 5, 5);
        ctx.fillStyle = "#121617";
        ctx.fillRect(rx + 28, ry + 4, 2, 2);
      }
      ctx.fillStyle = color;

      ctx.fillRect(rx + 18, ry + 14, 10, 4);
      ctx.fillRect(rx + 12, ry + 18, 20, 10);
      ctx.fillRect(rx + 8, ry + 24, 24, 8);
      ctx.fillRect(rx + 28, ry + 20, 4, 4);
      ctx.fillRect(rx + 30, ry + 22, 2, 4);

      ctx.fillRect(rx, ry + 18, 4, 4);
      ctx.fillRect(rx + 2, ry + 20, 6, 6);
      ctx.fillRect(rx + 6, ry + 22, 6, 8);

      const runFrame = Math.floor(tick / 5) % 2;
      if (!dino.grounded || !playing || dead) {
        ctx.fillRect(rx + 12, ry + 32, 4, 12);
        ctx.fillRect(rx + 14, ry + 42, 5, 3);
        ctx.fillRect(rx + 22, ry + 32, 4, 12);
        ctx.fillRect(rx + 24, ry + 42, 5, 3);
      } else if (runFrame === 0) {
        ctx.fillRect(rx + 12, ry + 32, 4, 6);
        ctx.fillRect(rx + 8, ry + 37, 5, 3);
        ctx.fillRect(rx + 22, ry + 32, 4, 12);
        ctx.fillRect(rx + 24, ry + 42, 5, 3);
      } else {
        ctx.fillRect(rx + 12, ry + 32, 4, 12);
        ctx.fillRect(rx + 14, ry + 42, 5, 3);
        ctx.fillRect(rx + 22, ry + 32, 4, 6);
        ctx.fillRect(rx + 25, ry + 37, 5, 3);
      }
    }

    function drawClouds() {
      ctx.fillStyle = "#a8a8a8";
      for (const c of clouds) {
        const cx = Math.round(c.x);
        const cy = Math.round(c.y);
        ctx.fillRect(cx + 10, cy, c.w - 20, 12);
        ctx.fillRect(cx + 4, cy + 4, c.w - 8, 8);
        ctx.fillRect(cx, cy + 8, c.w, 4);
      }
    }

    function drawGround() {
      const gy = Math.round(groundY);
      ctx.strokeStyle = "#535353";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy);
      ctx.stroke();

      ctx.fillStyle = "#535353";
      for (let i = Math.floor(groundOffset); i < W + 20; i += 20) {
        if (i > 0) {
          ctx.fillRect(i, gy + 4, 4, 3);
          ctx.fillRect(i + 10, gy + 9, 3, 2);
        }
      }
    }

    function drawObstacles() {
      for (const o of obstacles) {
        const ox = Math.round(o.x);
        const oy = Math.round(o.y);
        if (o.type === "ptera") {
          const wingUp = Math.floor(o.wingPhase / 8) === 0;
          ctx.fillStyle = "#535353";
          ctx.fillRect(ox + 10, oy + 8, 22, 8);
          ctx.fillRect(ox + 30, oy + 10, 10, 6);
          ctx.fillRect(ox + 38, oy + 6, 4, 4);
          if (wingUp) {
            ctx.fillRect(ox + 12, oy, 16, 8);
            ctx.fillRect(ox + 8, oy - 4, 8, 6);
          } else {
            ctx.fillRect(ox + 12, oy + 16, 16, 8);
            ctx.fillRect(ox + 8, oy + 20, 8, 6);
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(ox + 32, oy + 10, 3, 3);
        } else {
          ctx.fillStyle = "#535353";
          const segW = o.isLarge ? 22 : 14;
          const gap = 8;
          for (let j = 0; j < o.count; j++) {
            const cx = ox + j * (segW + gap);
            const cy = oy;
            ctx.fillRect(cx + 4, cy, segW - 8, o.h);
            ctx.fillRect(cx + 2, cy + 2, segW - 4, o.h - 2);
            ctx.fillRect(cx - 2, cy + 10, segW + 4, 4);
            ctx.fillRect(cx - 2, cy + 6, 4, 8);
            ctx.fillRect(cx + segW - 2, cy + 10, 4, 8);
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (W < 10 || H < 10) return;

      drawClouds();
      drawGround();
      drawObstacles();
      drawDino(dino.x, dino.y);

      const displayScore = String(Math.floor(score / 10)).padStart(5, "0");
      const hi = String(parseInt(localStorage.getItem("dino-hi")) || 0).padStart(5, "0");

      ctx.fillStyle = "#535353";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "right";

      if (hi !== "00000") {
        ctx.fillText(`HI ${hi}  ${displayScore}`, W - 15, 24);
      } else {
        ctx.fillText(displayScore, W - 15, 24);
      }

      if (dead) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#535353";
        ctx.font = "bold 22px monospace";
        ctx.fillText("G A M E   O V E R", W / 2, H / 2 - 20);
        ctx.font = "13px monospace";
        ctx.fillText("Press Space or Tap to Restart", W / 2, H / 2 + 16);
      } else if (!playing) {
        ctx.textAlign = "center";
        ctx.fillStyle = "#535353";
        ctx.font = "14px monospace";
        ctx.fillText("Press Space or Tap to Start", W / 2, H / 2);
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
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        duck(true);
      }
    }

    function onKeyUp(e) {
      if (e.key === "ArrowDown") {
        duck(false);
      }
    }

    function onTap(e) {
      e.preventDefault();
      jump();
    }

    function onResize() {
      const prev = groundY;
      resize();
      const diff = groundY - prev;
      dino.y += diff;
    }

    resize();
    reset();

    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onTap);
    canvas.addEventListener("touchstart", onTap, { passive: false });

    frameId = requestAnimationFrame(loop);

    this.destroy = function () {
      cancelAnimationFrame(frameId);
      clearTimeout(cactusTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onTap);
      canvas.removeEventListener("touchstart", onTap);
      if (audioCtx) audioCtx.close();
    };
  },

  destroy: null,
});

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

/* ══════════════════════════════════════
   CONWAY'S GAME OF LIFE — TI Open Arcade Port
   - Interactive cellular automaton simulation
   - Draw / erase cells with mouse or touch
   - Controls: Play/Pause, Step, Clear, Randomize, Presets
   - Live population & generation counters
══════════════════════════════════════ */
GamesPlay.register({
  name: "Conway's Game of Life",
  icon: "&#129516;",
  desc: "Cellular automaton simulation inspired by John Conway & TI Open Arcade. Draw cells & watch life evolve!",
  available: true,

  init(canvas, updateScore) {
    const ctx = canvas.getContext("2d");

    const CELL_SIZE = 12;
    let W, H, cols, rows;
    let grid = [], nextGrid = [];
    let running = false;
    let generation = 0, population = 0;
    let speedMs = 100;
    let lastTime = 0, accumulator = 0;
    let isDrawing = false, drawMode = true;
    let frameId;

    // Controls UI Overlay
    let uiWrap = document.getElementById("conwayUIOverlay");
    if (!uiWrap) {
      uiWrap = document.createElement("div");
      uiWrap.id = "conwayUIOverlay";
      uiWrap.className = "conway-ui-overlay";
      uiWrap.innerHTML = `
        <div class="conway-top-bar">
          <button id="conwayPlayBtn" class="conway-hud-btn">▶ Start</button>
          <button id="conwayStepBtn" class="conway-hud-btn">⏭ Step</button>
          <button id="conwayRandomBtn" class="conway-hud-btn">🎲 Random</button>
          <button id="conwayClearBtn" class="conway-hud-btn">🗑 Clear</button>
          <select id="conwayPresetSelect" class="conway-hud-select">
            <option value="">Presets...</option>
            <option value="glider">Glider</option>
            <option value="pulsar">Pulsar</option>
            <option value="gosper">Gosper Gun</option>
          </select>
        </div>
      `;
      canvas.parentElement.style.position = "relative";
      canvas.parentElement.appendChild(uiWrap);
    }

    let styleEl = document.getElementById("conwayUIStyle");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "conwayUIStyle";
      styleEl.textContent = `
        .conway-ui-overlay {
          position: absolute;
          top: 0; left: 0; right: 0;
          pointer-events: none;
          padding: 0.8rem;
          display: flex;
          justify-content: flex-start;
        }
        .conway-top-bar {
          display: flex;
          gap: 0.5rem;
          pointer-events: auto;
          flex-wrap: wrap;
        }
        .conway-hud-btn, .conway-hud-select {
          background: rgba(26, 32, 34, 0.95);
          color: var(--text, #ecf3ef);
          border: 1px solid var(--line, #2a3336);
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.85rem;
          transition: background 0.2s, border-color 0.2s;
        }
        .conway-hud-select option {
          background-color: #1f2628 !important;
          color: #ecf3ef !important;
        }
        .conway-hud-btn:hover, .conway-hud-select:hover {
          background: rgba(37, 126, 67, 0.25);
          border-color: var(--primary-2, #36a85d);
        }
      `;
      document.head.appendChild(styleEl);
    }

    const playBtn = document.getElementById("conwayPlayBtn");
    const stepBtn = document.getElementById("conwayStepBtn");
    const randomBtn = document.getElementById("conwayRandomBtn");
    const clearBtn = document.getElementById("conwayClearBtn");
    const presetSelect = document.getElementById("conwayPresetSelect");

    playBtn.onclick = () => {
      running = !running;
      playBtn.textContent = running ? "⏸ Pause" : "▶ Start";
    };

    stepBtn.onclick = () => {
      step();
    };

    randomBtn.onclick = () => {
      randomizeGrid();
    };

    clearBtn.onclick = () => {
      clearGrid();
    };

    presetSelect.onchange = (e) => {
      const val = e.target.value;
      if (!val) return;
      loadPreset(val);
      e.target.value = "";
    };

    function resize() {
      const cw = Math.min(880, window.innerWidth - 32);
      const ch = Math.min(640, window.innerHeight - 180);
      cols = Math.max(20, Math.floor(cw / CELL_SIZE));
      rows = Math.max(20, Math.floor(ch / CELL_SIZE));
      W = canvas.width = cols * CELL_SIZE;
      H = canvas.height = rows * CELL_SIZE;

      grid = create2DArray(cols, rows);
      nextGrid = create2DArray(cols, rows);
    }

    function create2DArray(c, r) {
      const arr = new Array(c);
      for (let i = 0; i < c; i++) {
        arr[i] = new Uint8Array(r);
      }
      return arr;
    }

    function clearGrid() {
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          grid[c][r] = 0;
        }
      }
      generation = 0;
      population = 0;
      updateScore("0");
    }

    function randomizeGrid() {
      population = 0;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          grid[c][r] = Math.random() < 0.25 ? 1 : 0;
          if (grid[c][r]) population++;
        }
      }
      generation = 0;
      updateScore(String(population));
    }

    function countNeighbors(g, x, y) {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const col = (x + i + cols) % cols;
          const row = (y + j + rows) % rows;
          sum += g[col][row];
        }
      }
      return sum;
    }

    function step() {
      let newPop = 0;
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const state = grid[c][r];
          const neighbors = countNeighbors(grid, c, r);

          if (state === 0 && neighbors === 3) {
            nextGrid[c][r] = 1;
          } else if (state === 1 && (neighbors < 2 || neighbors > 3)) {
            nextGrid[c][r] = 0;
          } else {
            nextGrid[c][r] = state;
          }

          if (nextGrid[c][r]) newPop++;
        }
      }

      // Swap grids
      const temp = grid;
      grid = nextGrid;
      nextGrid = temp;

      generation++;
      population = newPop;
      updateScore(String(population));
    }

    function loadPreset(name) {
      clearGrid();
      const cx = Math.floor(cols / 2);
      const cy = Math.floor(rows / 2);

      if (name === "glider") {
        const pattern = [
          [0, 1, 0],
          [0, 0, 1],
          [1, 1, 1],
        ];
        applyPattern(pattern, cx - 1, cy - 1);
      } else if (name === "pulsar") {
        const pattern = [
          [0,0,1,1,1,0,0,0,1,1,1,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [0,0,1,1,1,0,0,0,1,1,1,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,1,1,1,0,0,0,1,1,1,0,0],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [1,0,0,0,0,1,0,1,0,0,0,0,1],
          [0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,1,1,1,0,0,0,1,1,1,0,0],
        ];
        applyPattern(pattern, cx - 6, cy - 6);
      } else if (name === "gosper") {
        const pattern = [
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
          [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
          [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        ];
        applyPattern(pattern, Math.max(2, cx - 18), Math.max(2, cy - 4));
      }
    }

    function applyPattern(pat, startX, startY) {
      for (let r = 0; r < pat.length; r++) {
        for (let c = 0; c < pat[r].length; c++) {
          const x = startX + c;
          const y = startY + r;
          if (x >= 0 && x < cols && y >= 0 && y < rows) {
            grid[x][y] = pat[r][c];
            if (pat[r][c]) population++;
          }
        }
      }
      updateScore(String(population));
    }

    function draw() {
      ctx.fillStyle = "#0c1315";
      ctx.fillRect(0, 0, W, H);

      // Grid Lines
      ctx.strokeStyle = "rgba(42, 51, 54, 0.35)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * CELL_SIZE, 0);
        ctx.lineTo(c * CELL_SIZE, H);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * CELL_SIZE);
        ctx.lineTo(W, r * CELL_SIZE);
        ctx.stroke();
      }

      // Live Cells
      ctx.fillStyle = "#4ade80";
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (grid[c][r]) {
            ctx.fillRect(
              c * CELL_SIZE + 1,
              r * CELL_SIZE + 1,
              CELL_SIZE - 2,
              CELL_SIZE - 2
            );
          }
        }
      }

      // HUD Bottom Info
      ctx.fillStyle = "rgba(12, 19, 21, 0.88)";
      ctx.fillRect(W - 250, H - 38, 240, 32);
      ctx.strokeStyle = "#36a85d";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(W - 250, H - 38, 240, 32);

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`GEN: ${generation}   CELLS: ${population}`, W - 20, H - 18);
    }

    function loop(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const delta = timestamp - lastTime;
      lastTime = timestamp;

      if (running) {
        accumulator += delta;
        while (accumulator >= speedMs) {
          step();
          accumulator -= speedMs;
        }
      }

      draw();
      frameId = requestAnimationFrame(loop);
    }

    function toggleCellAtPointer(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const c = Math.floor(x / CELL_SIZE);
      const r = Math.floor(y / CELL_SIZE);

      if (c >= 0 && c < cols && r >= 0 && r < rows) {
        if (e.type === "mousedown") {
          isDrawing = true;
          drawMode = grid[c][r] === 0 ? 1 : 0;
          grid[c][r] = drawMode;
        } else if (e.type === "mousemove" && isDrawing) {
          grid[c][r] = drawMode;
        }
      }
    }

    function onMouseDown(e) { toggleCellAtPointer(e); }
    function onMouseMove(e) { toggleCellAtPointer(e); }
    function onMouseUp() { isDrawing = false; }

    resize();
    randomizeGrid();

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    frameId = requestAnimationFrame(loop);

    this.destroy = function () {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (uiWrap && uiWrap.parentNode) uiWrap.parentNode.removeChild(uiWrap);
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
    };
  },

  destroy: null,
});