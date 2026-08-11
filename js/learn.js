/* learn.js — galería de estudio */
(async function () {
  const grid = document.getElementById("grid");
  const count = document.getElementById("count");
  const player = document.getElementById("player");

  const birds = await PuenteAves.getAllBirds();
  count.textContent = birds.length + " aves";
  grid.innerHTML = "";

  if (!birds.length) {
    grid.innerHTML = '<p class="muted">No hay aves cargadas todavía. Ve a <a href="admin.html">Admin</a>.</p>';
    return;
  }

  birds.forEach((bird) => {
    const card = document.createElement("div");
    card.className = "bird-card";
    card.innerHTML = `
      <img src="${bird.photoURL || bird.standingURL}" alt="${bird.name}" />
      <h3>${bird.name}</h3>
      <button class="btn sun" ${bird.audioURL ? "" : "disabled"}>▶ Escuchar</button>
    `;
    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
      if (!bird.audioURL) return;
      player.src = bird.audioURL;
      player.currentTime = 0;
      player.play().catch(() => {});
    });
    grid.appendChild(card);
  });
})();
