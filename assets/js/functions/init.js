/* ══════════════════════════════════════
   INIT (amended)
══════════════════════════════════════ */
function initFunctions() {
  scUpdate();
  limUpdateNotation();
  intUpdateNotation();

  // Timer buttons
  const timerStartBtn = document.getElementById("timerStartBtn");
  if (timerStartBtn) timerStartBtn.addEventListener("click", timerStart);
  const timerPauseBtn = document.getElementById("timerPauseBtn");
  if (timerPauseBtn) timerPauseBtn.addEventListener("click", timerPause);
  const timerResetBtn = document.getElementById("timerResetBtn");
  if (timerResetBtn) timerResetBtn.addEventListener("click", timerReset);

  // Stopwatch buttons
  const swToggleBtn = document.getElementById("swToggleBtn");
  if (swToggleBtn) swToggleBtn.addEventListener("click", swToggle);
  const swLapBtn = document.getElementById("swLapBtn");
  if (swLapBtn) swLapBtn.addEventListener("click", swLap);
  const swResetBtn = document.getElementById("swResetBtn");
  if (swResetBtn) swResetBtn.addEventListener("click", swReset);

  // Timer presets
  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const min = parseInt(btn.dataset.minutes, 10);
      if (!isNaN(min)) timerSetPreset(min);
    });
  });

  // Copy buttons (event delegation)
  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const src = document.getElementById(btn.dataset.copy);
    if (!src) return;
    let text = src.textContent || "";
    if (btn.dataset.copyFilter === "clock") text = text.replace(/[^0-9:]/g, "");
    else if (btn.dataset.copyFilter === "decimal") text = text.replace(/[^0-9:.]/g, "");
    copyText(text);
  });

  // Calculator mode buttons
  document.getElementById("modeDeg")?.addEventListener("click", () => scSetMode("deg"));
  document.getElementById("modeRad")?.addEventListener("click", () => scSetMode("rad"));

  // Calculator grid event delegation
  document.getElementById("scGrid")?.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    const insert = btn.dataset.insert;
    const func = btn.dataset.func;

    if (action === "clear") scClear();
    else if (action === "backspace") scBackspace();
    else if (action === "percent") scInsertPercent();
    else if (action === "toggle-sign") scToggleSign();
    else if (action === "equals") scEquals();
    else if (func) scFunc(func);
    else if (insert) scInsert(insert);
  });

  // Calculator keyboard input
  const sciCard = document.getElementById("sciCalcCard");
  if (sciCard) {
    sciCard.addEventListener("click", () => sciCard.focus());
    sciCard.addEventListener("keydown", scHandleKey);
    sciCard.setAttribute("tabindex", "0");
  }

  // Calculator history
  const scHistoryToggle = document.getElementById("scHistoryToggle");
  if (scHistoryToggle) scHistoryToggle.addEventListener("click", scToggleHistory);
  const scHistoryClear = document.getElementById("scHistoryClear");
  if (scHistoryClear) scHistoryClear.addEventListener("click", scClearHistory);
  scRenderHistory();

  // Limit calculator
  document.querySelectorAll("[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => limSetDir(btn.dataset.dir));
  });
  document.querySelectorAll("[data-lim-expr]").forEach((btn) => {
    btn.addEventListener("click", () =>
      limExample(btn.dataset.limExpr, btn.dataset.limVal, btn.dataset.limDir)
    );
  });
  document.getElementById("limCalcBtn")?.addEventListener("click", limCalc);
  document.getElementById("limExpr")?.addEventListener("input", limUpdateNotation);
  document.getElementById("limVar")?.addEventListener("change", limUpdateNotation);
  document.getElementById("limVal")?.addEventListener("input", limUpdateNotation);

  // Integral calculator
  document.querySelectorAll("[data-int-type]").forEach((btn) => {
    btn.addEventListener("click", () => intSetType(btn.dataset.intType));
  });
  document.querySelectorAll("[data-int-expr]").forEach((btn) => {
    btn.addEventListener("click", () =>
      intExample(btn.dataset.intExpr, btn.dataset.intType, btn.dataset.intLower, btn.dataset.intUpper)
    );
  });
  document.getElementById("intCalcBtn")?.addEventListener("click", intCalc);
  document.getElementById("intExpr")?.addEventListener("input", intUpdateNotation);
  document.getElementById("intVar")?.addEventListener("change", intUpdateNotation);
  document.getElementById("intLower")?.addEventListener("input", intUpdateNotation);
  document.getElementById("intUpper")?.addEventListener("input", intUpdateNotation);

  // Derivative calculator
  document.getElementById("derivCalcBtn")?.addEventListener("click", derivCalc);
  document.getElementById("derivExpr")?.addEventListener("input", derivUpdateNotation);
  document.getElementById("derivVar")?.addEventListener("change", derivUpdateNotation);
  document.getElementById("derivPoint")?.addEventListener("input", derivUpdateNotation);
  document.querySelectorAll("[data-deriv-expr]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      derivExample(btn.dataset.derivExpr, btn.dataset.derivPoint);
    });
  });
  derivUpdateNotation();

  // Unit converter
  ucPopulateUnits();
  document.getElementById("ucCategory")?.addEventListener("change", function () {
    ucPopulateUnits();
    ucConvert();
  });
  document.getElementById("ucFrom")?.addEventListener("change", ucConvert);
  document.getElementById("ucTo")?.addEventListener("change", ucConvert);
  document.getElementById("ucValue")?.addEventListener("input", ucConvert);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFunctions);
} else {
  initFunctions();
}