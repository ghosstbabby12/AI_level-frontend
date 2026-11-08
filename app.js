(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  /* ---------- Tema claro / oscuro ---------- */

  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return document.documentElement.dataset.theme || (systemDark.matches ? "dark" : "light");
  }

  function paintThemeIcon() {
    const dark = currentTheme() === "dark";
    // Los <svg> no tienen la propiedad .hidden: hay que usar el atributo.
    $("icon-sun").toggleAttribute("hidden", !dark);
    $("icon-moon").toggleAttribute("hidden", dark);
    $("theme-toggle").setAttribute("aria-label", dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }

  $("theme-toggle").addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
    paintThemeIcon();
  });
  systemDark.addEventListener("change", paintThemeIcon);
  paintThemeIcon();

  /* ---------- Sesion ---------- */

  let authMode = "login";

  function setAuthMode(mode) {
    authMode = mode;
    const register = mode === "register";
    document.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === mode)));
    $("field-name").hidden = !register;
    $("auth-submit").textContent = register ? "Crear cuenta" : "Iniciar sesión";
    $("auth-password").autocomplete = register ? "new-password" : "current-password";
    $("auth-switch-hint").textContent = register ? "¿Ya tienes cuenta? Elige «Iniciar sesión»." : "¿No tienes cuenta? Elige «Crear cuenta».";
    $("auth-error").textContent = "";
  }
  document.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));

  function setAppChrome(visible) {
    $("dock").hidden = !visible;
    $("top-nav").hidden = !visible;
    document.body.classList.toggle("with-dock", visible);
  }

  function showAuth() {
    setAppChrome(false);
    $("boot-view").hidden = true;
    $("app-view").hidden = true;
    $("user-menu").hidden = true;
    $("auth-view").hidden = false;
    // En un telefono, enfocar abriria el teclado y taparia la pantalla.
    if (!window.TouchControls.isTouchDevice()) $("auth-email").focus();
  }

  function showApp(user) {
    setAppChrome(true);
    $("boot-view").hidden = true;
    $("auth-view").hidden = true;
    $("app-view").hidden = false;
    $("user-menu").hidden = false;
    $("user-avatar").textContent = user.name.charAt(0).toUpperCase();
    $("user-name").textContent = user.name;
    $("greeting").textContent = `Hola, ${user.name}. ¿Qué nivel quieres jugar hoy?`;
    if (!window.TouchControls.isTouchDevice()) $("description").focus();
    loadExamples();
    loadMine();
    openSharedLevel();
  }

  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = $("auth-submit");
    const payload = { email: $("auth-email").value, password: $("auth-password").value };
    if (authMode === "register") payload.name = $("auth-name").value;

    $("auth-error").textContent = "";
    submit.disabled = true;
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
      submit.disabled = false;
    }
  });

  $("logout").addEventListener("click", async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.TouchControls.detach();
    if (game) { game.destroy(); game = null; }
    // Lo del usuario anterior no debe quedar a la vista.
    $("mine-list").replaceChildren();
    levelCache.clear();
    renderMineCount();
    $("result").hidden = true;
    $("story").hidden = true;
    setResultActions(false);
    $("chips").replaceChildren();
    setAuthMode("login");
    showAuth();
  });

  /* ---------- Generador ---------- */

  const EXAMPLES = [
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

  const input = $("description");
  const submit = $("submit");
  const errorEl = $("error");
  const canvas = $("game");
  let game = null;

  const PLAY_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
  const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>';

  /** Tarjeta con aspecto de poster. `meta` es una linea pequena opcional bajo el texto. */
  function makeCard({ tag, text, meta, onOpen, onRemove }) {
    const card = document.createElement(onRemove ? "div" : "button");
    card.className = "example";
    card.dataset.tag = tag;
    if (onRemove) {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); }
      });
    } else card.type = "button";
    const art = document.createElement("span");
    art.className = "art";
    art.setAttribute("aria-hidden", "true");
    const tagEl = document.createElement("span");
    tagEl.className = "tag";
    tagEl.textContent = tag;
    const textEl = document.createElement("span");
    textEl.className = "text";
    textEl.textContent = text;
    if (meta) {
      const metaEl = document.createElement("span");
      metaEl.className = "meta";
      metaEl.textContent = meta;
      textEl.append(document.createElement("br"), metaEl);
    }
    const play = document.createElement("span");
    play.className = "play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML = PLAY_ICON;
    card.append(art, tagEl, textEl, play);
    card.addEventListener("click", onOpen);
    if (onRemove) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.setAttribute("aria-label", "Borrar " + text);
      remove.innerHTML = TRASH_ICON;
      remove.addEventListener("click", (event) => { event.stopPropagation(); onRemove(card); });
      remove.addEventListener("keydown", (event) => event.stopPropagation());
      card.appendChild(remove);
    }
    return { card, art };
  }

  // Capturas: se juega el nivel unos segundos fuera de pantalla y se fotografia.
  // Van de una en una y en ratos libres, para no trabar la pagina.
  const shotCanvas = document.createElement("canvas");
  const thumb = document.createElement("canvas");
  thumb.width = 320;
  thumb.height = 200;
  const shotQueue = [];
  let shooting = false;
  const PREVIEW_INPUT = { racing: "ArrowUp", platformer: "ArrowRight", arcade: "ArrowLeft" };
  const PREVIEW_SECONDS = 4.2;
  const IDLE_LIMIT = 150;

  function capture(level) {
    const preview = window.LevelGame.create(shotCanvas, level, { manual: true });
    try {
      if (PREVIEW_INPUT[level.layout]) preview.press(PREVIEW_INPUT[level.layout]);
      for (let i = 0; i < PREVIEW_SECONDS * 60; i++) preview.step(1 / 60);
      preview.render();
      const g = thumb.getContext("2d");
      g.imageSmoothingEnabled = true;
      g.drawImage(shotCanvas, 0, 0, thumb.width, thumb.height);
      return thumb.toDataURL("image/jpeg", 0.82);
    } finally {
      preview.destroy();
    }
  }

  function queueShot(art, getLevel) {
    shotQueue.push({ art, getLevel });
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
        if (job.art.isConnected) {
          const level = await job.getLevel();
          if (level) {
            job.art.style.backgroundImage = "url(" + capture(level) + ")";
            job.art.classList.add("shot");
          }
        }
      } catch (_) {
        // Sin captura la tarjeta conserva su degradado.
      }
      nextShot();
    });
  }

  /** La API envia la cuadricula de los ejemplos compacta: una cadena por fila. */
  const CELL = { "#": "wall", ".": "floor", S: "start", E: "exit", "^": "trap", M: "enemy", $: "item", B: "boss", P: "power" };
  const unpack = (level) => (level.grid || !level.rows ? level : { ...level, grid: level.rows.map((row) => [...row].map((c) => CELL[c])) });

  async function loadExamples() {
    let list;
    try {
      const res = await fetch("/api/levels/examples");
      if (!res.ok) throw new Error();
      list = (await res.json()).map((e) => ({ ...e, level: unpack(e.level) }));
    } catch (_) {
      list = EXAMPLES;
    }
    $("examples").replaceChildren();
    for (const example of list) {
      // Con el nivel ya generado se juega al instante y sin gastar IA; si no, se genera.
      const open = example.level
        ? () => { input.value = example.text; playLevel(example.level); }
        : () => { input.value = example.text; generate(); };
      const { card, art } = makeCard({ tag: example.tag, text: example.text, onOpen: open });
      $("examples").appendChild(card);
      if (example.level) queueShot(art, async () => example.level);
    }
  }

  /* ---------- Mis juegos ---------- */

  const DATE = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const levelCache = new Map();

  async function fetchLevel(id) {
    if (levelCache.has(id)) return levelCache.get(id);
    const res = await fetch("/api/levels/" + encodeURIComponent(id));
    if (!res.ok) return null;
    const level = await res.json();
    levelCache.set(id, level);
    return level;
  }

  function renderMineCount() {
    const n = $("mine-list").children.length;
    $("mine-section").hidden = n === 0;
    $("nav-mine").hidden = n === 0;
    $("mine-count").textContent = n === 1 ? "1 juego" : n + " juegos";
  }

  function addMineCard(summary, atStart) {
    const { card, art } = makeCard({
      tag: summary.tag || summary.label,
      text: summary.title,
      meta: (summary.label || "") + " · " + DATE.format(new Date(summary.createdAt)),
      onOpen: async () => {
        const level = await fetchLevel(summary.id);
        if (level) { input.value = level.description; playLevel(level); }
        else errorEl.textContent = "No se pudo abrir ese juego.";
      },
      onRemove: async (el) => {
        if (!confirm("¿Borrar «" + summary.title + "»? No se puede deshacer.")) return;
        const res = await fetch("/api/levels/" + encodeURIComponent(summary.id), { method: "DELETE" });
        if (res.ok || res.status === 404) {
          el.remove();
          levelCache.delete(summary.id);
          renderMineCount();
        }
      },
    });
    card.dataset.id = summary.id;
    if (atStart) $("mine-list").prepend(card);
    else $("mine-list").appendChild(card);
    // Los juegos a medida corren aislados y no se pueden fotografiar: conservan su degradado.
    if (summary.layout !== "custom") queueShot(art, () => fetchLevel(summary.id));
    renderMineCount();
  }

  async function loadMine() {
    $("mine-list").replaceChildren();
    try {
      const res = await fetch("/api/levels/mine");
      if (!res.ok) throw new Error();
      for (const summary of await res.json()) addMineCard(summary, false);
    } catch (_) {
      // Sin la lista se puede seguir creando y jugando.
    }
    renderMineCount();
  }

  function showTab(name) {
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
    if (name === "play") canvas.focus();
  }
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("restart").addEventListener("click", () => {
    if (current && current.layout === "custom") showCustomGame(current);
    else if (game) { game.restart(); canvas.focus(); }
  });
  $("regen").addEventListener("click", generate);

  let current = null;

  // Politica de seguridad del juego a medida: sin red, sin formularios y sin recursos externos.
  const CUSTOM_CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data: blob:; media-src data: blob:; font-src data:; form-action \'none\'">';

  function showCustomGame(level) {
    const frame = $("custom-frame");
    canvas.hidden = true;
    frame.hidden = false;
    // La politica va antes que el contenido del juego para que rija desde el principio.
    frame.srcdoc = CUSTOM_CSP + level.html;
    frame.onload = () => frame.focus();
  }

  function hideCustomGame() {
    const frame = $("custom-frame");
    frame.hidden = true;
    frame.removeAttribute("srcdoc");
    canvas.hidden = false;
  }

  function playLevel(level) {
    current = level;
    errorEl.textContent = "";
    // Titulo, historia y frase del jefe (niveles de un backend antiguo pueden no traerla).
    const story = level.narrative;
    $("story").hidden = !story;
    if (story) {
      $("story-title").textContent = story.title;
      $("story-text").textContent = story.story;
      $("story-boss").textContent = story.bossLine ? `«${story.bossLine}»` : "";
      $("story-boss").hidden = !story.bossLine;
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
    setResultActions(true);
    if (game) game.destroy();
    game = null;
    if (custom) {
      window.TouchControls.detach();
      showCustomGame(level);
      showTab("play");
      $("story").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    hideCustomGame();
    game = window.LevelGame.create(canvas, level);
    const touchHint = window.TouchControls.attach(game, level, canvas, $("touch-controls"));
    if (touchHint) $("hint").textContent = touchHint;
    showTab("play");
    // En un telefono interesa ver el juego y sus controles; la historia queda justo encima.
    const onTouch = window.TouchControls.isTouchDevice();
    (onTouch ? document.querySelector('[data-panel="play"]') : $("story")).scrollIntoView({ behavior: "smooth", block: onTouch ? "center" : "start" });
  }

  $("share").addEventListener("click", async () => {
    if (!current) return;
    const url = location.origin + location.pathname + "?nivel=" + encodeURIComponent(current.id);
    try {
      if (navigator.share && window.TouchControls.isTouchDevice()) await navigator.share({ title: current.narrative.title, url });
      else {
        await navigator.clipboard.writeText(url);
        $("share-label").textContent = "¡Enlace copiado!";
        setTimeout(() => ($("share-label").textContent = "Compartir"), 2000);
      }
    } catch (_) {
      prompt("Copia este enlace:", url);
    }
  });

  const JOB_POLL_MS = 2500;
  const JOB_TIMEOUT_MS = 5 * 60_000;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** El servidor esta escribiendo un juego nuevo: se muestra el progreso y se consulta hasta que termina. */
  async function waitForJob(pending) {
    $("progress").hidden = false;
    $("progress-title").textContent = pending.title ? "Creando «" + pending.title + "»…" : "Creando tu juego a medida…";
    const started = Date.now();
    try {
      while (Date.now() - started < JOB_TIMEOUT_MS) {
        await wait(JOB_POLL_MS);
        const res = await fetch("/api/levels/jobs/" + encodeURIComponent(pending.job));
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error || "No se pudo crear el juego.");
        if (body.status === "done") return body.level;
        const seconds = Math.round((Date.now() - started) / 1000);
        $("progress-text").textContent = "La IA está escribiendo un juego nuevo para ti (" + seconds + " s). Suele tardar uno o dos minutos.";
      }
      throw new Error("Está tardando demasiado. Inténtalo de nuevo en un momento.");
    } finally {
      $("progress").hidden = true;
    }
  }

  async function generate() {
    if (!input.value.trim()) { input.focus(); return; }
    errorEl.textContent = "";
    submit.disabled = true;
    submit.textContent = "Generando…";
    try {
      const res = await fetch("/api/levels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: input.value }),
      });
      const level = await res.json();
      if (res.status === 401) { showAuth(); return; }
      if (!res.ok) throw new Error(level.error || "Error al generar el nivel");
      // Un juego a medida en proceso se reconoce por el campo job, no por el 202: un proxy
      // puede cambiar el codigo y entonces se trataria la respuesta como un nivel terminado.
      const ready = level.job ? await waitForJob(level) : level;
      if (!ready) return;
      if (ready !== level) Object.assign(level, ready);
      if (level.saved) {
        levelCache.set(level.id, level);
        addMineCard({ id: level.id, title: level.narrative.title, label: ((level.interpretation || [])[0] || "").replace("Tipo: ", ""), tag: level.tag, layout: level.layout, createdAt: level.createdAt }, true);
      }
      playLevel(level);
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      submit.disabled = false;
      submit.textContent = "Generar";
    }
  }

  $("form").addEventListener("submit", (event) => { event.preventDefault(); generate(); });

  /* ---------- Dock y navegacion ---------- */

  function setResultActions(enabled) {
    document.querySelectorAll('[data-dock="result"], [data-dock="regen"]').forEach((b) => (b.disabled = !enabled));
  }

  const DOCK_ACTIONS = {
    create: () => { window.scrollTo({ top: 0, behavior: "smooth" }); input.focus({ preventScroll: true }); },
    intro: () => $("intro").scrollIntoView({ behavior: "smooth" }),
    result: () => { $("chips").scrollIntoView({ behavior: "smooth" }); canvas.focus({ preventScroll: true }); },
    regen: () => generate(),
    logout: () => $("logout").click(),
  };
  document.querySelectorAll("[data-dock]").forEach((b) => b.addEventListener("click", () => DOCK_ACTIONS[b.dataset.dock]()));

  // Resalta en el dock y en la barra superior la seccion visible: la ultima cuyo inicio ya paso el 35% de la pantalla.
  const SPY = [
    { el: $("create"), dock: "create", nav: "#create" },
    { el: $("result"), dock: "result", nav: "#create" },
    { el: $("mine"), dock: "intro", nav: "#mine" },
    { el: $("intro"), dock: "intro", nav: "#intro" },
    { el: $("how"), dock: "intro", nav: "#how" },
  ];
  let spyQueued = false;
  function updateSpy() {
    spyQueued = false;
    const line = window.innerHeight * 0.35;
    let current = SPY[0];
    for (const section of SPY) {
      if (section.el.offsetParent !== null && section.el.getBoundingClientRect().top <= line) current = section;
    }
    document.querySelectorAll("[data-dock]").forEach((b) => b.classList.toggle("active", b.dataset.dock === current.dock));
    document.querySelectorAll(".topnav a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === current.nav));
  }
  window.addEventListener("scroll", () => {
    if (!spyQueued) { spyQueued = true; requestAnimationFrame(updateSpy); }
  }, { passive: true });
  updateSpy();

  // Un enlace ?nivel=<id> abre ese juego en cuanto hay sesion.
  async function openSharedLevel() {
    const id = new URLSearchParams(location.search).get("nivel");
    if (!id) return;
    history.replaceState(null, "", location.pathname);
    const level = await fetchLevel(id);
    if (level) playLevel(level);
    else errorEl.textContent = "Ese juego ya no existe o el enlace está incompleto.";
  }

  /* ---------- Arranque ---------- */

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
