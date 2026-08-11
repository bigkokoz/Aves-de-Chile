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

  /* ---------- Generador de audio temporal ---------- */

  // Genera un canto placeholder: pequeña melodía con `freq` como base.
  // Se usa solo mientras un ave no tenga su mp3 real.
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

  /* ---------- Aves del repositorio (assets/) ---------- */
  // Definidas en js/birds.js -> window.REPO_BIRDS
  function repoToBird(b) {
    return {
      id: b.id,
      name: b.name,
      hint: b.hint || "",
      photoURL: b.standing,
      standingURL: b.standing,
      openURL: b.open || b.standing,
      // Si aún no hay audio real, usamos un tono temporal para que los
      // modos con sonido funcionen. Reemplázalo poniendo el mp3 en assets/sounds/.
      audioURL: b.audio || toneWavDataURI(b.tone || 500),
      hasRealAudio: !!b.audio,
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
    const repo = (window.REPO_BIRDS || []).map(repoToBird);
    // Las aves cargadas por el usuario van primero.
    return [...storedBirds, ...repo];
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
  };
})();
