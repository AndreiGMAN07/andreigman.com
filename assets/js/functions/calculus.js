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