/* ══════════════════════════════════════
   UNIT CONVERTER
══════════════════════════════════════ */
const UC = {
  categories: {
    length: {
      base: "m", units: [
        { id: "m", label: "Meter", factor: 1 },
        { id: "km", label: "Kilometer", factor: 1000 },
        { id: "cm", label: "Centimeter", factor: 0.01 },
        { id: "mm", label: "Millimeter", factor: 0.001 },
        { id: "in", label: "Inch", factor: 0.0254 },
        { id: "ft", label: "Foot", factor: 0.3048 },
        { id: "yd", label: "Yard", factor: 0.9144 },
        { id: "mi", label: "Mile", factor: 1609.344 },
        { id: "nm", label: "Nautical mile", factor: 1852 },
      ]
    },
    mass: {
      base: "kg", units: [
        { id: "kg", label: "Kilogram", factor: 1 },
        { id: "g", label: "Gram", factor: 0.001 },
        { id: "mg", label: "Milligram", factor: 1e-6 },
        { id: "t", label: "Metric ton", factor: 1000 },
        { id: "lb", label: "Pound", factor: 0.45359237 },
        { id: "oz", label: "Ounce", factor: 0.0283495 },
        { id: "st", label: "Stone", factor: 6.35029 },
      ]
    },
    temp: {
      base: "K", units: [
        { id: "K", label: "Kelvin", toBase: function (v) { return v; }, fromBase: function (v) { return v; } },
        { id: "C", label: "Celsius", toBase: function (v) { return v + 273.15; }, fromBase: function (v) { return v - 273.15; } },
        { id: "F", label: "Fahrenheit", toBase: function (v) { return (v + 459.67) * 5 / 9; }, fromBase: function (v) { return v * 9 / 5 - 459.67; } },
      ]
    },
    time: {
      base: "s", units: [
        { id: "s", label: "Second", factor: 1 },
        { id: "ms", label: "Millisecond", factor: 0.001 },
        { id: "min", label: "Minute", factor: 60 },
        { id: "h", label: "Hour", factor: 3600 },
        { id: "d", label: "Day", factor: 86400 },
      ]
    },
    speed: {
      base: "m/s", units: [
        { id: "m_s", label: "Meter/second", factor: 1 },
        { id: "km_h", label: "Kilometer/hour", factor: 0.277778 },
        { id: "mph", label: "Mile/hour", factor: 0.44704 },
        { id: "kn", label: "Knot", factor: 0.514444 },
        { id: "ft_s", label: "Foot/second", factor: 0.3048 },
      ]
    },
    area: {
      base: "m²", units: [
        { id: "m2", label: "Square meter", factor: 1 },
        { id: "km2", label: "Square kilometer", factor: 1e6 },
        { id: "cm2", label: "Square centimeter", factor: 0.0001 },
        { id: "ha", label: "Hectare", factor: 10000 },
        { id: "ac", label: "Acre", factor: 4046.856 },
        { id: "ft2", label: "Square foot", factor: 0.092903 },
        { id: "in2", label: "Square inch", factor: 0.00064516 },
      ]
    },
    volume: {
      base: "L", units: [
        { id: "L", label: "Liter", factor: 1 },
        { id: "mL", label: "Milliliter", factor: 0.001 },
        { id: "m3", label: "Cubic meter", factor: 1000 },
        { id: "gal", label: "Gallon (US)", factor: 3.78541 },
        { id: "qt", label: "Quart", factor: 0.946353 },
        { id: "pt", label: "Pint", factor: 0.473176 },
        { id: "cup", label: "Cup", factor: 0.236588 },
        { id: "fl_oz", label: "Fluid ounce", factor: 0.0295735 },
      ]
    },
    pressure: {
      base: "Pa", units: [
        { id: "Pa", label: "Pascal", factor: 1 },
        { id: "kPa", label: "Kilopascal", factor: 1000 },
        { id: "bar", label: "Bar", factor: 100000 },
        { id: "atm", label: "Atmosphere", factor: 101325 },
        { id: "psi", label: "PSI", factor: 6894.76 },
        { id: "torr", label: "Torr", factor: 133.322 },
        { id: "mmHg", label: "mmHg", factor: 133.322 },
      ]
    },
    energy: {
      base: "J", units: [
        { id: "J", label: "Joule", factor: 1 },
        { id: "kJ", label: "Kilojoule", factor: 1000 },
        { id: "cal", label: "Calorie", factor: 4.184 },
        { id: "kcal", label: "Kilocalorie", factor: 4184 },
        { id: "Wh", label: "Watt-hour", factor: 3600 },
        { id: "kWh", label: "Kilowatt-hour", factor: 3.6e6 },
        { id: "eV", label: "Electronvolt", factor: 1.602e-19 },
        { id: "BTU", label: "BTU", factor: 1055.06 },
      ]
    },
    power: {
      base: "W", units: [
        { id: "W", label: "Watt", factor: 1 },
        { id: "kW", label: "Kilowatt", factor: 1000 },
        { id: "MW", label: "Megawatt", factor: 1e6 },
        { id: "hp", label: "Horsepower", factor: 745.7 },
        { id: "BTU_h", label: "BTU/hour", factor: 0.293071 },
      ]
    },
    force: {
      base: "N", units: [
        { id: "N", label: "Newton", factor: 1 },
        { id: "kN", label: "Kilonewton", factor: 1000 },
        { id: "lbf", label: "Pound-force", factor: 4.44822 },
        { id: "dyn", label: "Dyne", factor: 1e-5 },
      ]
    },
    freq: {
      base: "Hz", units: [
        { id: "Hz", label: "Hertz", factor: 1 },
        { id: "kHz", label: "Kilohertz", factor: 1000 },
        { id: "MHz", label: "Megahertz", factor: 1e6 },
        { id: "GHz", label: "Gigahertz", factor: 1e9 },
      ]
    },
    data: {
      base: "B", units: [
        { id: "B", label: "Byte", factor: 1 },
        { id: "KB", label: "Kilobyte", factor: 1024 },
        { id: "MB", label: "Megabyte", factor: 1048576 },
        { id: "GB", label: "Gigabyte", factor: 1073741824 },
        { id: "TB", label: "Terabyte", factor: 1099511627776 },
        { id: "b", label: "Bit", factor: 0.125 },
        { id: "Kb", label: "Kilobit", factor: 128 },
        { id: "Mb", label: "Megabit", factor: 131072 },
      ]
    },
  }
};

function ucPopulateUnits() {
  const cat = document.getElementById("ucCategory").value;
  const fromEl = document.getElementById("ucFrom");
  const toEl = document.getElementById("ucTo");

  const data = UC.categories[cat];
  if (!data) return;

  [fromEl, toEl].forEach(function (sel) {
    sel.innerHTML = data.units.map(function (u) {
      return '<option value="' + u.id + '">' + u.label + "</option>";
    }).join("");
  });

  toEl.value = data.units.length > 1 ? data.units[1].id : data.units[0].id;
}

function ucConvert() {
  const cat = document.getElementById("ucCategory").value;
  const fromId = document.getElementById("ucFrom").value;
  const toId = document.getElementById("ucTo").value;
  const value = parseFloat(document.getElementById("ucValue").value);
  const resultEl = document.getElementById("ucResult");
  const formulaEl = document.getElementById("ucFormula");
  const formulaRow = document.getElementById("ucFormulaRow");

  if (isNaN(value) || !isFinite(value)) {
    resultEl.textContent = "—";
    formulaRow.hidden = true;
    return;
  }

  const data = UC.categories[cat];
  const fromUnit = data.units.find(function (u) { return u.id === fromId; });
  const toUnit = data.units.find(function (u) { return u.id === toId; });
  if (!fromUnit || !toUnit) return;

  let result, formula;

  if (fromUnit.toBase) {
    const baseVal = fromUnit.toBase(value);
    result = toUnit.fromBase(baseVal);
    formula = value + " " + fromUnit.label + " → " + result.toFixed(6) + " " + toUnit.label;
  } else {
    const baseVal = value * fromUnit.factor;
    result = baseVal / toUnit.factor;
    formula = value + " " + fromUnit.label + " × (" + fromUnit.factor + "/" + toUnit.factor + ") = " + result.toFixed(6) + " " + toUnit.label;
  }

  const precision = Math.abs(result) < 1e-6 ? 10 : Math.abs(result) < 1 ? 8 : Math.abs(result) < 1000 ? 4 : 2;
  resultEl.textContent = Number(result.toFixed(precision)).toString();

  formulaRow.hidden = false;
  formulaEl.textContent = formula;
}