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

  const VIEW_BY_HASH = { "#crear": "create", "#mis-juegos": "mine", "#ejemplos": "examples", "#como-funciona": "how" };
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
    $("fab").hidden = !document.body.classList.contains("app-on") || promptVisible;
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
  const STAGES_CUSTOM = ["Interpretar", "En cola", "Escribir el juego", "Revisar y guardar"];
  let progressTimer = null;

  function renderProgress({ title, stages, index, text, startedAt }) {
    $("progress").hidden = false;
    $("progress-title").textContent = title;
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

  const JOB_POLL_MS = 2500;
  const JOB_TIMEOUT_MS = 6 * 60_000;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
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

  function customStage(job) {
    const seconds = (Date.now() - job.startedAt) / 1000;
    if (job.status === "pending") return { index: 1, text: "En cola: el servidor empezará en un momento." };
    return {
      index: 2,
      text: seconds < 70
        ? "La IA está escribiendo el código del juego. Suele tardar uno o dos minutos; puedes seguir usando la app y te avisaremos."
        : "Sigue escribiendo: los juegos con más reglas tardan un poco más. Después se revisa que el código funcione.",
    };
  }

  function showJobProgress(job) {
    const { index, text } = customStage(job);
    renderProgress({ title: "Creando «" + job.title + "»", stages: STAGES_CUSTOM, index, text, startedAt: job.startedAt });
  }

  async function trackJob(pending) {
    const job = { id: pending.job, title: pending.title || "tu juego", status: "pending", startedAt: Date.now() };
    jobs.set(job.id, job);
    shownJob = job.id;
    renderJobs();
    showJobProgress(job);
    if (quota) { quota = { ...quota, used: quota.used + 1 }; renderQuota(); }

    try {
      let level = null;
      while (!level) {
        if (Date.now() - job.startedAt > JOB_TIMEOUT_MS) throw new Error("Está tardando demasiado. Inténtalo de nuevo en un momento.");
        await wait(JOB_POLL_MS);
        const res = await fetch("/api/levels/jobs/" + encodeURIComponent(job.id));
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "No se pudo crear el juego.");
        if (body.status === "done") level = body.level;
        else {
          job.status = body.status || job.status;
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
      notify({ kind: "success", title: "«" + level.narrative.title + "» está listo", text: "Tu juego a medida ya se puede jugar.", action: autoplay ? null : { label: "Jugar ahora", run: play } });
      if (autoplay) play();
    } catch (err) {
      jobs.delete(job.id);
      renderJobs();
      if (shownJob === job.id) { hideProgress(); shownJob = null; showError(err.message); }
      notify({ kind: "error", title: "No se pudo crear «" + job.title + "»", text: err.message });
    }
  }

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

  function hideGameOver() {
    clearTimeout(overTimer);
    $("gameover").hidden = true;
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
        if (status === "lost") {
          const elapsed = performance.now() - roundStart;
          overTimer = setTimeout(() => showGameOver(elapsed), GAMEOVER_DELAY_MS);
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

  function showGameOver(elapsed) {
    if (!game || !current) return;
    const state = game.state;
    const score = Math.max(0, Math.round(state.score || 0));
    const key = "best:" + (current.id || "ejemplo:" + current.layout);
    const best = Number(storage.get(key)) || 0;
    const record = score > best;
    if (record) storage.set(key, String(score));
    $("go-reason").textContent = lossReason(state);
    $("go-score").textContent = score.toLocaleString("es");
    $("go-time").textContent = formatTime(elapsed);
    $("go-best").textContent = Math.max(best, score).toLocaleString("es");
    $("go-record").hidden = !record || score === 0;
    $("gameover").hidden = false;
    $("go-retry").focus({ preventScroll: true });
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
    if (event.key === "Escape" && !$("gameover").hidden) { hideGameOver(); canvas.focus({ preventScroll: true }); }
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
    $("user-avatar").textContent = user.name.charAt(0).toUpperCase();
    $("user-name").textContent = user.name;
    $("user-panel-name").textContent = user.name;
    $("greeting").textContent = `Hola, ${user.name}. ¿Qué quieres jugar hoy?`;
    showView(VIEW_BY_HASH[location.hash] || "create");
    if (currentView === "create" && !window.TouchControls.isTouchDevice()) input.focus();
    renderAllLibraries();
    renderModesGrid();
    renderNotifs();
    loadExamples();
    loadMine();
    loadQuota();
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
