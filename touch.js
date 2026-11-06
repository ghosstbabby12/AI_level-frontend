// Controles tactiles: traducen gestos y botones a las mismas teclas que usa el teclado,
// asi cada juego funciona sin saber si se esta jugando en un telefono.
window.TouchControls = (function () {
  "use strict";

  const LEFT = { label: "◀", code: "ArrowLeft", name: "Izquierda" };
  const RIGHT = { label: "▶", code: "ArrowRight", name: "Derecha" };
  // Recorrido de la palanca: se ajusta al tamano real, que cambia en horizontal.
  const JOYSTICK_TRAVEL = 0.35;
  const JOYSTICK_DEADZONE = 0.3;
  // Con 8 direcciones: cada eje se activa pasado este angulo respecto al otro.
  const AXIS_THRESHOLD = 0.38;
  const SWIPE_DISTANCE = 22;

  const FREE = {
    stick: true,
    buttons: [{ label: "Impulso", code: "ShiftLeft", small: true }, { label: "Atacar", code: "Space", primary: true }],
    hint: "Joystick para moverte · Atacar golpea hacia donde miras · Impulso te hace esquivar",
  };

  const LAYOUTS = {
    maze: FREE,
    dungeon: FREE,
    cave: FREE,
    survival: { ...FREE, hint: "Joystick para moverte · Atacar golpea hacia donde miras · Impulso te hace esquivar · Sobrevive a todas las oleadas" },
    platformer: {
      pad: [LEFT, RIGHT],
      buttons: [{ label: "Saltar", code: "ArrowUp", primary: true }],
      hint: "Mantén Saltar para llegar más alto · Pisa a los enemigos desde arriba",
    },
    arcade: { dpad: true, swipe: true, hint: "Desliza el dedo sobre el juego o usa la cruceta · Sigues avanzando solo · Recógelo todo" },
    snake: { dpad: true, swipe: true, hint: "Desliza el dedo sobre el juego o usa la cruceta para girar · No choques" },
    racing: {
      pad: [LEFT, RIGHT],
      buttons: [{ label: "Objeto", code: "Space", small: true }, { label: "Freno", code: "ArrowDown", small: true }, { label: "Gas", code: "ArrowUp", primary: true }],
      hint: "Mantén Gas para acelerar y gira con las flechas · Las cajas dan objetos: úsalos con Objeto",
    },
    invaders: {
      buttons: [{ label: "Disparar", code: "Space", primary: true, wide: true }],
      hint: "Arrastra el dedo sobre el juego para mover la nave · También dispara mientras tocas",
    },
    breakout: { hint: "Arrastra el dedo sobre el juego para mover la paleta · Toca para lanzar la pelota" },
    shooter: { hint: "Toca cada diana para dispararle · No toques las bombas" },
  };

  let detach = null;

  // Permite al CSS mostrar lo que en escritorio aparece al pasar el raton.
  if (isTouchDevice()) document.documentElement.classList.add("touch-device");

  function isTouchDevice() {
    if (/[?&]touch=1\b/.test(location.search)) return true;
    return window.matchMedia("(pointer: coarse)").matches;
  }

  function button(game, config, listeners) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "touch-btn" + (config.primary ? " primary" : "") + (config.small ? " small" : "") + (config.wide ? " wide" : "");
    el.textContent = config.label;
    el.setAttribute("aria-label", config.name || config.label);

    const down = (event) => {
      event.preventDefault();
      if (el.setPointerCapture && event.pointerId !== undefined) {
        try { el.setPointerCapture(event.pointerId); } catch (_) {}
      }
      el.classList.add("held");
      game.press(config.code);
      if (navigator.vibrate) navigator.vibrate(8);
    };
    const up = () => {
      el.classList.remove("held");
      game.release(config.code);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("lostpointercapture", up);
    // Evita el menu contextual al mantener pulsado en Android.
    el.addEventListener("contextmenu", (event) => event.preventDefault());
    listeners.push(up);
    return el;
  }

  function joystick(game, listeners) {
    const base = document.createElement("div");
    base.className = "touch-stick";
    base.setAttribute("role", "application");
    base.setAttribute("aria-label", "Joystick");
    const knob = document.createElement("div");
    knob.className = "touch-knob";
    base.appendChild(knob);

    const CODES = { left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown" };
    const setAxis = (code, on) => (on ? game.press(code) : game.release(code));
    const releaseAll = () => {
      Object.values(CODES).forEach((code) => game.release(code));
      knob.style.transform = "";
    };

    const move = (event) => {
      const rect = base.getBoundingClientRect();
      const radius = rect.width * JOYSTICK_TRAVEL || 46;
      let dx = (event.clientX - (rect.left + rect.width / 2)) / radius;
      let dy = (event.clientY - (rect.top + rect.height / 2)) / radius;
      const length = Math.hypot(dx, dy);
      if (length > 1) {
        dx /= length;
        dy /= length;
      }
      knob.style.transform = "translate(" + dx * radius + "px," + dy * radius + "px)";
      const active = length > JOYSTICK_DEADZONE;
      setAxis(CODES.left, active && dx < -AXIS_THRESHOLD);
      setAxis(CODES.right, active && dx > AXIS_THRESHOLD);
      setAxis(CODES.up, active && dy < -AXIS_THRESHOLD);
      setAxis(CODES.down, active && dy > AXIS_THRESHOLD);
    };

    let dragging = false;
    base.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      dragging = true;
      if (base.setPointerCapture && event.pointerId !== undefined) {
        try { base.setPointerCapture(event.pointerId); } catch (_) {}
      }
      move(event);
    });
    base.addEventListener("pointermove", (event) => { if (dragging) move(event); });
    const end = () => {
      dragging = false;
      releaseAll();
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
    listeners.push(releaseAll);
    return base;
  }

  function dpad(game, listeners) {
    const grid = document.createElement("div");
    grid.className = "touch-dpad";
    for (const [label, code, name, area] of [["▲", "ArrowUp", "Arriba", "up"], ["◀", "ArrowLeft", "Izquierda", "left"], ["▶", "ArrowRight", "Derecha", "right"], ["▼", "ArrowDown", "Abajo", "down"]]) {
      const el = button(game, { label, code, name }, listeners);
      el.style.gridArea = area;
      grid.appendChild(el);
    }
    return grid;
  }

  /** Deslizar sobre el lienzo equivale a pulsar una flecha; cada tramo largo puede encadenar otro giro. */
  function attachSwipe(game, canvas) {
    let origin = null;
    const down = (event) => { origin = { x: event.clientX, y: event.clientY }; };
    const move = (event) => {
      if (!origin) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_DISTANCE) return;
      const code = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "ArrowRight" : "ArrowLeft") : dy > 0 ? "ArrowDown" : "ArrowUp";
      game.press(code);
      game.release(code);
      origin = { x: event.clientX, y: event.clientY };
    };
    const up = () => { origin = null; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }

  function attach(game, level, canvas, container) {
    if (detach) detach();
    if (!isTouchDevice()) return null;

    const config = LAYOUTS[level.layout] || {};
    const cleanups = [];
    const releases = [];
    container.replaceChildren();
    container.hidden = false;
    container.dataset.layout = level.layout;
    document.body.classList.add("touch-playing");

    canvas.style.touchAction = "none";

    const left = document.createElement("div");
    left.className = "touch-side";
    const right = document.createElement("div");
    right.className = "touch-side right";
    if (config.stick) left.appendChild(joystick(game, releases));
    if (config.dpad) left.appendChild(dpad(game, releases));
    for (const pad of config.pad || []) left.appendChild(button(game, pad, releases));
    for (const action of config.buttons || []) right.appendChild(button(game, action, releases));
    container.append(left, right);

    if (config.swipe) cleanups.push(attachSwipe(game, canvas));

    // Al terminar la partida, tocar el juego vuelve a empezar: no hay tecla R a mano.
    const restartOnTap = () => {
      if (game.state.status !== "playing") game.restart();
    };
    canvas.addEventListener("pointerup", restartOnTap);
    cleanups.push(() => canvas.removeEventListener("pointerup", restartOnTap));

    detach = () => {
      releases.forEach((release) => release());
      cleanups.forEach((clean) => clean());
      container.replaceChildren();
      container.hidden = true;
      canvas.style.touchAction = "";
      document.body.classList.remove("touch-playing");
      detach = null;
    };
    // En vertical el lienzo queda pequeno y el marcador cuesta de leer.
    const rotate = window.innerHeight > window.innerWidth ? " · Se ve mejor con el teléfono en horizontal" : "";
    return config.hint ? config.hint + rotate : null;
  }

  return {
    isTouchDevice,
    attach,
    detach: () => { if (detach) detach(); },
  };
})();
