/* ══════════════════════════════════════
   SCIENTIFIC CALCULATOR
══════════════════════════════════════ */
let scExpr = "";
let scMode = "deg";

function scUpdate() {
  document.getElementById("scExpr").textContent = scExpr;
  document.getElementById("scResult").textContent = scExpr || "0";
}

function scSetMode(mode) {
  scMode = mode;
  document.getElementById("modeDeg").classList.toggle("active", mode === "deg");
  document.getElementById("modeRad").classList.toggle("active", mode === "rad");
}

function scInsert(value) {
  if (document.getElementById("scResult").textContent === "Error") scExpr = "";
  scExpr += value;
  scUpdate();
}

function scFunc(name) {
  if (document.getElementById("scResult").textContent === "Error") scExpr = "";
  scExpr += name + "(";
  scUpdate();
}

function scInsertPercent() {
  if (!scExpr) return;
  scExpr += "/100";
  scUpdate();
}

function scToggleSign() {
  if (!scExpr) {
    scExpr = "-";
  } else if (scExpr.startsWith("-")) {
    scExpr = scExpr.slice(1);
  } else {
    scExpr = "-" + scExpr;
  }
  scUpdate();
}

function scBackspace() {
  if (document.getElementById("scResult").textContent === "Error") {
    scExpr = "";
    scUpdate();
    return;
  }
  scExpr = scExpr.slice(0, -1);
  scUpdate();
}

function scClear() {
  scExpr = "";
  scUpdate();
}

function sanitizeMathInput(str) {
  return String(str).replace(/[^0-9a-zA-Z+\-*/().,^ ]/g, "");
}

function scRound(value) {
  if (!isFinite(value)) return value;
  return parseFloat(Number(value).toFixed(10));
}

function scEvaluateExpression(expr) {
  let js = sanitizeMathInput(expr).replace(/\s+/g, "");

  const fnMap = [
    ["acot", "ACOT"],
    ["asin", "ASIN"],
    ["acos", "ACOS"],
    ["atan", "ATAN"],
    ["sqrt", "SQRT"],
    ["sin", "SIN"],
    ["cos", "COS"],
    ["tan", "TAN"],
    ["cot", "COT"],
    ["log", "LOG"],
    ["ln", "LN"]
  ];

  fnMap.forEach(([from, to]) => {
    js = js.replace(new RegExp("\\b" + from + "\\b", "g"), to);
  });

  js = js.replace(/\^/g, "**");
  js = js.replace(/\bpi\b/g, "Math.PI");
  js = js.replace(/\be\b/g, "Math.E");

  const SIN  = x => Math.sin(scMode === "deg" ? x * Math.PI / 180 : x);
  const COS  = x => Math.cos(scMode === "deg" ? x * Math.PI / 180 : x);
  const TAN  = x => Math.tan(scMode === "deg" ? x * Math.PI / 180 : x);
  const COT  = x => 1 / TAN(x);
  const ASIN = x => scMode === "deg" ? Math.asin(x) * 180 / Math.PI : Math.asin(x);
  const ACOS = x => scMode === "deg" ? Math.acos(x) * 180 / Math.PI : Math.acos(x);
  const ATAN = x => scMode === "deg" ? Math.atan(x) * 180 / Math.PI : Math.atan(x);
  const ACOT = x => scMode === "deg"
    ? (Math.PI / 2 - Math.atan(x)) * 180 / Math.PI
    : (Math.PI / 2 - Math.atan(x));
  const LOG  = x => Math.log10(x);
  const LN   = x => Math.log(x);
  const SQRT = x => Math.sqrt(x);

  const result = Function(
    "SIN","COS","TAN","COT","ASIN","ACOS","ATAN","ACOT","LOG","LN","SQRT",
    '"use strict"; return (' + js + ');'
  )(SIN,COS,TAN,COT,ASIN,ACOS,ATAN,ACOT,LOG,LN,SQRT);

  if (!isFinite(result) || isNaN(result)) throw new Error("Invalid");
  return scRound(result);
}

function scEquals() {
  if (!scExpr) return;
  try {
    const result = scEvaluateExpression(scExpr);
    const exprSnapshot = scExpr;
    document.getElementById("scResult").textContent = String(result);
    document.getElementById("scExpr").textContent = scExpr;
    scExpr = String(result);
    scAddHistory(exprSnapshot, result);
  } catch (e) {
    console.warn("Calculator: evaluation error", e);
    document.getElementById("scExpr").textContent = scExpr;
    document.getElementById("scResult").textContent = "Error";
  }
}

/* ══════════════════════════════════════
   SCIENTIFIC CALCULATOR HISTORY
══════════════════════════════════════ */
const SC_HISTORY_KEY = "sc-history";
const SC_HISTORY_MAX = 10;

function scLoadHistory() {
  try {
    const raw = localStorage.getItem(SC_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function scSaveHistory(items) {
  try {
    localStorage.setItem(SC_HISTORY_KEY, JSON.stringify(items));
  } catch (e) {}
}

function scAddHistory(expr, result) {
  const items = scLoadHistory();
  items.unshift({ expr: String(expr), result: String(result) });
  if (items.length > SC_HISTORY_MAX) items.length = SC_HISTORY_MAX;
  scSaveHistory(items);
  scRenderHistory();
  const panel = document.getElementById("scHistory");
  if (panel) panel.hidden = false;
}

function scRenderHistory() {
  const list = document.getElementById("scHistoryList");
  if (!list) return;
  const items = scLoadHistory();
  if (!items.length) {
    list.innerHTML = '<div class="sc-history-item" style="color:var(--muted);font-size:0.78rem;cursor:default">No entries yet.</div>';
    return;
  }
  list.innerHTML = items
    .map(
      (entry, i) =>
        '<div class="sc-history-item" data-idx="' +
        i +
        '">' +
        '<span class="sc-history-item-expr">' + entry.expr + "</span>" +
        '<span class="sc-history-item-result">= ' + entry.result + "</span>" +
        "</div>"
    )
    .join("");

  list.querySelectorAll(".sc-history-item").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.idx, 10);
      const items = scLoadHistory();
      if (items[idx]) {
        scExpr = items[idx].expr;
        scUpdate();
      }
    });
  });
}

function scClearHistory() {
  scSaveHistory([]);
  scRenderHistory();
  const panel = document.getElementById("scHistory");
  if (panel) panel.hidden = true;
}

function scToggleHistory() {
  const panel = document.getElementById("scHistory");
  if (!panel) return;
  panel.hidden = !panel.hidden;
  if (!panel.hidden) scRenderHistory();
}

/* ══════════════════════════════════════
   KEYBOARD INPUT FOR CALCULATOR
══════════════════════════════════════ */
const SC_KEY_MAP = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4",
  "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".", "+": "+", "-": "-", "*": "*", "/": "/",
  "(": "(", ")": ")", "^": "^",
};

function scHandleKey(e) {
  const key = e.key;

  if (key === "Enter") {
    e.preventDefault();
    scEquals();
    return;
  }

  if (key === "Backspace") {
    e.preventDefault();
    scBackspace();
    return;
  }

  if (key === "Escape") {
    e.preventDefault();
    scClear();
    return;
  }

  if (key === "Delete") {
    e.preventDefault();
    scClear();
    return;
  }

  if (key in SC_KEY_MAP) {
    e.preventDefault();
    scInsert(SC_KEY_MAP[key]);
  }
}