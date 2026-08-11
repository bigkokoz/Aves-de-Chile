# 🐦 Aves de Chile

Plataforma web para aprender a reconocer aves de Chile por su **nombre**, su **canto** y su **apariencia**.

Es 100% estática (HTML + CSS + JavaScript, sin frameworks ni backend). Se puede abrir directamente en el navegador o publicar gratis con **GitHub Pages**.

## ✨ Qué incluye

- **Inicio** — un borde de roca estilo cordillera donde se posan las aves (PNG parado). Al pasar el mouse por encima, el ave abre las alas (PNG alas abiertas), muestra su nombre arriba y suena su canto.
- **Aprender a jugar** — galería con la foto y el nombre de cada ave y un botón ▶ para escuchar su canto (modo estudio, sin puntaje).
- **Juego** — 3 pestañas: **Cómo jugar**, **Modo de juego** y **Jugar**, todas con botón de pausa/atrás.
  - Modos: 🔊 Escuchar · 👁️ Ver · 📖 Por nombre.
  - Aciertas → ✅ · Fallas → ❌ · **2 fallos seguidos → pista 💡**.
  - Puntaje = **% de acierto** (aciertos ÷ intentos). Meta: **100% = calificación perfecta**.
  - Menú de pausa: **Reanudar · Reiniciar · Menú principal**.
- **Admin** — panel para cargar aves con arrastrar-soltar y vista previa.

## 📤 Cargar aves (panel Admin)

Abre `admin.html` y por cada ave sube:

| Campo | Formato | Uso |
|---|---|---|
| Nombre | texto | mostrar y validar respuestas |
| Pista (opcional) | texto | se muestra tras 2 fallos |
| Foto | `.jpg` / `.png` | galería y opciones del juego |
| PNG parado | `.png` transparente | ave posada en la roca |
| PNG alas abiertas | `.png` transparente | al pasar el mouse |
| Audio | `.mp3` / `.wav` | canto del ave |

Las aves cargadas se guardan en **IndexedDB** (el navegador), así que aparecen al instante en todas las secciones y persisten entre visitas **en ese navegador/dispositivo**.

> **Importante:** al ser una web estática, el panel guarda los archivos *localmente en tu navegador*. Para que otras personas vean tus aves al abrir el sitio publicado, hay que subir los archivos al repositorio (ver abajo) o, más adelante, conectar un backend/servicio de almacenamiento.

### Aves de ejemplo
Vienen 4 aves de ejemplo (Chincol, Zorzal, Diucón, Queltehue) con **placeholders generados automáticamente** (silueta + tono), para que todo funcione desde el primer momento. Puedes reemplazarlas cargando las tuyas.

## ▶️ Cómo ejecutarlo localmente

Por las restricciones de los navegadores, ábrelo con un pequeño servidor (no con doble clic):

```bash
cd pajaros-chile
python3 -m http.server 8000
```

Luego abre <http://localhost:8000>.

## 🌐 Publicar en GitHub Pages

1. Sube el repo a GitHub.
2. En **Settings → Pages**, elige la rama `main` y la carpeta raíz (o `/pajaros-chile`).
3. Tu sitio quedará en `https://<usuario>.github.io/<repo>/`.

## 📁 Estructura

```
pajaros-chile/
├── index.html        # Inicio (borde de roca + hover con alas y sonido)
├── learn.html        # Aprender a jugar (galería de estudio)
├── game.html         # Juego (3 pestañas + pausa)
├── admin.html        # Panel de carga de aves
├── css/styles.css
├── js/
│   ├── storage.js    # IndexedDB + aves de ejemplo + placeholders
│   ├── home.js
│   ├── learn.js
│   ├── game.js       # lógica del juego
│   └── admin.js      # panel de carga
└── assets/           # (opcional) archivos versionados en el repo
    ├── images/  standing/  open/  sounds/
```
