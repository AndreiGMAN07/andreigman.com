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
