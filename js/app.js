/**
 * Doodle Quizzes — main app
 */
(function () {
  "use strict";

  const navStack = ["home"];
  let authMode = "login";
  let leaderboardTab = "quiz";
  let memoryState = {};

  let gameContext = {
    type: null,
    categoryId: null,
    difficultyId: null,
    current: null,
    hintsUsed: 0,
    isDaily: false,
    lastTypedLen: 0,
    answered: false,
  };

  const $ = (id) => document.getElementById(id);
  const views = document.querySelectorAll(".view");

  const quizClue = $("quiz-clue");
  const letterBoxesEl = $("letter-boxes");
  const quizAnswerInput = $("quiz-answer");
  const quizFeedback = $("quiz-feedback");
  const quizNext = $("quiz-next");
  const mathProblem = $("math-problem");
  const mathDrawing = $("math-drawing");
  const mathAnswerInput = $("math-answer");
  const mathFeedback = $("math-feedback");
  const mathNext = $("math-next");
  const memoryStage = $("memory-stage");
  const memoryTimer = $("memory-timer");
  const memorySubmit = $("memory-submit");
  const memoryNext = $("memory-next");
  const memoryFeedback = $("memory-feedback");

  function init() {
    buildDifficultyLegend();
    buildCategoryGrids();
    buildMathSymbols();
    initSettings();
    updateAuthUI();
    updateDailyUI();
    updatePointsHeader();

    document.body.addEventListener("click", () => Sounds.unlock(), { once: true });

    document.querySelectorAll("[data-go]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const t = btn.getAttribute("data-go");
        if (t === "quiz-categories") gameContext.type = "quiz";
        if (t === "math-categories") gameContext.type = "math";
        if (t === "memory-difficulty") {
          gameContext.type = "memory";
          gameContext.categoryId = "memory";
          openMemoryDifficulty();
          return;
        }
        navigateTo(t);
        Sounds.play("click");
      });
    });

    $("btn-back").addEventListener("click", () => { goBack(); Sounds.play("click"); });
    $("site-logo").addEventListener("click", goHome);
    $("btn-account").addEventListener("click", () => navigateTo("auth"));
    $("btn-settings").addEventListener("click", () => { navigateTo("settings"); loadSettingsUI(); });
    $("btn-leaderboard").addEventListener("click", () => {
      navStack.length = 0;
      navStack.push("home", "leaderboard");
      showView("leaderboard");
      renderLeaderboard();
    });
    $("btn-daily").addEventListener("click", startDaily);
    $("guest-login").addEventListener("click", () => navigateTo("auth"));

    $("quiz-form").addEventListener("submit", onQuizSubmit);
    $("math-form").addEventListener("submit", onMathSubmit);
    $("quiz-next").addEventListener("click", nextQuiz);
    $("math-next").addEventListener("click", nextMath);
    $("btn-quiz-hint").addEventListener("click", onQuizHint);
    quizAnswerInput.addEventListener("input", syncLetterBoxes);

    memorySubmit.addEventListener("click", checkMemory);
    memoryNext.addEventListener("click", nextMemory);

    $("auth-form").addEventListener("submit", onAuthSubmit);
    $("auth-toggle").addEventListener("click", () => {
      authMode = authMode === "login" ? "register" : "login";
      updateAuthUI();
    });
    $("auth-logout").addEventListener("click", () => { logoutUser(); updateAuthUI(); goHome(); });

    document.querySelectorAll(".leaderboard-tabs .tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".leaderboard-tabs .tab").forEach((x) => x.classList.remove("active"));
        tab.classList.add("active");
        leaderboardTab = tab.getAttribute("data-lb-tab");
        renderLeaderboard();
      });
    });
  }

  function goHome() {
    navStack.length = 0;
    navStack.push("home");
    showView("home");
    updateDailyUI();
    updatePointsHeader();
  }

  function navigateTo(name) {
    navStack.push(name);
    showView(name);
  }

  function goBack() {
    if (navStack.length > 1) {
      navStack.pop();
      showView(navStack[navStack.length - 1]);
    } else goHome();
  }

  function showView(name) {
    views.forEach((v) => v.classList.toggle("view-active", v.getAttribute("data-view") === name));
    $("btn-back").classList.toggle("hidden", name === "home");
  }

  function updatePointsHeader() {
    $("header-points").textContent = `${getPoints()} pts`;
    $("guest-banner").classList.toggle("hidden", isLoggedIn());
  }

  function updateAuthUI() {
    const logged = isLoggedIn();
    if (logged) {
      $("auth-title").textContent = `hello, ${getUsername()}`;
      $("auth-submit").classList.add("hidden");
      $("auth-toggle").classList.add("hidden");
      $("auth-logout").hidden = false;
      $("auth-username").hidden = true;
      $("auth-password").hidden = true;
    } else {
      $("auth-title").textContent = authMode === "login" ? "log in" : "register";
      $("auth-submit").textContent = authMode === "login" ? "log in" : "create account";
      $("auth-submit").classList.remove("hidden");
      $("auth-toggle").classList.remove("hidden");
      $("auth-logout").hidden = true;
      $("auth-username").hidden = false;
      $("auth-password").hidden = false;
    }
    updateDailyUI();
    updatePointsHeader();
  }

  async function onAuthSubmit(e) {
    e.preventDefault();
    $("auth-error").classList.add("hidden");
    const r = authMode === "login"
      ? await loginUser($("auth-username").value, $("auth-password").value)
      : await registerUser($("auth-username").value, $("auth-password").value);
    if (!r.ok) {
      $("auth-error").textContent = r.error;
      $("auth-error").classList.remove("hidden");
      Sounds.play("wrong");
      return;
    }
    Sounds.play("login");
    updateAuthUI();
    goHome();
  }

  function updateDailyUI() {
    if (!isLoggedIn()) {
      $("daily-desc").textContent = "Log in for daily challenge — 1.5× points (guests can play everything else!)";
      $("btn-daily").classList.add("hidden");
      $("daily-done").classList.add("hidden");
      return;
    }
    const d = getOrCreateDaily();
    if (d.completed) {
      $("daily-desc").textContent = "Daily complete!";
      $("btn-daily").classList.add("hidden");
      $("daily-done").classList.remove("hidden");
    } else {
      $("daily-desc").textContent = `Today: ${d.type} · ${getDifficultyLabel(d.difficulty)} · 1.5× pts`;
      $("btn-daily").classList.remove("hidden");
      $("daily-done").classList.add("hidden");
    }
  }

  function startDaily() {
    if (!isLoggedIn()) { navigateTo("auth"); return; }
    const d = getOrCreateDaily();
    if (d.completed) return;
    gameContext = {
      type: d.type,
      categoryId: d.categoryId,
      difficultyId: d.difficulty,
      current: d.question,
      hintsUsed: 0,
      isDaily: true,
      answered: false,
      lastTypedLen: 0,
    };
    Sounds.play("daily");
    if (d.type === "quiz") { renderQuiz(); navigateTo("quiz-play"); }
    else if (d.type === "math") { renderMath(); navigateTo("math-play"); }
    else { startMemoryGame(d.difficulty, d.question); navigateTo("memory-play"); }
  }

  function buildDifficultyLegend() {
    const tilts = [-2, 1, -1, 2, -1.5, 0.5];
    $("difficulty-legend").innerHTML = DIFFICULTIES.map((d, i) => {
      const ex = d.rainbow ? " extreme-rainbow" : d.id === "extreme" ? " extreme-label" : "";
      return `<li class="difficulty-chip${ex}" style="--tilt:${tilts[i]}deg">
        <span class="difficulty-dot ${d.colorClass}${d.rainbow ? " rainbow-dot" : ""}"></span>${d.label}</li>`;
    }).join("");
  }

  function buildCategoryGrids() {
    $("quiz-category-grid").innerHTML = QUIZ_CATEGORIES.map((c) => catCard(c, "quiz")).join("");
    $("math-category-grid").innerHTML = MATH_CATEGORIES.map((c) => catCard(c, "math", c.hardest)).join("");
    document.querySelectorAll(".category-card").forEach((card) => {
      card.addEventListener("click", () => {
        gameContext.type = card.dataset.type;
        gameContext.categoryId = card.dataset.category;
        gameContext.isDaily = false;
        Sounds.play("click");
        openDifficultyPicker();
      });
    });
  }

  function catCard(cat, type, tough) {
    return `<button type="button" class="category-card sketch-box idle-wobble" data-type="${type}" data-category="${cat.id}">
      <span class="cat-icon">${cat.icon}</span><span class="cat-name">${cat.name}</span>
      ${tough ? '<span class="cat-tag">tough</span>' : ""}</button>`;
  }

  function openMemoryDifficulty() {
    gameContext.type = "memory";
    gameContext.categoryId = "memory";
    gameContext.isDaily = false;
    $("difficulty-title").textContent = "Memory — difficulty";
    $("difficulty-sub").textContent = "grid size, speed & complexity scale with color";
    $("difficulty-pick").innerHTML = DIFFICULTIES.map((d) =>
      `<button type="button" class="difficulty-btn idle-wobble" data-diff="${d.id}">
        <span>${d.label}</span><span class="bar"></span></button>`).join("");
    $("difficulty-pick").querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        startMemoryGame(btn.dataset.diff);
        navigateTo("memory-play");
        Sounds.play("click");
      });
    });
    navigateTo("difficulty");
  }

  function openDifficultyPicker() {
    const cat = getCategoryName(gameContext.type, gameContext.categoryId);
    $("difficulty-title").textContent = `${cat} — difficulty`;
    $("difficulty-sub").textContent = gameContext.type === "quiz"
      ? "AI writes unique clues per round — Easy ≠ Extreme"
      : gameContext.categoryId === "calculus"
        ? "Calculus: Hard minimum"
        : "New procedural problem every round";

    let diffs = DIFFICULTIES;
    if (gameContext.type === "math" && gameContext.categoryId === "calculus") {
      diffs = DIFFICULTIES.filter((d) => diffIndex(d.id) >= diffIndex("hard"));
    }

    $("difficulty-pick").innerHTML = diffs.map((d) =>
      `<button type="button" class="difficulty-btn idle-wobble" data-diff="${d.id}">
        <span>${d.label}</span><span class="bar"></span></button>`).join("");

    $("difficulty-pick").querySelectorAll(".difficulty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        gameContext.difficultyId = btn.dataset.diff;
        gameContext.hintsUsed = 0;
        gameContext.isDaily = false;
        if (gameContext.type === "quiz") {
          gameContext.current = getQuizQuestion(gameContext.categoryId, gameContext.difficultyId);
          renderQuiz();
          navigateTo("quiz-play");
        } else {
          gameContext.current = getMathQuestion(gameContext.categoryId, gameContext.difficultyId);
          renderMath();
          navigateTo("math-play");
        }
        Sounds.play("click");
      });
    });
    navigateTo("difficulty");
  }

  // --- Quiz ---
  function renderQuiz() {
    const q = gameContext.current;
    const diff = gameContext.difficultyId;
    $("quiz-badge-cat").textContent = gameContext.isDaily ? "☀ " + getCategoryName("quiz", gameContext.categoryId) : getCategoryName("quiz", gameContext.categoryId);
    $("quiz-badge-diff").textContent = getDifficultyLabel(diff);
    $("quiz-badge-diff").className = `badge sketch-pill diff-${diff}${diff === "extreme" ? " diff-extreme-rainbow" : ""}`;
    let pts = getQuizPoints(diff, gameContext.hintsUsed);
    if (gameContext.isDaily) pts = Math.round(pts * DAILY_MULTIPLIER);
    $("quiz-points-preview").textContent = `+${pts} pts`;

    $("quiz-clue").textContent = q.clue;
    $("quiz-hint-clue").classList.add("hidden");
    $("quiz-hint-clue").textContent = "";
    buildLetterBoxes(q.answer);
    quizAnswerInput.value = "";
    quizAnswerInput.disabled = false;
    hideFeedback(quizFeedback);
    quizNext.classList.remove("visible");
    gameContext.answered = false;
    gameContext.lastTypedLen = 0;
    $("hints-left").textContent = getHintsRemaining();
    $("btn-quiz-hint").disabled = getHintsRemaining() <= 0;
    $("quiz-progress").textContent = gameContext.isDaily ? "daily quiz" : "new AI puzzle";
    quizAnswerInput.focus();
  }

  function buildLetterBoxes(answer) {
    letterBoxesEl.innerHTML = answer.toUpperCase().split("").map((ch) =>
      ch === " " ? '<span class="letter-box space"></span>' : '<span class="letter-box"></span>').join("");
  }

  function syncLetterBoxes() {
    const raw = quizAnswerInput.value.toUpperCase().replace(/[^A-Z]/g, "");
    const boxes = letterBoxesEl.querySelectorAll(".letter-box:not(.space)");
    const prev = gameContext.lastTypedLen;
    boxes.forEach((box, i) => {
      const ch = raw[i] || "";
      const had = box.classList.contains("filled");
      box.textContent = ch;
      if (ch && !had) {
        box.classList.add("filled", "letter-stagger");
        box.style.animationDelay = `${i * 0.07}s`;
        if (i >= prev) Sounds.play("pencil");
      } else if (!ch) box.classList.remove("filled", "letter-stagger");
    });
    gameContext.lastTypedLen = raw.length;
  }

  function onQuizHint() {
    if (!useHint()) { $("btn-quiz-hint").disabled = true; return; }
    const q = gameContext.current;
    const hints = q.hints || [];
    const idx = gameContext.hintsUsed;
    $("quiz-hint-clue").textContent += ( $("quiz-hint-clue").textContent ? " " : "") + "💡 " + (hints[idx] || "Combine the clues you already have.");
    $("quiz-hint-clue").classList.remove("hidden");
    gameContext.hintsUsed++;
    $("hints-left").textContent = getHintsRemaining();
    $("btn-quiz-hint").disabled = getHintsRemaining() <= 0;
    let pts = getQuizPoints(gameContext.difficultyId, gameContext.hintsUsed);
    if (gameContext.isDaily) pts = Math.round(pts * DAILY_MULTIPLIER);
    $("quiz-points-preview").textContent = `+${pts} pts`;
    Sounds.play("hint");
  }

  function onQuizSubmit(e) {
    e.preventDefault();
    if (gameContext.answered) return;
    const q = gameContext.current;
    const user = norm(quizAnswerInput.value);
    if (!user) { showFeedback(quizFeedback, "wrong", "type something…"); Sounds.play("wrong"); return; }
    gameContext.answered = true;
    quizAnswerInput.disabled = true;
    if (user === norm(q.answer)) {
      let pts = getQuizPoints(gameContext.difficultyId, gameContext.hintsUsed);
      if (gameContext.isDaily) pts = Math.round(pts * DAILY_MULTIPLIER);
      addPoints(pts);
      if (isLoggedIn()) recordWin("quiz", gameContext.categoryId, gameContext.difficultyId);
      if (gameContext.isDaily) completeDaily();
      showFeedback(quizFeedback, "correct", `✓ +${pts} pts`);
      Sounds.play("correct");
      updatePointsHeader();
      updateDailyUI();
    } else {
      showFeedback(quizFeedback, "wrong", `✗ ${q.answer}`);
      Sounds.play("wrong");
    }
    quizNext.classList.add("visible");
  }

  function nextQuiz() {
    if (gameContext.isDaily) { goHome(); return; }
    gameContext.current = getQuizQuestion(gameContext.categoryId, gameContext.difficultyId);
    gameContext.hintsUsed = 0;
    renderQuiz();
  }

  // --- Math ---
  function renderMath() {
    const q = gameContext.current;
    if (!q || q.problem == null) {
      gameContext.current = getMathQuestion(gameContext.categoryId, gameContext.difficultyId);
      return renderMath();
    }
    const diff = gameContext.difficultyId;
    $("math-badge-cat").textContent = gameContext.isDaily ? "☀ " + getCategoryName("math", gameContext.categoryId) : getCategoryName("math", gameContext.categoryId);
    $("math-badge-diff").textContent = getDifficultyLabel(diff);
    $("math-badge-diff").className = `badge sketch-pill diff-${diff}${diff === "extreme" ? " diff-extreme-rainbow" : ""}`;
    $("math-points-preview").textContent = `+${getMathPoints(diff, gameContext.categoryId, gameContext.isDaily)} pts`;
    mathProblem.textContent = q.problem;
    mathDrawing.innerHTML = q.drawing || "";
    $("math-notes").value = "";
    mathAnswerInput.value = "";
    mathAnswerInput.disabled = false;
    hideFeedback(mathFeedback);
    mathNext.classList.remove("visible");
    gameContext.answered = false;
    $("math-progress").textContent = gameContext.isDaily ? "daily math" : "new AI problem";
    mathAnswerInput.focus();
  }

  function onMathSubmit(e) {
    e.preventDefault();
    if (gameContext.answered) return;
    const q = gameContext.current;
    const raw = mathAnswerInput.value.trim();
    if (!raw) { showFeedback(mathFeedback, "wrong", "enter answer…"); Sounds.play("wrong"); return; }
    gameContext.answered = true;
    mathAnswerInput.disabled = true;
    if (checkMath(raw, q.answer)) {
      const pts = getMathPoints(gameContext.difficultyId, gameContext.categoryId, gameContext.isDaily);
      addPoints(pts);
      if (isLoggedIn()) recordWin("math", gameContext.categoryId, gameContext.difficultyId);
      if (gameContext.isDaily) completeDaily();
      showFeedback(mathFeedback, "correct", `✓ +${pts} pts`);
      Sounds.play("correct");
      updatePointsHeader();
      updateDailyUI();
    } else {
      showFeedback(mathFeedback, "wrong", `✗ ${q.answer}`);
      Sounds.play("wrong");
    }
    mathNext.classList.add("visible");
  }

  function checkMath(user, exp) {
    const u = parseFloat(user.replace(/,/g, ""));
    const e = parseFloat(String(exp).replace(/,/g, ""));
    if (!Number.isNaN(u) && !Number.isNaN(e)) return Math.abs(u - e) < 0.51;
    return norm(user) === norm(String(exp));
  }

  function nextMath() {
    if (gameContext.isDaily) { goHome(); return; }
    gameContext.current = getMathQuestion(gameContext.categoryId, gameContext.difficultyId);
    renderMath();
  }

  // --- Memory ---
  function startMemoryGame(difficultyId, preset) {
    gameContext.difficultyId = difficultyId;
    gameContext.categoryId = "memory";
    gameContext.current = preset || MemoryEngine.generate(difficultyId);
    gameContext.answered = false;
    memoryState = { phase: "show", user: {}, timer: null, tickId: null };
    $("memory-badge-diff").textContent = getDifficultyLabel(difficultyId);
    $("memory-badge-diff").className = `badge sketch-pill diff-${difficultyId}`;
    let pts = getMemoryPoints(difficultyId, gameContext.isDaily);
    $("memory-points-preview").textContent = `+${pts} pts`;
    $("memory-title").textContent = gameContext.current.title;
    $("memory-instruction").textContent = gameContext.current.instruction;
    memorySubmit.classList.add("hidden");
    memoryNext.classList.add("hidden");
    hideFeedback(memoryFeedback);
    renderMemoryPhase();
  }

  function renderMemoryPhase() {
    const g = gameContext.current;
    clearMemTimer();
    memoryStage.innerHTML = "";

    if (g.gameType === "grid") return memGrid(g);
    if (g.gameType === "sequence") return memSequence(g);
    if (g.gameType === "objects") return memObjects(g);
    return memDraw(g);
  }

  function memGrid(g) {
    const selected = new Set();
    if (memoryState.phase === "show") {
      memoryTimer.textContent = "memorize…";
      const grid = buildGrid(g.size, (idx, el) => {
        const hit = g.pattern.find((p) => p.idx === idx);
        if (hit) { el.style.background = hit.color; el.classList.add("lit"); }
      });
      memoryStage.appendChild(grid);
      memoryState.timer = setTimeout(() => {
        memoryState.phase = "input";
        memoryState.user.cells = [];
        renderMemoryPhase();
      }, g.showMs);
      return;
    }
    memoryTimer.textContent = "tap the squares you remember";
    const grid = buildGrid(g.size, (idx, el) => {
      el.addEventListener("click", () => {
        if (selected.has(idx)) { selected.delete(idx); el.style.background = ""; el.classList.remove("picked"); }
        else { selected.add(idx); el.style.background = "#e6c22988"; el.classList.add("picked"); }
        memoryState.user.cells = [...selected];
        Sounds.play("click");
      });
    });
    memoryStage.appendChild(grid);
    memorySubmit.classList.remove("hidden");
  }

  function buildGrid(size, each) {
    const wrap = document.createElement("div");
    wrap.className = "mem-grid";
    wrap.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "mem-cell sketch-box";
      cell.dataset.idx = i;
      each(i, cell);
      wrap.appendChild(cell);
    }
    return wrap;
  }

  function memSequence(g) {
    if (memoryState.phase === "show") {
      memoryTimer.textContent = "watch the sequence…";
      const box = document.createElement("p");
      box.className = "seq-display";
      memoryStage.appendChild(box);
      let i = 0;
      const flash = () => {
        if (i >= g.sequence.length) {
          memoryState.phase = "input";
          renderMemoryPhase();
          return;
        }
        box.textContent = g.sequence[i];
        Sounds.play("click");
        i++;
        memoryState.timer = setTimeout(flash, g.showMs);
      };
      flash();
      return;
    }
    memoryTimer.textContent = `type it back! ${(g.typeMs / 1000).toFixed(0)}s`;
    const inp = document.createElement("input");
    inp.className = "seq-input";
    inp.maxLength = g.sequence.length + 2;
    memoryStage.appendChild(inp);
    inp.focus();
    memoryState.user.input = inp;
    let left = g.typeMs;
    const tick = () => {
      memoryTimer.textContent = `time: ${(left / 1000).toFixed(1)}s`;
      left -= 100;
      if (left <= 0) { checkMemory(); return; }
      memoryState.timer = setTimeout(tick, 100);
    };
    tick();
    memorySubmit.classList.remove("hidden");
  }

  function memObjects(g) {
    if (memoryState.phase === "show") {
      memoryTimer.textContent = "memorize shape in each numbered slot…";
      const row = document.createElement("div");
      row.className = "obj-slots";
      g.shapes.forEach((s) => {
        const slot = document.createElement("div");
        slot.className = "obj-slot sketch-box filled-slot";
        slot.innerHTML = `<span class="slot-num">${s.slot + 1}</span>
          <svg viewBox="0 0 40 40" class="shape-icon">${MemoryEngine.SHAPE_SVGS[s.shape]}</svg>`;
        row.appendChild(slot);
      });
      memoryStage.appendChild(row);
      memoryState.timer = setTimeout(() => {
        memoryState.phase = "input";
        memoryState.user.assign = {};
        renderMemoryPhase();
      }, g.memMs);
      return;
    }
    memoryTimer.textContent = "tap shape → tap slot";
    const slotsWrap = document.createElement("div");
    slotsWrap.className = "obj-slots";
    const bank = document.createElement("div");
    bank.className = "obj-bank";
    let picked = null;
    let left = g.placeMs;
    memoryState.tickId = setInterval(() => {
      left -= 100;
      memoryTimer.textContent = `time: ${Math.max(0, left / 1000).toFixed(1)}s`;
      if (left <= 0) checkMemory();
    }, 100);

    for (let i = 0; i < g.slots; i++) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "obj-slot sketch-box empty-slot";
      slot.dataset.slot = i;
      slot.innerHTML = `<span class="slot-num">${i + 1}</span>`;
      slot.addEventListener("click", () => {
        if (picked == null) return;
        const piece = bank.querySelector(`[data-id="${picked}"]`);
        if (!piece || piece.disabled) return;
        memoryState.user.assign[picked] = i;
        slot.innerHTML = `<span class="slot-num">${i + 1}</span>${piece.innerHTML}`;
        slot.classList.add("filled-slot");
        piece.disabled = true;
        piece.classList.add("placed");
        picked = null;
        bank.querySelectorAll(".obj-piece").forEach((p) => p.classList.remove("picked-piece"));
        Sounds.play("click");
      });
      slotsWrap.appendChild(slot);
    }
    g.shuffled.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "obj-piece sketch-box";
      b.dataset.id = s.id;
      b.innerHTML = `<svg viewBox="0 0 40 40">${MemoryEngine.SHAPE_SVGS[s.shape]}</svg>`;
      b.addEventListener("click", () => {
        bank.querySelectorAll(".obj-piece").forEach((p) => p.classList.remove("picked-piece"));
        if (b.disabled) return;
        picked = s.id;
        b.classList.add("picked-piece");
        Sounds.play("click");
      });
      bank.appendChild(b);
    });
    memoryStage.appendChild(slotsWrap);
    memoryStage.appendChild(bank);
    memorySubmit.classList.remove("hidden");
  }

  function memDraw(g) {
    if (memoryState.phase === "show") {
      memoryTimer.textContent = "memorize the doodle…";
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 200 140");
      svg.classList.add("draw-preview");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", g.path);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#141414");
      path.setAttribute("stroke-width", "3");
      svg.appendChild(path);
      g.points.forEach((p, i) => {
        const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        c.setAttribute("cx", p.x);
        c.setAttribute("cy", p.y);
        c.setAttribute("r", 6);
        c.setAttribute("fill", "#d64541");
        svg.appendChild(c);
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", p.x + 8);
        t.setAttribute("y", p.y - 6);
        t.setAttribute("font-size", "11");
        t.setAttribute("font-family", "Patrick Hand, sans-serif");
        t.textContent = String(i + 1);
        svg.appendChild(t);
      });
      memoryStage.appendChild(svg);
      memoryState.timer = setTimeout(() => {
        memoryState.phase = "input";
        memoryState.user.clicks = [];
        renderMemoryPhase();
      }, g.showMs);
      return;
    }
    memoryTimer.textContent = `tap ${g.points.length} dots in order (1→${g.points.length})`;
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 140;
    canvas.className = "draw-canvas";
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "#141414";
    memoryState.user.clicks = [];
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 200;
      const y = ((e.clientY - r.top) / r.height) * 140;
      memoryState.user.clicks.push({ x, y });
      ctx.fillStyle = "#141414";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      if (memoryState.user.clicks.length > 1) {
        const prev = memoryState.user.clicks[memoryState.user.clicks.length - 2];
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      Sounds.play("pencil");
      if (memoryState.user.clicks.length >= g.points.length) setTimeout(checkMemory, 400);
    });
    memoryStage.appendChild(canvas);
    memorySubmit.classList.remove("hidden");
  }

  function checkMemory() {
    if (gameContext.answered) return;
    const g = gameContext.current;
    let ok = false;
    if (g.gameType === "grid") ok = g.check(memoryState.user.cells || []);
    else if (g.gameType === "sequence") ok = g.check((memoryState.user.input || {}).value || "");
    else if (g.gameType === "objects") {
      ok = g.check(memoryState.user.assign || {});
    } else ok = g.check(memoryState.user.clicks || []);

    clearMemTimer();
    gameContext.answered = true;
    memorySubmit.classList.add("hidden");
    if (ok) {
      const pts = getMemoryPoints(gameContext.difficultyId, gameContext.isDaily);
      addPoints(pts);
      if (isLoggedIn()) recordWin("memory", "memory", gameContext.difficultyId);
      if (gameContext.isDaily) completeDaily();
      showFeedback(memoryFeedback, "correct", `✓ memory sharp! +${pts} pts`);
      Sounds.play("correct");
      updatePointsHeader();
      updateDailyUI();
    } else {
      showFeedback(memoryFeedback, "wrong", "✗ not quite — try the next one!");
      Sounds.play("wrong");
    }
    memoryNext.classList.remove("hidden");
  }

  function nextMemory() {
    if (gameContext.isDaily) { goHome(); return; }
    startMemoryGame(gameContext.difficultyId);
  }

  function clearMemTimer() {
    if (memoryState.timer) clearTimeout(memoryState.timer);
    if (memoryState.tickId) clearInterval(memoryState.tickId);
    memoryState.timer = null;
    memoryState.tickId = null;
  }

  // --- Settings ---
  function initSettings() {
    const s = Settings.get();
    $("set-volume").value = s.volume;
    $("set-volume-val").textContent = s.volume;
    $("set-theme").value = s.theme;
    $("set-custom-color").value = s.customColor;
    $("set-leaderboard").checked = s.showOnLeaderboard;
    $("custom-color-row").classList.toggle("hidden", s.theme !== "custom");

    $("set-volume").addEventListener("input", () => {
      const v = +$("set-volume").value;
      $("set-volume-val").textContent = v;
      Settings.set({ volume: v });
    });
    $("set-theme").addEventListener("change", () => {
      const t = $("set-theme").value;
      Settings.set({ theme: t });
      $("custom-color-row").classList.toggle("hidden", t !== "custom");
    });
    $("set-custom-color").addEventListener("input", () => {
      Settings.set({ customColor: $("set-custom-color").value, theme: "custom" });
      $("set-theme").value = "custom";
    });
    $("set-leaderboard").addEventListener("change", () => {
      Settings.set({ showOnLeaderboard: $("set-leaderboard").checked });
      if (isLoggedIn()) setShowOnLeaderboard($("set-leaderboard").checked);
    });
  }

  function loadSettingsUI() {
    const s = Settings.get();
    $("set-volume").value = s.volume;
    $("set-volume-val").textContent = s.volume;
    $("set-theme").value = s.theme;
    $("set-custom-color").value = s.customColor;
    $("set-leaderboard").checked = isLoggedIn() ? getShowOnLeaderboard() : s.showOnLeaderboard;
    $("custom-color-row").classList.toggle("hidden", s.theme !== "custom");
  }

  function buildMathSymbols() {
    const grid = $("symbols-grid");
    if (!grid) return;
    grid.innerHTML = MATH_SYMBOLS.map((s) =>
      `<button type="button" class="sym-btn" data-char="${s.char}">${s.char}</button>`).join("");
    grid.querySelectorAll(".sym-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        insertAt(mathAnswerInput, btn.dataset.char);
        Sounds.play("pencil");
      });
    });
  }

  function insertAt(input, text) {
    const s = input.selectionStart ?? input.value.length;
    const e = input.selectionEnd ?? s;
    input.value = input.value.slice(0, s) + text + input.value.slice(e);
    input.selectionStart = input.selectionEnd = s + text.length;
    input.focus();
  }

  function renderLeaderboard() {
    const el = $("leaderboard-content");
    if (leaderboardTab === "points") {
      const rows = getPointsLeaderboard();
      if (!rows.length) { el.innerHTML = `<p class="lb-empty">no scores yet</p>`; return; }
      el.innerHTML = `<table class="lb-table"><tr><th>#</th><th>player</th><th>pts</th></tr>
        ${rows.slice(0, 20).map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td><b>${r.points}</b></td></tr>`).join("")}
        </table>`;
      return;
    }
    const rows = getLeaderboard(leaderboardTab);
    if (!rows.length) { el.innerHTML = `<p class="lb-empty">no wins yet</p>`; return; }
    el.innerHTML = `<table class="lb-table"><tr><th>#</th><th>player</th><th>wins</th><th>pts</th></tr>
      ${rows.slice(0, 15).map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${r.total}</td><td>${r.points}</td></tr>`).join("")}
      </table>`;
  }

  function norm(s) { return String(s).trim().toUpperCase().replace(/[^A-Z0-9]/g, ""); }
  function esc(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
  function showFeedback(el, k, m) {
    el.textContent = m;
    el.classList.remove("hidden", "correct", "wrong");
    el.classList.add(k);
  }
  function hideFeedback(el) { el.classList.add("hidden"); el.classList.remove("correct", "wrong"); }

  init();
})();
