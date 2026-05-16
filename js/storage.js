/**
 * Doodle Quizzes — accounts, progress, points (localStorage)
 */

const STORAGE_KEY = "doodle_quizzes_v2";

function defaultUserData() {
  return {
    points: 0,
    hintsUsedToday: 0,
    hintsDate: "",
    daily: null,
    scores: { quiz: {}, math: {}, memory: {} },
    completed: 0,
    showOnLeaderboard: true,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Could not load saved data", e);
  }
  return { currentUser: null, users: {}, guestPoints: 0 };
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn("Could not save data", e);
  }
}

let appState = loadState();

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function hashPassword(password) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const enc = new TextEncoder().encode(password);
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch (e) {
      /* fall through */
    }
  }
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i);
  return "local_" + (h >>> 0).toString(16);
}

function getCurrentUserData() {
  if (!appState.currentUser) return null;
  return appState.users[appState.currentUser] || null;
}

function requireLogin() {
  return false;
}

function isLoggedIn() {
  return !!appState.currentUser;
}

function getUsername() {
  const u = getCurrentUserData();
  return u ? u.displayName || appState.currentUser : null;
}

function getPoints() {
  const u = getCurrentUserData();
  if (u) return u.points;
  return appState.guestPoints || 0;
}

function resetHintsIfNewDay(user) {
  const today = todayKey();
  if (user.hintsDate !== today) {
    user.hintsDate = today;
    user.hintsUsedToday = 0;
  }
}

function getHintsRemaining() {
  const u = getCurrentUserData();
  if (!u) return MAX_HINTS_PER_DAY;
  resetHintsIfNewDay(u);
  return Math.max(0, MAX_HINTS_PER_DAY - u.hintsUsedToday);
}

function useHint() {
  const u = getCurrentUserData();
  if (!u) return true;
  resetHintsIfNewDay(u);
  if (u.hintsUsedToday >= MAX_HINTS_PER_DAY) return false;
  u.hintsUsedToday += 1;
  saveState();
  return true;
}

async function registerUser(username, password) {
  const name = username.trim().toLowerCase();
  if (name.length < 3) return { ok: false, error: "Username needs at least 3 characters." };
  if (password.length < 4) return { ok: false, error: "Password needs at least 4 characters." };
  if (appState.users[name]) return { ok: false, error: "Username already taken." };

  appState.users[name] = {
    ...defaultUserData(),
    passwordHash: await hashPassword(password),
    displayName: username.trim(),
  };
  appState.currentUser = name;
  saveState();
  return { ok: true };
}

async function loginUser(username, password) {
  const name = username.trim().toLowerCase();
  const user = appState.users[name];
  if (!user) return { ok: false, error: "No account found. Register first!" };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok: false, error: "Wrong password." };
  appState.currentUser = name;
  saveState();
  return { ok: true };
}

function logoutUser() {
  appState.currentUser = null;
  saveState();
}

function addPoints(amount) {
  if (amount <= 0) return getPoints();
  const u = getCurrentUserData();
  if (u) {
    u.points += amount;
    saveState();
    return u.points;
  }
  appState.guestPoints = (appState.guestPoints || 0) + amount;
  saveState();
  return appState.guestPoints;
}

function recordWin(type, categoryId, difficultyId) {
  const u = getCurrentUserData();
  if (!u) return;
  const key = `${categoryId}|${difficultyId}`;
  if (!u.scores[type]) u.scores[type] = {};
  u.scores[type][key] = (u.scores[type][key] || 0) + 1;
  u.completed += 1;
  saveState();
}

function getLeaderboard(type) {
  const rows = [];
  Object.entries(appState.users).forEach(([id, data]) => {
    if (data.showOnLeaderboard === false) return;
    if (typeof Settings !== "undefined" && !Settings.isVisibleOnLeaderboard(data)) return;
    const bucket = data.scores[type] || {};
    const total = Object.values(bucket).reduce((a, b) => a + b, 0);
    rows.push({
      name: data.displayName || id,
      total,
      points: data.points || 0,
      breakdown: bucket,
    });
  });
  return rows.sort((a, b) => b.points - a.points || b.total - a.total);
}

function getPointsLeaderboard() {
  return Object.entries(appState.users)
    .filter(([, data]) => data.showOnLeaderboard !== false)
    .map(([id, data]) => ({
      name: data.displayName || id,
      points: data.points || 0,
    }))
    .sort((a, b) => b.points - a.points);
}

function setShowOnLeaderboard(show) {
  const u = getCurrentUserData();
  if (!u) return;
  u.showOnLeaderboard = show;
  saveState();
}

function getShowOnLeaderboard() {
  const u = getCurrentUserData();
  return u ? u.showOnLeaderboard !== false : true;
}

function getOrCreateDaily() {
  const u = getCurrentUserData();
  if (!u) return null;
  const today = todayKey();
  if (!u.daily || u.daily.date !== today) {
    const challenge = createDailyChallenge();
    u.daily = {
      date: today,
      type: challenge.type,
      categoryId: challenge.categoryId,
      difficulty: challenge.difficulty,
      question: challenge.question,
      completed: false,
    };
    saveState();
  }
  return u.daily;
}

function completeDaily() {
  const u = getCurrentUserData();
  if (!u || !u.daily) return;
  u.daily.completed = true;
  saveState();
}
