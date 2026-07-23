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
