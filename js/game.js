/* ============================================================
   game.js — lógica del juego "Aves de Chile"
   Modos: listen (🔊), see (👁️), name (📖)
   Puntaje: % de acierto = respuestas correctas / intentos totales
   Meta: 100% (calificación perfecta = no fallar ninguna).
   ============================================================ */
(function () {
  "use strict";

  const audio = document.getElementById("gameAudio");
  const state = {
    birds: [],
    mode: null,
    queue: [],        // aves barajadas para esta partida
    index: 0,         // ave actual dentro de la queue
    current: null,
    wrongStreak: 0,   // fallos seguidos en el ave actual
    correct: 0,       // respuestas correctas
    attempts: 0,      // intentos totales (clics de respuesta)
    completed: 0,     // aves resueltas
    solved: false,    // ave actual ya resuelta
  };

  const MODE_NAMES = { listen: "🔊 Escuchar", see: "👁️ Ver", name: "📖 Por nombre" };

  /* ---------- Navegación de pestañas ---------- */
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    how: document.getElementById("panel-how"),
    mode: document.getElementById("panel-mode"),
    play: document.getElementById("panel-play"),
  };
  function showTab(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  }
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      if (t.dataset.tab === "play" && !state.mode) { showTab("mode"); flashModeHint(); return; }
      showTab(t.dataset.tab);
    })
  );
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showTab(b.dataset.goto))
  );

  /* ---------- Selección de modo ---------- */
  const modeCards = document.querySelectorAll(".mode-card");
  const startBtn = document.getElementById("startBtn");
  const modeHint = document.getElementById("modeHint");
  const modeLabel = document.getElementById("modeLabel");

  modeCards.forEach((card) =>
    card.addEventListener("click", () => {
      modeCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      state.mode = card.dataset.mode;
      startBtn.disabled = false;
      modeHint.textContent = "Modo elegido: " + MODE_NAMES[state.mode];
      modeLabel.textContent = "Modo: " + MODE_NAMES[state.mode];
    })
  );
  function flashModeHint() {
    modeHint.style.color = "var(--bad)";
    modeHint.textContent = "Primero elige un modo 👇";
    setTimeout(() => (modeHint.style.color = ""), 1500);
  }

  startBtn.addEventListener("click", startGame);

  /* ---------- Arranque de partida ---------- */
  function startGame() {
    if (!state.mode) return;
    state.queue = shuffle([...state.birds]);
    state.index = 0;
    state.correct = 0;
    state.attempts = 0;
    state.completed = 0;
    showTab("play");
    nextBird();
    updateScore();
  }

  function nextBird() {
    state.wrongStreak = 0;
    state.solved = false;
    document.getElementById("hintBox").classList.add("hidden");
    document.getElementById("feedback").textContent = "";
    document.getElementById("nextRow").innerHTML = "";

    if (state.index >= state.queue.length) return finishGame();
    state.current = state.queue[state.index];

    document.getElementById("roundText").textContent =
      "Ave " + (state.index + 1) + " / " + state.queue.length;

    renderPrompt();
    renderOptions();
  }

  /* ---------- Render del enunciado ---------- */
  function renderPrompt() {
    const prompt = document.getElementById("prompt");
    const b = state.current;
    if (state.mode === "listen") {
      prompt.innerHTML = `
        <p class="muted">¿De qué ave es este canto?</p>
        <button class="btn sun big" id="replay">🔊 Reproducir canto</button>`;
      playAudio(b.audioURL);
      document.getElementById("replay").addEventListener("click", () => playAudio(b.audioURL));
    } else if (state.mode === "see") {
      prompt.innerHTML = `
        <p class="muted">¿Cómo se llama esta ave?</p>
        <img src="${b.photoURL || b.standingURL}" alt="ave"
             style="max-height:200px; background:#eef6f0; border-radius:14px; padding:8px" />`;
    } else { // name
      prompt.innerHTML = `
        <p class="muted">¿Cuál de estas fotos es…?</p>
        <h1 style="margin:6px 0">${b.name}</h1>`;
    }
  }

  /* ---------- Render de opciones ---------- */
  function renderOptions() {
    const cont = document.getElementById("options");
    cont.innerHTML = "";
    const opts = buildOptions();

    opts.forEach((bird) => {
      const el = document.createElement("div");
      el.className = "option";
      if (state.mode === "see") {
        el.textContent = bird.name; // opciones = nombres
      } else {
        el.innerHTML = `<img src="${bird.photoURL || bird.standingURL}" alt="${bird.name}" />
                        <div>${bird.name}</div>`;
      }
      el.addEventListener("click", () => answer(bird, el));
      cont.appendChild(el);
    });
  }

  function buildOptions() {
    const correct = state.current;
    const others = shuffle(state.birds.filter((b) => b.id !== correct.id)).slice(0, 3);
    return shuffle([correct, ...others]);
  }

  /* ---------- Responder ---------- */
  function answer(bird, el) {
    if (state.solved) return;
    state.attempts++;
    const feedback = document.getElementById("feedback");

    if (bird.id === state.current.id) {
      // ¡Acierto!
      state.correct++;
      state.completed++;
      state.solved = true;
      el.classList.add("correct");
      feedback.textContent = "✅ ¡Muy bien! Es " + state.current.name + ".";
      feedback.className = "feedback center ok";
      disableOptions();
      updateScore();
      showNextButton();
    } else {
      // Fallo
      el.classList.add("wrong");
      el.style.pointerEvents = "none";
      state.wrongStreak++;
      feedback.textContent = "❌ No es esa. Intenta de nuevo.";
      feedback.className = "feedback center bad";
      if (state.wrongStreak >= 2) showHint();
    }
  }

  function disableOptions() {
    document.querySelectorAll("#options .option").forEach((o) => (o.style.pointerEvents = "none"));
    // marca la correcta si el usuario había fallado
    document.querySelectorAll("#options .option").forEach((o) => {
      const label = o.textContent.trim();
      if (label.includes(state.current.name)) o.classList.add("correct");
    });
  }

  function showHint() {
    const box = document.getElementById("hintBox");
    const tip = state.current.hint ? state.current.hint : "Vuelve a la sección Aprender para reconocer esta ave.";
    box.innerHTML = "💡 <b>Pista:</b> " + tip;
    box.classList.remove("hidden");
  }

  function showNextButton() {
    const row = document.getElementById("nextRow");
    const last = state.index >= state.queue.length - 1;
    row.innerHTML = `<button class="btn big" id="nextBtn">${last ? "🏁 Ver resultado" : "Siguiente ave →"}</button>`;
    document.getElementById("nextBtn").addEventListener("click", () => {
      state.index++;
      nextBird();
    });
  }

  /* ---------- Puntaje ---------- */
  function updateScore() {
    const pct = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
    document.getElementById("scoreText").textContent = "Acierto: " + pct + "%";
    const prog = state.queue.length ? (state.completed / state.queue.length) * 100 : 0;
    document.getElementById("progressBar").style.width = prog + "%";
  }

  function finishGame() {
    const pct = state.attempts ? Math.round((state.correct / state.attempts) * 100) : 0;
    const perfect = pct === 100;
    document.getElementById("prompt").innerHTML = `
      <h1>${perfect ? "🏆 ¡Calificación perfecta!" : "🏁 Fin de la partida"}</h1>
      <p style="font-size:2.4rem; font-weight:800; margin:8px 0">${pct}%</p>
      <p class="muted">${perfect
        ? "¡Reconociste todas las aves sin fallar! Te las sabes 🐦"
        : "Acertaste " + state.correct + " de " + state.attempts + " intentos. ¡Sigue practicando para llegar al 100%!"}</p>`;
    document.getElementById("options").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    document.getElementById("hintBox").classList.add("hidden");
    document.getElementById("roundText").textContent = "Completado";
    document.getElementById("progressBar").style.width = "100%";
    document.getElementById("nextRow").innerHTML =
      `<button class="btn big" id="againBtn">🔄 Jugar otra vez</button>
       <a class="btn secondary big" href="index.html">🏠 Menú principal</a>`;
    document.getElementById("againBtn").addEventListener("click", startGame);
  }

  /* ---------- Pausa ---------- */
  const overlay = document.getElementById("pauseOverlay");
  document.getElementById("pauseBtn").addEventListener("click", () => overlay.classList.add("show"));
  document.getElementById("resumeBtn").addEventListener("click", () => overlay.classList.remove("show"));
  document.getElementById("restartBtn").addEventListener("click", () => {
    overlay.classList.remove("show");
    if (state.mode) startGame(); else showTab("mode");
  });
  document.getElementById("menuBtn").addEventListener("click", () => (window.location.href = "index.html"));

  /* ---------- Utilidades ---------- */
  function playAudio(src) {
    if (!src) return;
    audio.src = src;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Init ---------- */
  (async function init() {
    state.birds = await PuenteAves.getAllBirds();
    if (state.birds.length < 2) {
      panels.mode.innerHTML =
        '<h1>Faltan aves 🐣</h1><p class="muted">Necesitas al menos 2 aves para jugar. ' +
        'Ve a <a href="admin.html">Admin</a> para cargar más.</p>';
      startBtn && (startBtn.disabled = true);
    }
  })();
})();
