(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const svg = (paths, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${paths}</svg>`;
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} },
    remove(key) { try { localStorage.removeItem(key); } catch (_) {} },
  };

  /* ================= Tema ================= */

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  const themeChoice = () => document.documentElement.dataset.theme || "system";
  const currentTheme = () => document.documentElement.dataset.theme || (systemDark.matches ? "dark" : "light");

  function paintTheme() {
    const dark = currentTheme() === "dark";
    // Los <svg> no tienen la propiedad .hidden: hay que usar el atributo.
    $("icon-sun").toggleAttribute("hidden", !dark);
    $("icon-moon").toggleAttribute("hidden", dark);
    $("theme-toggle").setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    $$("[data-theme-choice]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.themeChoice === themeChoice())));
  }

  function setTheme(choice) {
    if (choice === "system") {
      delete document.documentElement.dataset.theme;
      storage.remove("theme");
    } else {
      document.documentElement.dataset.theme = choice;
      storage.set("theme", choice);
    }
    paintTheme();
  }

  $("theme-toggle").addEventListener("click", () => setTheme(currentTheme() === "dark" ? "light" : "dark"));
  $$("[data-theme-choice]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeChoice)));
  systemDark.addEventListener("change", paintTheme);
  paintTheme();

  /* ================= Efectos de los botones ================= */

  // Foco de luz que sigue al puntero: cada control lee --mx/--my en su fondo (ver index.html).
  const FX = ".btn, .icon-btn, .fab, .genre, .tabs button, .user-btn, .switch button, .choice button, .tip, .nav a, .nav button, .jobs-pill, .segmented button";
  // Onda al pulsar: solo en los que recortan su contenido (overflow: hidden).
  const RIPPLE = ".btn, .fab, .genre, .tabs button, .switch button, .choice button, .tip, .nav a, .nav button, .segmented button";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  document.addEventListener("pointermove", (event) => {
    const el = event.target.closest && event.target.closest(FX);
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", event.clientX - r.left + "px");
    el.style.setProperty("--my", event.clientY - r.top + "px");
  }, { passive: true });

  document.addEventListener("pointerdown", (event) => {
    const el = event.target.closest && event.target.closest(RIPPLE);
    if (!el || el.disabled || reducedMotion.matches) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const wave = document.createElement("span");
    wave.className = "ripple";
    wave.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - r.left - size / 2}px;top:${event.clientY - r.top - size / 2}px`;
    el.appendChild(wave);
    wave.addEventListener("animationend", () => wave.remove());
  }, { passive: true });

  /* ================= Menus emergentes ================= */

  let openPopover = null;

  function closePopover() {
    if (!openPopover) return;
    openPopover.panel.hidden = true;
    openPopover.button.setAttribute("aria-expanded", "false");
    const { onClose } = openPopover;
    openPopover = null;
    if (onClose) onClose();
  }

  function togglePopover(button, panel, onOpen, onClose) {
    const wasOpen = openPopover && openPopover.panel === panel;
    closePopover();
    if (wasOpen) return;
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
    openPopover = { button, panel, onClose };
    if (onOpen) onOpen();
  }

  document.addEventListener("click", (event) => {
    if (openPopover && !openPopover.panel.contains(event.target) && !openPopover.button.contains(event.target)) closePopover();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openPopover) { openPopover.button.focus(); closePopover(); }
  });

  /* ================= Generos ================= */

  // Mismas etiquetas que el registro de modos del backend (MODES[mode].example.tag).
  const GENRES = [
    { tag: "Plataformas", label: "Plataformas", icon: '<path d="M3 20h5v-5h5v-5h5V5h3"/>' },
    { tag: "Laberinto", label: "Laberinto", icon: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v9M12 8v13M16 3v9"/>' },
    { tag: "Mazmorra", label: "Mazmorra", icon: '<path d="M6 21V10a6 6 0 0 1 12 0v11M3 21h18M10 21v-5h4v5"/>' },
    { tag: "Cuevas", label: "Cuevas", icon: '<path d="m3 20 6-10 4 6 3-4 5 8z"/>' },
    { tag: "Arcade", label: "Arcade", icon: '<path d="M5 21V11a7 7 0 0 1 14 0v10l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2z"/><path d="M10 11h.01M14 11h.01"/>' },
    { tag: "Carreras", label: "Carreras", icon: '<path d="M5 21V4M5 4h13l-2.5 4.5L18 13H5"/>' },
    { tag: "Naves", label: "Naves", icon: '<path d="M12 2c4 3 5 8 3 13H9C7 10 8 5 12 2z"/><path d="m9 15-3 4h4M15 15l3 4h-4"/>' },
    { tag: "Supervivencia", label: "Supervivencia", icon: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>' },
    { tag: "Tiro", label: "Tiro", icon: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".5"/>' },
    { tag: "Bloques", label: "Rompe-bloques", icon: '<rect x="3" y="4" width="8" height="4" rx="1"/><rect x="13" y="4" width="8" height="4" rx="1"/><rect x="7" y="10" width="10" height="4" rx="1"/><path d="M10 20h4"/>' },
    { tag: "Serpiente", label: "Serpiente", icon: '<path d="M4 18c4 0 4-6 8-6s4 6 8 6M4 8c3 0 3-3 6-3"/>' },
    { tag: "Libre", label: "Libre", icon: '<path d="m12 3 1.9 5.8L20 10l-5 3.6L16.5 20 12 16.4 7.5 20 9 13.6 4 10l6.1-1.2z"/>' },
  ];
  const GENRE_BY_TAG = new Map(GENRES.map((g) => [g.tag, g]));
  const genreLabel = (tag, fallback) => (GENRE_BY_TAG.get(tag) || {}).label || fallback || tag || "";
  const ALL_ICON = '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>';

  /* ================= Estado de la biblioteca ================= */

  const filter = {
    genre: "all",
    q: "",
    sort: "recent",
    layout: storage.get("libLayout") === "list" ? "list" : "grid",
  };
  let mine = [];
  let examples = [];
  const levelCache = new Map();

  function renderGenres() {
    for (const container of $$("[data-genres]")) {
      const chips = [{ tag: "all", label: "Todos", icon: ALL_ICON }, ...GENRES].map((g) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "genre";
        chip.setAttribute("aria-pressed", String(filter.genre === g.tag));
        chip.innerHTML = svg(g.icon);
        chip.append(g.label);
        chip.addEventListener("click", () => {
          filter.genre = filter.genre === g.tag && g.tag !== "all" ? "all" : g.tag;
          renderAllLibraries();
        });
        return chip;
      });
      container.replaceChildren(...chips);
      fadeGenres(container);
    }
  }

  /** Activa el desvanecido del borde solo si sobran generos y aun no se llego al final. */
  function fadeGenres(container) {
    const update = () => {
      container.classList.toggle("overflowing", container.scrollWidth > container.clientWidth + 2);
      container.classList.toggle("at-end", container.scrollLeft + container.clientWidth >= container.scrollWidth - 2);
    };
    if (!container.dataset.fade) {
      container.dataset.fade = "1";
      container.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
    }
    requestAnimationFrame(update);
  }

  function renderLayoutSwitches() {
    const options = [
      { value: "grid", label: "Ver en rejilla", icon: ALL_ICON },
      { value: "list", label: "Ver en lista", icon: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>' },
    ];
    for (const container of $$("[data-layout-switch]")) {
      container.replaceChildren(...options.map((o) => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("aria-label", o.label);
        button.title = o.label;
        button.setAttribute("aria-pressed", String(filter.layout === o.value));
        button.innerHTML = svg(o.icon);
        button.addEventListener("click", () => {
          filter.layout = o.value;
          storage.set("libLayout", o.value);
          renderAllLibraries();
        });
        return button;
      }));
    }
    $$(".lib").forEach((lib) => { lib.classList.toggle("grid", filter.layout === "grid"); lib.classList.toggle("list", filter.layout === "list"); });
  }

  function renderAllLibraries() {
    renderGenres();
    renderLayoutSwitches();
    renderFeatured();
    renderExamples();
    renderMine();
  }

  /* ================= Tarjetas ================= */

  const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
  const DOTS_ICON = svg('<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>');
  const LINK_ICON = svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>');
  const EDIT_ICON = svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>');
  const TRASH_ICON = svg('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>');

  function makeArt(shotKey, getLevel) {
    const art = document.createElement("span");
    art.className = "art";
    art.setAttribute("aria-hidden", "true");
    art.dataset.shot = shotKey;
    if (shots.has(shotKey)) paintShot(art, shots.get(shotKey));
    else if (getLevel) queueShot(shotKey, getLevel);
    return art;
  }

  /** Una tarjeta de la biblioteca: miniatura, titulo, genero, fecha, Jugar y un menu opcional. */
  function makeItem({ tag, title, sub, meta, shotKey, getLevel, onPlay, menu }) {
    const item = document.createElement("article");
    item.className = "item";
    item.dataset.tag = tag;

    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "thumb";
    thumb.setAttribute("aria-label", "Jugar " + title);
    const tagEl = document.createElement("span");
    tagEl.className = "tag";
    tagEl.textContent = genreLabel(tag);
    thumb.append(makeArt(shotKey, getLevel), tagEl);
    thumb.addEventListener("click", onPlay);

    const info = document.createElement("div");
    info.className = "info";
    const h3 = document.createElement("h3");
    h3.textContent = title;
    const subEl = document.createElement("p");
    subEl.className = "sub";
    subEl.textContent = sub || "";
    const metaEl = document.createElement("p");
    metaEl.className = "meta";
    const pill = document.createElement("span");
    pill.className = "genre-pill";
    pill.textContent = genreLabel(tag);
    metaEl.append(pill, meta || "");
    info.append(h3, subEl, metaEl);

    const actions = document.createElement("div");
    actions.className = "actions";
    const play = document.createElement("button");
    play.type = "button";
    play.className = "btn btn-primary btn-sm play-btn";
    play.innerHTML = PLAY_ICON;
    play.append("Jugar");
    play.addEventListener("click", onPlay);
    actions.append(play);

    if (menu && menu.length) {
      const wrap = document.createElement("div");
      wrap.className = "pop";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "icon-btn sm";
      toggle.setAttribute("aria-label", "Más opciones para " + title);
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = DOTS_ICON;
      const panel = document.createElement("div");
      panel.className = "popover menu";
      panel.hidden = true;
      for (const entry of menu) {
        const b = document.createElement("button");
        b.type = "button";
        if (entry.danger) b.className = "danger";
        b.innerHTML = entry.icon;
        b.append(entry.label);
        b.addEventListener("click", () => { closePopover(); entry.action(item); });
        panel.appendChild(b);
      }
      toggle.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePopover(toggle, panel, () => item.classList.add("menu-open"), () => item.classList.remove("menu-open"));
      });
      wrap.append(toggle, panel);
      actions.append(wrap);
    }

    item.append(thumb, info, actions);
    return item;
  }

  function emptyState(el, title, text, action) {
    el.replaceChildren();
    const strong = document.createElement("strong");
    strong.textContent = title;
    const p = document.createElement("span");
    p.textContent = text;
    el.append(strong, p);
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-primary btn-sm";
      b.textContent = action.label;
      b.addEventListener("click", action.run);
      el.append(document.createElement("br"), b);
    }
    el.hidden = false;
  }

  /* ================= Capturas para las miniaturas ================= */

  // Se juega el nivel unos segundos fuera de pantalla y se fotografia.
  // Van de una en una y en ratos libres, para no trabar la pagina.
  const shotCanvas = document.createElement("canvas");
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 320;
  thumbCanvas.height = 200;
  const shots = new Map();
  const shotQueue = [];
  const shotPending = new Set();
  let shooting = false;
  const PREVIEW_INPUT = { racing: "ArrowUp", platformer: "ArrowRight", arcade: "ArrowLeft" };
  const PREVIEW_SECONDS = 4.2;
  const IDLE_LIMIT = 150;

  function paintShot(art, url) {
    art.style.backgroundImage = "url(" + url + ")";
    art.classList.add("shot");
  }

  function capture(level) {
    const preview = window.LevelGame.create(shotCanvas, level, { manual: true });
    try {
      if (PREVIEW_INPUT[level.layout]) preview.press(PREVIEW_INPUT[level.layout]);
      for (let i = 0; i < PREVIEW_SECONDS * 60; i++) preview.step(1 / 60);
      preview.render();
      const g = thumbCanvas.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.drawImage(shotCanvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
      return thumbCanvas.toDataURL("image/jpeg", 0.82);
    } finally {
      preview.destroy();
    }
  }

  /* Vista previa de un juego a medida: corre aislado y no se puede fotografiar desde fuera.
     Se carga en un iframe invisible con la misma politica, y un script inyectado copia su
     lienzo (casi siempre la pantalla de titulo) y lo envia con postMessage. */
  const SNAP_DELAY_MS = 1500;
  const SNAP_TIMEOUT_MS = 8000;
  const SNAP_PREFIX = "data:image/jpeg;base64,";
  const SNAP_MAX_LENGTH = 400_000;
  const SNAP_SCRIPT = "<script>addEventListener('load',function(){setTimeout(function(){var r=null;try{" +
    "var c=[].slice.call(document.querySelectorAll('canvas')).sort(function(a,b){return b.width*b.height-a.width*a.height})[0];" +
    "if(c&&c.width&&c.height){var t=document.createElement('canvas');t.width=" + thumbCanvas.width + ";t.height=" + thumbCanvas.height + ";" +
    "var g=t.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,t.width,t.height);" +
    "var k=Math.max(t.width/c.width,t.height/c.height),w=c.width*k,h=c.height*k;" +
    "g.drawImage(c,(t.width-w)/2,(t.height-h)/2,w,h);r=t.toDataURL('image/jpeg',0.82)}}catch(e){}" +
    "parent.postMessage({snap:r},'*')}," + SNAP_DELAY_MS + ")})<\/script>";
  const snapKey = (id) => "snap:" + id;

  function captureCustom(level) {
    const saved = storage.get(snapKey(level.id));
    if (saved) return Promise.resolve(saved);
    if (!level.html) return Promise.resolve(null);

    return new Promise((resolve) => {
      const frame = document.createElement("iframe");
      frame.setAttribute("sandbox", "allow-scripts");
      frame.setAttribute("aria-hidden", "true");
      frame.tabIndex = -1;
      // Dentro de la ventana pero invisible: fuera de ella el navegador congela el iframe.
      frame.style.cssText = "position:fixed;left:0;top:0;width:960px;height:600px;border:0;opacity:0;pointer-events:none;z-index:-1";
      let timer;
      const done = (shot) => {
        clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        frame.remove();
        if (shot) storage.set(snapKey(level.id), shot);
        resolve(shot);
      };
      // Solo se acepta una imagen JPEG de tamano razonable y de este iframe.
      function onMessage(event) {
        if (event.source !== frame.contentWindow) return;
        const snap = event.data && event.data.snap;
        done(typeof snap === "string" && snap.startsWith(SNAP_PREFIX) && snap.length < SNAP_MAX_LENGTH ? snap : null);
      }
      window.addEventListener("message", onMessage);
      timer = setTimeout(() => done(null), SNAP_TIMEOUT_MS);
      frame.srcdoc = withPolicy(level.html, SNAP_SCRIPT);
      document.body.appendChild(frame);
    });
  }

  /** Una captura por clave: se pinta en todas las miniaturas que la muestran (carrusel y rejilla). */
  function queueShot(key, getLevel) {
    if (shotPending.has(key)) return;
    shotPending.add(key);
    shotQueue.push({ key, getLevel });
    if (!shooting) nextShot();
  }

  function nextShot() {
    const job = shotQueue.shift();
    if (!job) { shooting = false; return; }
    shooting = true;
    // Se espera un rato libre, pero sin pasar de IDLE_LIMIT: con un juego en marcha casi nunca lo hay.
    const idle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: IDLE_LIMIT }) : (fn) => setTimeout(fn, 30);
    idle(async () => {
      try {
        const level = await job.getLevel();
        const shot = !level ? null : level.layout === "custom" ? await captureCustom(level) : capture(level);
        if (shot) {
          shots.set(job.key, shot);
          $$('.art[data-shot="' + CSS.escape(job.key) + '"]').forEach((art) => paintShot(art, shot));
        }
      } catch (_) {
        // Sin captura la miniatura conserva su degradado.
      }
      shotPending.delete(job.key);
      nextShot();
    });
  }

  /* ================= Ejemplos y destacados ================= */

  const FALLBACK_EXAMPLES = [
    { tag: "Plataformas", text: "mapa tipo Mario Bros con trampas, diseño pixelado y jefe final" },
    { tag: "Arcade", text: "arcade retro tipo pacman en el espacio con fantasmas" },
    { tag: "Cuevas", text: "cuevas de lava con murciélagos y un dragón como jefe final" },
    { tag: "Laberinto", text: "un laberinto de hielo con trampas" },
    { tag: "Mazmorra", text: "mazmorra con salas, 5 trampas, muchos enemigos y jefe final, difícil" },
    { tag: "Supervivencia", text: "sobrevivir a hordas de esqueletos en una cripta con jefe final" },
    { tag: "Carreras", text: "carreras de autos en el desierto a 3 vueltas" },
    { tag: "Naves", text: "batalla de naves contra robots invasores" },
    { tag: "Bloques", text: "rompe bloques en el espacio con explosivos" },
    { tag: "Serpiente", text: "juego de la serpiente en el bosque comiendo manzanas" },
    { tag: "Tiro", text: "tiro al blanco en el bosque con bombas y jefe final" },
  ];
  const TIPS = ["un laberinto de hielo con trampas", "carreras en el desierto a 3 vueltas", "ajedrez contra la computadora"];

  /** La API envia la cuadricula de los ejemplos compacta: una cadena por fila. */
  const CELL = { "#": "wall", ".": "floor", S: "start", E: "exit", "^": "trap", M: "enemy", $: "item", B: "boss", P: "power" };
  const unpack = (level) => (level.grid || !level.rows ? level : { ...level, grid: level.rows.map((row) => [...row].map((c) => CELL[c])) });

  function openExample(example) {
    input.value = example.text;
    // Con el nivel ya generado se juega al instante y sin gastar IA; si no, se genera.
    if (example.level) playLevel(example.level);
    else generate();
  }

  const exampleVisible = (e) => filter.genre === "all" || e.tag === filter.genre;

  function renderFeatured() {
    const list = examples.filter(exampleVisible);
    $("featured").replaceChildren(...list.map((example) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "feature";
      card.dataset.tag = example.tag;
      card.setAttribute("aria-label", "Jugar: " + example.text);
      const body = document.createElement("div");
      body.className = "feature-body";
      const text = document.createElement("div");
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = genreLabel(example.tag);
      const h3 = document.createElement("h3");
      h3.textContent = example.text;
      text.append(tag, h3);
      const play = document.createElement("span");
      play.className = "btn btn-sm";
      play.innerHTML = PLAY_ICON;
      play.append("Jugar");
      body.append(text, play);
      card.append(makeArt("ej:" + example.tag, example.level && (async () => example.level)), body);
      card.addEventListener("click", () => openExample(example));
      return card;
    }));
    $("feat-prev").hidden = $("feat-next").hidden = list.length < 2;
  }

  function renderExamples() {
    const list = examples.filter(exampleVisible);
    $("examples").replaceChildren(...list.map((example) => makeItem({
      tag: example.tag,
      title: genreLabel(example.tag),
      sub: example.text,
      meta: example.level ? "Listo para jugar" : "Se genera al abrirlo",
      shotKey: "ej:" + example.tag,
      getLevel: example.level && (async () => example.level),
      onPlay: () => openExample(example),
    })));
    if (list.length) $("examples-empty").hidden = true;
    else emptyState($("examples-empty"), "No hay ejemplos de ese género", "Elige otro género o «Todos».");
  }

  async function loadExamples() {
    try {
      const res = await fetch("/api/levels/examples");
      if (!res.ok) throw new Error();
      examples = (await res.json()).map((e) => ({ ...e, level: unpack(e.level) }));
    } catch (_) {
      examples = FALLBACK_EXAMPLES;
    }
    renderFeatured();
    renderExamples();
  }

  $("feat-prev").addEventListener("click", () => $("featured").scrollBy({ left: -$("featured").clientWidth * 0.8 }));
  $("feat-next").addEventListener("click", () => $("featured").scrollBy({ left: $("featured").clientWidth * 0.8 }));

  /* ================= Mis juegos ================= */

  const DATE = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const normalize = (text) => String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  async function fetchLevel(id) {
    if (levelCache.has(id)) return levelCache.get(id);
    const res = await fetch("/api/levels/" + encodeURIComponent(id));
    if (!res.ok) return null;
    const level = await res.json();
    levelCache.set(id, level);
    return level;
  }

  function mineMatches(summary) {
    if (filter.genre !== "all" && summary.tag !== filter.genre) return false;
    if (!filter.q) return true;
    const haystack = normalize([summary.title, summary.description, genreLabel(summary.tag, summary.label), summary.label].join(" "));
    return normalize(filter.q).split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
  }

  function sortedMine(list) {
    const byDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    if (filter.sort === "oldest") return [...list].sort((a, b) => -byDate(a, b));
    if (filter.sort === "genre") return [...list].sort((a, b) => genreLabel(a.tag).localeCompare(genreLabel(b.tag), "es") || byDate(a, b));
    return [...list].sort(byDate);
  }

  function renderMineCount() {
    const n = mine.length;
    $("badge-mine").hidden = n === 0;
    $("badge-mine").textContent = String(n);
    renderProfileStats();
    $("mine-summary").textContent = n === 0 ? "Todo lo que crees se guarda aquí, en tu cuenta." : n === 1 ? "1 juego guardado en tu cuenta." : n + " juegos guardados en tu cuenta.";
  }

  function renderMine() {
    renderMineCount();
    const list = sortedMine(mine.filter(mineMatches));
    $("mine-list").replaceChildren(...list.map((summary) => makeItem({
      tag: summary.tag || "Libre",
      title: summary.title,
      sub: summary.description,
      meta: DATE.format(new Date(summary.createdAt)),
      shotKey: "lv:" + summary.id,
      getLevel: () => fetchLevel(summary.id),
      onPlay: () => openMine(summary),
      menu: [
        { label: "Editar", icon: EDIT_ICON, action: () => openEditor(summary.id) },
        { label: "Compartir", icon: LINK_ICON, action: () => shareLink(summary.id, summary.title) },
        { label: "Borrar", icon: TRASH_ICON, danger: true, action: () => deleteMine(summary) },
      ],
    })));
    if (list.length) { $("mine-empty").hidden = true; return; }
    if (mine.length === 0) {
      emptyState($("mine-empty"), "Aún no tienes juegos", "Describe uno en Crear y aparecerá aquí.", { label: "Crear mi primer juego", run: () => go("create", true) });
    } else {
      const what = [filter.q && "«" + filter.q + "»", filter.genre !== "all" && genreLabel(filter.genre)].filter(Boolean).join(" en ");
      emptyState($("mine-empty"), "Nada coincide con " + what, "Prueba con otras palabras o quita el filtro de género.", {
        label: "Quitar filtros",
        run: () => { filter.genre = "all"; filter.q = ""; $("search").value = ""; renderAllLibraries(); },
      });
    }
  }

  async function openMine(summary) {
    const level = await fetchLevel(summary.id);
    if (level) { input.value = level.description; playLevel(level); }
    else showError("No se pudo abrir ese juego.");
  }

  async function deleteMine(summary) {
    if (!confirm("¿Borrar «" + summary.title + "»? No se puede deshacer.")) return;
    const res = await fetch("/api/levels/" + encodeURIComponent(summary.id), { method: "DELETE" });
    if (res.ok || res.status === 404) {
      mine = mine.filter((m) => m.id !== summary.id);
      levelCache.delete(summary.id);
      shots.delete("lv:" + summary.id);
      storage.remove(snapKey(summary.id));
      renderMine();
    } else {
      toast({ kind: "error", title: "No se pudo borrar", text: "Inténtalo de nuevo en un momento." });
    }
  }

  function addMine(summary) {
    mine = [summary, ...mine.filter((m) => m.id !== summary.id)];
    renderMine();
  }

  async function loadMine() {
    try {
      const res = await fetch("/api/levels/mine");
      if (!res.ok) throw new Error();
      mine = await res.json();
    } catch (_) {
      mine = [];
    }
    renderMine();
  }

  $("sort").addEventListener("change", () => { filter.sort = $("sort").value; renderMine(); });

  /* ================= Busqueda ================= */

  const search = $("search");
  search.addEventListener("input", () => {
    filter.q = search.value.trim();
    if (filter.q && currentView !== "mine") go("mine");
    renderMine();
  });
  document.addEventListener("keydown", (event) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (event.key === "/" && !typing && !$("search-wrap").hidden) { event.preventDefault(); search.focus(); }
  });

  /* ================= Vistas ================= */

  const VIEW_BY_HASH = { "#crear": "create", "#mis-juegos": "mine", "#ejemplos": "examples", "#como-funciona": "how", "#perfil": "profile" };
  const HASH_BY_VIEW = Object.fromEntries(Object.entries(VIEW_BY_HASH).map(([h, v]) => [v, h]));
  let currentView = "create";

  function showView(view) {
    currentView = view;
    $$("[data-panel-view]").forEach((p) => (p.hidden = p.dataset.panelView !== view));
    updateFab();
    // Las vistas ocultas miden 0 de ancho: al mostrarlas se recalcula el desvanecido.
    $$("[data-genres]").forEach(fadeGenres);
    $$(".nav a[data-view]").forEach((a) => {
      const active = a.dataset.view === view;
      a.classList.toggle("active", active);
      if (active) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  /** Cambia de vista dejando rastro en el historial, para que Atras funcione. */
  function go(view, focusPrompt) {
    if (HASH_BY_VIEW[view] !== location.hash) history.pushState(null, "", HASH_BY_VIEW[view]);
    showView(view);
    window.scrollTo({ top: 0 });
    if (focusPrompt && view === "create") input.focus();
  }

  window.addEventListener("popstate", () => showView(VIEW_BY_HASH[location.hash] || "create"));

  /** El boton flotante sobra cuando la caja de pedido ya esta a la vista. */
  function updateFab() {
    const promptVisible = currentView === "create" && window.scrollY < 260;
    // En el perfil taparia los botones de guardar.
    $("fab").hidden = !document.body.classList.contains("app-on") || promptVisible || currentView === "profile";
  }
  window.addEventListener("scroll", updateFab, { passive: true });
  $("fab").addEventListener("click", () => {
    go("create");
    input.focus({ preventScroll: true });
    updateFab();
  });
  $$("a[href^='#']").forEach((a) => a.addEventListener("click", (event) => {
    const view = VIEW_BY_HASH[a.getAttribute("href")];
    if (!view) return;
    event.preventDefault();
    go(view);
  }));

  function renderModesGrid() {
    $("modes-grid").replaceChildren(...GENRES.filter((g) => g.tag !== "Libre").map((g) => {
      const card = document.createElement("div");
      card.className = "mode-card";
      card.innerHTML = svg(g.icon);
      card.append(g.label);
      return card;
    }));
  }

  /* ================= Notificaciones ================= */

  const KIND_ICON = {
    success: svg('<path d="m5 12 5 5 9-10"/>'),
    error: svg('<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>'),
    info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  };
  const TIME = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" });
  let notifs = [];

  function notifBody(n, closeAction) {
    const ico = document.createElement("span");
    ico.className = "ico";
    ico.innerHTML = KIND_ICON[n.kind];
    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = n.title;
    body.append(title);
    if (n.text) {
      const p = document.createElement("p");
      p.textContent = n.text;
      body.append(p);
    }
    if (n.at) {
      const time = document.createElement("time");
      time.textContent = TIME.format(n.at);
      body.append(time);
    }
    if (n.action) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-primary btn-sm";
      b.textContent = n.action.label;
      b.addEventListener("click", () => { if (closeAction) closeAction(); n.action.run(); });
      body.append(document.createElement("br"), b);
    }
    return [ico, body];
  }

  function renderNotifs() {
    const unread = notifs.filter((n) => !n.read).length;
    $("bell-count").hidden = unread === 0;
    $("bell-count").textContent = String(unread);
    $("bell").setAttribute("aria-label", unread ? "Notificaciones (" + unread + " sin leer)" : "Notificaciones");
    $("notif-empty").hidden = notifs.length > 0;
    $("notif-clear").hidden = notifs.length === 0;
    $("notif-list").replaceChildren(...notifs.map((n) => {
      const li = document.createElement("li");
      li.className = "notif " + n.kind + (n.read ? "" : " unread");
      li.append(...notifBody(n, closePopover));
      return li;
    }));
  }

  /** Guarda el aviso en el historial de la sesion y lo muestra unos segundos. */
  function notify(n) {
    notifs = [{ ...n, at: new Date(), read: false }, ...notifs].slice(0, 30);
    renderNotifs();
    toast(n);
  }

  function toast(n) {
    const el = document.createElement("div");
    el.className = "toast notif " + n.kind;
    el.setAttribute("role", n.kind === "error" ? "alert" : "status");
    const close = document.createElement("button");
    close.type = "button";
    close.className = "close";
    close.setAttribute("aria-label", "Cerrar aviso");
    close.innerHTML = svg('<path d="M18 6 6 18M6 6l12 12"/>');
    const remove = () => el.remove();
    close.addEventListener("click", remove);
    el.append(...notifBody({ ...n, at: null }, remove), close);
    $("toasts").prepend(el);
    setTimeout(remove, n.kind === "error" ? 9000 : 6500);
  }

  $("bell").addEventListener("click", (event) => {
    event.stopPropagation();
    togglePopover($("bell"), $("notif-panel"), null, () => {
      // Al cerrar el panel, lo visto queda como leido.
      notifs = notifs.map((n) => ({ ...n, read: true }));
      renderNotifs();
    });
  });
  $("notif-clear").addEventListener("click", () => { notifs = []; renderNotifs(); });

  /* ================= Cupo de juegos libres ================= */

  // GET /api/levels/quota -> { used, limit, retryAt? }. Si el backend aun no lo expone,
  // el indicador se llena con lo que trae la respuesta 429 (limit y retryAt).
  let quota = null;

  function formatWait(ms) {
    const minutes = Math.max(1, Math.round(ms / 60_000));
    if (minutes < 60) return minutes + " min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? h + " h " + m + " min" : h + " h";
  }

  function renderQuota() {
    const show = Boolean(quota && quota.limit);
    $("quota").hidden = !show;
    $("quota-card").hidden = !show;
    if (!show) return;
    const left = Math.max(0, quota.limit - quota.used);
    const bars = Array.from({ length: quota.limit }, (_, i) => {
      const bar = document.createElement("i");
      if (i < left) bar.className = "on";
      return bar;
    });
    $("quota-bar").replaceChildren(...bars);
    $("quota-card-bar").replaceChildren(...bars.map((b) => b.cloneNode()));
    const text = "Juegos libres: " + left + "/" + quota.limit;
    const wait = left === 0 && quota.retryAt ? "Se renueva en " + formatWait(new Date(quota.retryAt) - Date.now()) + "." : left + " de " + quota.limit + " disponibles en 24 h.";
    $("quota-text").textContent = text;
    $("quota").title = wait;
    $("quota-card-text").textContent = wait;
  }

  async function loadQuota() {
    try {
      const res = await fetch("/api/levels/quota");
      if (!res.ok) return;
      const data = await res.json();
      if (Number.isInteger(data.limit) && Number.isInteger(data.used)) { quota = data; renderQuota(); }
    } catch (_) {
      // Sin dato, el indicador queda oculto.
    }
  }

  /* ================= Progreso por etapas ================= */

  const STAGES_FAST = ["Interpretar tu idea", "Preparar el juego"];
  const STAGES_CUSTOM = ["Interpretar", "Escribir", "Revisar", "Guardar"];
  let progressTimer = null;

  function renderProgress({ title, stages, index, text, startedAt, live = false }) {
    $("progress").hidden = false;
    $("progress-title").textContent = title;
    $("progress-live").hidden = !live;
    $("progress-text").textContent = text || "";
    const segs = $("progress-segs");
    const labels = $("progress-labels");
    segs.style.setProperty("--n", stages.length);
    labels.style.setProperty("--n", stages.length);
    const state = (i) => (i < index ? "done" : i === index ? "active" : "");
    segs.replaceChildren(...stages.map((_, i) => { const s = document.createElement("span"); s.className = "seg " + state(i); return s; }));
    labels.replaceChildren(...stages.map((label, i) => { const s = document.createElement("span"); s.className = state(i); s.textContent = label; return s; }));
    clearInterval(progressTimer);
    const tick = () => { $("progress-time").textContent = startedAt ? Math.round((Date.now() - startedAt) / 1000) + " s" : ""; };
    tick();
    if (startedAt) progressTimer = setInterval(tick, 1000);
  }

  function hideProgress() {
    clearInterval(progressTimer);
    $("progress").hidden = true;
  }

  /* ================= Trabajos en segundo plano (juegos libres) ================= */

  // Con el WebSocket conectado, el servidor avisa de cada cambio y el sondeo queda solo como red de
  // seguridad (por si se pierde un aviso). Sin conexion en vivo se vuelve a consultar cada 2,5 s.
  const JOB_POLL_MS = 2500;
  const JOB_POLL_LIVE_MS = 20_000;
  const JOB_TIMEOUT_MS = 6 * 60_000;
  const jobs = new Map();
  let shownJob = null;
  let lastOpenedAt = 0;

  function renderJobs() {
    const n = jobs.size;
    $("badge-jobs").hidden = n === 0;
    $("badge-jobs").textContent = String(n);
    $("jobs-pill").hidden = n === 0;
    $("jobs-text").textContent = n === 1 ? "Creando 1 juego" : "Creando " + n + " juegos";
    $("jobs-pill").title = [...jobs.values()].map((j) => j.title).join(", ");
  }

  /** Etapa real que informa el servidor; sin ella (backend antiguo), una estimacion por tiempo. */
  function customStage(job) {
    const seconds = (Date.now() - job.startedAt) / 1000;
    switch (job.stage) {
      case "validating": return { index: 2, text: "La IA terminó de escribir. Comprobando que el código funcione…" };
      case "fixing": return { index: 2, text: "La revisión encontró errores y la IA los está corrigiendo. Tarda un poco más." };
      case "saving": return { index: 3, text: "Todo en orden. Guardándolo en tus juegos…" };
    }
    if (job.status === "pending") return { index: 1, text: "Preparando la escritura del juego…" };
    return {
      index: 1,
      text: seconds < 70
        ? "La IA está escribiendo el código del juego. Suele tardar uno o dos minutos; puedes seguir usando la app y te avisaremos."
        : "Sigue escribiendo: los juegos con más reglas tardan un poco más. Después se revisa que el código funcione.",
    };
  }

  function showJobProgress(job) {
    const { index, text } = customStage(job);
    renderProgress({ title: "Creando «" + job.title + "»", stages: STAGES_CUSTOM, index, text, startedAt: job.startedAt, live: realtime.connected });
  }

  const isFinished = (job) => job.status === "done" || job.status === "error";

  /** Espera hasta la proxima consulta, o menos si un aviso en vivo dice que ya termino. */
  function sleepJob(job) {
    return new Promise((resolve) => {
      const timer = setTimeout(done, realtime.connected ? JOB_POLL_LIVE_MS : JOB_POLL_MS);
      function done() { clearTimeout(timer); job.wake = null; resolve(); }
      job.wake = done;
    });
  }

  /** Tras reconectar pudo perderse un aviso: todos los trabajos consultan ya. */
  function wakeJobs() {
    for (const job of jobs.values()) job.wake?.();
  }

  /**
   * Sigue un juego a medida hasta que termina. adopted: lo empezo otra pestana u otro dispositivo
   * de la misma cuenta y nos enteramos por el aviso en vivo.
   */
  async function trackJob(pending, { adopted = false, status = "pending", stage = null } = {}) {
    const existing = jobs.get(pending.job);
    if (existing) {
      // El aviso en vivo puede llegar antes que la respuesta de /generate: esta pestana lo pidio.
      if (!adopted && existing.adopted) {
        existing.adopted = false;
        existing.title = pending.title || existing.title;
        shownJob = existing.id;
        showJobProgress(existing);
        loadQuota();
      }
      return;
    }
    const job = { id: pending.job, title: pending.title || "tu juego", status, stage, adopted, startedAt: Date.now(), wake: null };
    jobs.set(job.id, job);
    renderJobs();
    if (adopted) loadQuota();
    else {
      shownJob = job.id;
      showJobProgress(job);
      if (quota) { quota = { ...quota, used: quota.used + 1 }; renderQuota(); }
    }

    try {
      let level = null;
      while (!level) {
        if (Date.now() - job.startedAt > JOB_TIMEOUT_MS) throw new Error("Está tardando demasiado. Inténtalo de nuevo en un momento.");
        if (!isFinished(job)) await sleepJob(job);
        if (!jobs.has(job.id)) return; // se cerro la sesion
        const res = await fetch("/api/levels/jobs/" + encodeURIComponent(job.id));
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "No se pudo crear el juego.");
        if (body.status === "done") level = body.level;
        else {
          job.status = body.status || job.status;
          job.stage = body.stage || job.stage;
          if (shownJob === job.id) showJobProgress(job);
        }
      }
      jobs.delete(job.id);
      renderJobs();
      level.interpretedBy = "ai";
      if (level.saved) {
        levelCache.set(level.id, level);
        addMine({ id: level.id, title: level.narrative.title, description: level.description, label: "Juego libre", tag: level.tag || "Libre", layout: level.layout, createdAt: level.createdAt });
      }
      const play = () => { input.value = level.description; playLevel(level); };
      // Si sigue mirando este progreso y no abrio otro juego mientras tanto, se abre solo.
      const autoplay = shownJob === job.id && currentView === "create" && lastOpenedAt < job.startedAt;
      if (shownJob === job.id) {
        renderProgress({ title: "«" + level.narrative.title + "» está listo", stages: STAGES_CUSTOM, index: STAGES_CUSTOM.length, text: "" });
        setTimeout(hideProgress, 900);
        shownJob = null;
      }
      notify({
        kind: "success",
        title: "«" + level.narrative.title + "» está listo",
        text: job.adopted ? "Lo pediste en otra pestaña o dispositivo; ya se puede jugar aquí." : "Tu juego a medida ya se puede jugar.",
        action: autoplay ? null : { label: "Jugar ahora", run: play },
      });
      if (autoplay) play();
    } catch (err) {
      if (!jobs.has(job.id)) return;
      jobs.delete(job.id);
      renderJobs();
      if (shownJob === job.id) { hideProgress(); shownJob = null; showError(err.message); }
      notify({ kind: "error", title: "No se pudo crear «" + job.title + "»", text: err.message });
      if (job.adopted) loadQuota();
    }
  }

  /** Aviso en vivo sobre un trabajo: actualiza su etapa o, si termino, lo consulta ya. */
  function onJobEvent(event) {
    const job = jobs.get(event.id);
    if (!job) {
      // De otra pestana u otro dispositivo de la misma cuenta: se sigue aqui tambien.
      trackJob({ job: event.id, title: event.title }, { adopted: true, status: event.status, stage: event.stage });
      return;
    }
    job.status = event.status;
    if (event.stage) job.stage = event.stage;
    if (event.title && job.title === "tu juego") job.title = event.title;
    if (isFinished(job)) job.wake?.();
    else if (shownJob === job.id) showJobProgress(job);
  }

  /* ================= Tiempo real (WebSocket) ================= */

  // El navegador pide un ticket de un solo uso por HTTP (con la cookie de sesion) y con el abre el
  // WebSocket directo contra el backend. Si algo falla, todo sigue funcionando con el sondeo.
  const realtime = { ws: null, connected: false, wanted: false, retry: 0, timer: null, unsupported: false };

  function setLive(on) {
    realtime.connected = on;
    const job = shownJob && jobs.get(shownJob);
    if (job) showJobProgress(job);
  }

  async function connectRealtime() {
    clearTimeout(realtime.timer);
    if (!realtime.wanted || realtime.ws || realtime.unsupported || !("WebSocket" in window)) return;
    let ws;
    try {
      const res = await fetch("/api/realtime/ticket", { method: "POST" });
      // 404: backend sin tiempo real todavia; no tiene sentido insistir.
      if (res.status === 404) { realtime.unsupported = true; return; }
      if (!res.ok) throw new Error("sin ticket");
      const { ticket, url } = await res.json();
      if (!realtime.wanted || realtime.ws) return;
      ws = new WebSocket(url + (url.includes("?") ? "&" : "?") + "ticket=" + encodeURIComponent(ticket));
    } catch (_) {
      return scheduleReconnect();
    }
    realtime.ws = ws;
    ws.addEventListener("message", (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch (_) { return; }
      if (msg.type === "hello") {
        realtime.retry = 0;
        setLive(true);
        wakeJobs();
      } else if (msg.type === "job" && msg.job) {
        onJobEvent(msg.job);
      }
    });
    ws.addEventListener("close", () => {
      if (realtime.ws !== ws) return;
      realtime.ws = null;
      if (realtime.connected) { setLive(false); wakeJobs(); }
      scheduleReconnect();
    });
  }

  /** Reintenta con espera creciente: 1, 2, 4, 8, 16 y luego cada 30 s. */
  function scheduleReconnect() {
    if (!realtime.wanted) return;
    clearTimeout(realtime.timer);
    const delay = Math.min(30_000, 1000 * 2 ** realtime.retry++);
    realtime.timer = setTimeout(connectRealtime, delay);
  }

  function startRealtime() {
    realtime.wanted = true;
    realtime.retry = 0;
    connectRealtime();
  }

  function stopRealtime() {
    realtime.wanted = false;
    clearTimeout(realtime.timer);
    const ws = realtime.ws;
    realtime.ws = null;
    realtime.connected = false;
    if (ws) ws.close();
  }

  // Al volver a la pestana o recuperar la red no se espera al siguiente reintento.
  const reconnectNow = () => {
    if (!realtime.wanted || realtime.ws) return;
    realtime.retry = 0;
    connectRealtime();
  };
  window.addEventListener("online", reconnectNow);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") reconnectNow(); });

  $("jobs-pill").addEventListener("click", () => {
    go("create");
    const latest = [...jobs.values()].pop();
    if (latest) { shownJob = latest.id; showJobProgress(latest); }
    $("progress").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  /* ================= Generar ================= */

  const input = $("description");
  const submit = $("submit");
  const errorEl = $("error");
  const canvas = $("game");
  let game = null;
  let current = null;
  let generating = false;

  function showError(message) {
    errorEl.textContent = message;
    if (message) errorEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function generate() {
    const description = input.value.trim();
    if (!description) { input.focus(); return; }
    if (generating) return;
    generating = true;
    showError("");
    submit.disabled = true;
    $("submit-label").textContent = "Generando…";
    if (currentView !== "create") go("create");
    shownJob = null;
    renderProgress({ title: "Generando tu juego", stages: STAGES_FAST, index: 0, text: "Interpretando lo que pediste…", startedAt: Date.now() });
    try {
      const res = await fetch("/api/levels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const level = await res.json().catch(() => ({}));
      if (res.status === 401) { hideProgress(); showAuth(); return; }
      if (!res.ok) {
        if (level.code === "custom_limit" && level.limit) { quota = { used: level.limit, limit: level.limit, retryAt: level.retryAt }; renderQuota(); }
        throw new Error(level.error || "Error al generar el nivel.");
      }
      // Un juego a medida en proceso se reconoce por el campo job, no por el 202: un proxy
      // puede cambiar el codigo y entonces se trataria la respuesta como un nivel terminado.
      if (level.job) {
        trackJob(level);
        return;
      }
      hideProgress();
      if (level.saved) {
        levelCache.set(level.id, level);
        addMine({ id: level.id, title: level.narrative.title, description: level.description, label: genreLabel(level.tag), tag: level.tag, layout: level.layout, createdAt: level.createdAt });
      }
      playLevel(level);
    } catch (err) {
      hideProgress();
      showError(err.message);
    } finally {
      generating = false;
      submit.disabled = false;
      $("submit-label").textContent = "Generar";
    }
  }

  $("form").addEventListener("submit", (event) => { event.preventDefault(); generate(); });
  $("tips").append(...TIPS.map((tip) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tip";
    b.textContent = tip;
    b.addEventListener("click", () => { input.value = tip; input.focus(); });
    return b;
  }));

  /* ================= Jugar ================= */

  // Politica de seguridad del juego a medida: sin red, sin formularios y sin recursos externos.
  const CUSTOM_CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; form-action \'none\'">';

  /** Pone la politica (y codigo propio, si hay) al principio del <head>, sin desplazar el doctype. */
  function withPolicy(html, extra = "") {
    const head = CUSTOM_CSP + extra;
    const at = html.search(/<head[^>]*>/i);
    if (at !== -1) {
      const end = html.indexOf(">", at) + 1;
      return html.slice(0, end) + head + html.slice(end);
    }
    const doctype = html.match(/^\s*<!doctype[^>]*>/i);
    return doctype ? doctype[0] + head + html.slice(doctype[0].length) : head + html;
  }

  function showCustomGame(level) {
    const frame = $("custom-frame");
    canvas.hidden = true;
    frame.hidden = false;
    frame.srcdoc = withPolicy(level.html);
    frame.onload = () => frame.focus();
  }

  function hideCustomGame() {
    const frame = $("custom-frame");
    frame.hidden = true;
    frame.removeAttribute("srcdoc");
    canvas.hidden = false;
  }

  function showTab(name) {
    $$("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
    if (name === "play") canvas.focus({ preventScroll: true });
  }
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

  const SOURCE = {
    ai: { className: "ai", text: "Interpretado por IA", icon: '<path d="m12 3 1.9 5.8L20 10l-5 3.6L16.5 20 12 16.4 7.5 20 9 13.6 4 10l6.1-1.2z"/>', title: "Claude interpretó tu descripción." },
    keywords: { className: "keywords", text: "Modo sin IA", icon: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>', title: "Interpretado por palabras clave, sin IA: puede que el resultado sea menos preciso." },
  };

  function playLevel(level) {
    current = level;
    lastOpenedAt = Date.now();
    showError("");
    if (currentView !== "create") go("create");

    // Titulo, historia y frase del jefe (niveles de un backend antiguo pueden no traerla).
    const story = level.narrative;
    $("story").hidden = !story;
    if (story) {
      $("story-title").textContent = story.title;
      $("story-text").textContent = story.story;
      $("story-boss").textContent = story.bossLine ? `«${story.bossLine}»` : "";
      $("story-boss").hidden = !story.bossLine;
    }
    // Solo se sabe quien interpreto en los pedidos de esta sesion (la API no lo guarda).
    const source = SOURCE[level.interpretedBy];
    $("source-chip").hidden = !source;
    if (source) {
      $("source-chip").className = "source-chip " + source.className;
      $("source-chip").innerHTML = svg(source.icon);
      $("source-chip").append(source.text);
      $("source-chip").title = source.title;
    }
    $("story-note").textContent = level.adaptationNote || "";
    $("story-note").hidden = !level.adaptationNote;

    $("chips").replaceChildren(...(level.interpretation || []).map((text) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = text;
      return chip;
    }));

    // Los ejemplos no estan guardados: no tienen imagen ni enlace propio.
    const saved = Boolean(level.id) && !String(level.id).startsWith("ejemplo-");
    $("share").hidden = !saved;
    $("edit-level").hidden = !mine.some((m) => m.id === level.id);
    $("share-label").textContent = "Compartir";
    if (saved && level.imageUrl) $("image").src = level.imageUrl;
    const custom = level.layout === "custom";
    document.querySelector('[data-tab="image"]').hidden = !saved || custom;
    document.querySelector('[data-tab="ascii"]').hidden = custom;
    $("ascii").textContent = level.ascii || "";
    $("hint").textContent = level.controls || "";

    $("result").hidden = false;
    stopWatching();
    if (game) game.destroy();
    game = null;
    if (custom) {
      window.TouchControls.detach();
      showCustomGame(level);
    } else {
      hideCustomGame();
      game = window.LevelGame.create(canvas, level);
      const touchHint = window.TouchControls.attach(game, level, canvas, $("touch-controls"));
      if (touchHint) $("hint").textContent = touchHint;
      watchGame();
    }
    showTab("play");
    // En un telefono interesa ver el juego y sus controles; la historia queda justo encima.
    const onTouch = window.TouchControls.isTouchDevice();
    (onTouch ? document.querySelector('[data-panel="play"]') : $("story")).scrollIntoView({ behavior: "smooth", block: onTouch ? "center" : "start" });
  }

  /* ================= Game Over ================= */

  // Todos los modos marcan la derrota con state.status = "lost": se vigila desde aqui y la
  // pantalla sirve para los 11 estilos. Si el jugador reinicia con R, se cierra sola.
  const GAMEOVER_DELAY_MS = 700;
  let watchId = 0;
  let overTimer = 0;
  let lastStatus = null;
  let roundStart = 0;

  /** Cierra la pantalla de derrota o de victoria, la que este abierta. */
  function hideGameOver() {
    clearTimeout(overTimer);
    $("gameover").hidden = true;
    $("victory").hidden = true;
  }

  function stopWatching() {
    cancelAnimationFrame(watchId);
    hideGameOver();
  }

  function watchGame() {
    stopWatching();
    lastStatus = "playing";
    roundStart = performance.now();
    const tick = () => {
      if (!game) return;
      const status = game.state && game.state.status;
      if (status !== lastStatus) {
        if (status === "lost" || status === "won") {
          const elapsed = performance.now() - roundStart;
          const show = status === "won" ? showVictory : showGameOver;
          overTimer = setTimeout(() => show(elapsed), GAMEOVER_DELAY_MS);
        } else {
          hideGameOver();
          if (status === "playing") roundStart = performance.now();
        }
        lastStatus = status;
      }
      watchId = requestAnimationFrame(tick);
    };
    watchId = requestAnimationFrame(tick);
  }

  /** El aviso del juego explica por que se perdio; se le quita la instruccion final. */
  function lossReason(state) {
    let reason = String(game.message || "").replace(/\s*[-–·.]?\s*Pulsa R.*$/i, "").trim();
    if (!reason || /^has perdido$/i.test(reason)) reason = state.hp === 0 ? "Te quedaste sin vidas." : "Esta vez no pudo ser.";
    return /[.!?»]$/.test(reason) ? reason : reason + ".";
  }

  const formatTime = (ms) => {
    const total = Math.round(ms / 1000);
    return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0");
  };

  /** Guarda el record de este nivel y devuelve los numeros que muestran las dos pantallas. */
  function roundResult() {
    const score = Math.max(0, Math.round(game.state.score || 0));
    const key = "best:" + (current.id || "ejemplo:" + current.layout);
    const best = Number(storage.get(key)) || 0;
    const record = score > best;
    if (record) storage.set(key, String(score));
    return { score, best: Math.max(best, score), record: record && score > 0 };
  }

  function showGameOver(elapsed) {
    if (!game || !current) return;
    const state = game.state;
    const { score, best, record } = roundResult();
    $("go-reason").textContent = lossReason(state);
    $("go-score").textContent = score.toLocaleString("es");
    $("go-time").textContent = formatTime(elapsed);
    $("go-best").textContent = best.toLocaleString("es");
    $("go-record").hidden = !record;
    $("gameover").hidden = false;
    $("go-retry").focus({ preventScroll: true });
  }

  /* ---------- Victoria y nivel siguiente ---------- */

  // Los juegos libres (HTML de la IA) no avisan si se ganan: la cadena es para los 11 estilos.
  const stageOf = (level) => level.stage || 1;
  let advancing = false;

  function showVictory(elapsed) {
    if (!game || !current) return;
    const { score, best, record } = roundResult();
    const stage = stageOf(current);
    $("vc-kicker").textContent = `Nivel ${stage} superado`;
    $("vc-next").textContent = `Sigue el nivel ${stage + 1}: más enemigos, más peligros y un mapa más grande.`;
    $("vc-score").textContent = score.toLocaleString("es");
    $("vc-time").textContent = formatTime(elapsed);
    $("vc-best").textContent = best.toLocaleString("es");
    $("vc-record").hidden = !record;
    $("vc-error").hidden = true;
    $("victory").hidden = false;
    $("vc-next-btn").focus({ preventScroll: true });
  }

  async function playNextLevel() {
    if (!current || advancing) return;
    advancing = true;
    const button = $("vc-next-btn");
    button.setAttribute("aria-busy", "true");
    $("vc-next-label").textContent = "Preparando…";
    $("vc-error").hidden = true;
    try {
      const res = await fetch(`/api/levels/${encodeURIComponent(current.id)}/next`, { method: "POST" });
      const level = await res.json().catch(() => ({}));
      if (res.status === 401) { hideGameOver(); showAuth(); return; }
      if (!res.ok) throw new Error(level.error || "No se pudo preparar el siguiente nivel.");
      hideGameOver();
      if (level.saved) {
        levelCache.set(level.id, level);
        addMine({ id: level.id, title: level.narrative.title, description: level.description, label: genreLabel(level.tag), tag: level.tag, layout: level.layout, createdAt: level.createdAt });
      }
      playLevel(level);
      toast({ kind: "success", title: `Nivel ${stageOf(level)}`, text: "Un poco más difícil que el anterior. ¡Suerte!" });
    } catch (err) {
      $("vc-error").textContent = err.message === "Failed to fetch" ? "Sin conexión. Revisa tu red e inténtalo de nuevo." : err.message;
      $("vc-error").hidden = false;
    } finally {
      advancing = false;
      button.removeAttribute("aria-busy");
      $("vc-next-label").textContent = "Siguiente nivel";
    }
  }

  $("vc-next-btn").addEventListener("click", playNextLevel);
  $("vc-retry").addEventListener("click", () => {
    if (!game) return;
    game.restart();
    hideGameOver();
    canvas.focus({ preventScroll: true });
  });
  $("vc-other").addEventListener("click", () => { hideGameOver(); go(mine.length ? "mine" : "examples"); });
  $("vc-peek").addEventListener("click", () => { hideGameOver(); canvas.focus({ preventScroll: true }); });

  // El juego escucha el teclado en toda la ventana: Enter o Espacio sobre un boton de estas
  // pantallas tambien reiniciaria la partida. Se cortan aqui; el clic del boton sigue igual.
  for (const id of ["gameover", "victory"]) {
    $(id).addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") event.stopPropagation();
    });
  }

  $("go-retry").addEventListener("click", () => {
    if (!game) return;
    game.restart();
    hideGameOver();
    canvas.focus({ preventScroll: true });
  });
  $("go-variant").addEventListener("click", () => { hideGameOver(); generate(); });
  $("go-other").addEventListener("click", () => { hideGameOver(); go(mine.length ? "mine" : "examples"); });
  $("go-peek").addEventListener("click", () => { hideGameOver(); canvas.focus({ preventScroll: true }); });
  document.addEventListener("keydown", (event) => {
    const open = !$("gameover").hidden || !$("victory").hidden;
    if (event.key === "Escape" && open) { hideGameOver(); canvas.focus({ preventScroll: true }); }
    if ((event.key === "n" || event.key === "N") && !$("victory").hidden && !event.metaKey && !event.ctrlKey) playNextLevel();
  });

  $("restart").addEventListener("click", () => {
    if (current && current.layout === "custom") showCustomGame(current);
    else if (game) { game.restart(); canvas.focus(); }
  });
  $("regen").addEventListener("click", generate);

  async function shareLink(id, title) {
    const url = location.origin + location.pathname + "?nivel=" + encodeURIComponent(id);
    try {
      if (navigator.share && window.TouchControls.isTouchDevice()) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ kind: "success", title: "Enlace copiado", text: "Cualquiera con el enlace y una cuenta puede jugar «" + title + "»." });
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      prompt("Copia este enlace:", url);
    }
  }

  $("share").addEventListener("click", () => {
    if (current && current.id) shareLink(current.id, current.narrative ? current.narrative.title : "Artificial Levels");
  });

  // Un enlace ?nivel=<id> abre ese juego en cuanto hay sesion.
  async function openSharedLevel() {
    const id = new URLSearchParams(location.search).get("nivel");
    if (!id) return;
    history.replaceState(null, "", location.pathname + location.hash);
    const level = await fetchLevel(id);
    if (level) playLevel(level);
    else showError("Ese juego ya no existe o el enlace está incompleto.");
  }

  /* ================= Editor de escenarios ================= */

  // Copia de las reglas del backend (que es quien decide): que casillas usa cada estilo.
  // Carreras no se edita: su recorrido se calcula aparte del mapa.
  const EDITABLE = {
    maze: ["wall", "floor", "start", "exit", "trap", "enemy", "item", "boss"],
    dungeon: ["wall", "floor", "start", "exit", "trap", "enemy", "item", "boss"],
    cave: ["wall", "floor", "start", "exit", "trap", "enemy", "item", "boss"],
    platformer: ["wall", "floor", "start", "exit", "trap", "enemy", "item", "boss"],
    arcade: ["wall", "floor", "start", "enemy", "item", "power", "boss"],
    survival: ["wall", "floor", "start", "trap", "enemy", "item", "boss"],
    shooter: ["wall", "floor", "trap", "enemy", "item", "boss"],
    invaders: ["wall", "floor", "enemy", "boss"],
    breakout: ["wall", "floor", "trap", "enemy", "item", "power", "boss"],
    snake: ["wall", "floor", "start", "trap", "item"],
  };
  const FIXED_START = new Set(["shooter", "invaders", "breakout"]);
  const UNIQUE = new Set(["start", "exit", "boss"]);
  const CELL_CODE = { wall: "#", floor: ".", start: "S", exit: "E", trap: "^", enemy: "M", item: "$", boss: "B", power: "P" };
  const CELL_LABEL = { wall: "Pared", floor: "Suelo", start: "Inicio", exit: "Salida", trap: "Trampa", enemy: "Enemigo", item: "Objeto", power: "Poder", boss: "Jefe" };
  const LABEL_BY_LAYOUT = {
    arcade: { item: "Punto" },
    survival: { enemy: "Aparición", item: "Curación" },
    shooter: { item: "Diana", enemy: "Blanco móvil", trap: "Bomba" },
    invaders: { enemy: "Invasor" },
    breakout: { item: "Bloque", trap: "Explosivo", enemy: "Bloque duro" },
    snake: { item: "Comida" },
  };
  const cellLabel = (layout, cell) => (LABEL_BY_LAYOUT[layout] || {})[cell] || CELL_LABEL[cell];

  const ed = { level: null, grid: null, original: null, tool: "wall", undo: [], redo: [], size: 16, painting: false, last: null, hover: null, busy: false };
  const editor = $("editor");
  const edCanvas = $("ed-canvas");

  /** Dibuja una casilla. Figuras simples y reconocibles; los colores de pared y suelo son los del tema. */
  function drawCell(ctx, cell, x, y, s, palette, alt) {
    ctx.fillStyle = cell === "wall" ? palette.wall : alt ? palette.floorAlt || palette.floor : palette.floor;
    ctx.fillRect(x, y, s, s);
    if (cell === "wall") {
      ctx.fillStyle = palette.wallAccent || "rgba(255,255,255,.12)";
      ctx.fillRect(x, y, s, Math.max(1, s * 0.18));
      return;
    }
    const cx = x + s / 2, cy = y + s / 2, r = s * 0.36;
    ctx.lineWidth = Math.max(1, s / 12);
    switch (cell) {
      case "trap":
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.moveTo(cx, y + s * 0.15); ctx.lineTo(x + s * 0.85, y + s * 0.82); ctx.lineTo(x + s * 0.15, y + s * 0.82); ctx.closePath(); ctx.fill();
        break;
      case "enemy":
        ctx.fillStyle = "#a855f7";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillRect(cx - r * 0.5, cy - r * 0.25, r * 0.32, r * 0.32); ctx.fillRect(cx + r * 0.18, cy - r * 0.25, r * 0.32, r * 0.32);
        break;
      case "item":
        ctx.fillStyle = "#facc15";
        ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r * 0.8, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r * 0.8, cy); ctx.closePath(); ctx.fill();
        break;
      case "power":
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#ecfeff"; ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2); ctx.stroke();
        break;
      case "boss":
        ctx.fillStyle = "#dc2626";
        ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 1.1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fde047";
        ctx.beginPath(); ctx.moveTo(cx - r * 0.8, cy - r * 0.5); ctx.lineTo(cx - r * 0.4, cy - r * 1.1); ctx.lineTo(cx, cy - r * 0.6); ctx.lineTo(cx + r * 0.4, cy - r * 1.1); ctx.lineTo(cx + r * 0.8, cy - r * 0.5); ctx.closePath(); ctx.fill();
        break;
      case "start":
        ctx.fillStyle = "#22c55e";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#052e16";
        ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 0.5); ctx.lineTo(cx + r * 0.55, cy); ctx.lineTo(cx - r * 0.35, cy + r * 0.5); ctx.closePath(); ctx.fill();
        break;
      case "exit":
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(x + s * 0.22, y + s * 0.12, s * 0.56, s * 0.76);
        ctx.fillStyle = "#dbeafe";
        ctx.fillRect(x + s * 0.58, y + s * 0.48, s * 0.08, s * 0.08);
        break;
    }
  }

  function paintMap() {
    const { grid, size: s, level } = ed;
    const h = grid.length, w = grid[0].length;
    const dpr = window.devicePixelRatio || 1;
    edCanvas.width = w * s * dpr;
    edCanvas.height = h * s * dpr;
    edCanvas.style.width = w * s + "px";
    edCanvas.style.height = h * s + "px";
    const ctx = edCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) drawCell(ctx, grid[y][x], x * s, y * s, s, level.palette, (x + y) % 2 === 1);
    if (s >= 10) {
      ctx.strokeStyle = "rgba(255,255,255,.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < w; x++) { ctx.moveTo(x * s + 0.5, 0); ctx.lineTo(x * s + 0.5, h * s); }
      for (let y = 1; y < h; y++) { ctx.moveTo(0, y * s + 0.5); ctx.lineTo(w * s, y * s + 0.5); }
      ctx.stroke();
    }
    if (ed.hover) {
      ctx.strokeStyle = lockedCell(ed.hover.x, ed.hover.y) ? "rgba(239,68,68,.9)" : "rgba(255,255,255,.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(ed.hover.x * s + 1, ed.hover.y * s + 1, s - 2, s - 2);
    }
  }

  function renderTools() {
    const layout = ed.level.layout;
    const counts = {};
    for (const row of ed.grid) for (const cell of row) counts[cell] = (counts[cell] || 0) + 1;
    const tools = EDITABLE[layout].filter((cell) => !(cell === "start" && FIXED_START.has(layout)));
    $("ed-tools").replaceChildren(...tools.map((cell) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ed-tool";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(ed.tool === cell));
      const icon = document.createElement("canvas");
      icon.width = icon.height = 44;
      const ictx = icon.getContext("2d");
      ictx.scale(2, 2);
      drawCell(ictx, cell, 0, 0, 22, ed.level.palette, false);
      const name = document.createElement("span");
      name.textContent = cellLabel(layout, cell);
      b.append(icon, name);
      if (!["wall", "floor"].includes(cell)) {
        const n = document.createElement("span");
        n.className = "count";
        n.textContent = counts[cell] || 0;
        b.append(n);
      }
      b.addEventListener("click", () => { ed.tool = cell; renderTools(); });
      return b;
    }));
  }

  const rowsOf = (grid) => grid.map((row) => row.map((c) => CELL_CODE[c]).join(""));
  const cloneGrid = (grid) => grid.map((row) => row.slice());
  const mapChanged = () => ed.grid && rowsOf(ed.grid).join("\n") !== rowsOf(ed.original).join("\n");
  const textChanged = () => ed.level && ($("ed-title").value.trim() !== ed.level.narrative.title || $("ed-story").value.trim() !== (ed.level.narrative.story || ""));
  const dirty = () => textChanged() || (ed.grid && mapChanged());

  function lockedCell(x, y) {
    const h = ed.grid.length, w = ed.grid[0].length;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) return true;
    return FIXED_START.has(ed.level.layout) && ed.original[y][x] === "start";
  }

  function syncHistory() {
    $("ed-undo").disabled = ed.undo.length === 0;
    $("ed-redo").disabled = ed.redo.length === 0;
    $("ed-reset").disabled = !mapChanged();
  }

  function snapshot() {
    ed.undo.push(cloneGrid(ed.grid));
    if (ed.undo.length > 60) ed.undo.shift();
    ed.redo = [];
  }

  /** Pinta una casilla con el pincel. Inicio, salida y jefe son unicos: el anterior pasa a suelo. */
  function paintAt(x, y) {
    if (lockedCell(x, y) || ed.grid[y][x] === ed.tool) return false;
    if (UNIQUE.has(ed.tool)) {
      for (const row of ed.grid) for (let i = 0; i < row.length; i++) if (row[i] === ed.tool) row[i] = "floor";
    }
    ed.grid[y][x] = ed.tool;
    return true;
  }

  function cellFromEvent(event) {
    const rect = edCanvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / ed.size);
    const y = Math.floor((event.clientY - rect.top) / ed.size);
    return x >= 0 && y >= 0 && y < ed.grid.length && x < ed.grid[0].length ? { x, y } : null;
  }

  /** Une los puntos del arrastre para que un movimiento rapido no deje huecos. */
  function strokeTo(to) {
    const from = ed.last || to;
    const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1);
    let changed = false;
    for (let i = 1; i <= steps; i++) {
      changed = paintAt(Math.round(from.x + ((to.x - from.x) * i) / steps), Math.round(from.y + ((to.y - from.y) * i) / steps)) || changed;
    }
    ed.last = to;
    return changed;
  }

  edCanvas.addEventListener("pointerdown", (event) => {
    if (!ed.grid || event.button > 0) return;
    const cell = cellFromEvent(event);
    if (!cell) return;
    try { edCanvas.setPointerCapture(event.pointerId); } catch (_) { /* puntero ya liberado */ }
    snapshot();
    ed.painting = true;
    ed.last = null;
    strokeTo(cell);
    afterPaint();
  });
  edCanvas.addEventListener("pointermove", (event) => {
    if (!ed.grid) return;
    const cell = cellFromEvent(event);
    ed.hover = event.pointerType === "mouse" ? cell : null;
    if (ed.painting && cell) strokeTo(cell);
    paintMap();
  });
  const endStroke = () => {
    if (!ed.painting) return;
    ed.painting = false;
    ed.last = null;
    // Un trazo que no cambio nada no ocupa un paso de deshacer.
    if (ed.undo.length && rowsOf(ed.undo[ed.undo.length - 1]).join() === rowsOf(ed.grid).join()) ed.undo.pop();
    afterPaint();
  };
  edCanvas.addEventListener("pointerup", endStroke);
  edCanvas.addEventListener("pointercancel", endStroke);
  edCanvas.addEventListener("pointerleave", () => { ed.hover = null; if (ed.grid) paintMap(); });

  function afterPaint() {
    $("ed-error").textContent = "";
    paintMap();
    renderTools();
    syncHistory();
  }

  function stepHistory(from, to) {
    if (!from.length) return;
    to.push(cloneGrid(ed.grid));
    ed.grid = from.pop();
    afterPaint();
  }
  $("ed-undo").addEventListener("click", () => stepHistory(ed.undo, ed.redo));
  $("ed-redo").addEventListener("click", () => stepHistory(ed.redo, ed.undo));
  $("ed-reset").addEventListener("click", () => { snapshot(); ed.grid = cloneGrid(ed.original); afterPaint(); });

  /** Tamano de casilla: que el mapa quepa a lo ancho si se puede, sin bajar de lo que se puede tocar. */
  function fitMap() {
    if (!ed.grid) return;
    const box = $("ed-map-scroll").clientWidth - 2 || 600;
    const touch = window.TouchControls.isTouchDevice();
    ed.size = Math.max(touch ? 14 : 9, Math.min(30, Math.floor(box / ed.grid[0].length)));
    paintMap();
  }

  async function openEditor(id) {
    const level = await fetchLevel(id);
    if (!level) { toast({ kind: "error", title: "No se pudo abrir", text: "Ese juego ya no existe." }); return; }
    ed.level = level;
    ed.undo = [];
    ed.redo = [];
    ed.hover = null;
    const editable = Boolean(EDITABLE[level.layout]) && Array.isArray(level.grid);
    ed.grid = editable ? cloneGrid(level.grid) : null;
    ed.original = editable ? cloneGrid(level.grid) : null;
    ed.tool = editable ? "wall" : null;

    $("editor-sub").textContent = level.layout === "custom" ? "Juego libre" : genreLabel(level.tag) + (level.width ? ` · ${level.width}×${level.height}` : "");
    $("ed-title").value = level.narrative.title;
    $("ed-story").value = level.narrative.story || "";
    updateStoryCount();
    $("ed-error").textContent = "";
    $$("#editor .field").forEach((f) => f.classList.remove("invalid"));
    $("ed-tools-wrap").hidden = !editable;
    $("ed-map-section").hidden = !editable;
    $("ed-nomap").hidden = editable;
    $("ed-nomap-text").textContent = level.layout === "custom"
      ? "Este juego lo escribió la IA a medida: no tiene un mapa de casillas. Puedes cambiar su título y su historia."
      : "En las carreras el circuito se calcula junto con el recorrido de los rivales, así que el mapa no se puede editar. Puedes cambiar el título y la historia.";

    editor.showModal();
    if (editable) { fitMap(); renderTools(); syncHistory(); }
    if (!window.TouchControls.isTouchDevice()) $("ed-title").focus();
  }

  function updateStoryCount() {
    $("ed-story-count").textContent = `(${$("ed-story").value.length}/240)`;
  }
  $("ed-story").addEventListener("input", updateStoryCount);

  function closeEditor() {
    if (ed.busy) return;
    if (dirty() && !confirm("¿Descartar los cambios sin guardar?")) return;
    editor.close();
  }
  $("editor-close").addEventListener("click", closeEditor);
  $("ed-cancel").addEventListener("click", closeEditor);
  editor.addEventListener("cancel", (event) => { event.preventDefault(); closeEditor(); });
  editor.addEventListener("close", () => { ed.level = null; ed.grid = null; });
  window.addEventListener("resize", () => { if (editor.open) fitMap(); });

  // El juego escucha el teclado en toda la ventana: mientras se edita no debe moverse ni reiniciarse.
  editor.addEventListener("keydown", (event) => {
    if (event.key === "Escape") return;
    const typing = /INPUT|TEXTAREA/.test(event.target.tagName);
    if (!typing && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) stepHistory(ed.redo, ed.undo); else stepHistory(ed.undo, ed.redo);
    }
    event.stopPropagation();
  });

  $("editor-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (ed.busy || !ed.level) return;
    const level = ed.level;
    const body = {};
    const title = $("ed-title").value.trim();
    const story = $("ed-story").value.trim();
    if (title !== level.narrative.title) body.title = title;
    if (story !== (level.narrative.story || "")) body.story = story;
    if (ed.grid && mapChanged()) body.rows = rowsOf(ed.grid);
    $$("#editor .field").forEach((f) => f.classList.remove("invalid"));
    if (!title) { $("ed-title-field").classList.add("invalid"); $("ed-error").textContent = "El título no puede quedar vacío."; return; }
    if (!Object.keys(body).length) { editor.close(); return; }

    ed.busy = true;
    $("ed-save").setAttribute("aria-busy", "true");
    $("ed-save").textContent = "Guardando…";
    try {
      const res = await fetch("/api/levels/" + encodeURIComponent(level.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { ed.busy = false; editor.close(); showAuth(); return; }
      if (!res.ok) {
        if (data.field === "title" || data.field === "story") $(`ed-${data.field}-field`).classList.add("invalid");
        throw new Error(data.error || "No se pudieron guardar los cambios.");
      }
      levelCache.set(data.id, data);
      shots.delete("lv:" + data.id);
      storage.remove(snapKey(data.id));
      mine = mine.map((m) => (m.id === data.id ? { ...m, title: data.narrative.title } : m));
      renderMine();
      ed.busy = false;
      editor.close();
      if (current && current.id === data.id) playLevel(data);
      toast({ kind: "success", title: "Cambios guardados", text: body.rows ? "El mapa nuevo ya se puede jugar." : "«" + data.narrative.title + "» quedó actualizado." });
    } catch (err) {
      $("ed-error").textContent = err.message === "Failed to fetch" ? "Sin conexión. Revisa tu red e inténtalo de nuevo." : err.message;
    } finally {
      ed.busy = false;
      $("ed-save").removeAttribute("aria-busy");
      $("ed-save").textContent = "Guardar cambios";
    }
  });

  $("edit-level").addEventListener("click", () => { if (current && current.id) openEditor(current.id); });

  /* ================= Ajustes ================= */

  const settings = $("settings");
  const openSettings = () => { closePopover(); paintTheme(); settings.showModal(); };
  $("open-settings").addEventListener("click", openSettings);
  $$("[data-open-settings]").forEach((b) => b.addEventListener("click", openSettings));
  $("settings-close").addEventListener("click", () => settings.close());
  settings.addEventListener("click", (event) => { if (event.target === settings) settings.close(); });
  $("clear-previews").addEventListener("click", () => {
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("snap:")).forEach((k) => localStorage.removeItem(k));
    } catch (_) {}
    for (const key of [...shots.keys()]) if (key.startsWith("lv:")) shots.delete(key);
    renderMine();
    settings.close();
    toast({ kind: "info", title: "Vistas previas reiniciadas", text: "Se vuelven a capturar en unos segundos." });
  });

  /* ================= Perfil ================= */

  let me = null;
  const SINCE = new Intl.DateTimeFormat("es", { month: "long", year: "numeric" });
  const cleanSpaces = (v) => v.trim().replace(/\s+/g, " ");

  /** Foto si la hay; si no, o si no carga, la inicial del nombre. */
  function paintAvatar(el, user) {
    const initial = () => { el.textContent = user.name.charAt(0).toUpperCase(); };
    el.replaceChildren();
    if (!user.avatarUrl) return initial();
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.addEventListener("error", initial, { once: true });
    img.src = user.avatarUrl;
    el.append(img);
  }

  /** Pinta los datos del usuario en todos los sitios donde aparecen. */
  function setUser(user) {
    me = user;
    paintAvatar($("user-avatar"), user);
    paintAvatar($("profile-avatar"), user);
    $("user-name").textContent = user.name;
    $("user-panel-name").textContent = user.name;
    $("user-panel-email").textContent = user.email;
    $("greeting").textContent = `Hola, ${user.name}. ¿Qué quieres jugar hoy?`;
    $("profile-name").textContent = user.name;
    $("profile-email").textContent = user.email;
    $("profile-since").textContent = user.createdAt ? "Cuenta creada en " + SINCE.format(new Date(user.createdAt)) : "";
    $("photo-remove").hidden = !user.avatarUrl;
    $("photo-pick-2").textContent = user.avatarUrl ? "Cambiar foto" : "Subir foto";
    fillProfileForm();
  }

  function renderProfileStats() {
    $("stat-saved").textContent = String(mine.length);
    $("stat-custom").textContent = String(mine.filter((l) => l.layout === "custom").length);
  }

  /** Peticion al perfil. Los errores llevan el campo culpable, si el servidor lo dice. */
  async function profileRequest(method, url, body, type = "application/json") {
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: body === undefined ? {} : { "Content-Type": type },
        body: body === undefined ? undefined : type === "application/json" ? JSON.stringify(body) : body,
      });
    } catch (_) {
      throw new Error("No hay conexión con el servidor. Inténtalo de nuevo.");
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      toast({ kind: "error", title: "Tu sesión terminó", text: "Vuelve a iniciar sesión para guardar los cambios." });
      logout();
      throw Object.assign(new Error(""), { silent: true });
    }
    if (!res.ok) throw Object.assign(new Error(data.error || "No se pudo guardar. Inténtalo de nuevo."), { field: data.field });
    return data;
  }

  function clearInvalid(form) {
    form.querySelectorAll(".field.invalid").forEach((f) => f.classList.remove("invalid"));
    form.querySelectorAll("[aria-invalid]").forEach((i) => i.removeAttribute("aria-invalid"));
  }
  function markInvalid(inputId) {
    const input = $(inputId);
    if (!input) return;
    input.closest(".field").classList.add("invalid");
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }

  // Mostrar u ocultar cualquier contrasena del perfil.
  $$("[data-reveal]").forEach((b) => b.addEventListener("click", () => {
    const field = $(b.dataset.reveal);
    const show = field.type === "password";
    field.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", String(show));
    b.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
  }));

  // ---- Datos personales ----
  const pf = {
    form: $("profile-form"), name: $("pf-name"), email: $("pf-email"), phone: $("pf-phone"),
    current: $("pf-current"), currentField: $("pf-current-field"), save: $("pf-save"), reset: $("pf-reset"), error: $("pf-error"),
  };

  /** La misma regla que el servidor: vacio vale (es opcional); si no, de 7 a 15 digitos. */
  function validPhone(value) {
    const phone = cleanSpaces(value);
    const digits = phone.replace(/\D/g, "").length;
    return !phone || (phone.length <= 25 && /^\+?[\d\s().-]+$/.test(phone) && digits >= 7 && digits <= 15);
  }

  /** Solo lo que cambio respecto a lo guardado, con la misma limpieza que hace el servidor. */
  function profileChanges() {
    if (!me) return {};
    const changes = {};
    if (cleanSpaces(pf.name.value) !== me.name) changes.name = pf.name.value;
    if (pf.email.value.trim().toLowerCase() !== me.email) changes.email = pf.email.value;
    if ((cleanSpaces(pf.phone.value) || null) !== (me.phone || null)) changes.phone = pf.phone.value;
    return changes;
  }

  function updateProfileDirty() {
    const changes = profileChanges();
    const dirty = Object.keys(changes).length > 0;
    pf.save.disabled = !dirty;
    pf.reset.hidden = !dirty;
    pf.currentField.hidden = !("email" in changes);
    if (pf.currentField.hidden) pf.current.value = "";
  }

  function fillProfileForm() {
    if (!me) return;
    pf.name.value = me.name;
    pf.email.value = me.email;
    pf.phone.value = me.phone || "";
    pf.current.value = "";
    pf.error.textContent = "";
    clearInvalid(pf.form);
    updateProfileDirty();
  }

  pf.form.addEventListener("input", (event) => {
    event.target.closest(".field")?.classList.remove("invalid");
    pf.error.textContent = "";
    updateProfileDirty();
  });
  pf.reset.addEventListener("click", fillProfileForm);

  pf.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const changes = profileChanges();
    if (Object.keys(changes).length === 0) return;
    clearInvalid(pf.form);
    pf.error.textContent = "";
    // Lo evidente se avisa sin ir al servidor.
    if (!cleanSpaces(pf.name.value)) { pf.error.textContent = "Escribe tu nombre."; return markInvalid("pf-name"); }
    if (!pf.email.checkValidity() || !pf.email.value.trim()) { pf.error.textContent = "El correo no es válido."; return markInvalid("pf-email"); }
    if ("phone" in changes && !validPhone(pf.phone.value)) {
      pf.error.textContent = "El teléfono no es válido: usa solo números, espacios, guiones y un + inicial (de 7 a 15 dígitos).";
      return markInvalid("pf-phone");
    }
    if ("email" in changes) {
      if (!pf.current.value) { pf.error.textContent = "Escribe tu contraseña actual para cambiar el correo."; return markInvalid("pf-current"); }
      changes.currentPassword = pf.current.value;
    }
    pf.save.disabled = true;
    pf.save.textContent = "Guardando…";
    try {
      const { user } = await profileRequest("PATCH", "/api/profile", changes);
      setUser(user);
      const what = ["name" in changes && "nombre", "email" in changes && "correo", "phone" in changes && "teléfono"].filter(Boolean);
      toast({ kind: "success", title: "Perfil actualizado", text: "Guardamos tu " + what.join(", ").replace(/, ([^,]*)$/, " y $1") + "." });
    } catch (err) {
      if (err.silent) return;
      pf.error.textContent = err.message;
      markInvalid({ name: "pf-name", email: "pf-email", phone: "pf-phone", currentPassword: "pf-current" }[err.field]);
    } finally {
      pf.save.textContent = "Guardar cambios";
      updateProfileDirty();
    }
  });

  // ---- Contrasena ----
  const pw = { form: $("password-form"), current: $("pw-current"), next: $("pw-new"), confirm: $("pw-confirm"), save: $("pw-save"), error: $("pw-error") };

  /** Puntuacion orientativa de 0 a 4: largo y variedad de caracteres. */
  function passwordScore(value) {
    if (value.length < 8) return value ? 1 : 0;
    const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^\w\s]/].filter((re) => re.test(value)).length;
    return Math.min(4, 1 + (value.length >= 12) + (kinds >= 2) + (kinds >= 3 || value.length >= 16));
  }
  const SCORE_TEXT = ["Mínimo 8 caracteres.", "Muy corta: mínimo 8 caracteres.", "Aceptable. Más larga sería mejor.", "Buena.", "Muy buena."];

  pw.form.addEventListener("input", (event) => {
    event.target.closest(".field")?.classList.remove("invalid");
    pw.error.textContent = "";
    const score = passwordScore(pw.next.value);
    $("pw-meter").dataset.score = String(score);
    $("pw-meter-text").textContent = SCORE_TEXT[score];
  });

  function resetPasswordForm() {
    pw.form.reset();
    pw.error.textContent = "";
    clearInvalid(pw.form);
    $("pw-meter").dataset.score = "0";
    $("pw-meter-text").textContent = SCORE_TEXT[0];
    pw.form.querySelectorAll("[data-reveal]").forEach((b) => {
      $(b.dataset.reveal).type = "password";
      b.setAttribute("aria-pressed", "false");
    });
  }

  pw.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearInvalid(pw.form);
    const fail = (text, id) => { pw.error.textContent = text; markInvalid(id); };
    if (!pw.current.value) return fail("Escribe tu contraseña actual.", "pw-current");
    if (pw.next.value.length < 8) return fail("La nueva contraseña debe tener al menos 8 caracteres.", "pw-new");
    if (pw.next.value !== pw.confirm.value) return fail("Las contraseñas nuevas no coinciden.", "pw-confirm");
    if (pw.next.value === pw.current.value) return fail("La nueva contraseña debe ser distinta de la actual.", "pw-new");
    pw.save.disabled = true;
    pw.save.textContent = "Cambiando…";
    try {
      await profileRequest("PUT", "/api/profile/password", { currentPassword: pw.current.value, newPassword: pw.next.value });
      resetPasswordForm();
      toast({ kind: "success", title: "Contraseña cambiada", text: "Cerramos tu sesión en los demás dispositivos; aquí sigues dentro." });
    } catch (err) {
      if (err.silent) return;
      fail(err.message, { currentPassword: "pw-current", newPassword: "pw-new" }[err.field]);
    } finally {
      pw.save.disabled = false;
      pw.save.textContent = "Cambiar contraseña";
    }
  });

  // ---- Foto ----
  const MAX_PHOTO_INPUT = 20 * 1024 * 1024;
  const PHOTO_SIZE = 320;

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No pudimos leer esa imagen. Prueba con una JPG o PNG.")); };
      img.src = url;
    });
  }

  /** Recorta al centro en cuadrado y reduce a 320 px en JPEG: unos 30 KB en vez de varios MB. */
  async function squarePhoto(file) {
    const img = await loadImage(file);
    const w = img.naturalWidth, h = img.naturalHeight;
    const side = Math.min(w, h);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = PHOTO_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; // un PNG transparente no queda negro en JPEG
    ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No pudimos procesar la imagen."))), "image/jpeg", 0.88));
  }

  function setPhotoBusy(busy) {
    $("photo-busy").hidden = !busy;
    ["photo-pick", "photo-pick-2", "photo-remove"].forEach((id) => ($(id).disabled = busy));
  }

  async function uploadPhoto(file) {
    if (!file.type.startsWith("image/")) return toast({ kind: "error", title: "Eso no es una imagen", text: "Elige una foto JPG, PNG o WebP." });
    if (file.size > MAX_PHOTO_INPUT) return toast({ kind: "error", title: "La imagen es muy grande", text: "Elige una de menos de 20 MB." });
    setPhotoBusy(true);
    try {
      const blob = await squarePhoto(file);
      const { user } = await profileRequest("PUT", "/api/profile/avatar", blob, "image/jpeg");
      setUser(user);
      toast({ kind: "success", title: "Foto actualizada" });
    } catch (err) {
      if (!err.silent) toast({ kind: "error", title: "No se pudo cambiar la foto", text: err.message });
    } finally {
      setPhotoBusy(false);
    }
  }

  const photoInput = $("photo-input");
  const pickPhoto = () => photoInput.click();
  $("photo-pick").addEventListener("click", pickPhoto);
  $("photo-pick-2").addEventListener("click", pickPhoto);
  photoInput.addEventListener("change", () => {
    const file = photoInput.files[0];
    photoInput.value = ""; // asi elegir la misma foto otra vez tambien dispara el cambio
    if (file) uploadPhoto(file);
  });

  const photoDrop = $("profile-photo");
  ["dragenter", "dragover"].forEach((type) => photoDrop.addEventListener(type, (event) => {
    if (![...event.dataTransfer.types].includes("Files")) return;
    event.preventDefault();
    photoDrop.classList.add("drop");
  }));
  ["dragleave", "drop"].forEach((type) => photoDrop.addEventListener(type, () => photoDrop.classList.remove("drop")));
  photoDrop.addEventListener("drop", (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) uploadPhoto(file);
  });

  $("photo-remove").addEventListener("click", async () => {
    if (!confirm("¿Quitar tu foto de perfil?")) return;
    setPhotoBusy(true);
    try {
      const { user } = await profileRequest("DELETE", "/api/profile/avatar");
      setUser(user);
      toast({ kind: "info", title: "Foto quitada" });
    } catch (err) {
      if (!err.silent) toast({ kind: "error", title: "No se pudo quitar la foto", text: err.message });
    } finally {
      setPhotoBusy(false);
    }
  });

  $("open-profile").addEventListener("click", () => { closePopover(); go("profile"); });

  /* ================= Sesion ================= */

  let authMode = "login";
  const AUTH_COPY = {
    login: { title: "Hola de nuevo", subtitle: "Inicia sesión para seguir creando.", submit: "Iniciar sesión", hint: "¿No tienes cuenta? Elige «Crear cuenta»." },
    register: { title: "Crea tu cuenta", subtitle: "Tus juegos quedan guardados y los retomas cuando quieras.", submit: "Crear cuenta", hint: "¿Ya tienes cuenta? Elige «Iniciar sesión»." },
  };

  function setAuthMode(mode) {
    authMode = mode;
    const copy = AUTH_COPY[mode];
    $$("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    $("field-name").hidden = mode !== "register";
    $("auth-title").textContent = copy.title;
    $("auth-subtitle").textContent = copy.subtitle;
    $("auth-submit").textContent = copy.submit;
    $("auth-switch-hint").textContent = copy.hint;
    $("auth-password").autocomplete = mode === "register" ? "new-password" : "current-password";
    $("auth-error").textContent = "";
  }
  $$("[data-mode]").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));

  $("toggle-password").addEventListener("click", () => {
    const field = $("auth-password");
    const show = field.type === "password";
    field.type = show ? "text" : "password";
    $("toggle-password").setAttribute("aria-pressed", String(show));
    $("toggle-password").setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
    $("eye-open").toggleAttribute("hidden", show);
    $("eye-closed").toggleAttribute("hidden", !show);
  });

  function setChrome(on) {
    document.body.classList.toggle("app-on", on);
    $("sidebar").hidden = !on;
    $("search-wrap").hidden = !on;
    $("bell-wrap").hidden = !on;
    $("user-wrap").hidden = !on;
    updateFab();
  }

  function showAuth() {
    setChrome(false);
    $("boot-view").hidden = true;
    $("app-view").hidden = true;
    $("auth-view").hidden = false;
    // En un telefono, enfocar abriria el teclado y taparia la pantalla.
    if (!window.TouchControls.isTouchDevice()) $("auth-email").focus();
  }

  function showApp(user) {
    setChrome(true);
    $("boot-view").hidden = true;
    $("auth-view").hidden = true;
    $("app-view").hidden = false;
    setUser(user);
    showView(VIEW_BY_HASH[location.hash] || "create");
    if (currentView === "create" && !window.TouchControls.isTouchDevice()) input.focus();
    renderAllLibraries();
    renderModesGrid();
    renderNotifs();
    loadExamples();
    loadMine();
    loadQuota();
    startRealtime();
    openSharedLevel();
  }

  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = $("auth-submit");
    const payload = { email: $("auth-email").value, password: $("auth-password").value };
    if (authMode === "register") payload.name = $("auth-name").value;
    $("auth-error").textContent = "";
    button.disabled = true;
    try {
      const res = await fetch(`/api/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión.");
      $("auth-password").value = "";
      showApp(data.user);
    } catch (err) {
      $("auth-error").textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });

  $("user-btn").addEventListener("click", (event) => { event.stopPropagation(); togglePopover($("user-btn"), $("user-panel")); });

  async function logout() {
    closePopover();
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.TouchControls.detach();
    stopWatching();
    if (game) { game.destroy(); game = null; }
    hideCustomGame();
    // Lo del usuario anterior no debe quedar a la vista.
    me = null;
    stopRealtime();
    resetPasswordForm();
    mine = [];
    notifs = [];
    jobs.clear();
    quota = null;
    levelCache.clear();
    for (const key of [...shots.keys()]) if (key.startsWith("lv:")) shots.delete(key);
    renderMine();
    renderNotifs();
    renderJobs();
    renderQuota();
    hideProgress();
    $("result").hidden = true;
    $("story").hidden = true;
    $("chips").replaceChildren();
    search.value = "";
    filter.q = "";
    setAuthMode("login");
    showAuth();
  }
  $("logout").addEventListener("click", logout);
  $("side-logout").addEventListener("click", logout);

  /* ================= Arranque ================= */

  // El backend gratuito se duerme: mientras despierta, el proxy puede responder 5xx o cortar la conexion.
  // Se reintenta hasta ~90 s y, si tarda, se explica por que.
  const BOOT_DEADLINE = Date.now() + 90_000;
  const slowTimer = setTimeout(() => {
    $("boot-title").textContent = "Conectando con el servidor…";
    $("boot-detail").hidden = false;
  }, 2500);

  async function boot() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status < 500) {
        clearTimeout(slowTimer);
        const data = res.ok ? await res.json() : null;
        return data ? showApp(data.user) : showAuth();
      }
    } catch (_) {
      // red caida o conexion cortada: se reintenta
    }
    if (Date.now() < BOOT_DEADLINE) return setTimeout(boot, 3000);
    clearTimeout(slowTimer);
    document.querySelector("#boot-view .spinner").hidden = true;
    $("boot-title").textContent = "No pudimos conectar con el servidor.";
    $("boot-detail").textContent = "Revisa tu conexión y recarga la página en un momento.";
    $("boot-detail").hidden = false;
  }
  boot();
})();
