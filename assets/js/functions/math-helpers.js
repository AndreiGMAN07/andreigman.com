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
    console.warn("Math: eval error", e);
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