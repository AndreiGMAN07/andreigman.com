/* ══════════════════════════════════════
   COUNTDOWN TIMER
══════════════════════════════════════ */
let timerInterval = null;
let timerEnd = null;
let timerRemaining = 0;
let timerRunning = false;

function timerFormat(totalSec) {
  const hh = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const ss = totalSec % 60;
  return (
    String(hh).padStart(2, "0") + ":" +
    String(mm).padStart(2, "0") + ":" +
    String(ss).padStart(2, "0")
  );
}

function timerStart() {
  if (timerRunning) return;

  const h = parseInt(document.getElementById("timerH").value, 10) || 0;
  const m = parseInt(document.getElementById("timerM").value, 10) || 0;
  const s = parseInt(document.getElementById("timerS").value, 10) || 0;
  const total = (h * 3600 + m * 60 + s) * 1000;

  if (total <= 0 && timerRemaining <= 0) return;

  document.getElementById("timerAlert").classList.remove("show");
  timerRemaining = timerRemaining > 0 ? timerRemaining : total;
  timerEnd = Date.now() + timerRemaining;
  timerRunning = true;
  timerTick();
  timerInterval = setInterval(timerTick, 100);
}

function timerTick() {
  const left = timerEnd - Date.now();

  if (left <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerRemaining = 0;
    document.getElementById("timerDisplay").textContent = "00:00:00";
    document.getElementById("timerAlert").classList.add("show");
    return;
  }

  timerRemaining = left;
  document.getElementById("timerDisplay").textContent = timerFormat(Math.ceil(left / 1000));
}

function timerPause() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemaining = timerEnd - Date.now();
  timerRunning = false;
}

function timerReset() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerEnd = null;
  timerRemaining = 0;
  timerRunning = false;
  document.getElementById("timerDisplay").textContent = "00:00:00";
  document.getElementById("timerAlert").classList.remove("show");
  document.getElementById("timerH").value = 0;
  document.getElementById("timerM").value = 0;
  document.getElementById("timerS").value = 0;
}

/* ══════════════════════════════════════
   STOPWATCH
══════════════════════════════════════ */
let swInterval = null;
let swStartTime = null;
let swElapsed = 0;
let swRunning = false;
let swLapCount = 0;

function swFormat(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ms3 = ms % 1000;
  return (
    String(h).padStart(2, "0") + ":" +
    String(m).padStart(2, "0") + ":" +
    String(s).padStart(2, "0") + "." +
    String(ms3).padStart(3, "0")
  );
}

function swTick() {
  swElapsed = Date.now() - swStartTime;
  document.getElementById("swDisplay").textContent = swFormat(swElapsed);
}

function swToggle() {
  if (!swRunning) {
    swStartTime = Date.now() - swElapsed;
    swRunning = true;
    swTick();
    swInterval = setInterval(swTick, 31);
    document.getElementById("swToggleBtn").textContent = "Stop";
    document.getElementById("swLapBtn").disabled = false;
  } else {
    clearInterval(swInterval);
    swInterval = null;
    swElapsed = Date.now() - swStartTime;
    swRunning = false;
    document.getElementById("swToggleBtn").textContent = "Start";
  }
}

function swLap() {
  if (!swRunning) return;
  swLapCount++;
  const list = document.getElementById("swLapList");
  const li = document.createElement("li");
  li.innerHTML = "<span>Lap " + swLapCount + "</span><span>" + swFormat(swElapsed) + "</span>";
  list.insertBefore(li, list.firstChild);
}

function swReset() {
  clearInterval(swInterval);
  swInterval = null;
  swStartTime = null;
  swElapsed = 0;
  swRunning = false;
  swLapCount = 0;
  document.getElementById("swDisplay").textContent = "00:00:00.000";
  document.getElementById("swToggleBtn").textContent = "Start";
  document.getElementById("swLapBtn").disabled = true;
  document.getElementById("swLapList").innerHTML = "";
}

/* ══════════════════════════════════════
   TIMER PRESETS
══════════════════════════════════════ */
function timerSetPreset(minutes) {
  const total = minutes * 60;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  document.getElementById("timerH").value = h;
  document.getElementById("timerM").value = m;
  document.getElementById("timerS").value = s;
}
/* ══════════════════════════════════════
   COPY TO CLIPBOARD
══════════════════════════════════════ */
function copyText(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(function () {
      console.warn("Clipboard: failed to copy");
    });
  }
}
