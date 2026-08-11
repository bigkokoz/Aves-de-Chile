/* ============================================================
   admin.js — panel de carga de aves
   Maneja drag & drop, vista previa y guardado en IndexedDB.
   ============================================================ */
(function () {
  "use strict";

  // Archivos seleccionados para el ave en edición
  const files = { photo: null, standing: null, open: null, audio: null };

  const toast = document.getElementById("toast");
  const formMsg = document.getElementById("formMsg");
  const prev = document.getElementById("prev");

  /* ---------- Zonas de arrastrar/soltar ---------- */
  document.querySelectorAll(".drop").forEach((drop) => {
    const target = drop.dataset.target;
    const input = drop.querySelector('input[type="file"]');
    const preview = drop.querySelector(".preview");

    drop.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      if (input.files[0]) setFile(target, input.files[0], preview);
    });

    ["dragenter", "dragover"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("hover"); })
    );
    ["dragleave", "drop"].forEach((ev) =>
      drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("hover"); })
    );
    drop.addEventListener("drop", (e) => {
      const f = e.dataTransfer.files[0];
      if (f) setFile(target, f, preview);
    });
  });

  function setFile(target, file, preview) {
    files[target] = file;
    const url = URL.createObjectURL(file);
    if (target === "audio") {
      preview.innerHTML = `<audio controls src="${url}" style="max-width:100%; margin-top:8px"></audio>
                           <div><small>${file.name}</small></div>`;
    } else {
      preview.innerHTML = `<img class="preview-thumb" src="${url}" alt="preview" />
                           <div><small>${file.name}</small></div>`;
    }
  }

  /* ---------- Guardar ave ---------- */
  document.getElementById("saveBtn").addEventListener("click", async () => {
    const name = document.getElementById("name").value.trim();
    const hint = document.getElementById("hint").value.trim();

    const missing = [];
    if (!name) missing.push("nombre");
    if (!files.photo) missing.push("foto");
    if (!files.standing) missing.push("PNG parado");
    if (!files.open) missing.push("PNG alas abiertas");
    if (!files.audio) missing.push("audio");

    if (missing.length) {
      formMsg.style.color = "var(--bad)";
      formMsg.textContent = "Falta: " + missing.join(", ") + ".";
      return;
    }

    try {
      await PuenteAves.saveBird({
        name, hint,
        photo: files.photo,
        standing: files.standing,
        open: files.open,
        audio: files.audio,
      });
      showToast("✅ Ave “" + name + "” guardada");
      resetForm();
      renderList();
    } catch (err) {
      formMsg.style.color = "var(--bad)";
      formMsg.textContent = "Error al guardar: " + err.message;
    }
  });

  document.getElementById("clearFormBtn").addEventListener("click", resetForm);

  function resetForm() {
    document.getElementById("name").value = "";
    document.getElementById("hint").value = "";
    formMsg.textContent = "";
    files.photo = files.standing = files.open = files.audio = null;
    document.querySelectorAll(".drop .preview").forEach((p) => (p.innerHTML = ""));
    document.querySelectorAll('.drop input[type="file"]').forEach((i) => (i.value = ""));
  }

  /* ---------- Borrar todas las cargadas ---------- */
  document.getElementById("wipeBtn").addEventListener("click", async () => {
    if (!confirm("¿Borrar TODAS las aves que cargaste? (Las de ejemplo se mantienen.)")) return;
    await PuenteAves.clearAll();
    showToast("🗑️ Aves cargadas eliminadas");
    renderList();
  });

  /* ---------- Lista ---------- */
  async function renderList() {
    const list = document.getElementById("list");
    const birds = await PuenteAves.getAllBirds();
    document.getElementById("count").textContent = birds.length + " aves";
    list.innerHTML = "";

    birds.forEach((bird) => {
      const item = document.createElement("div");
      item.className = "admin-item";
      item.innerHTML = `
        <img src="${bird.photoURL || bird.standingURL}" alt="${bird.name}" />
        <span class="name">${bird.name}</span>
        <span class="badge ${bird.editable ? "" : "seed"}">${bird.editable ? "cargada" : "del repo"}</span>
        ${bird.hasRealAudio === false && !bird.editable ? '<span class="badge">♪ audio temporal</span>' : ""}
        <button class="btn ghost play">▶</button>
        ${bird.editable ? '<button class="btn secondary del">Eliminar</button>' : ""}
      `;
      item.querySelector(".play").addEventListener("click", () => {
        if (bird.audioURL) { prev.src = bird.audioURL; prev.play().catch(() => {}); }
      });
      const del = item.querySelector(".del");
      if (del) {
        del.addEventListener("click", async () => {
          if (!confirm("¿Eliminar “" + bird.name + "”?")) return;
          await PuenteAves.deleteBird(bird.id);
          showToast("Eliminada");
          renderList();
        });
      }
      list.appendChild(item);
    });
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  renderList();
})();
