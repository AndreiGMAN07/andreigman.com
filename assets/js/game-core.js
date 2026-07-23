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
