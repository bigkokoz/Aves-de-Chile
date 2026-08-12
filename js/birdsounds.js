/* ============================================================
   birdsounds.js — ejemplos sintetizados de tipos de canto
   (trino, gorjeo, silbido, gorgorito) con Web Audio API.
   Sirven como referencia didáctica mientras no haya audios reales.
   ============================================================ */
window.BirdSounds = (function () {
  let ctx;
  function ac() {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function envelope(gain, t0, dur) {
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.22, t0 + 0.03);
    gain.gain.setValueAtTime(0.22, t0 + dur - 0.1);
    gain.gain.linearRampToValueAtTime(0, t0 + dur);
  }

  function play(type) {
    const c = ac();
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(c.destination);

    if (type === "silbido") {
      // Sonido claro y sostenido, con leve glissando.
      const d = 0.95;
      osc.frequency.setValueAtTime(1700, t);
      osc.frequency.linearRampToValueAtTime(2250, t + 0.45);
      osc.frequency.linearRampToValueAtTime(1950, t + 0.95);
      envelope(gain, t, d);
      osc.start(t); osc.stop(t + d);

    } else if (type === "trino") {
      // Nota que se repite muy rápido y vibrante.
      const d = 1.1;
      let f = t;
      for (let i = 0; i < 24; i++) {
        osc.frequency.setValueAtTime(i % 2 ? 2500 : 2900, f);
        f += 0.045;
      }
      envelope(gain, t, d);
      osc.start(t); osc.stop(t + d);

    } else if (type === "gorjeo") {
      // Sucesión melódica de notas que suben y bajan.
      const d = 1.35;
      const notes = [1600, 2600, 1900, 3050, 2200, 2750, 1850, 2400];
      notes.forEach((p, i) => osc.frequency.setValueAtTime(p, t + i * (d / notes.length)));
      envelope(gain, t, d);
      osc.start(t); osc.stop(t + d);

    } else if (type === "gorgorito") {
      // Sonido burbujeante y rodado (modulación rápida sobre nota grave).
      const d = 1.0;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(760, t);
      const lfo = c.createOscillator();
      const lfoGain = c.createGain();
      lfo.frequency.value = 15;
      lfoGain.gain.value = 190;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      envelope(gain, t, d);
      lfo.start(t); lfo.stop(t + d);
      osc.start(t); osc.stop(t + d);
    }
  }

  return { play };
})();
