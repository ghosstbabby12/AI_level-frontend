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
    $("auth-email").focus();
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
    $("description").focus();
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
    if (game) { game.destroy(); game = null; }
    $("result").hidden = true;
    setResultActions(false);
    $("chips").replaceChildren();
    setAuthMode("login");
    showAuth();
  });

  /* ---------- Generador ---------- */

  const EXAMPLES = [
    { tag: "Plataformas", text: "mapa tipo Mario Bros con trampas, diseño pixelado y jefe final" },
    { tag: "Laberinto", text: "un laberinto de hielo con trampas" },
    { tag: "Mazmorra", text: "mazmorra con salas, 5 trampas, muchos enemigos y jefe final, difícil" },
    { tag: "Espacio", text: "plataformas en el espacio con monedas, difícil" },
  ];

  const input = $("description");
  const submit = $("submit");
  const errorEl = $("error");
  const canvas = $("game");
  let game = null;

  for (const example of EXAMPLES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "example";
    button.dataset.tag = example.tag;
    const art = document.createElement("span");
    art.className = "art";
    art.setAttribute("aria-hidden", "true");
    const play = document.createElement("span");
    play.className = "play";
    play.setAttribute("aria-hidden", "true");
    play.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>';
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = example.tag;
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = example.text;
    button.append(art, tag, text, play);
    button.addEventListener("click", () => { input.value = example.text; generate(); });
    $("examples").appendChild(button);
  }

  function showTab(name) {
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
    if (name === "play") canvas.focus();
  }
  document.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
  $("restart").addEventListener("click", () => { if (game) game.restart(); canvas.focus(); });
  $("regen").addEventListener("click", generate);

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

      $("chips").replaceChildren(...level.interpretation.map((text) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = text;
        return chip;
      }));

      $("image").src = level.imageUrl;
      $("ascii").textContent = level.ascii;
      $("hint").textContent = level.layout === "platformer"
        ? "Mover: flechas o A/D · Saltar: ↑ / W / Espacio (mantén para saltar más alto) · Pisa a los enemigos y al jefe desde arriba · R reinicia"
        : "Mover: flechas o WASD · Atacar: caminar contra un enemigo o Espacio · Las trampas y enemigos quitan vida · R reinicia";

      $("result").hidden = false;
      setResultActions(true);
      if (game) game.destroy();
      game = window.LevelGame.create(canvas, level);
      showTab("play");
      $("chips").scrollIntoView({ behavior: "smooth", block: "start" });
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
