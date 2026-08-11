/* ============================================================
   storage.js  —  Capa de datos de "Aves de Chile"
   ------------------------------------------------------------
   - Guarda las aves subidas desde el panel Admin en IndexedDB
     (fotos, PNG parado, PNG alas abiertas y audio como Blobs).
   - Incluye aves de ejemplo ("semilla") con placeholders
     generados al vuelo (silueta SVG + tono WAV) para que la
     plataforma se vea viva incluso sin archivos reales.
   - Expone un objeto global `PuenteAves` con funciones async.
   ============================================================ */

(function () {
  "use strict";

  const DB_NAME = "puenteAvesDB";
  const DB_VERSION = 1;
  const STORE = "birds";

  /* ---------- IndexedDB ---------- */

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode) {
    return openDB().then((db) => {
      const t = db.transaction(store, mode);
      return { store: t.objectStore(store), done: txDone(t) };
    });
  }

  function txDone(t) {
    return new Promise((resolve, reject) => {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  async function addStoredBird(record) {
    const { store, done } = await tx(STORE, "readwrite");
    store.put(record);
    await done;
    return record.id;
  }

  async function getStoredBirds() {
    const { store } = await tx(STORE, "readonly");
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteStoredBird(id) {
    const { store, done } = await tx(STORE, "readwrite");
    store.delete(id);
    await done;
  }

  async function clearStoredBirds() {
    const { store, done } = await tx(STORE, "readwrite");
    store.clear();
    await done;
  }

  /* ---------- Generadores de placeholders (para semillas) ---------- */

  // Silueta de ave en SVG. mode = "standing" | "open"
  function silhouetteSVG(color, mode) {
    const wings =
      mode === "open"
        ? // alas extendidas
          `<path d="M100 95 C60 40 20 55 8 92 C40 78 70 84 100 100 Z" fill="${color}"/>
           <path d="M100 95 C140 40 180 55 192 92 C160 78 130 84 100 100 Z" fill="${color}"/>`
        : // alas plegadas
          `<path d="M100 96 C80 80 70 110 92 128 C104 116 108 106 104 98 Z" fill="${shade(color,-18)}"/>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <ellipse cx="100" cy="118" rx="34" ry="42" fill="${color}"/>
        <circle cx="100" cy="72" r="24" fill="${shade(color,12)}"/>
        <path d="M100 70 l26 8 l-26 8 Z" fill="#f4a63b"/>
        <circle cx="108" cy="66" r="4" fill="#20232a"/>
        ${wings}
        <path d="M96 158 l-6 22 M108 158 l8 20" stroke="#f4a63b" stroke-width="5" stroke-linecap="round"/>
      </svg>`
    )}`;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.replace("#", ""), 16);
    let r = (n >> 16) + amt,
      g = ((n >> 8) & 0xff) + amt,
      b = (n & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  // Genera un canto placeholder: pequeña melodía con `freq` como base.
  function toneWavDataURI(freq) {
    const sampleRate = 8000;
    const duration = 1.1; // segundos
    const total = Math.floor(sampleRate * duration);
    const notes = [freq, freq * 1.25, freq * 1.5, freq * 1.18];
    const buffer = new Int16Array(total);
    for (let i = 0; i < total; i++) {
      const t = i / sampleRate;
      const noteIdx = Math.min(notes.length - 1, Math.floor(t / (duration / notes.length)));
      const f = notes[noteIdx];
      // envolvente para que suene "gorjeo"
      const env = Math.sin((Math.PI * (t % (duration / notes.length))) / (duration / notes.length));
      const trill = 1 + 0.06 * Math.sin(2 * Math.PI * 18 * t);
      buffer[i] = Math.round(Math.sin(2 * Math.PI * f * trill * t) * env * 9000);
    }
    return encodeWav(buffer, sampleRate);
  }

  function encodeWav(samples, sampleRate) {
    const bytesPerSample = 2;
    const blockAlign = bytesPerSample;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    const w = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    w(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    w(8, "WAVE");
    w(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    w(36, "data");
    view.setUint32(40, dataSize, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++, off += 2) view.setInt16(off, samples[i], true);
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return "data:audio/wav;base64," + btoa(binary);
  }

  /* ---------- Aves de ejemplo (semilla) ---------- */
  // Puedes borrarlas cuando cargues las tuyas desde el Admin.
  const SEED = [
    { id: "seed-chincol",   name: "Chincol",   color: "#8a6d3b", freq: 620,
      hint: "Tiene un pequeño copete y un collar rufo en el cuello." },
    { id: "seed-zorzal",    name: "Zorzal",    color: "#5c4033", freq: 500,
      hint: "Pecho anaranjado y pico amarillo; muy común en jardines." },
    { id: "seed-diucon",    name: "Diucón",    color: "#8f9aa6", freq: 720,
      hint: "Gris con ojo rojo; se posa erguido en lo alto de arbustos." },
    { id: "seed-queltehue", name: "Queltehue", color: "#3c4b57", freq: 430,
      hint: "Blanco y negro con espolones; grita fuerte cuando te acercas." },
  ];

  function seedToBird(s) {
    return {
      id: s.id,
      name: s.name,
      hint: s.hint,
      photoURL: silhouetteSVG(s.color, "standing"),
      standingURL: silhouetteSVG(s.color, "standing"),
      openURL: silhouetteSVG(shade(s.color, 20), "open"),
      audioURL: toneWavDataURI(s.freq),
      editable: false,
    };
  }

  /* ---------- API pública ---------- */

  // Convierte un registro de IndexedDB (con Blobs) a URLs usables.
  function storedToBird(rec) {
    return {
      id: rec.id,
      name: rec.name,
      hint: rec.hint || "",
      photoURL: rec.photo ? URL.createObjectURL(rec.photo) : "",
      standingURL: rec.standing ? URL.createObjectURL(rec.standing) : "",
      openURL: rec.open ? URL.createObjectURL(rec.open) : "",
      audioURL: rec.audio ? URL.createObjectURL(rec.audio) : "",
      editable: true,
    };
  }

  async function getAllBirds() {
    const stored = await getStoredBirds();
    const storedBirds = stored
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map(storedToBird);
    const seeds = SEED.map(seedToBird);
    // Las aves cargadas por el usuario van primero.
    return [...storedBirds, ...seeds];
  }

  async function saveBird({ id, name, hint, photo, standing, open, audio }) {
    const record = {
      id: id || "u-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      hint: (hint || "").trim(),
      photo, standing, open, audio,
      createdAt: Date.now(),
    };
    await addStoredBird(record);
    return record.id;
  }

  window.PuenteAves = {
    getAllBirds,
    saveBird,
    deleteBird: deleteStoredBird,
    clearAll: clearStoredBirds,
    _seedCount: SEED.length,
  };
})();
