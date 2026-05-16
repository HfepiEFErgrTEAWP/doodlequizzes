/**
 * Doodle Quizzes — config, categories, points
 */

const DIFFICULTIES = [
  { id: "easy", label: "Easy", colorClass: "easy" },
  { id: "normal", label: "Normal", colorClass: "normal" },
  { id: "hard", label: "Hard", colorClass: "hard" },
  { id: "harder", label: "Harder", colorClass: "harder" },
  { id: "insane", label: "Insane", colorClass: "insane" },
  { id: "extreme", label: "Extreme", colorClass: "extreme", rainbow: true },
];

const DIFF_ORDER = ["easy", "normal", "hard", "harder", "insane", "extreme"];

const POINTS_BY_DIFF = {
  easy: 10,
  normal: 25,
  hard: 50,
  harder: 100,
  insane: 200,
  extreme: 400,
};

const DAILY_DIFF_POOL = ["hard", "harder", "insane"];
const DAILY_MULTIPLIER = 1.5;
const HINT_PENALTY = 0.7;
const MAX_HINTS_PER_DAY = 3;
const CALCULUS_POINT_MULT = 1.3;
const MEMORY_POINT_MULT = 1.15;

const MATH_SYMBOLS = [
  { label: "π", char: "π" },
  { label: "∑", char: "∑" },
  { label: "∫", char: "∫" },
  { label: "√", char: "√" },
  { label: "∞", char: "∞" },
  { label: "θ", char: "θ" },
  { label: "Δ", char: "Δ" },
  { label: "±", char: "±" },
  { label: "÷", char: "÷" },
  { label: "×", char: "×" },
  { label: "²", char: "²" },
  { label: "³", char: "³" },
  { label: "≤", char: "≤" },
  { label: "≥", char: "≥" },
  { label: "≠", char: "≠" },
  { label: "≈", char: "≈" },
  { label: "^", char: "^" },
  { label: "(", char: "(" },
  { label: ")", char: ")" },
];

const QUIZ_CATEGORIES = [
  { id: "mystery", name: "Mystery", icon: "🔍" },
  { id: "nature", name: "Nature", icon: "🌿" },
  { id: "words", name: "Word Play", icon: "✏️" },
  { id: "logic", name: "Logic", icon: "🧩" },
  { id: "history", name: "History", icon: "📜" },
  { id: "science", name: "Science", icon: "⚗️" },
  { id: "pop", name: "Pop Culture", icon: "🎬" },
  { id: "riddles", name: "Riddles", icon: "🌙" },
  { id: "hidden", name: "Hidden Clues", icon: "👁" },
];

const MATH_CATEGORIES = [
  { id: "arithmetic", name: "Arithmetic", icon: "＋" },
  { id: "algebra", name: "Algebra", icon: "𝑥" },
  { id: "geometry", name: "Geometry", icon: "△" },
  { id: "patterns", name: "Patterns", icon: "∞" },
  { id: "calculus", name: "Calculus", icon: "∫", hardest: true },
];

const MEMORY_CATEGORY = {
  id: "memory",
  name: "Memory",
  icon: "💡✏️",
};

function diffIndex(id) {
  const i = DIFF_ORDER.indexOf(id);
  return i >= 0 ? i : 0;
}

function getBasePoints(difficultyId) {
  return POINTS_BY_DIFF[difficultyId] || 10;
}

function getQuizPoints(difficultyId, hintsUsed) {
  let p = getBasePoints(difficultyId);
  for (let i = 0; i < hintsUsed; i++) p *= HINT_PENALTY;
  return Math.round(p);
}

function getMathPoints(difficultyId, categoryId, isDaily) {
  let p = getBasePoints(difficultyId);
  if (categoryId === "calculus") p = Math.round(p * CALCULUS_POINT_MULT);
  if (isDaily) p = Math.round(p * DAILY_MULTIPLIER);
  return p;
}

function getMemoryPoints(difficultyId, isDaily) {
  let p = Math.round(getBasePoints(difficultyId) * MEMORY_POINT_MULT);
  if (isDaily) p = Math.round(p * DAILY_MULTIPLIER);
  return p;
}

/** Always fresh procedural quiz */
function getQuizQuestion(categoryId, difficultyId) {
  return QuizGen.generate(categoryId, difficultyId);
}

/** Always fresh procedural math */
function getMathQuestion(categoryId, difficultyId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const p = generateMathProblem(categoryId, difficultyId);
      if (!p || p.problem == null || p.answer == null || !Number.isFinite(Number(p.answer))) {
        continue;
      }
      return { ...p, category: categoryId, difficulty: difficultyId };
    } catch (e) {
      console.warn("Math gen retry", e);
    }
  }
  return generateMathProblem(categoryId, difficultyId);
}

function getCategoryName(type, categoryId) {
  if (type === "memory" || categoryId === "memory") return MEMORY_CATEGORY.name;
  const list = type === "quiz" ? QUIZ_CATEGORIES : MATH_CATEGORIES;
  const found = list.find((c) => c.id === categoryId);
  return found ? found.name : categoryId;
}

function getDifficultyLabel(difficultyId) {
  const found = DIFFICULTIES.find((d) => d.id === difficultyId);
  return found ? found.label : difficultyId;
}

function pickDailyDifficulty() {
  return DAILY_DIFF_POOL[Math.floor(Math.random() * DAILY_DIFF_POOL.length)];
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createDailyChallenge() {
  const roll = Math.random();
  const difficulty = pickDailyDifficulty();
  if (roll < 0.33) {
    const cat = pick(QUIZ_CATEGORIES).id;
    return { type: "quiz", categoryId: cat, difficulty, question: getQuizQuestion(cat, difficulty) };
  }
  if (roll < 0.66) {
    const cats = MATH_CATEGORIES.filter(
      (c) => c.id !== "calculus" || diffIndex(difficulty) >= diffIndex("hard")
    );
    const cat = pick(cats).id;
    return { type: "math", categoryId: cat, difficulty, question: getMathQuestion(cat, difficulty) };
  }
  return {
    type: "memory",
    categoryId: "memory",
    difficulty,
    question: MemoryEngine.generate(difficulty),
  };
}
