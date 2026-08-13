/* ============================================================
   home.js — Portada con aves posadas sobre la ilustración
   - Posa las aves en "posaderos" coherentes (roca, quisco,
     puya, suelo) definidos como % de la escena.
   - Cada cierto tiempo aleatorio, un ave vuela a otro posadero
     libre (con aleteo y volteo según la dirección).
   - Hover: muestra el nombre y reproduce el canto.
   - Transición: al ir a otra pestaña, la cámara "sube al cielo".
   ============================================================ */
(async function () {
  const hero = document.getElementById("hero");
  const layer = document.getElementById("ledge");
  const nameEl = document.getElementById("hoverName");
  const chirp = document.getElementById("chirp");

  /* Posaderos: coordenadas (% del ancho, % del alto) donde el
     ave apoya las patas. Ajustados a superficies de la ilustración. */
  const PERCHES = [
    { x: 33.5, y: 47 },  // punta del quisco alto (izq)
    { x: 19,   y: 55 },  // roca bajo los quiscos (izq)
    { x: 49,   y: 43 },  // cima del roquerío central
    { x: 61,   y: 55 },  // repisa de roca (centro-der)
    { x: 41,   y: 74 },  // roca pálida grande (centro-bajo)
    { x: 62,   y: 60 },  // sobre la puya
    { x: 51,   y: 78 },  // cactus barril (centro)
    { x: 14,   y: 72 },  // arbustos/roca izquierda
    { x: 86,   y: 84 },  // roquerío derecha
    { x: 46,   y: 90 },  // sendero/suelo central
    { x: 73,   y: 72 },  // matorral centro-derecha
    { x: 34,   y: 84 },  // suelo izquierda-baja
    { x: 65,   y: 53 },  // roca (der del centro)
  ];

  const occupied = new Set();      // índices de posaderos ocupados
  const birdsData = await PuenteAves.getAllBirds();
  layer.innerHTML = "";
  if (!birdsData.length) return;

  // Altura de cada ave según el alto de la escena.
  function birdPx() {
    // En móvil la escena es más baja: hacemos las aves algo más grandes
    // (más fáciles de tocar) que en escritorio.
    const factor = window.innerWidth < 640 ? 0.16 : 0.11;
    return Math.max(28, Math.round(hero.clientHeight * factor));
  }

  const flock = [];

  // Coloca cada ave en un posadero inicial distinto.
  const startPerches = shuffle([...PERCHES.keys()]);
  birdsData.forEach((bird, i) => {
    const perchIndex = startPerches[i % PERCHES.length];
    occupied.add(perchIndex);

    const el = document.createElement("div");
    el.className = "perch-bird idle";
    el.style.height = birdPx() + "px";
    el.style.left = PERCHES[perchIndex].x + "%";
    el.style.top = PERCHES[perchIndex].y + "%";
    el.innerHTML = `<img src="${bird.standingURL}" alt="${bird.name}" />`;
    const img = el.querySelector("img");

    el.style.animationDelay = (Math.random() * 3) + "s";

    const state = { bird, el, img, perchIndex, paused: false, timer: null };

    // Abre las alas (cambia al PNG "abierto") si el ave no está en pleno vuelo.
    function openWings() {
      if (state.el.classList.contains("flying")) return;
      state.el.classList.remove("idle");
      state.img.src = bird.openURL || bird.standingURL;
    }
    // Cierra las alas (vuelve al PNG "parado").
    function closeWings() {
      if (state.el.classList.contains("flying")) return;
      state.img.src = bird.standingURL;
      state.el.classList.add("idle");
    }

    el.addEventListener("mouseenter", () => {
      state.paused = true;
      nameEl.textContent = bird.name;
      nameEl.classList.add("show");
      el.style.zIndex = 10;
      openWings();
      if (bird.audioURL) { chirp.src = bird.audioURL; chirp.currentTime = 0; chirp.play().catch(() => {}); }
    });
    el.addEventListener("mouseleave", () => {
      state.paused = false;
      nameEl.classList.remove("show");
      el.style.zIndex = "";
      closeWings();
      chirp.pause();  // corta el canto al salir (los clips reales duran varios segundos)
    });
    // En móvil: tocar abre las alas, nombra y reproduce.
    el.addEventListener("click", () => {
      nameEl.textContent = bird.name;
      nameEl.classList.add("show");
      el.style.zIndex = 10;
      openWings();
      if (bird.audioURL) { chirp.src = bird.audioURL; chirp.play().catch(() => {}); }
      setTimeout(() => {
        nameEl.classList.remove("show");
        el.style.zIndex = "";
        closeWings();
      }, 1600);
    });

    layer.appendChild(el);
    flock.push(state);
    scheduleHop(state);
  });

  // Reajusta el tamaño de las aves si cambia el tamaño de la ventana.
  window.addEventListener("resize", () => {
    const h = birdPx() + "px";
    flock.forEach((s) => (s.el.style.height = h));
  });

  function scheduleHop(state) {
    const delay = 15000 + Math.random() * 20000; // 15–35 s (movimiento calmado)
    state.timer = setTimeout(() => hop(state), delay);
  }

  function hop(state) {
    if (state.paused) { scheduleHop(state); return; }

    // elige un posadero libre
    const free = [...PERCHES.keys()].filter((i) => !occupied.has(i));
    if (!free.length) { scheduleHop(state); return; }
    const target = free[Math.floor(Math.random() * free.length)];

    const from = PERCHES[state.perchIndex];
    const to = PERCHES[target];

    // libera el actual, ocupa el destino
    occupied.delete(state.perchIndex);
    occupied.add(target);
    state.perchIndex = target;

    // mira hacia donde va (las ilustraciones miran a la derecha)
    if (to.x < from.x) state.el.classList.add("face-left");
    else state.el.classList.remove("face-left");

    // despega: alas abiertas
    state.el.classList.remove("idle");
    state.el.classList.add("flying");
    state.el.style.zIndex = 6;
    if (state.bird.openURL) state.img.src = state.bird.openURL;

    // mueve (la transición CSS anima left/top)
    requestAnimationFrame(() => {
      state.el.style.left = to.x + "%";
      state.el.style.top = to.y + "%";
    });

    // aterriza: alas cerradas
    setTimeout(() => {
      state.img.src = state.bird.standingURL;
      state.el.classList.remove("flying");
      state.el.classList.add("idle");
      state.el.style.zIndex = "";
      scheduleHop(state);
    }, 1100);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- Transición: cámara sube al cielo ---------- */
  // Si venimos de otra página, entra la escena desde abajo.
  if (sessionStorage.getItem("fromApp")) {
    hero.classList.add("enter");
    sessionStorage.removeItem("fromApp");
  }
  document.querySelectorAll("a.nav-go").forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      e.preventDefault();
      document.body.classList.add("leaving");
      sessionStorage.setItem("fromApp", "1");
      setTimeout(() => (window.location.href = href), 560);
    });
  });
})();
