/**
 * Memory minigames — procedural, difficulty-scaled
 */
const MemoryEngine = (function () {
  "use strict";

  const GAMES = ["grid", "sequence", "objects", "draw"];
  const SHAPE_SVGS = {
    circle: '<circle cx="20" cy="20" r="14" fill="currentColor"/>',
    square: '<rect x="6" y="6" width="28" height="28" fill="currentColor"/>',
    triangle: '<polygon points="20,4 36,36 4,36" fill="currentColor"/>',
    star: '<polygon points="20,2 25,14 38,14 28,22 32,36 20,28 8,36 12,22 2,14 15,14" fill="currentColor"/>',
    diamond: '<polygon points="20,4 36,20 20,36 4,20" fill="currentColor"/>',
    cross: '<path d="M16,6 h8 v8 h8 v8 h-8 v8 h-8 v-8 H8 v-8 h8z" fill="currentColor"/>',
  };
  const SHAPE_KEYS = Object.keys(SHAPE_SVGS);
  const COLORS = ["#3d9b4f", "#e6c229", "#e67e22", "#d64541", "#8e44ad", "#3498db", "#1abc9c"];

  function cfg(difficultyId) {
    const d = diffIndex(difficultyId);
    return {
      gridSize: [3, 3, 4, 5, 6, 10][Math.min(d, 5)],
      patternCells: Math.min(3 + d * 2, 40),
      showMs: Math.max(900, 3800 - d * 450),
      seqLen: 3 + d * 2,
      seqShowMs: Math.max(450, 1300 - d * 130),
      seqTypeMs: Math.max(6000, 16000 - d * 1800),
      objectCount: Math.min(2 + d, 6),
      objectMemMs: Math.max(2500, 5500 - d * 450),
      objectPlaceMs: Math.max(10000, 22000 - d * 2200),
      drawPoints: Math.min(3 + d * 2, 14),
      drawShowMs: Math.max(1600, 4500 - d * 400),
      drawTolerance: Math.max(22, 48 - d * 4),
    };
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickGame(difficultyId) {
    const d = diffIndex(difficultyId);
    if (d <= 1) return pick(["grid", "sequence"]);
    if (d <= 3) return pick(["grid", "sequence", "objects"]);
    return pick(GAMES);
  }

  function generate(difficultyId, forcedType) {
    const type = forcedType || pickGame(difficultyId);
    const c = cfg(difficultyId);
    if (type === "grid") return generateGrid(difficultyId, c);
    if (type === "sequence") return generateSequence(difficultyId, c);
    if (type === "objects") return generateObjects(difficultyId, c);
    return generateDraw(difficultyId, c);
  }

  function generateGrid(difficultyId, c) {
    const size = c.gridSize;
    const total = size * size;
    const count = Math.min(c.patternCells, total - 1);
    const indices = [];
    while (indices.length < count) {
      const i = Math.floor(Math.random() * total);
      if (!indices.includes(i)) indices.push(i);
    }
    const pattern = indices.map((idx) => ({
      idx,
      color: pick(COLORS),
    }));
    const expected = indices.slice().sort((a, b) => a - b);

    return {
      gameType: "grid",
      difficulty: difficultyId,
      title: "Color Grid Memory",
      instruction: `Memorize the colored squares on the ${size}×${size} grid, then tap the same cells.`,
      size,
      pattern,
      expected,
      showMs: c.showMs,
      check(userCells) {
        if (!Array.isArray(userCells)) return false;
        const got = userCells.slice().sort((a, b) => a - b);
        if (got.length !== expected.length) return false;
        return got.every((v, i) => v === expected[i]);
      },
    };
  }

  function generateSequence(difficultyId, c) {
    const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let seq = "";
    for (let i = 0; i < c.seqLen; i++) {
      seq += letters[Math.floor(Math.random() * letters.length)];
    }
    return {
      gameType: "sequence",
      difficulty: difficultyId,
      title: "Letter Sequence",
      instruction: "Watch each letter, then type the full sequence before time runs out!",
      sequence: seq,
      showMs: c.seqShowMs,
      typeMs: c.seqTypeMs,
      check(input) {
        return String(input).toUpperCase().replace(/[^A-Z]/g, "") === seq;
      },
    };
  }

  function generateObjects(difficultyId, c) {
    const count = Math.min(c.objectCount, SHAPE_KEYS.length);
    const shapeOrder = shuffle(SHAPE_KEYS).slice(0, count);
    const shapes = shapeOrder.map((shape, i) => ({
      id: i,
      shape,
      slot: i,
    }));

    return {
      gameType: "objects",
      difficulty: difficultyId,
      title: "Shape Positions",
      instruction: "Each numbered slot has a shape. After they shuffle, put every shape back in its slot!",
      slots: count,
      shapes,
      shuffled: shuffle(shapes.map((s) => ({ ...s }))),
      memMs: c.objectMemMs,
      placeMs: c.objectPlaceMs,
      check(assignments) {
        if (!assignments || typeof assignments !== "object") return false;
        return shapes.every((s) => Number(assignments[s.id]) === s.slot);
      },
    };
  }

  function generateDraw(difficultyId, c) {
    const n = c.drawPoints;
    const points = [];
    const pad = 28;
    const w = 200;
    const h = 140;
    for (let i = 0; i < n; i++) {
      points.push({
        x: pad + Math.random() * (w - pad * 2),
        y: pad + Math.random() * (h - pad * 2),
        order: i + 1,
      });
    }
    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${Math.round(p.x)},${Math.round(p.y)}`)
      .join(" ");

    return {
      gameType: "draw",
      difficulty: difficultyId,
      title: "Sketch Recall",
      instruction: "Memorize the doodle path, then tap each dot in order (1 → 2 → 3…).",
      points,
      path,
      showMs: c.drawShowMs,
      tolerance: c.drawTolerance,
      check(userPoints) {
        if (!userPoints || userPoints.length !== points.length) return false;
        for (let i = 0; i < points.length; i++) {
          const dx = userPoints[i].x - points[i].x;
          const dy = userPoints[i].y - points[i].y;
          if (Math.sqrt(dx * dx + dy * dy) > c.drawTolerance) return false;
        }
        return true;
      },
    };
  }

  return { generate, SHAPE_SVGS, COLORS, cfg };
})();
