/* home.js — arma el borde de roca con las aves y el hover (alas + sonido) */
(async function () {
  const ledge = document.getElementById("ledge");
  const hoverName = document.getElementById("hoverName");
  const chirp = document.getElementById("chirp");

  const birds = await PuenteAves.getAllBirds();
  ledge.innerHTML = "";

  if (!birds.length) {
    ledge.innerHTML = '<p style="color:#ede4d3">Aún no hay aves. Ve a <b>Admin</b> para cargarlas.</p>';
    return;
  }

  birds.forEach((bird) => {
    const perch = document.createElement("div");
    perch.className = "perch";
    perch.title = bird.name;
    perch.innerHTML = `
      <img class="stand-img" src="${bird.standingURL || bird.photoURL}" alt="${bird.name} posado" />
      <img class="open-img" src="${bird.openURL || bird.standingURL || bird.photoURL}" alt="${bird.name} volando" />
    `;

    perch.addEventListener("mouseenter", () => {
      hoverName.textContent = bird.name;
      hoverName.style.opacity = "1";
      if (bird.audioURL) {
        chirp.src = bird.audioURL;
        chirp.currentTime = 0;
        chirp.play().catch(() => {});
      }
    });
    perch.addEventListener("mouseleave", () => {
      hoverName.textContent = "Pasa el mouse por las aves 🪶";
    });
    // En móvil: tocar reproduce el sonido
    perch.addEventListener("click", () => {
      hoverName.textContent = bird.name;
      if (bird.audioURL) { chirp.src = bird.audioURL; chirp.play().catch(() => {}); }
    });

    ledge.appendChild(perch);
  });
})();
