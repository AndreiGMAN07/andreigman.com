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
    document.getElementById("scExpr").textContent = scExpr;
    document.getElementById("scResult").textContent = "Error";
  }
}

/* ══════════════════════════════════════
   SHARED MATH HELPERS
══════════════════════════════════════ */
function fmtNum(n) {
  if (typeof n !== "number" || isNaN(n)) return "NaN";
  if (!isFinite(n)) return n > 0 ? "+∞" : "−∞";
  const rounded = parseFloat(n.toFixed(8));
  if (Math.abs(rounded - Math.round(rounded)) < 1e-8) return String(Math.round(rounded));
  return String(parseFloat(rounded.toFixed(6)));
}

function parseMathValue(str) {
  const s = String(str).trim().toLowerCase();
  if (s === "inf" || s === "+inf" || s === "infinity" || s === "+infinity") return Infinity;
  if (s === "-inf" || s === "-infinity") return -Infinity;
  if (s === "pi") return Math.PI;
  if (s === "e") return Math.E;
  const v = parseFloat(s);
  return isNaN(v) ? null : v;
}

function preprocessMathExpr(expr) {
  let s = sanitizeMathInput(expr).trim();
  s = s.replace(/\s+/g, "");
  s = s.replace(/π/g, "pi");
  s = s.replace(/√/g, "sqrt");
  s = s.replace(/\^/g, "**");

  s = s.replace(/\bacot\b/g, "ACOT");
  s = s.replace(/\basin\b/g, "Math.asin");
  s = s.replace(/\bacos\b/g, "Math.acos");
  s = s.replace(/\batan\b/g, "Math.atan");
  s = s.replace(/\bsin\b/g, "Math.sin");
  s = s.replace(/\bcos\b/g, "Math.cos");
  s = s.replace(/\btan\b/g, "Math.tan");
  s = s.replace(/\bcot\b/g, "COT");
  s = s.replace(/\bsqrt\b/g, "Math.sqrt");
  s = s.replace(/\babs\b/g, "Math.abs");
  s = s.replace(/\bln\b/g, "Math.log");
  s = s.replace(/\blog\b/g, "Math.log10");
  s = s.replace(/\bpi\b/g, "Math.PI");
  s = s.replace(/\be\^\(([^()]+)\)/g, "Math.exp($1)");
  s = s.replace(/\be\^([a-zA-Z0-9.+\-*/]+)/g, "Math.exp($1)");
  s = s.replace(/\be\b/g, "Math.E");

  return s;
}

function evalMathExpr(expr, variable, value) {
  try {
    let s = preprocessMathExpr(expr);
    const re = new RegExp("\\b" + variable + "\\b", "g");
    s = s.replace(re, "(" + value + ")");
    const COT = x => 1 / Math.tan(x);
    const ACOT = x => Math.PI / 2 - Math.atan(x);
    return Function("COT", "ACOT", '"use strict"; return (' + s + ');')(COT, ACOT);
  } catch (e) {
    return NaN;
  }
}

function splitTopLevelTerms(expr) {
  const s = expr.replace(/\s+/g, "");
  const terms = [];
  let cur = "";
  let depth = 0;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (i > 0 && depth === 0 && (ch === "+" || ch === "-")) {
      if (cur === "+" || cur === "-") {
        cur = ch;
      } else {
        terms.push(cur);
        cur = ch;
      }
    } else {
      cur += ch;
    }
  }
  if (cur) terms.push(cur);
  return terms;
}

function simpson(expr, variable, a, b, n = 1000) {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = evalMathExpr(expr, variable, a) + evalMathExpr(expr, variable, b);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const fx = evalMathExpr(expr, variable, x);
    if (!isFinite(fx) || isNaN(fx)) return NaN;
    sum += (i % 2 === 0 ? 2 : 4) * fx;
  }
  return (h / 3) * sum;
}

/* ══════════════════════════════════════
   LIMIT CALCULATOR
══════════════════════════════════════ */
let limDirection = "both";

function limSetDir(dir) {
  limDirection = dir;
  document.getElementById("dirBoth").classList.toggle("active", dir === "both");
  document.getElementById("dirLeft").classList.toggle("active", dir === "left");
  document.getElementById("dirRight").classList.toggle("active", dir === "right");
  limUpdateNotation();
}

function limUpdateNotation() {
  const vari = document.getElementById("limVar").value || "x";
  const val = document.getElementById("limVal").value || "a";
  const suffix = limDirection === "left" ? "&#8315;" : limDirection === "right" ? "&#8314;" : "";
  document.getElementById("limNotVar").textContent = vari;
  document.getElementById("limNotVar2").textContent = vari;
  document.getElementById("limNotVal").innerHTML = val + suffix;
}

function limExample(expr, val, dir) {
  document.getElementById("limExpr").value = expr;
  document.getElementById("limVal").value = val;
  limSetDir(dir);
  limUpdateNotation();
}

function limSample(expr, vari, point, dir) {
  const eps = [1e-2, 1e-3, 1e-4, 1e-5];
  if (point === Infinity || point === -Infinity) {
    const sign = point === Infinity ? 1 : -1;
    return [1e3, 1e4, 1e5, 1e6].map(v => evalMathExpr(expr, vari, sign * v));
  }
  if (dir === "left") return eps.map(e => evalMathExpr(expr, vari, point - e));
  if (dir === "right") return eps.map(e => evalMathExpr(expr, vari, point + e));
  return {
    left: eps.map(e => evalMathExpr(expr, vari, point - e)),
    right: eps.map(e => evalMathExpr(expr, vari, point + e))
  };
}

function limStable(vals) {
  if (!Array.isArray(vals) || vals.length < 2) return false;
  const last = vals[vals.length - 1];
  const prev = vals[vals.length - 2];
  return isFinite(last) && isFinite(prev) && Math.abs(last - prev) < 1e-3;
}

function limCalc() {
  const expr = document.getElementById("limExpr").value.trim();
  const vari = document.getElementById("limVar").value;
  const valS = document.getElementById("limVal").value.trim();
  const box = document.getElementById("limResultBox");
  const res = document.getElementById("limResultValue");
  const stps = document.getElementById("limSteps");

  box.classList.remove("show");
  stps.innerHTML = "";

  if (!expr) {
    res.innerHTML = '<span class="calc-error">Please enter a function.</span>';
    box.classList.add("show");
    return;
  }

  if (!valS) {
    res.innerHTML = '<span class="calc-error">Please enter an approach value.</span>';
    box.classList.add("show");
    return;
  }

  const approach = parseMathValue(valS);
  if (approach === null) {
    res.innerHTML = '<span class="calc-error">Invalid approach value. Use a number, pi, e, inf, or -inf.</span>';
    box.classList.add("show");
    return;
  }

  const steps = [];
  let answer = "";

  const dirText = limDirection === "left" ? "⁻" : limDirection === "right" ? "⁺" : "";
  const valDisp = approach === Infinity ? "+∞" : approach === -Infinity ? "−∞" : valS;
  steps.push("<strong>Step 1:</strong> Evaluate lim " + vari + "→" + valDisp + dirText + " of " + expr);

  if (isFinite(approach)) {
    const direct = evalMathExpr(expr, vari, approach);
    if (isFinite(direct) && !isNaN(direct)) {
      steps.push("<strong>Step 2:</strong> Direct substitution works.");
      steps.push("<strong>Result:</strong> " + fmtNum(direct));
      answer = fmtNum(direct);
    } else {
      steps.push("<strong>Step 2:</strong> Direct substitution is undefined, so use nearby values.");
    }
  } else {
    steps.push("<strong>Step 2:</strong> Use large values to estimate behavior at infinity.");
  }

  if (!answer) {
    if (approach === Infinity || approach === -Infinity) {
      const vals = limSample(expr, vari, approach, limDirection);
      const last = vals[vals.length - 1];
      const prev = vals[vals.length - 2];

      if (!isFinite(last)) {
        answer = last > 0 ? "+∞" : "−∞";
      } else if (isFinite(last) && isFinite(prev) && Math.abs(last - prev) < 1e-3) {
        answer = fmtNum(last);
      } else {
        answer = "Does not settle clearly";
      }

      steps.push("<strong>Step 3:</strong> Sample values: " + vals.map(fmtNum).join(", "));
      steps.push("<strong>Result:</strong> " + answer);
    } else if (limDirection === "left" || limDirection === "right") {
      const vals = limSample(expr, vari, approach, limDirection);
      const last = vals[vals.length - 1];

      if (!isFinite(last)) {
        answer = last > 0 ? "+∞" : "−∞";
      } else if (limStable(vals)) {
        answer = fmtNum(last);
      } else {
        answer = "Does not settle clearly";
      }

      steps.push("<strong>Step 3:</strong> One-sided samples: " + vals.map(fmtNum).join(", "));
      steps.push("<strong>Result:</strong> " + answer);
    } else {
      const both = limSample(expr, vari, approach, "both");
      const leftVals = both.left;
      const rightVals = both.right;
      const leftLast = leftVals[leftVals.length - 1];
      const rightLast = rightVals[rightVals.length - 1];

      steps.push("<strong>Step 3:</strong> Left samples: " + leftVals.map(fmtNum).join(", "));
      steps.push("<strong>Step 4:</strong> Right samples: " + rightVals.map(fmtNum).join(", "));

      if (!isFinite(leftLast) && !isFinite(rightLast) && Math.sign(leftLast) === Math.sign(rightLast)) {
        answer = leftLast > 0 ? "+∞" : "−∞";
      } else if (limStable(leftVals) && limStable(rightVals) && Math.abs(leftLast - rightLast) < 1e-3) {
        answer = fmtNum((leftLast + rightLast) / 2);
      } else {
        answer = "DNE";
      }

      steps.push("<strong>Result:</strong> " + answer);
    }
  }

  res.textContent = answer;
  stps.innerHTML = steps.map(s => '<div class="calc-step">' + s + "</div>").join("");
  box.classList.add("show");
}

/* ══════════════════════════════════════
   INTEGRAL CALCULATOR
══════════════════════════════════════ */
let intType = "indefinite";

function intSetType(type) {
  intType = type;
  document.getElementById("intTypeIndef").classList.toggle("active", type === "indefinite");
  document.getElementById("intTypeDefi").classList.toggle("active", type === "definite");
  document.getElementById("intBoundsWrap").classList.toggle("show", type === "definite");
  intUpdateNotation();
}

function intUpdateNotation() {
  const expr = document.getElementById("intExpr").value.trim() || "f(x)";
  const vari = document.getElementById("intVar").value;
  const lower = document.getElementById("intLower").value.trim() || "a";
  const upper = document.getElementById("intUpper").value.trim() || "b";
  document.getElementById("intNotVar").textContent = vari;

  if (intType === "definite") {
    document.getElementById("intNotation").innerHTML =
      "<span>&#8747;</span><sub>" + lower + "</sub><sup>" + upper + "</sup> <span>" + expr + "</span> &nbsp;d<span>" + vari + "</span>";
  } else {
    document.getElementById("intNotation").innerHTML =
      "<span>&#8747;</span> <span>" + expr + "</span> &nbsp;d<span>" + vari + "</span>";
  }
}

function intExample(expr, type, lower, upper) {
  document.getElementById("intExpr").value = expr;
  document.getElementById("intLower").value = lower;
  document.getElementById("intUpper").value = upper;
  intSetType(type);
  intUpdateNotation();
}

function intSymbolicTerm(term, variable) {
  const x = variable;
  const t = term.replace(/\s+/g, "");

  if (t === x) {
    return { display: x + "^2/2", evalExpr: "(" + x + "**2)/2", rule: "Power rule" };
  }

  if (/^[+-]?\d+(\.\d+)?$/.test(t)) {
    return { display: t + "*" + x, evalExpr: "(" + t + ")*(" + x + ")", rule: "Constant rule" };
  }

  let m = t.match(new RegExp("^" + x + "\\^([+-]?\\d+(?:\\.\\d+)?)$"));
  if (m) {
    const n = parseFloat(m[1]);
    if (n === -1) {
      return { display: "ln|" + x + "|", evalExpr: "Math.log(Math.abs(" + x + "))", rule: "Log rule" };
    }
    const p = n + 1;
    return {
      display: x + "^" + p + "/" + p,
      evalExpr: "(" + x + "**" + p + ")/(" + p + ")",
      rule: "Power rule"
    };
  }

  m = t.match(new RegExp("^([+-]?\\d+(?:\\.\\d+)?)\\*" + x + "$"));
  if (m) {
    const c = parseFloat(m[1]);
    return {
      display: "(" + c + "/2)*" + x + "^2",
      evalExpr: "((" + c + ")/2)*(" + x + "**2)",
      rule: "Constant multiple rule"
    };
  }

  m = t.match(new RegExp("^([+-]?\\d+(?:\\.\\d+)?)\\*" + x + "\\^([+-]?\\d+(?:\\.\\d+)?)$"));
  if (m) {
    const c = parseFloat(m[1]);
    const n = parseFloat(m[2]);
    if (n === -1) {
      return {
        display: c + "*ln|" + x + "|",
        evalExpr: "(" + c + ")*Math.log(Math.abs(" + x + "))",
        rule: "Constant multiple log rule"
      };
    }
    const p = n + 1;
    return {
      display: "(" + c + "/" + p + ")*" + x + "^" + p,
      evalExpr: "((" + c + ")/(" + p + "))*(" + x + "**" + p + ")",
      rule: "Constant multiple power rule"
    };
  }

  if (t === "sin(" + x + ")") {
    return { display: "-cos(" + x + ")", evalExpr: "-Math.cos(" + x + ")", rule: "Trig rule" };
  }

  if (t === "cos(" + x + ")") {
    return { display: "sin(" + x + ")", evalExpr: "Math.sin(" + x + ")", rule: "Trig rule" };
  }

  if (t === "tan(" + x + ")") {
    return { display: "-ln|cos(" + x + ")|", evalExpr: "-Math.log(Math.abs(Math.cos(" + x + ")))", rule: "Trig rule" };
  }

  if (t === "e^" + x || t === "e^(" + x + ")") {
    return { display: "e^" + x, evalExpr: "Math.exp(" + x + ")", rule: "Exponential rule" };
  }

  if (t === "1/" + x) {
    return { display: "ln|" + x + "|", evalExpr: "Math.log(Math.abs(" + x + "))", rule: "Log rule" };
  }

  if (t === "1/" + x + "^2") {
    return { display: "-1/" + x, evalExpr: "-1/(" + x + ")", rule: "Power rule" };
  }

  if (t === "sqrt(" + x + ")") {
    return {
      display: "(2/3)*" + x + "^(3/2)",
      evalExpr: "(2/3)*(" + x + "**(3/2))",
      rule: "Power rule"
    };
  }

  if (t === "ln(" + x + ")") {
    return {
      display: x + "*ln(" + x + ")-" + x,
      evalExpr: "(" + x + ")*Math.log(" + x + ")-(" + x + ")",
      rule: "Integration by parts formula"
    };
  }

  return null;
}

function intSymbolic(expr, variable) {
  const terms = splitTopLevelTerms(expr);
  const parts = [];
  const rules = [];

  for (let i = 0; i < terms.length; i++) {
    const sym = intSymbolicTerm(terms[i], variable);
    if (!sym) return null;
    parts.push(sym);
    rules.push(sym.rule);
  }

  return {
    display: parts.map(p => p.display).join(" + ").replace(/\+\s-\s/g, "- "),
    evalExpr: parts.map(p => "(" + p.evalExpr + ")").join(" + "),
    rules
  };
}

function intEvalAntiderivative(evalExpr, variable, value) {
  try {
    const re = new RegExp("\\b" + variable + "\\b", "g");
    const js = evalExpr.replace(re, "(" + value + ")");
    return Function('"use strict"; return (' + js + ');')();
  } catch (e) {
    return NaN;
  }
}

function intCalc() {
  const expr = document.getElementById("intExpr").value.trim();
  const vari = document.getElementById("intVar").value;
  const box = document.getElementById("intResultBox");
  const res = document.getElementById("intResultValue");
  const stps = document.getElementById("intSteps");

  box.classList.remove("show");
  stps.innerHTML = "";

  if (!expr) {
    res.innerHTML = '<span class="calc-error">Please enter a function.</span>';
    box.classList.add("show");
    return;
  }

  const steps = [];
  let answer = "";

  if (intType === "indefinite") {
    steps.push("<strong>Step 1:</strong> Compute ∫ " + expr + " d" + vari);

    const sym = intSymbolic(expr, vari);
    if (sym) {
      steps.push("<strong>Step 2:</strong> Apply known integration rule(s): " + Array.from(new Set(sym.rules)).join(", "));
      steps.push("<strong>Step 3:</strong> Antiderivative = " + sym.display + " + C");
      answer = sym.display + " + C";
    } else {
      steps.push("<strong>Step 2:</strong> This expression is not in the simple symbolic rule set.");
      steps.push("<strong>Note:</strong> Switch to definite mode for a numerical approximation.");
      answer = "No simple closed form found";
    }
  } else {
    const lowerS = document.getElementById("intLower").value.trim();
    const upperS = document.getElementById("intUpper").value.trim();

    if (!lowerS || !upperS) {
      res.innerHTML = '<span class="calc-error">Please enter both bounds.</span>';
      box.classList.add("show");
      return;
    }

    const a = parseMathValue(lowerS);
    const b = parseMathValue(upperS);

    if (a === null || b === null) {
      res.innerHTML = '<span class="calc-error">Invalid bounds. Use numbers, pi, e, inf, or -inf.</span>';
      box.classList.add("show");
      return;
    }

    steps.push("<strong>Step 1:</strong> Compute ∫ from " + lowerS + " to " + upperS + " of " + expr + " d" + vari);

    const sym = intSymbolic(expr, vari);
    if (sym && isFinite(a) && isFinite(b)) {
      const Fb = intEvalAntiderivative(sym.evalExpr, vari, b);
      const Fa = intEvalAntiderivative(sym.evalExpr, vari, a);

      if (isFinite(Fb) && isFinite(Fa)) {
        const val = Fb - Fa;
        steps.push("<strong>Step 2:</strong> Antiderivative = " + sym.display);
        steps.push("<strong>Step 3:</strong> Apply FTC: F(" + upperS + ") - F(" + lowerS + ")");
        steps.push("<strong>Step 4:</strong> " + fmtNum(Fb) + " - " + fmtNum(Fa));
        steps.push("<strong>Result:</strong> " + fmtNum(val));
        answer = fmtNum(val);
      }
    }

    if (!answer) {
      if (!isFinite(a) || !isFinite(b)) {
        res.innerHTML = '<span class="calc-error">Improper integrals with ±∞ are not handled numerically here.</span>';
        box.classList.add("show");
        return;
      }

      const numerical = simpson(expr, vari, a, b, 1000);
      if (isNaN(numerical) || !isFinite(numerical)) {
        res.innerHTML = '<span class="calc-error">Could not evaluate. Check the expression syntax.</span>';
        box.classList.add("show");
        return;
      }

      steps.push("<strong>Step 2:</strong> No simple symbolic form found, so use Simpson's Rule.");
      steps.push("<strong>Step 3:</strong> Numerical approximation with 1000 subintervals.");
      steps.push("<strong>Result:</strong> ≈ " + fmtNum(numerical));
      answer = "≈ " + fmtNum(numerical);
    }
  }

  res.textContent = answer;
  stps.innerHTML = steps.map(s => '<div class="calc-step">' + s + "</div>").join("");
  box.classList.add("show");
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
    navigator.clipboard.writeText(text).catch(() => {});
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

/* ══════════════════════════════════════
   DERIVATIVE CALCULATOR
══════════════════════════════════════ */
function derivFormatTerm(coeff, power, variable) {
  const x = variable || "x";
  if (coeff === 0) return null;
  if (power === 0) return String(coeff);
  if (power === 1) {
    if (coeff === 1) return x;
    if (coeff === -1) return "-" + x;
    return coeff + "*" + x;
  }
  const cs = coeff === 1 ? "" : coeff === -1 ? "-" : coeff + "*";
  return cs + x + "^" + power;
}

function derivPowerTerm(term, variable) {
  const x = variable || "x";
  const t = term.replace(/\s+/g, "");

  if (/^[+-]?\d+(\.\d+)?$/.test(t)) {
    return { display: "0", evalExpr: "0", rule: "Constant rule: d/dx(c) = 0" };
  }

  if (t === x) {
    return { display: "1", evalExpr: "1", rule: "Power rule: d/dx(x) = 1" };
  }
  if (t === "-" + x) {
    return { display: "-1", evalExpr: "-1", rule: "Power rule: d/dx(-x) = -1" };
  }

  let m = t.match(new RegExp("^([+-])?" + x + "\\^([+-]?\\d+(?:\\.\\d+)?)$"));
  if (m) {
    const sign = m[1] === "-" ? -1 : 1;
    const n = parseFloat(m[2]);
    const newCoeff = sign * n;
    const newPower = n - 1;
    if (newPower === 0) return { display: String(newCoeff), evalExpr: String(newCoeff), rule: "Power rule: d/dx(" + t + ") = " + newCoeff };
    if (newPower === 1) return { display: derivFormatTerm(newCoeff, 1, x), evalExpr: "(" + newCoeff + ")*(" + x + ")", rule: "Power rule" };
    return { display: derivFormatTerm(newCoeff, newPower, x), evalExpr: "(" + newCoeff + ")*(" + x + "**" + newPower + ")", rule: "Power rule" };
  }

  m = t.match(new RegExp("^([+-]?\\d+(?:\\.\\d+)?)\\*" + x + "$"));
  if (m) {
    const c = parseFloat(m[1]);
    return { display: String(c), evalExpr: String(c), rule: "Power rule: d/dx(" + c + "·x) = " + c };
  }

  m = t.match(new RegExp("^([+-]?\\d+(?:\\.\\d+)?)\\*" + x + "\\^([+-]?\\d+(?:\\.\\d+)?)$"));
  if (m) {
    const c = parseFloat(m[1]);
    const n = parseFloat(m[2]);
    const newCoeff = c * n;
    const newPower = n - 1;
    if (newPower === 0) return { display: String(newCoeff), evalExpr: String(newCoeff), rule: "Constant multiple + power rule" };
    if (newPower === 1) return { display: derivFormatTerm(newCoeff, 1, x), evalExpr: "(" + newCoeff + ")*(" + x + ")", rule: "Constant multiple + power rule" };
    return { display: derivFormatTerm(newCoeff, newPower, x), evalExpr: "(" + newCoeff + ")*(" + x + "**" + newPower + ")", rule: "Constant multiple + power rule" };
  }

  return null;
}

function derivSymbolicTerm(term, variable) {
  const x = variable || "x";
  const t = term.replace(/\s+/g, "");

  const powerResult = derivPowerTerm(term, variable);
  if (powerResult) return powerResult;

  if (t === "sin(" + x + ")") {
    return { display: "cos(" + x + ")", evalExpr: "Math.cos(" + x + ")", rule: "Trig rule: d/dx(sin(" + x + ")) = cos(" + x + ")" };
  }
  if (t === "cos(" + x + ")") {
    return { display: "-sin(" + x + ")", evalExpr: "-Math.sin(" + x + ")", rule: "Trig rule: d/dx(cos(" + x + ")) = -sin(" + x + ")" };
  }
  if (t === "tan(" + x + ")") {
    return { display: "1/cos(" + x + ")^2", evalExpr: "1/(Math.cos(" + x + ")**2)", rule: "Trig rule: d/dx(tan(" + x + ")) = sec²(" + x + ")" };
  }
  if (t === "cot(" + x + ")") {
    return { display: "-1/sin(" + x + ")^2", evalExpr: "-1/(Math.sin(" + x + ")**2)", rule: "Trig rule: d/dx(cot(" + x + ")) = -csc²(" + x + ")" };
  }
  if (t === "e^" + x || t === "e^(" + x + ")" || t === "exp(" + x + ")") {
    return { display: "e^" + x, evalExpr: "Math.exp(" + x + ")", rule: "Exponential rule: d/dx(e^" + x + ") = e^" + x };
  }
  if (t === "ln(" + x + ")") {
    return { display: "1/" + x, evalExpr: "1/(" + x + ")", rule: "Log rule: d/dx(ln(" + x + ")) = 1/" + x };
  }
  if (t === "sqrt(" + x + ")") {
    return { display: "1/(2*sqrt(" + x + "))", evalExpr: "1/(2*Math.sqrt(" + x + "))", rule: "Power rule: d/dx(√" + x + ") = 1/(2√" + x + ")" };
  }
  if (t === "1/" + x) {
    return { display: "-1/" + x + "^2", evalExpr: "-1/(" + x + "**2)", rule: "Power rule: d/dx(1/" + x + ") = -1/" + x + "²" };
  }

  return null;
}

function derivSymbolic(expr, variable) {
  const terms = splitTopLevelTerms(expr);
  const parts = [];
  const rules = [];

  for (let i = 0; i < terms.length; i++) {
    const sym = derivSymbolicTerm(terms[i], variable);
    if (!sym) return null;
    parts.push(sym);
    rules.push(sym.rule);
  }

  let display = parts.map(function (p) { return p.display; }).join(" + ");
  display = display.replace(/\+ -/g, "- ");
  display = display.replace(/^\+ /, "");
  display = display.replace(/^\+/, "");
  display = display.replace(/--/g, "");

  const evalExpr = parts.map(function (p) { return "(" + p.evalExpr + ")"; }).join(" + ");

  return { display: display, evalExpr: evalExpr, rules: rules };
}

function derivNumeric(expr, variable, point) {
  const h = 1e-8;
  const fplus = evalMathExpr(expr, variable, point + h);
  const fminus = evalMathExpr(expr, variable, point - h);
  if (!isFinite(fplus) || !isFinite(fminus)) return NaN;
  return (fplus - fminus) / (2 * h);
}

function derivCalc() {
  const expr = document.getElementById("derivExpr").value.trim();
  const vari = document.getElementById("derivVar").value;
  const pointS = document.getElementById("derivPoint").value.trim();
  const box = document.getElementById("derivResultBox");
  const res = document.getElementById("derivResultValue");
  const stps = document.getElementById("derivSteps");

  box.classList.remove("show");
  stps.innerHTML = "";

  if (!expr) {
    res.innerHTML = '<span class="calc-error">Please enter a function.</span>';
    box.classList.add("show");
    return;
  }

  const steps = [];
  let answer = "";

  steps.push("<strong>Step 1:</strong> Differentiate f(" + vari + ") = " + expr);

  const sym = derivSymbolic(expr, vari);
  if (sym) {
    steps.push("<strong>Step 2:</strong> Apply differentiation rules:");
    Array.from(new Set(sym.rules)).forEach(function (r, i) {
      steps.push("<div style='padding-left:1rem'>" + (i + 1) + ". " + r + "</div>");
    });
    steps.push("<strong>Step 3:</strong> f'(" + vari + ") = " + sym.display);
    answer = "f'(" + vari + ") = " + sym.display;

    if (pointS) {
      const point = parseMathValue(pointS);
      if (point !== null && isFinite(point)) {
        let numVal = NaN;
        try {
          numVal = evalMathExpr(sym.evalExpr, vari, point);
        } catch (e) {}
        if (!isFinite(numVal)) {
          numVal = derivNumeric(expr, vari, point);
        }
        if (isFinite(numVal) && !isNaN(numVal)) {
          steps.push("<strong>Step 4:</strong> f'(" + pointS + ") = " + fmtNum(numVal));
          answer += " | f'(" + pointS + ") = " + fmtNum(numVal);
        }
      } else {
        steps.push("<strong>Note:</strong> Could not parse point value.");
      }
    }
  } else {
    steps.push("<strong>Step 2:</strong> No simple symbolic form found in the rule set.");

    if (pointS) {
      const point = parseMathValue(pointS);
      if (point !== null && isFinite(point)) {
        const numVal = derivNumeric(expr, vari, point);
        if (isFinite(numVal) && !isNaN(numVal)) {
          steps.push("<strong>Step 3:</strong> Use central difference with h=10⁻⁸");
          steps.push("<strong>Step 4:</strong> f'(" + pointS + ") ≈ " + fmtNum(numVal));
          answer = fmtNum(numVal);
        } else {
          answer = "Could not compute";
          steps.push("<strong>Step 3:</strong> Could not compute derivative. Check expression syntax.");
        }
      } else {
        res.innerHTML = '<span class="calc-error">Please enter a valid point for numerical differentiation.</span>';
        box.classList.add("show");
        return;
      }
    } else {
      answer = "No simple closed form found. Provide a point for numerical differentiation.";
    }
  }

  res.textContent = answer;
  stps.innerHTML = steps.map(function (s) { return '<div class="calc-step">' + s + "</div>"; }).join("");
  box.classList.add("show");
}

function derivUpdateNotation() {
  const expr = document.getElementById("derivExpr").value.trim() || "f(x)";
  const vari = document.getElementById("derivVar").value;
  document.getElementById("derivNotVar").textContent = vari;
  document.getElementById("derivNotExpr").textContent = expr;
}

function derivExample(expr, point) {
  document.getElementById("derivExpr").value = expr;
  document.getElementById("derivPoint").value = point;
  derivUpdateNotation();
}

/* ══════════════════════════════════════
   INIT
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

  // Copy buttons
  const timerCopyBtn = document.getElementById("timerCopyBtn");
  if (timerCopyBtn) timerCopyBtn.addEventListener("click", () => copyText(document.getElementById("timerDisplay")?.textContent?.replace(/[^0-9:]/g, "") || ""));
  const swCopyBtn = document.getElementById("swCopyBtn");
  if (swCopyBtn) swCopyBtn.addEventListener("click", () => copyText(document.getElementById("swDisplay")?.textContent?.replace(/[^0-9:.]/g, "") || ""));
  const scCopyBtn = document.getElementById("scCopyBtn");
  if (scCopyBtn) scCopyBtn.addEventListener("click", () => copyText(document.getElementById("scResult")?.textContent || ""));
  const limCopyBtn = document.getElementById("limCopyBtn");
  if (limCopyBtn) limCopyBtn.addEventListener("click", () => copyText(document.getElementById("limResultValue")?.textContent || ""));
  const intCopyBtn = document.getElementById("intCopyBtn");
  if (intCopyBtn) intCopyBtn.addEventListener("click", () => copyText(document.getElementById("intResultValue")?.textContent || ""));

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
  const derivCopyBtn = document.getElementById("derivCopyBtn");
  if (derivCopyBtn) derivCopyBtn.addEventListener("click", function () {
    copyText(document.getElementById("derivResultValue")?.textContent || "");
  });
  derivUpdateNotation();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFunctions);
} else {
  initFunctions();
}
