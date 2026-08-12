/* ============================================================
   birds.js — Aves incluidas en el repositorio
   ------------------------------------------------------------
   Estas aves vienen con la plataforma (sus imágenes están en
   assets/). Aparecen para TODOS al publicar el sitio.
   Para agregar una nueva ave aquí:
     1. Pon assets/standing/<archivo>.png  (alas cerradas)
        y assets/open/<archivo>.png        (alas abiertas)
     2. (Opcional) el audio en assets/sounds/<archivo>.mp3
     3. Agrega un objeto a la lista BIRDS de abajo.
   El panel Admin sigue funcionando para cargas rápidas
   (se guardan en el navegador, además de estas).
   ============================================================ */

window.REPO_BIRDS = [
  {
    id: "jilguero",
    name: "Jilguero",
    standing: "assets/standing/jilguero.png",
    open: "assets/open/jilguero.png",
    audio: "assets/sounds/jilguero.wav",
    tone: 660,
    hint: "Amarillo brillante con la cabeza y las alas negras.",
  },
  {
    id: "chercan",
    name: "Chercán",
    standing: "assets/standing/chercan.png",
    open: "assets/open/chercan.png",
    audio: "assets/sounds/chercan.wav",
    tone: 720,
    hint: "Café pequeño que levanta la cola; canto muy melodioso en jardines.",
  },
  {
    id: "cachudito",
    name: "Cachudito",
    standing: "assets/standing/cachudito.png",
    open: "assets/open/cachudito.png",
    audio: "assets/sounds/cachudito.wav",
    tone: 780,
    hint: "Muy pequeño, con un ‘cachito’ de plumas parado en la cabeza.",
  },
  {
    id: "fiofio",
    name: "Fío-fío",
    standing: "assets/standing/fiofio.png",
    open: "assets/open/fiofio.png",
    audio: "assets/sounds/fiofio.wav",
    tone: 600,
    hint: "Grisáceo con un pequeño copete; su canto parece decir ‘fío-fío’.",
  },
  {
    id: "golondrina",
    name: "Golondrina",
    standing: "assets/standing/golondrina.png",
    open: "assets/open/golondrina.png",
    audio: "assets/sounds/golondrina.wav",
    tone: 540,
    hint: "Alas largas y puntiagudas; vuela rápido cazando insectos en el aire.",
  },
  {
    id: "rayadito",
    name: "Rayadito",
    standing: "assets/standing/rayadito.png",
    open: "assets/open/rayadito.png",
    audio: "",
    tone: 840,
    hint: "Pequeño e inquieto, café con rayas anaranjadas y cola larga puntiaguda.",
  },
  {
    id: "tapaculo",
    name: "Tapaculo",
    standing: "assets/standing/tapaculo.png",
    open: "assets/open/tapaculo.png",
    audio: "assets/sounds/tapaculo.wav",
    tone: 480,
    hint: "Oscuro y escondidizo; anda por el suelo con la cola erguida.",
  },
  {
    id: "turca",
    name: "Turca",
    standing: "assets/standing/turca.png",
    open: "assets/open/turca.png",
    audio: "assets/sounds/turca.wav",
    tone: 500,
    hint: "Café de patas largas que corre por el suelo; endémica de Chile.",
  },
  {
    id: "tucuquere",
    name: "Tucúquere",
    standing: "assets/standing/tucuquere.png",
    open: "assets/open/tucuquere.png",
    audio: "assets/sounds/tucuquere.wav",
    tone: 300,
    hint: "El búho más grande de Chile: penachos en la cabeza y ojos amarillos.",
  },
  {
    id: "tortola_cordillerana",
    name: "Tórtola cordillerana",
    standing: "assets/standing/tortola_cordillerana.png",
    open: "assets/open/tortola_cordillerana.png",
    audio: "assets/sounds/tortola_cordillerana.wav",
    tone: 380,
    hint: "Paloma de la cordillera, de tonos grises y rosados.",
  },
];
