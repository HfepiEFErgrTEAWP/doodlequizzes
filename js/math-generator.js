/**
 * Doodle Quizzes — procedural math matched to difficulty
 *
 * Rules (strict):
 * - easy: only + and -
 * - normal+: × and ÷
 * - harder+: fractions
 * - insane+: √ π ∑ style symbols
 * - extreme: many terms + fractions + symbols
 */

const DIFF_ORDER = ["easy", "normal", "hard", "harder", "insane", "extreme"];

function diffIndex(id) {
  const i = DIFF_ORDER.indexOf(id);
  return i >= 0 ? i : 0;
}

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function roundAns(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1000) / 1000;
}

function generateMathProblem(categoryId, difficultyId) {
  const cat = categoryId || "arithmetic";
  const diff = difficultyId || "easy";
  if (cat === "calculus") return generateCalculus(diff);
  if (cat === "geometry") return generateGeometry(diff);
  if (cat === "algebra") return generateAlgebra(diff);
  if (cat === "patterns") return generatePatterns(diff);
  return generateArithmetic(diff);
}

function generateArithmetic(diff) {
  const d = diffIndex(diff);
  if (d === 0) return arithEasy();
  if (d === 1) return arithNormal();
  if (d === 2) return arithHard();
  if (d === 3) return arithHarder();
  if (d === 4) return arithInsane();
  return arithExtreme();
}

function arithEasy() {
  const a = randInt(2, 45);
  const b = randInt(2, 45);
  if (Math.random() < 0.5) {
    if (a < b) return arithEasy();
    return { problem: `${a} − ${b} = ?`, answer: a - b };
  }
  return { problem: `${a} + ${b} = ?`, answer: a + b };
}

function arithNormal() {
  const kind = pick(["mul", "div", "addchain"]);
  if (kind === "mul") {
    const a = randInt(4, 18);
    const b = randInt(3, 14);
    return { problem: `${a} × ${b} = ?`, answer: a * b };
  }
  if (kind === "div") {
    const b = randInt(3, 12);
    const ans = randInt(4, 15);
    return { problem: `${ans * b} ÷ ${b} = ?`, answer: ans };
  }
  const a = randInt(10, 40);
  const b = randInt(5, 20);
  const c = randInt(3, 15);
  return { problem: `${a} + ${b} − ${c} = ?`, answer: a + b - c };
}

function arithHard() {
  const a = randInt(6, 25);
  const b = randInt(4, 14);
  const c = randInt(3, 10);
  const d = randInt(2, 8);
  return pick([
    () => ({ problem: `${a} + ${b} × ${c} − ${d} = ?`, answer: a + b * c - d }),
    () => ({ problem: `(${a} + ${b}) × ${c} = ?`, answer: (a + b) * c }),
    () => ({ problem: `${a * b} ÷ ${b} + ${c} × ${d} = ?`, answer: a + c * d }),
  ])();
}

function arithHarder() {
  const a = randInt(12, 50);
  const b = randInt(5, 18);
  const c = randInt(4, 12);
  const extra = randInt(5, 25);
  return pick([
    () => {
      const n1 = randInt(1, 8);
      const d1 = randInt(2, 9);
      const n2 = randInt(1, 8);
      const d2 = randInt(2, 9);
      const ans = n1 / d1 + n2 / d2;
      return { problem: `${n1}/${d1} + ${n2}/${d2} = ?`, answer: roundAns(ans) };
    },
    () => ({
      problem: `${a} × ${b} − ${c} + ${extra} = ?`,
      answer: a * b - c + extra,
    }),
    () => {
      const pct = pick([10, 20, 25]);
      const mult = randInt(2, 6);
      return {
        problem: `${pct}% of ${a} + ${b} × ${c} − ${mult} = ?`,
        answer: roundAns((a * pct) / 100 + b * c - mult),
      };
    },
  ])();
}

function arithInsane() {
  return pick([arithFractionChain, arithSqrtBlock, arithPiBlock])();
}

function arithExtreme() {
  return pick([arithExtremeFrac, arithExtremeSymbol, arithExtremeMega])();
}

function arithFractionChain() {
  const n1 = randInt(2, 9);
  const d1 = randInt(3, 11);
  const n2 = randInt(2, 9);
  const d2 = randInt(3, 11);
  const n3 = randInt(1, 6);
  const d3 = randInt(2, 8);
  const op = pick(["+", "−"]);
  let ans = op === "+" ? n1 / d1 + n2 / d2 : n1 / d1 - n2 / d2;
  ans += n3 / d3;
  return {
    problem: `${n1}/${d1} ${op} ${n2}/${d2} + ${n3}/${d3} = ?`,
    answer: roundAns(ans),
  };
}

function arithSqrtBlock() {
  const n = pick([4, 9, 16, 25, 36, 49]);
  const a = randInt(3, 14);
  const b = randInt(2, 10);
  const c = randInt(2, 8);
  return {
    problem: `√${n} × ${a} + ${b} − ${c} = ?`,
    answer: roundAns(Math.sqrt(n) * a + b - c),
  };
}

function arithPiBlock() {
  const r = randInt(3, 8);
  const add = randInt(2, 12);
  const sub = randInt(1, 6);
  const div = pick([2, 4]);
  return {
    problem: `π × ${r}² ÷ ${div} + ${add} − ${sub} = ? (π ≈ 3.14)`,
    answer: roundAns((3.14 * r * r) / div + add - sub),
  };
}

function arithExtremeFrac() {
  const n1 = randInt(3, 11);
  const d1 = randInt(4, 12);
  const n2 = randInt(2, 9);
  const d2 = randInt(3, 10);
  const n3 = randInt(2, 8);
  const d3 = randInt(4, 9);
  const w = randInt(2, 7);
  const inner = n1 / d1 + n2 / d2;
  const ans = inner * w - n3 / d3;
  return {
    problem: `(${n1}/${d1} + ${n2}/${d2}) × ${w} − ${n3}/${d3} = ?`,
    answer: roundAns(ans),
  };
}

function arithExtremeSymbol() {
  const n = pick([16, 25, 36, 49, 64]);
  const a = randInt(4, 12);
  const b = randInt(2, 9);
  const fn = randInt(2, 5);
  const fd = randInt(3, 8);
  const c = randInt(3, 11);
  const cd = randInt(4, 10);
  const ans = Math.sqrt(n) + a * 3.14 - b + fn / fd - c / cd;
  return {
    problem: `√${n} + ${a}π − ${b} + ${fn}/${fd} − ${c}/${cd} = ? (π ≈ 3.14)`,
    answer: roundAns(ans),
  };
}

function arithExtremeMega() {
  const a = randInt(8, 22);
  const b = randInt(4, 14);
  const c = randInt(3, 11);
  const d = randInt(2, 9);
  const e = randInt(2, 8);
  const f = randInt(3, 10);
  const g = randInt(2, 6);
  const n1 = randInt(2, 7);
  const d1 = randInt(3, 9);
  const sqrtN = pick([16, 25, 36]);
  const ans = a + b * c - d * e + Math.sqrt(sqrtN) + n1 / d1 - f + g;
  return {
    problem: `${a} + ${b}×${c} − ${d}×${e} + √${sqrtN} + ${n1}/${d1} − ${f} + ${g} = ?`,
    answer: roundAns(ans),
  };
}

function generateAlgebra(diff) {
  const d = diffIndex(diff);
  if (d === 0) {
    const x = randInt(2, 20);
    const b = randInt(3, 15);
    return { problem: `x + ${b} = ${x + b}. Find x.`, answer: x };
  }
  if (d === 1) {
    const x = randInt(3, 15);
    const m = randInt(2, 6);
    return { problem: `${m}x = ${m * x}. Find x.`, answer: x };
  }
  if (d === 2) {
    const x = randInt(4, 12);
    const a = randInt(2, 5);
    const b = randInt(3, 18);
    return { problem: `${a}x + ${b} = ${a * x + b}. Find x.`, answer: x };
  }
  if (d === 3) {
    const x = randInt(5, 15);
    const a = randInt(2, 6);
    const b = randInt(4, 20);
    return { problem: `${a}x − ${b} = ${a * x - b}. Find x.`, answer: x };
  }
  if (d === 4) {
    const x = randInt(2, 6);
    return { problem: `If √(x²) = ${x} and x > 0, find x.`, answer: x };
  }
  const x = randInt(2, 9);
  const a = randInt(2, 5);
  return {
    problem: `Solve: ${a}x² = ${a * x * x} (positive x)`,
    answer: x,
  };
}

function generateGeometry(diff) {
  const d = diffIndex(diff);
  const draw = Math.random() < 0.7;
  if (d <= 1) {
    const side = randInt(4, 14);
    if (Math.random() < 0.5) {
      return {
        problem: `Square side ${side}. Area = ?`,
        answer: side * side,
        drawing: draw ? drawSquare(side) : null,
      };
    }
    const h = randInt(3, side + 5);
    return {
      problem: `Rectangle ${side} × ${h}. Area = ?`,
      answer: side * h,
      drawing: draw ? drawRectangle(side, h) : null,
    };
  }
  if (d === 2) {
    const r = randInt(3, 12);
    return {
      problem: `Circle r=${r}. Area ≈ ? (π≈3.14, whole)`,
      answer: Math.round(3.14 * r * r),
      drawing: draw ? drawCircle(r) : null,
    };
  }
  if (d === 3) {
    const b = randInt(5, 14);
    const h = randInt(4, 12);
    return {
      problem: `Triangle base ${b}, height ${h}. Area = ?`,
      answer: (b * h) / 2,
      drawing: draw ? drawTriangle(b, h) : null,
    };
  }
  if (d === 4) {
    const a = randInt(3, 9);
    const b = randInt(3, 9);
    const c = randInt(3, 9);
    return {
      problem: `Box ${a}×${b}×${c}. Volume = ?`,
      answer: a * b * c,
      drawing: draw ? drawCube(a, b, c) : null,
    };
  }
  const r = randInt(3, 8);
  const h = randInt(5, 14);
  return {
    problem: `Cylinder r=${r}, h=${h}. Volume ≈ ? (π≈3.14, whole)`,
    answer: Math.round(3.14 * r * r * h),
    drawing: draw ? drawCylinder(r, h) : null,
  };
}

function generateCalculus(diff) {
  const d = Math.max(diffIndex(diff), diffIndex("hard"));
  if (d <= 2) {
    const k = randInt(2, 5);
    return { problem: `f(x)=${k}x. f(2)=?`, answer: k * 2 };
  }
  if (d === 3) {
    const a = randInt(2, 5);
    const n = randInt(2, 4);
    return { problem: `d/dx(${a}x^${n}) at x=1 = ?`, answer: a * n };
  }
  if (d === 4) {
    const c = randInt(2, 6);
    return { problem: `∫₀¹ ${c}x² dx = ?`, answer: roundAns(c / 3) };
  }
  const c = randInt(3, 8);
  return {
    problem: `∫₀² ${c}x dx + √(16) = ?`,
    answer: roundAns(c * 2 + 4),
  };
}

function generatePatterns(diff) {
  const d = diffIndex(diff);
  const seqs = [
    { seq: [2, 4, 6, 8], next: 10 },
    { seq: [1, 4, 9, 16], next: 25 },
    { seq: [2, 6, 12, 20], next: 30 },
    { seq: [3, 6, 12, 24], next: 48 },
    { seq: [1, 1, 2, 3, 5], next: 8 },
    { seq: [2, 3, 5, 8, 13], next: 21 },
    { seq: [2, 4, 8, 16], next: 32 },
  ];
  let pool = seqs;
  if (d <= 1) pool = seqs.slice(0, 2);
  else if (d <= 3) pool = seqs.slice(0, 5);
  const s = pick(pool);
  return { problem: `Next: ${s.seq.join(", ")}, ?`, answer: s.next };
}

function drawSquare(side) {
  const s = 60 + side * 3;
  return `<svg class="geo-draw" viewBox="0 0 120 100"><rect x="20" y="15" width="${s}" height="${s}" fill="none" stroke="#141414" stroke-width="2.5"/><text x="60" y="95" text-anchor="middle" font-size="12">${side}</text></svg>`;
}

function drawRectangle(w, h) {
  const sw = 40 + w * 4;
  const sh = 30 + h * 4;
  return `<svg class="geo-draw" viewBox="0 0 140 110"><rect x="25" y="20" width="${sw}" height="${sh}" fill="none" stroke="#141414" stroke-width="2.5"/></svg>`;
}

function drawCircle(r) {
  const rad = 18 + r * 4;
  return `<svg class="geo-draw" viewBox="0 0 120 120"><circle cx="60" cy="55" r="${rad}" fill="none" stroke="#141414" stroke-width="2.5"/></svg>`;
}

function drawTriangle(b, h) {
  return `<svg class="geo-draw" viewBox="0 0 130 100"><path d="M25,85 L105,85 L65,25 Z" fill="none" stroke="#141414" stroke-width="2.5"/></svg>`;
}

function drawCube(a, b, c) {
  return `<svg class="geo-draw" viewBox="0 0 140 120"><path d="M30,90 L30,50 L70,30 L110,50 L110,90 L70,110 Z" fill="none" stroke="#141414" stroke-width="2"/><text x="70" y="115" text-anchor="middle" font-size="10">${a}×${b}×${c}</text></svg>`;
}

function drawCylinder(r, h) {
  return `<svg class="geo-draw" viewBox="0 0 100 120"><ellipse cx="50" cy="35" rx="32" ry="11" fill="none" stroke="#141414" stroke-width="2"/><line x1="18" y1="35" x2="18" y2="92" stroke="#141414" stroke-width="2"/><line x1="82" y1="35" x2="82" y2="92" stroke="#141414" stroke-width="2"/><ellipse cx="50" cy="92" rx="32" ry="11" fill="none" stroke="#141414" stroke-width="2"/></svg>`;
}
