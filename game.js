window.LevelGame = { modes: {} };

(function () {
  "use strict";

  const VIEW_W = 960;
  const VIEW_H = 600;
  const HUD_H = 48;

  const SPRITE_DEFS = {
    player: {
      rows: ["..rrrr..", ".rrrrrr.", ".ffeffe.", ".ffffff.", "..bbbb..", ".bbbbbb.", "..b..b..", ".ss..ss."],
      colors: { r: "#e53935", f: "#ffcc99", e: "#222222", b: "#1e64d0", s: "#6b3e1a" },
    },
    enemy: {
      rows: ["..cccc..", ".cccccc.", "cwwccwwc", "cwkccwkc", "cccccccc", ".cccccc.", "..dccd..", ".dd..dd."],
      colors: { c: "#b0602f", w: "#ffffff", k: "#111111", d: "#5a2d0c" },
    },
    boss: {
      rows: ["y.y..y.y", "yyyyyyyy", ".gggggg.", "gwkggwkg", "gggggggg", "gggmmggg", ".gggggg.", "gg.gg.gg"],
      colors: { y: "#ffd600", g: "#3aa64a", w: "#ffffff", k: "#111111", m: "#d32f2f" },
    },
    spike: {
      rows: ["........", "..l..l..", "..s..s..", ".lss.lss", ".sss.sss", "ssssssss", "dddddddd", "dddddddd"],
      colors: { l: "#f3f4f6", s: "#7b8194", d: "#2f3340" },
    },
    coin: {
      rows: ["..oooo..", ".oyyyyo.", ".oyywyo.", ".oyyyyo.", ".oyyyyo.", ".oyyyyo.", ".oyyyyo.", "..oooo.."],
      colors: { o: "#b8860b", y: "#ffd700", w: "#fff7b0" },
    },
    door: {
      rows: ["dddddddd", "dlllllld", "dlllllld", "dlllllld", "dllllyld", "dlllllld", "dlllllld", "dddddddd"],
      colors: { d: "#5d3a1a", l: "#a9713a", y: "#ffd54f" },
    },
    flag: {
      rows: [".gggg...", ".ggggg..", ".gggg...", ".p......", ".p......", ".p......", ".p......", "ppp....."],
      colors: { g: "#2ecc40", p: "#eeeeee" },
    },

    // ---- Objetos (level.kinds.item) ----
    gem: {
      rows: ["..cccc..", ".cwccdc.", "cwcccddc", "cccccddc", ".cccddc.", "..cddc..", "...dc...", "........"],
      colors: { c: "#38bdf8", w: "#e0f7ff", d: "#0369a1" },
    },
    key: {
      rows: ["........", ".yyy....", "y.w.y...", "y...yyyy", "y...y.y.", ".yyy..y.", "........", "........"],
      colors: { y: "#f5c518", w: "#fff3b0" },
    },
    weapon: {
      rows: ["......ll", ".....lwl", "....lwl.", "...lwl..", "g.lwl...", ".gg.....", ".hgg....", "h...g..."],
      colors: { l: "#94a3b8", w: "#f1f5f9", g: "#eab308", h: "#7c4a1e" },
    },
    potion: {
      rows: ["...cc...", "...gg...", "..g..g..", ".grrrrg.", ".rwrrrr.", ".rrrrrr.", "..rrrr..", "........"],
      colors: { c: "#8b5a2b", g: "#cfe8ff", r: "#e0245e", w: "#ffd1e0" },
    },
    star: {
      rows: ["...yy...", "...yy...", "yyyyyyyy", ".yywyyy.", "..yyyy..", ".yy..yy.", "yy....yy", "........"],
      colors: { y: "#facc15", w: "#fef9c3" },
    },
    fruit: {
      rows: ["....g...", "...g....", ".rrrrrr.", "rwrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrr.", "..rr.rr."],
      colors: { g: "#16a34a", r: "#dc2626", w: "#fecaca" },
    },

    // ---- Enemigos (level.kinds.enemy; "blob" usa el sprite "enemy") ----
    slime: {
      rows: ["........", "........", "..gggg..", ".gggggg.", "gwkggwkg", "gggggggg", "gggggggg", ".gddddg."],
      colors: { g: "#4ade80", d: "#16a34a", w: "#ffffff", k: "#111111" },
    },
    ghost: {
      rows: ["..wwww..", ".wwwwww.", "wwkwwkww", "wwkwwkww", "wwwwwwww", "wwwoowww", "wwwwwwww", "w.ww.w.w"],
      colors: { w: "#eef2ff", k: "#1e1b4b", o: "#a5b4fc" },
    },
    skeleton: {
      rows: ["..wwww..", ".wkwwkw.", ".wwwwww.", "..wkkw..", "...ww...", ".wwwwww.", "w..ww..w", "..w..w.."],
      colors: { w: "#e5e7eb", k: "#111111" },
    },
    robot: {
      rows: ["...rr...", ".mmmmmm.", ".mcmmcm.", ".mmmmmm.", "..mkkm..", ".mmmmmm.", ".m.mm.m.", ".mm..mm."],
      colors: { r: "#ef4444", m: "#94a3b8", c: "#22d3ee", k: "#334155" },
    },
    bat: {
      rows: ["........", "p..pp..p", "pp.pp.pp", "pprpprpp", ".pppppp.", "..p..p..", "........", "........"],
      colors: { p: "#6d28d9", r: "#f87171" },
    },

    // ---- Jefes (level.kinds.boss; "monster" usa el sprite "boss") ----
    dragon: {
      rows: [".r....r.", "rrr..rrr", ".rrrrrr.", "rwkrrwkr", "rrrrrrrr", "rryyyyrr", ".rrrrrr.", "rr.rr.rr"],
      colors: { r: "#dc2626", y: "#fbbf24", w: "#ffffff", k: "#111111" },
    },
    vampire: {
      rows: ["..kkkk..", ".kkffkk.", ".frffrf.", ".ffffff.", "..fwwf..", "pkkkkkkp", "pkkrrkkp", "pk.kk.kp"],
      colors: { k: "#111827", f: "#e5e7eb", r: "#dc2626", w: "#ffffff", p: "#7c3aed" },
    },
    mech: {
      rows: ["..rmmr..", ".mmmmmm.", "mmcmmcmm", "mmmmmmmm", "mkkkkkkm", "mmmmmmmm", ".mm..mm.", "mmm..mmm"],
      colors: { r: "#ef4444", m: "#64748b", c: "#22d3ee", k: "#1e293b" },
    },
  };

  // Perseguidores asustados o devueltos a la guarida en el modo arcade
  Object.assign(SPRITE_DEFS, {
    scared: {
      rows: ["..bbbb..", ".bbbbbb.", "bbwbbwbb", "bbwbbwbb", "bbbbbbbb", "bwbwbwbb", "bbbbbbbb", "b.bb.b.b"],
      colors: { b: "#2547d0", w: "#f8fafc" },
    },
    scaredFlash: {
      rows: ["..wwww..", ".wwwwww.", "wwrwwrww", "wwrwwrww", "wwwwwwww", "wrwrwrww", "wwwwwwww", "w.ww.w.w"],
      colors: { w: "#f8fafc", r: "#e11d48" },
    },
    eyes: {
      rows: ["........", "........", ".ww..ww.", ".wk..wk.", ".ww..ww.", "........", "........", "........"],
      colors: { w: "#f8fafc", k: "#2547d0" },
    },
  });

  SPRITE_DEFS.bomb = {
    rows: ["....fy..", "...f....", "..kkkk..", ".kkkkkk.", ".kwkkkk.", ".kkkkkk.", ".kkkkkk.", "..kkkk.."],
    colors: { k: "#111827", w: "#94a3b8", f: "#a16207", y: "#f97316" },
  };

  const ARCADE_BOSS_HP = { easy: 2, normal: 3, hard: 4 };
  const ENEMY_SPRITE = { blob: "enemy" };
  // "mixed": cada enemigo toma un aspecto distinto, fijo por posicion.
  const MIXED_ENEMIES = ["enemy", "slime", "ghost", "skeleton", "robot", "bat"];
  const BOSS_SPRITE = { monster: "boss" };
  const ITEM_LABEL = { coin: "Moneda", gem: "Gema", key: "Llave", weapon: "Arma", potion: "Poción", star: "Estrella", fruit: "Fruta" };

  function buildSprite(def) {
    const canvas = document.createElement("canvas");
    canvas.width = def.rows[0].length;
    canvas.height = def.rows.length;
    const g = canvas.getContext("2d");
    def.rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const color = def.colors[ch];
        if (color) {
          g.fillStyle = color;
          g.fillRect(x, y, 1, 1);
        }
      })
    );
    return canvas;
  }

  const SPRITES = {};
  for (const name of Object.keys(SPRITE_DEFS)) SPRITES[name] = buildSprite(SPRITE_DEFS[name]);

  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const target = amount < 0 ? 0 : 255;
    const t = Math.abs(amount);
    const mix = (c) => Math.round(c + (target - c) * t);
    const r = mix((n >> 16) & 255);
    const g = mix((n >> 8) & 255);
    const b = mix(n & 255);
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  const WALL_STYLE = {
    dungeon: "brick", lava: "brick", desert: "brick", overworld: "brick",
    ice: "bevel", water: "bevel", space: "bevel", forest: "leaf",
  };

  function tile8(paint) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const g = canvas.getContext("2d");
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        g.fillStyle = paint(x, y);
        g.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  function makeTextures(level) {
    const pal = level.palette;
    const style = WALL_STYLE[level.theme] || "brick";
    const dark = shade(pal.wall, -0.18);
    const light = shade(pal.wall, 0.18);

    const wallPaint = (variant) => (x, y) => {
      const n = hash(x, y, variant);
      if (style === "brick") {
        const band = y < 4 ? 0 : 1;
        const joints = band === 0 ? [3, 7] : [1, 5];
        if (y === 3 || y === 7 || joints.includes(x)) return pal.wallAccent;
      } else if (style === "bevel") {
        if (y === 0 || x === 0) return light;
        if (y === 7 || x === 7) return dark;
      }
      return n < 0.2 ? dark : n > 0.88 ? light : pal.wall;
    };

    const walls = [0, 1, 2, 3].map((v) => tile8(wallPaint(v)));
    const tops = [0, 1, 2, 3].map((v) =>
      tile8((x, y) => {
        if (y < 2) return pal.top;
        if (y === 2 && hash(x, 9, v) < 0.5) return shade(pal.top, -0.2);
        return wallPaint(v)(x, y);
      })
    );
    const floors = [0, 1, 2, 3].map((v) =>
      tile8((x, y) => (hash(x, y, v + 10) < 0.08 ? pal.floorAlt : (x + y + v) % 8 < 4 && v % 2 ? pal.floorAlt : pal.floor))
    );
    return { walls, tops, floors };
  }

  function createGame(canvas, level, options) {
    options = options || {};
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;

    // Aspecto elegido por la IA o el parser; niveles antiguos sin "kinds" usan los sprites clasicos.
    const kinds = level.kinds || {};
    const itemSprite = SPRITE_DEFS[kinds.item] ? kinds.item : "coin";
    const enemySprite = ENEMY_SPRITE[kinds.enemy] || (SPRITE_DEFS[kinds.enemy] ? kinds.enemy : "enemy");
    const bossSprite = BOSS_SPRITE[kinds.boss] || (SPRITE_DEFS[kinds.boss] ? kinds.boss : "boss");

    const grid = level.grid;
    const W = level.width;
    const H = level.height;
    const platformer = level.layout === "platformer";
    const arcade = level.layout === "arcade";
    const shooter = level.layout === "shooter";
    const survival = level.layout === "survival";
    const modeDef = window.LevelGame.modes[level.layout] || null;
    // Arcade: el tablero entero cabe en pantalla, dejando sitio al marcador.
    const T = platformer ? Math.floor(VIEW_H / H) : arcade ? Math.floor(Math.min(VIEW_W / W, (VIEW_H - HUD_H) / H)) : shooter ? Math.floor(Math.min(VIEW_W / W, VIEW_H / H)) : modeDef ? modeDef.tile(W, H, VIEW_W, VIEW_H) : 36;
    const textures = makeTextures(level);
    const maxHp = { easy: 5, normal: 4, hard: 3 }[level.difficulty] || 4;
    const bossMaxHp = platformer
      ? { easy: 2, normal: 3, hard: 5 }[level.difficulty] || 3
      : { easy: 5, normal: 8, hard: 12 }[level.difficulty] || 8;

    const keys = new Set();
    const dirStack = [];
    let jumpPressed = false;
    let state;
    let time = 0;
    let rafId = 0;
    let lastFrame = 0;
    let camera = { x: 0, y: 0 };
    let cameraReady = false;
    let frameDt = 0;
    const board = arcade ? buildArcadeBoard() : null;
    const mode = modeDef
      ? modeDef.create({
          ctx, canvas, level, grid, W, H, T, VIEW_W, VIEW_H, HUD_H, kinds, itemSprite, enemySprite, bossSprite,
          sprites: SPRITES, hash, shade, textures, camera, say, hurt, win,
          cellAt: (x, y) => cellAt(x, y),
          held: (...codes) => codes.some((code) => keys.has(code)),
          drawTexture: (tile, x, y) => drawTexture(tile, x, y),
          drawSprite: (name, x, y, w, h, flip) => drawSprite(name, x, y, w, h, flip),
          mixedEnemy: (x, y) => MIXED_ENEMIES[Math.floor(hash(x, y, 3) * MIXED_ENEMIES.length)],
          get state() { return state; },
          get time() { return time; },
        })
      : null;
    let banner = { text: "", ttl: 0 };

    const cellAt = (x, y) => (y >= 0 && y < H && x >= 0 && x < W ? grid[y][x] : "wall");
    const solid = (x, y) => (x < 0 || x >= W ? true : y < 0 || y >= H ? false : grid[y][x] === "wall");
    const findCell = (type) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === type) return { x, y };
      return null;
    };

    function say(text, seconds) {
      banner = { text, ttl: seconds || 2.5 };
    }

    function reset() {
      if (shooter) {
        resetShooter();
        return;
      }
      if (mode) {
        state = mode.reset();
        cameraReady = false;
        return;
      }
      const start = findCell("start");
      const items = new Set();
      const powers = new Set();
      const enemies = [];
      const spawnPoints = [];
      let bossCell = null;
      let boss = null;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cell = grid[y][x];
          if (cell === "item") items.add(x + "," + y);
          else if (cell === "power") powers.add(x + "," + y);
          else if (survival && cell === "enemy") spawnPoints.push({ x, y });
          else if (survival && cell === "boss") bossCell = { x, y };
          else if (cell === "enemy") {
            const sprite = kinds.enemy === "mixed" ? MIXED_ENEMIES[Math.floor(hash(x, y, 3) * MIXED_ENEMIES.length)] : enemySprite;
            enemies.push(
              platformer
                ? { x: x + 0.1, y: y + 0.2, w: 0.8, h: 0.8, dir: hash(x, y, 1) < 0.5 ? -1 : 1, alive: true, sprite }
                : arcade
                  ? { x, y, home: { x, y }, dir: { x: 0, y: 0 }, release: 1 + enemies.length * 2.5, mode: "chase", spared: false, alive: true, sprite, slot: enemies.length }
                  : { x, y, hp: 1, target: null, wait: hash(x, y, 2) * 0.6, stun: 0, flash: 0, alive: true, sprite }
            );
          } else if (cell === "boss") {
            boss = platformer
              ? { x, y: y - 1, w: 1.9, h: 1.9, vx: 0, vy: 0, dir: -1, hp: bossMaxHp, invuln: 0, jumpT: 2, minX: Math.max(2, x - 9), maxX: W - 4, alive: true }
              : arcade
                ? { x, y, home: { x, y }, dir: { x: 0, y: 0 }, release: 4, mode: "chase", spared: false, alive: true, hp: ARCADE_BOSS_HP[level.difficulty] || 3, slot: 0 }
                : { x, y, hp: bossMaxHp, target: null, wait: 0.5, stun: 0, flash: 0, alive: true };
          }
        }
      }

      state = {
        status: "playing",
        hp: maxHp,
        score: 0,
        totalItems: items.size + powers.size,
        collected: 0,
        items,
        powers,
        fright: 0,
        combo: 0,
        spawnPoints,
        bossCell,
        wave: 0,
        waves: (level.params && level.params.waves) || 5,
        pending: 0,
        spawnCd: 1.5,
        betweenWaves: 1.5,
        enemies,
        boss,
        invuln: 0,
        flash: 0,
        exit: findCell("exit"),
        player: platformer
          ? { x: start.x + 0.15, y: start.y + 0.1, w: 0.7, h: 0.9, vx: 0, vy: 0, onGround: false, coyote: 0, jumpBuf: 0, facing: 1, safe: { x: start.x + 0.15, y: start.y + 0.1 } }
          : arcade
            ? { x: start.x, y: start.y, home: { x: start.x, y: start.y }, dir: { x: 0, y: 0 }, want: { x: 0, y: 0 }, facing: 1 }
            : { x: start.x, y: start.y, vx: 0, vy: 0, dir: { x: 1, y: 0 }, tile: { x: start.x, y: start.y }, attackCd: 0, swing: 0, dashT: 0, dashCd: 0, moving: false, trail: [] },
        dist: null,
        homeDist: null,
      };
      if (!platformer) state.dist = distanceField(start.x, start.y);
      if (arcade) {
        state.homeDist = distanceField(Math.floor(W / 2), Math.floor(H / 2));
        state.corners = [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]].map(([x, y]) => distanceField(x, y));
        state.retreating = true;
        state.phase = RETREAT_PHASE;
      }
      dirStack.length = 0;
      jumpPressed = false;
      cameraReady = false;
      const goal = survival
        ? "Resiste " + state.waves + " oleadas"
        : arcade
        ? state.boss ? "Recógelo todo y atrapa al jefe" : "Recógelo todo sin que te atrapen"
        : state.boss ? "Derrota al jefe y llega a la salida" : "Llega a la salida";
      const title = level.narrative && level.narrative.title;
      say(title ? title + " · " + goal : goal, 3.5);
    }

    function bossAlive() {
      return !!(state.boss && state.boss.alive);
    }

    function hurt(amount, bypass) {
      if (state.status !== "playing") return false;
      if (!bypass && state.invuln > 0) return false;
      state.hp -= amount;
      state.invuln = 1.2;
      state.flash = 0.25;
      if (state.hp <= 0) {
        state.hp = 0;
        state.status = "lost";
        say("Has perdido. Pulsa R para reintentar", 999);
      }
      return true;
    }

    function collect(x, y) {
      const key = x + "," + y;
      if (!state.items.has(key)) return;
      state.items.delete(key);
      state.collected++;
      state.score += 10;
      if (survival) {
        state.hp = Math.min(maxHp, state.hp + 1);
        say("+1 vida", 0.9);
        return;
      }
      if (!arcade) say((ITEM_LABEL[itemSprite] || "Objeto") + " " + state.collected + "/" + state.totalItems, 0.9);
    }

    function win() {
      if (state.status !== "playing") return;
      state.status = "won";
      say("¡Nivel completado! Puntos: " + state.score + " - Pulsa R para repetir", 999);
    }

    function tryExit() {
      if (bossAlive()) say("La salida está cerrada: derrota al jefe", 1.5);
      else win();
    }

    function killBoss() {
      state.boss.alive = false;
      state.score += 200;
      say(arcade ? "¡Jefe derrotado!" : "¡Jefe derrotado! La salida está abierta", 3);
    }

    // ---------------------------------------------------------------- top-down
    const wrapX = (x) => (arcade ? (x + W) % W : x);

    function distanceField(px, py) {
      const dist = Array.from({ length: H }, () => Array(W).fill(-1));
      dist[py][px] = 0;
      const queue = [[px, py]];
      for (let head = 0; head < queue.length; head++) {
        const [x, y] = queue[head];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = wrapX(x + dx);
          const ny = y + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H && dist[ny][nx] === -1 && grid[ny][nx] !== "wall") {
            dist[ny][nx] = dist[y][x] + 1;
            queue.push([nx, ny]);
          }
        }
      }
      return dist;
    }

    // Movimiento libre: maze, dungeon y cave. Posiciones en casillas con decimales.
    const PLAYER_SPEED = 5.4;
    const PLAYER_HALF = 0.3;
    const DASH_SPEED = 13;
    const DASH_TIME = 0.16;
    const DASH_COOLDOWN = 0.9;
    const ATTACK_RANGE = 1.6;
    const ATTACK_COOLDOWN = 0.28;
    const CHASE_RADIUS = 8;
    // En hielo se patina: la velocidad cambia mas despacio.
    const GRIP = level.theme === "ice" ? 5 : 16;
    const wallAt = (x, y) => cellAt(x, y) === "wall";

    function blockedAt(cx, cy) {
      const r = PLAYER_HALF;
      return wallAt(Math.floor(cx - r), Math.floor(cy - r)) || wallAt(Math.floor(cx + r), Math.floor(cy - r)) ||
        wallAt(Math.floor(cx - r), Math.floor(cy + r)) || wallAt(Math.floor(cx + r), Math.floor(cy + r));
    }

    // Mueve por ejes separados para deslizar por las paredes; si una esquina estorba, centra al jugador en el pasillo.
    function slide(p, dx, dy) {
      let cx = p.x + 0.5;
      let cy = p.y + 0.5;
      if (dx) {
        if (!blockedAt(cx + dx, cy)) cx += dx;
        else {
          const row = Math.floor(cy) + 0.5;
          const ahead = Math.floor(cx + dx + Math.sign(dx) * PLAYER_HALF);
          if (!wallAt(ahead, Math.floor(cy)) && !blockedAt(cx, cy + Math.sign(row - cy) * Math.min(Math.abs(row - cy), Math.abs(dx)))) {
            cy += Math.sign(row - cy) * Math.min(Math.abs(row - cy), Math.abs(dx));
          } else p.vx = 0;
        }
      }
      if (dy) {
        if (!blockedAt(cx, cy + dy)) cy += dy;
        else {
          const col = Math.floor(cx) + 0.5;
          const ahead = Math.floor(cy + dy + Math.sign(dy) * PLAYER_HALF);
          if (!wallAt(Math.floor(cx), ahead) && !blockedAt(cx + Math.sign(col - cx) * Math.min(Math.abs(col - cx), Math.abs(dy)), cy)) {
            cx += Math.sign(col - cx) * Math.min(Math.abs(col - cx), Math.abs(dy));
          } else p.vy = 0;
        }
      }
      p.x = cx - 0.5;
      p.y = cy - 0.5;
    }

    const held = (...codes) => codes.some((code) => keys.has(code));

    function hitEntity(entity) {
      entity.hp--;
      entity.flash = 0.2;
      entity.stun = 0.3;
      if (entity.hp > 0) return;
      entity.alive = false;
      if (entity === state.boss) killBoss();
      else state.score += 25;
    }

    function attack() {
      const p = state.player;
      if (p.attackCd > 0) return;
      p.attackCd = ATTACK_COOLDOWN;
      p.swing = 0.14;
      const targets = state.enemies.filter((e) => e.alive);
      if (bossAlive()) targets.push(state.boss);
      for (const e of targets) {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d > ATTACK_RANGE) continue;
        const inFront = d < 0.8 || (dx * p.dir.x + dy * p.dir.y) / d > 0.25;
        const clear = !wallAt(Math.floor(p.x + 0.5 + dx / 2), Math.floor(p.y + 0.5 + dy / 2));
        if (inFront && clear) hitEntity(e);
      }
    }

    function dash() {
      const p = state.player;
      if (p.dashCd > 0) return;
      p.dashT = DASH_TIME;
      p.dashCd = DASH_COOLDOWN;
    }

    function stepChaser(e, isBoss, dt) {
      e.flash = Math.max(0, e.flash - dt);
      if (e.stun > 0) {
        e.stun -= dt;
        return;
      }
      // En supervivencia cada oleada corre un poco mas.
      const speed = ((isBoss ? { easy: 1.7, normal: 2.2, hard: 2.8 } : { easy: 1.6, normal: 2.1, hard: 2.7 })[level.difficulty] || 2.1) * (1 + (survival ? state.wave * 0.035 : 0));

      if (e.target) {
        const dx = e.target.x - e.x;
        const dy = e.target.y - e.y;
        const d = Math.hypot(dx, dy);
        const step = speed * dt;
        if (d <= step) {
          e.x = e.target.x;
          e.y = e.target.y;
          e.target = null;
        } else {
          e.x += (dx / d) * step;
          e.y += (dy / d) * step;
        }
        return;
      }

      e.wait -= dt;
      if (e.wait > 0) return;

      const others = state.enemies.filter((o) => o.alive && o !== e);
      if (bossAlive() && !isBoss) others.push(state.boss);
      const taken = (x, y) => others.some((o) => (o.target ? o.target.x === x && o.target.y === y : Math.round(o.x) === x && Math.round(o.y) === y));
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => ({ x: e.x + dx, y: e.y + dy }))
        .filter((c) => !wallAt(c.x, c.y) && !taken(c.x, c.y));
      if (!options.length) {
        e.wait = 0.2;
        return;
      }

      const here = state.dist[e.y][e.x];
      if (here !== -1 && (isBoss || survival || here <= CHASE_RADIUS)) {
        const best = options.filter((c) => state.dist[c.y][c.x] !== -1).sort((a, b) => state.dist[a.y][a.x] - state.dist[b.y][b.x])[0];
        if (best && state.dist[best.y][best.x] < here) e.target = best;
        else e.wait = 0.2;
      } else if (Math.random() < 0.45) {
        e.target = options[Math.floor(Math.random() * options.length)];
      } else {
        e.wait = 0.3 + Math.random() * 0.6;
      }
    }

    function touchDamage(e, reach, message) {
      const p = state.player;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d > reach || p.dashT > 0) return;
      if (hurt(1)) {
        say(message, 0.8);
        // Empujon para no recibir golpes seguidos.
        p.vx = (d ? dx / d : 0) * 9;
        p.vy = (d ? dy / d : -1) * 9;
      }
    }

    // Oleadas: cuando no queda nadie, llega la siguiente con mas enemigos.
    function updateWaves(dt) {
      if (state.pending > 0) {
        state.spawnCd -= dt;
        if (state.spawnCd <= 0) {
          const p = state.player;
          const far = state.spawnPoints.filter((c) => Math.abs(c.x - p.x) + Math.abs(c.y - p.y) > 5);
          const pool = far.length ? far : state.spawnPoints;
          const free = pool.filter((c) => !state.enemies.some((e) => e.alive && Math.round(e.x) === c.x && Math.round(e.y) === c.y));
          if (free.length) {
            const c = free[Math.floor(Math.random() * free.length)];
            const sprite = kinds.enemy === "mixed" ? MIXED_ENEMIES[Math.floor(Math.random() * MIXED_ENEMIES.length)] : enemySprite;
            state.enemies.push({ x: c.x, y: c.y, hp: 1, target: null, wait: 0.2, stun: 0, flash: 0, alive: true, sprite });
            state.pending--;
          }
          state.spawnCd = { easy: 0.8, normal: 0.6, hard: 0.5 }[level.difficulty] || 0.6;
        }
        return;
      }
      if (state.enemies.some((e) => e.alive) || bossAlive()) return;
      state.enemies = [];

      if (state.wave >= state.waves) {
        if (state.bossCell && !state.boss) {
          state.boss = { x: state.bossCell.x, y: state.bossCell.y, hp: bossMaxHp, target: null, wait: 0.5, stun: 0, flash: 0, alive: true };
          say("¡Último combate!", 2.5);
          return;
        }
        win();
        return;
      }

      state.betweenWaves -= dt;
      if (state.betweenWaves > 0) return;
      state.wave++;
      state.betweenWaves = 2;
      state.pending = Math.round(2 + state.wave * ({ easy: 1, normal: 1.5, hard: 1.7 }[level.difficulty] || 1.5));
      state.spawnCd = 0.3;
      say("Oleada " + state.wave + " de " + state.waves, 1.6);
    }

    function updateFree(dt) {
      const p = state.player;
      p.attackCd = Math.max(0, p.attackCd - dt);
      p.swing = Math.max(0, p.swing - dt);
      p.dashCd = Math.max(0, p.dashCd - dt);

      const ix = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
      const iy = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
      const len = Math.hypot(ix, iy);
      p.moving = len > 0;
      if (len) p.dir = { x: ix / len, y: iy / len };

      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vx = p.dir.x * DASH_SPEED;
        p.vy = p.dir.y * DASH_SPEED;
        p.trail.push({ x: p.x, y: p.y, life: 0.2 });
      } else {
        const k = 1 - Math.exp(-GRIP * dt);
        p.vx += ((len ? ix / len : 0) * PLAYER_SPEED - p.vx) * k;
        p.vy += ((len ? iy / len : 0) * PLAYER_SPEED - p.vy) * k;
      }
      for (const t of p.trail) t.life -= dt;
      p.trail = p.trail.filter((t) => t.life > 0);

      // Subpasos para no atravesar paredes a alta velocidad.
      const steps = Math.max(1, Math.ceil((Math.max(Math.abs(p.vx), Math.abs(p.vy)) * dt) / 0.2));
      for (let i = 0; i < steps; i++) slide(p, (p.vx * dt) / steps, (p.vy * dt) / steps);

      const tx = Math.floor(p.x + 0.5);
      const ty = Math.floor(p.y + 0.5);
      if (tx !== p.tile.x || ty !== p.tile.y) {
        p.tile = { x: tx, y: ty };
        state.dist = distanceField(tx, ty);
        collect(tx, ty);
      }
      if (cellAt(tx, ty) === "trap" && p.dashT <= 0 && hurt(1)) say("¡Trampa!", 0.8);
      if (state.exit && tx === state.exit.x && ty === state.exit.y) tryExit();

      for (const e of state.enemies) {
        if (!e.alive) continue;
        stepChaser(e, false, dt);
        touchDamage(e, 0.72, "¡Te atacaron!");
      }
      if (bossAlive()) {
        stepChaser(state.boss, true, dt);
        touchDamage(state.boss, 0.95, "¡El jefe te golpea!");
      }
      if (survival && state.status === "playing") updateWaves(dt);
    }

    // Modo arcade: todos se mueven sobre rieles de casilla en casilla, sin detenerse.
    const ARCADE_PLAYER_SPEED = 6;
    const FRIGHT_TIME = { easy: 8, normal: 6, hard: 4 }[level.difficulty] || 6;
    const CHASER_SPEED = { easy: 3.4, normal: 4, hard: 4.5 }[level.difficulty] || 4.4;
    // Cuanto se distrae cada perseguidor: unos van directos y otros cortan por otro lado.
    const WANDER = [0, 0.15, 0.3, 0.45];
    // Fases: persiguen un rato y luego se retiran a su esquina, dando respiro para recoger.
    const CHASE_PHASE = { easy: 8, normal: 12, hard: 18 }[level.difficulty] || 12;
    const RETREAT_PHASE = { easy: 7, normal: 6, hard: 4 }[level.difficulty] || 6;
    const openAt = (x, y) => y >= 0 && y < H && grid[y][wrapX(x)] !== "wall";

    function railMove(e, speed, dt, choose) {
      let left = speed * dt;
      for (let guard = 0; left > 1e-6 && guard < 8; guard++) {
        if (Math.abs(e.x - Math.round(e.x)) < 1e-6 && Math.abs(e.y - Math.round(e.y)) < 1e-6) {
          e.x = Math.round(e.x);
          e.y = Math.round(e.y);
          choose(e);
          if ((!e.dir.x && !e.dir.y) || !openAt(e.x + e.dir.x, e.y + e.dir.y)) {
            e.dir = { x: 0, y: 0 };
            return;
          }
        }
        const tx = e.dir.x > 0 ? Math.floor(e.x) + 1 : e.dir.x < 0 ? Math.ceil(e.x) - 1 : e.x;
        const ty = e.dir.y > 0 ? Math.floor(e.y) + 1 : e.dir.y < 0 ? Math.ceil(e.y) - 1 : e.y;
        const d = Math.abs(tx - e.x) + Math.abs(ty - e.y);
        if (d <= left) {
          e.x = wrapX(tx);
          e.y = ty;
          left -= d;
        } else {
          e.x += e.dir.x * left;
          e.y += e.dir.y * left;
          left = 0;
        }
      }
    }

    function choosePlayerDir(p) {
      if ((p.want.x || p.want.y) && openAt(p.x + p.want.x, p.y + p.want.y)) p.dir = p.want;
      if (p.dir.x) p.facing = p.dir.x;
    }

    // Sin nada por recoger el jefe queda siempre vulnerable: si no, ya no habria forma de terminar el nivel.
    const finale = () => !state.items.size && !state.powers.size;
    const frightened = (e) => {
      if (e.mode === "eaten") return false;
      if (e === state.boss && finale()) return true;
      return state.fright > 0 && !e.spared;
    };

    function chooseChaserDir(e) {
      // Reaparece en el centro de la guarida. Se comprueba aqui porque a alta velocidad cruza casillas dentro de un mismo frame.
      if (e.mode === "eaten" && state.homeDist[e.y][e.x] === 0) {
        e.mode = "chase";
        e.dir = { x: 0, y: 0 };
        e.release = 1;
        return;
      }
      const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([x, y]) => ({ x, y }))
        .filter((d) => openAt(e.x + d.x, e.y + d.y));
      const forward = options.filter((d) => d.x !== -e.dir.x || d.y !== -e.dir.y || (!e.dir.x && !e.dir.y));
      const pool = forward.length ? forward : options;
      if (!pool.length) return;
      const score = (field, d) => field[e.y + d.y][wrapX(e.x + d.x)];

      if (e.mode === "eaten") {
        e.dir = options.reduce((best, d) => (score(state.homeDist, d) < score(state.homeDist, best) ? d : best));
      } else if (frightened(e)) {
        e.dir = pool.reduce((best, d) => (score(state.dist, d) > score(state.dist, best) ? d : best));
      } else if (state.retreating && e !== state.boss) {
        const corner = state.corners[e.slot % state.corners.length];
        e.dir = pool.reduce((best, d) => (score(corner, d) < score(corner, best) ? d : best));
      } else if (Math.random() < WANDER[e.slot % WANDER.length]) {
        e.dir = pool[Math.floor(Math.random() * pool.length)];
      } else {
        e.dir = pool.reduce((best, d) => (score(state.dist, d) < score(state.dist, best) ? d : best));
      }
    }

    function eatPower() {
      state.fright = FRIGHT_TIME;
      state.combo = 0;
      const all = state.boss ? [...state.enemies, state.boss] : state.enemies;
      for (const e of all) {
        e.spared = false;
        if (e.mode !== "eaten") e.dir = { x: -e.dir.x, y: -e.dir.y };
      }
      state.score += 50;
      say("¡Ahora te temen a ti!", 1.2);
    }

    function sendHome(e) {
      e.mode = "eaten";
      e.spared = true;
    }

    function respawnArcade() {
      const p = state.player;
      p.x = p.home.x;
      p.y = p.home.y;
      p.dir = { x: 0, y: 0 };
      p.want = { x: 0, y: 0 };
      state.dist = distanceField(p.x, p.y);
      state.fright = 0;
      state.retreating = true;
      state.phase = RETREAT_PHASE;
      const all = state.boss && state.boss.alive ? [...state.enemies, state.boss] : state.enemies;
      all.forEach((e, i) => {
        e.x = e.home.x;
        e.y = e.home.y;
        e.dir = { x: 0, y: 0 };
        e.mode = "chase";
        e.spared = false;
        e.release = 1 + i * 1.5;
      });
    }

    function arcadeContact(e, reach) {
      const p = state.player;
      if (e.mode === "eaten" || Math.abs(p.x - e.x) + Math.abs(p.y - e.y) > reach) return;
      if (frightened(e)) {
        state.combo++;
        state.score += 100 * 2 ** (state.combo - 1);
        if (e === state.boss) {
          e.hp--;
          if (e.hp <= 0) {
            e.alive = false;
            killBoss();
            return;
          }
          say("¡Golpe al jefe! Quedan " + e.hp, 1.2);
        }
        sendHome(e);
      } else if (hurt(1) && state.status === "playing") {
        say("¡Te atraparon!", 1.2);
        respawnArcade();
      }
    }

    function moveChaser(e, baseSpeed, dt) {
      if (e.release > 0) {
        e.release -= dt;
        return;
      }
      const speed = e.mode === "eaten" ? 10 : frightened(e) ? baseSpeed * 0.6 : baseSpeed;
      railMove(e, speed, dt, chooseChaserDir);
    }

    function updateArcade(dt) {
      const p = state.player;
      if (state.fright > 0) state.fright = Math.max(0, state.fright - dt);
      else {
        // El reloj de fases se detiene mientras dura el potenciador.
        state.phase -= dt;
        if (state.phase <= 0) {
          state.retreating = !state.retreating;
          state.phase = state.retreating ? RETREAT_PHASE : CHASE_PHASE;
        }
      }

      // Dar media vuelta no espera al siguiente cruce.
      if ((p.want.x || p.want.y) && p.want.x === -p.dir.x && p.want.y === -p.dir.y) p.dir = p.want;
      railMove(p, ARCADE_PLAYER_SPEED, dt, choosePlayerDir);

      const tx = wrapX(Math.round(p.x));
      const ty = Math.round(p.y);
      if (Math.abs(p.x - Math.round(p.x)) + Math.abs(p.y - ty) < 0.4) {
        const key = tx + "," + ty;
        collect(tx, ty);
        if (state.powers.delete(key)) {
          state.collected++;
          eatPower();
        }
      }
      if (!p.tile || p.tile.x !== tx || p.tile.y !== ty) {
        p.tile = { x: tx, y: ty };
        state.dist = distanceField(tx, ty);
      }

      for (const e of state.enemies) {
        moveChaser(e, CHASER_SPEED, dt);
        arcadeContact(e, 0.7);
        if (state.status !== "playing") return;
      }
      if (bossAlive()) {
        moveChaser(state.boss, CHASER_SPEED - 0.4, dt);
        arcadeContact(state.boss, 0.9);
      }

      if (!state.items.size && !state.powers.size) {
        if (!bossAlive()) win();
        else if (!state.finaleSaid) {
          state.finaleSaid = true;
          say("¡Ya no te queda nada por recoger: atrapa al jefe!", 2.5);
        }
      }
    }

    // ----------------------------------------------------------------- shooter
    // Galeria de tiro: la cuadricula dice donde aparece cada blanco; se apunta con el mouse o las flechas.
    const SHOOT = {
      lifetime: { easy: 2.8, normal: 2.1, hard: 1.5 }[level.difficulty] || 2.1,
      maxActive: { easy: 2, normal: 3, hard: 4 }[level.difficulty] || 3,
      movingSpeed: { easy: 2.5, normal: 3.5, hard: 4.5 }[level.difficulty] || 3.5,
      bossHp: { easy: 3, normal: 5, hard: 8 }[level.difficulty] || 5,
      bossTime: { easy: 20, normal: 16, hard: 13 }[level.difficulty] || 16,
    };
    const GOAL_RATIO = 0.6;
    const AIM_SPEED = 620;
    const toViewX = (x) => (x + 0.5) * T - camera.x;
    const toViewY = (y) => (y + 0.5) * T - camera.y;

    function resetShooter() {
      const queue = [];
      let bossCell = null;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cell = grid[y][x];
          if (cell === "item") queue.push({ kind: hash(x, y, 8) < 0.2 ? "bonus" : "target", x, y });
          else if (cell === "enemy") queue.push({ kind: "moving", x, y, sprite: kinds.enemy === "mixed" ? MIXED_ENEMIES[Math.floor(hash(x, y, 3) * MIXED_ENEMIES.length)] : enemySprite });
          else if (cell === "trap") queue.push({ kind: "bomb", x, y });
          else if (cell === "boss") bossCell = { x, y };
        }
      }
      queue.sort((a, b) => hash(a.x, a.y, 9) - hash(b.x, b.y, 9));
      const scorable = queue.filter((t) => t.kind !== "bomb").length;

      state = {
        status: "playing",
        hp: maxHp,
        score: 0,
        totalItems: Math.ceil(scorable * GOAL_RATIO),
        collected: 0,
        scorable,
        items: new Set(),
        powers: new Set(),
        enemies: [],
        boss: null,
        bossCell,
        invuln: 0,
        flash: 0,
        exit: null,
        player: { x: 0, y: 0 },
        aim: { x: VIEW_W / 2, y: VIEW_H / 2 },
        ammo: Math.floor(scorable * 1.6) + 5,
        shots: 0,
        queue,
        active: [],
        spawnCd: 1.2,
        effects: [],
        dist: null,
      };
      cameraReady = false;
      const title = level.narrative && level.narrative.title;
      const goal = "Acierta " + state.totalItems + " de " + scorable + " blancos · No dispares a las bombas";
      say(title ? title + " · " + goal : goal, 3.5);
    }

    function spawnTarget() {
      const t = state.queue.shift();
      const entry = { ...t, age: 0, ttl: SHOOT.lifetime };
      if (t.kind === "moving") {
        // Cruza la pantalla por su carril, hacia un lado o el otro segun su posicion.
        entry.dir = hash(t.x, t.y, 4) < 0.5 ? 1 : -1;
        entry.x = entry.dir > 0 ? -1 : W;
        entry.ttl = (W + 2) / SHOOT.movingSpeed;
      }
      state.active.push(entry);
    }

    function addEffect(x, y, color, text) {
      state.effects.push({ x, y, color, text, life: 0.5 });
    }

    function finishRound() {
      if (state.collected < state.totalItems) {
        state.status = "lost";
        say("Te faltó puntería: " + state.collected + "/" + state.totalItems + " - Pulsa R para reintentar", 999);
      } else if (state.bossCell && !state.boss) {
        // Aparece al final, con municion para intentarlo.
        const b = state.bossCell;
        state.boss = { x: b.x, y: b.y, baseY: b.y, hp: SHOOT.bossHp, alive: true, t: 0, ttl: SHOOT.bossTime, flash: 0 };
        state.ammo += SHOOT.bossHp * 3;
        say("¡Acierta al jefe antes de que escape!", 2.5);
      } else {
        win();
      }
    }

    function shoot() {
      if (state.status !== "playing") return;
      if (state.ammo <= 0) {
        say("Sin munición", 0.8);
        return;
      }
      state.ammo--;
      state.shots++;
      const { x: ax, y: ay } = state.aim;

      if (bossAlive()) {
        const b = state.boss;
        if (Math.hypot(ax - toViewX(b.x), ay - toViewY(b.y)) < T * 1.3) {
          b.hp--;
          b.flash = 0.2;
          state.score += 50;
          addEffect(ax, ay, "#fde047", "+50");
          if (b.hp <= 0) {
            killBoss();
            win();
          }
          return;
        }
      }

      // Los ultimos en aparecer quedan delante.
      for (let i = state.active.length - 1; i >= 0; i--) {
        const t = state.active[i];
        const d = Math.hypot(ax - toViewX(t.x), ay - toViewY(t.y));
        const radius = t.kind === "target" ? T * 0.8 : T * 0.62;
        if (d > radius) continue;
        state.active.splice(i, 1);
        if (t.kind === "bomb") {
          hurt(1, true);
          addEffect(ax, ay, "#fb923c", "¡BOMBA!");
          if (state.status === "playing") say("¡Era una bomba!", 0.9);
          return;
        }
        state.collected++;
        // En una diana, cuanto mas al centro, mas puntos.
        const multiplier = t.kind === "target" ? (d < radius * 0.3 ? 3 : d < radius * 0.65 ? 2 : 1) : 2;
        const points = 10 * multiplier + (t.kind === "bonus" ? 20 : 0);
        state.score += points;
        addEffect(ax, ay, multiplier === 3 ? "#fde047" : "#ffffff", "+" + points);
        return;
      }
      addEffect(ax, ay, "rgba(255,255,255,0.6)", "");
    }

    function updateShooter(dt) {
      const aimX = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
      const aimY = (held("ArrowDown", "KeyS") ? 1 : 0) - (held("ArrowUp", "KeyW") ? 1 : 0);
      state.aim.x = Math.max(0, Math.min(VIEW_W, state.aim.x + aimX * AIM_SPEED * dt));
      state.aim.y = Math.max(0, Math.min(VIEW_H, state.aim.y + aimY * AIM_SPEED * dt));

      for (const fx of state.effects) fx.life -= dt;
      state.effects = state.effects.filter((fx) => fx.life > 0);

      if (bossAlive()) {
        const b = state.boss;
        b.t += dt;
        b.flash = Math.max(0, b.flash - dt);
        b.x = W / 2 - 0.5 + Math.sin(b.t * 1.4) * (W / 2 - 3);
        b.y = b.baseY + (Math.sin(b.t * 2.3) + 1) * 2;
        if (b.t >= b.ttl) {
          state.status = "lost";
          say("¡El jefe escapó! - Pulsa R para reintentar", 999);
        }
        return;
      }

      state.spawnCd -= dt;
      if (state.spawnCd <= 0 && state.queue.length && state.active.length < SHOOT.maxActive) {
        spawnTarget();
        state.spawnCd = 0.6 + hash(state.queue.length, 1, 5) * 0.8;
      }
      for (const t of state.active) {
        t.age += dt;
        if (t.kind === "moving") t.x += t.dir * SHOOT.movingSpeed * dt;
      }
      state.active = state.active.filter((t) => t.age < t.ttl);

      if ((!state.queue.length && !state.active.length) || (state.ammo <= 0 && state.collected < state.totalItems)) finishRound();
    }

    function drawBullseye(x, y, r) {
      for (const [ratio, color] of [[1, "#dc2626"], [0.72, "#f8fafc"], [0.45, "#dc2626"], [0.2, "#fde047"]]) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r * ratio, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawShooter() {
      // Suelo de la galeria
      for (let x = 0; x < W; x++) drawTexture(textures.tops[Math.floor(hash(x, 1, 7) * 4)], x, H - 1);

      for (const t of state.active) {
        const x = toViewX(t.x);
        const y = toViewY(t.y);
        const pop = Math.min(1, t.age / 0.14);
        // Parpadea justo antes de desaparecer para avisar.
        if (t.kind !== "moving" && t.ttl - t.age < 0.4 && Math.floor(time * 16) % 2) continue;
        if (t.kind === "target") {
          ctx.fillStyle = "#7c4a1e";
          ctx.fillRect(x - T * 0.07, y, T * 0.14, T * 1.05);
          drawBullseye(x, y, T * 0.8 * pop);
        } else {
          const name = t.kind === "bomb" ? "bomb" : t.kind === "bonus" ? itemSprite : t.sprite;
          const size = T * 1.2 * pop;
          if (t.kind === "bomb") {
            // Aureola de aviso: la bomba debe verse sobre cualquier fondo.
            ctx.fillStyle = "rgba(249,115,22,0.55)";
            ctx.beginPath();
            ctx.arc(x, y, T * 0.78 * pop, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.drawImage(SPRITES[name], x - size / 2, y - size / 2, size, size);
        }
      }

      if (bossAlive() && !(state.boss.flash > 0 && Math.floor(time * 20) % 2)) {
        const size = T * 2.6;
        ctx.drawImage(SPRITES[bossSprite], toViewX(state.boss.x) - size / 2, toViewY(state.boss.y) - size / 2, size, size);
      }

      ctx.textAlign = "center";
      ctx.font = "bold 20px monospace";
      for (const fx of state.effects) {
        ctx.globalAlpha = Math.min(1, fx.life * 2);
        ctx.strokeStyle = fx.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, (0.5 - fx.life) * 44 + 4, 0, Math.PI * 2);
        ctx.stroke();
        if (fx.text) {
          ctx.fillStyle = fx.color;
          ctx.fillText(fx.text, fx.x, fx.y - 34 + fx.life * 30);
        }
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";

      // Mira
      const { x: ax, y: ay } = state.aim;
      for (const [color, width] of [["rgba(0,0,0,0.75)", 5], ["#ffffff", 2]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.arc(ax, ay, 16, 0, Math.PI * 2);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          ctx.moveTo(ax + dx * 9, ay + dy * 9);
          ctx.lineTo(ax + dx * 24, ay + dy * 24);
        }
        ctx.stroke();
      }
    }

    // -------------------------------------------------------------- platformer
    const GRAVITY = 40;
    const MOVE_SPEED = 6;
    const JUMP_SPEED = 18.5;

    function collides(x, y, w, h) {
      for (let ty = Math.floor(y); ty <= Math.floor(y + h - 1e-6); ty++) {
        for (let tx = Math.floor(x); tx <= Math.floor(x + w - 1e-6); tx++) {
          if (solid(tx, ty)) return true;
        }
      }
      return false;
    }

    function overlaps(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    }

    function approach(value, target, amount) {
      return value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);
    }

    function moveBody(b, dt) {
      b.x += b.vx * dt;
      if (collides(b.x, b.y, b.w, b.h)) {
        b.x = b.vx > 0 ? Math.floor(b.x + b.w) - b.w - 1e-4 : Math.floor(b.x) + 1 + 1e-4;
        b.vx = 0;
      }
      b.y += b.vy * dt;
      b.onGround = false;
      if (collides(b.x, b.y, b.w, b.h)) {
        if (b.vy > 0) {
          b.y = Math.floor(b.y + b.h) - b.h - 1e-4;
          b.onGround = true;
        } else {
          b.y = Math.floor(b.y) + 1 + 1e-4;
        }
        b.vy = 0;
      }
    }

    function respawn() {
      const p = state.player;
      p.x = p.safe.x;
      p.y = p.safe.y;
      p.vx = 0;
      p.vy = 0;
      state.invuln = 1.5;
    }

    function stepEnemyWalker(e, dt) {
      e.x += e.dir * 1.6 * dt;
      const aheadX = Math.floor(e.dir > 0 ? e.x + e.w + 0.05 : e.x - 0.05);
      const bodyY = Math.floor(e.y + e.h / 2);
      const footY = Math.floor(e.y + e.h + 0.05);
      const blocked = solid(aheadX, bodyY) || !solid(aheadX, footY) || cellAt(aheadX, Math.floor(e.y + e.h - 0.3)) === "trap";
      if (blocked) {
        e.dir = -e.dir;
        e.x += e.dir * 1.6 * dt * 2;
      }
    }

    function stepBoss(b, dt) {
      b.invuln = Math.max(0, b.invuln - dt);
      const speed = 2.4 + (bossMaxHp - b.hp) * 0.7;
      b.vx = b.dir * speed;
      b.vy = Math.min(b.vy + GRAVITY * dt, 25);
      b.jumpT -= dt;
      if (b.jumpT <= 0 && b.onGround) {
        b.vy = -14;
        b.jumpT = 1.6 + Math.random() * 1.6;
      }
      moveBody(b, dt);
      if (b.x <= b.minX) b.dir = 1;
      if (b.x >= b.maxX) b.dir = -1;
      b.x = Math.min(b.maxX, Math.max(b.minX, b.x));
    }

    function stepPlatformer(dt) {
      const p = state.player;
      const left = keys.has("ArrowLeft") || keys.has("KeyA");
      const right = keys.has("ArrowRight") || keys.has("KeyD");
      const target = (right ? 1 : 0) - (left ? 1 : 0);
      if (target) p.facing = target;
      p.vx = approach(p.vx, target * MOVE_SPEED, (target ? 70 : 60) * dt);
      p.vy = Math.min(p.vy + GRAVITY * dt, 25);

      p.coyote = p.onGround ? 0.1 : Math.max(0, p.coyote - dt);
      p.jumpBuf = Math.max(0, p.jumpBuf - dt);
      if (p.jumpBuf > 0 && p.coyote > 0) {
        p.vy = -JUMP_SPEED;
        p.jumpBuf = 0;
        p.coyote = 0;
      }
      const jumpHeld = keys.has("ArrowUp") || keys.has("KeyW") || keys.has("Space");
      if (!jumpHeld && p.vy < -7) p.vy = -7;

      moveBody(p, dt);

      if (p.onGround) {
        const cx = Math.floor(p.x + p.w / 2);
        if (solid(cx, Math.floor(p.y + p.h + 0.1)) && solid(cx - 1, Math.floor(p.y + p.h + 0.1)) && solid(cx + 1, Math.floor(p.y + p.h + 0.1))) {
          p.safe = { x: p.x, y: p.y };
        }
      }

      if (p.y > H + 1) {
        if (hurt(1, true)) say("¡Caíste al vacío!", 1);
        if (state.status === "playing") respawn();
        return;
      }

      for (let ty = Math.floor(p.y); ty <= Math.floor(p.y + p.h); ty++) {
        for (let tx = Math.floor(p.x); tx <= Math.floor(p.x + p.w); tx++) {
          collect(tx, ty);
          if (cellAt(tx, ty) === "trap") {
            const spike = { x: tx + 0.1, y: ty + 0.5, w: 0.8, h: 0.5 };
            if (overlaps(p, spike) && hurt(1)) {
              p.vy = -10;
              say("¡Pinchos!", 0.8);
            }
          }
        }
      }

      for (const e of state.enemies) {
        if (!e.alive) continue;
        stepEnemyWalker(e, dt);
        if (!overlaps(p, e)) continue;
        if (p.vy > 0 && p.y + p.h - e.y < 0.6) {
          e.alive = false;
          p.vy = -11;
          state.score += 25;
        } else if (hurt(1)) {
          p.vx = (p.x < e.x ? -1 : 1) * 7;
          p.vy = -8;
        }
      }

      if (bossAlive()) {
        const b = state.boss;
        stepBoss(b, dt);
        if (overlaps(p, b) && b.invuln <= 0) {
          if (p.vy > 0 && p.y + p.h - b.y < 0.8) {
            b.hp--;
            b.invuln = 1.2;
            p.vy = -14;
            if (b.hp <= 0) killBoss();
            else say("¡Golpe al jefe! Le quedan " + b.hp, 1);
          } else if (hurt(1)) {
            p.vx = (p.x < b.x ? -1 : 1) * 9;
            p.vy = -9;
            say("¡El jefe te golpea!", 0.8);
          }
        }
      }

      const exit = state.exit;
      if (exit && overlaps(p, { x: exit.x - 0.2, y: -20, w: 1.4, h: exit.y + 21 })) tryExit();
    }

    function updatePlatformer(dt) {
      const step = 1 / 120;
      let remaining = Math.min(dt, 0.05);
      while (remaining > 0 && state.status === "playing") {
        const h = Math.min(step, remaining);
        stepPlatformer(h);
        remaining -= h;
      }
    }

    // ------------------------------------------------------------------ update
    function update(dt) {
      time += dt;
      banner.ttl -= dt;
      if (state.status !== "playing") return;
      state.invuln = Math.max(0, state.invuln - dt);
      state.flash = Math.max(0, state.flash - dt);
      if (platformer) updatePlatformer(dt);
      else if (mode) mode.update(dt);
      else if (shooter) updateShooter(dt);
      else if (arcade) updateArcade(dt);
      else updateFree(dt);
    }

    // ------------------------------------------------------------------ render
    function playerPos() {
      const p = state.player;
      if (mode) return mode.focus ? mode.focus() : { x: (W * T) / 2, y: (H * T) / 2 };
      if (shooter) return { x: (W * T) / 2, y: (H * T) / 2 };
      return platformer ? { x: (p.x + p.w / 2) * T, y: (p.y + p.h / 2) * T } : { x: (p.x + 0.5) * T, y: (p.y + 0.5) * T };
    }

    function updateCamera() {
      const target = playerPos();
      const mapW = W * T;
      const mapH = H * T;
      const fit = (pos, view, size) => (size <= view ? (size - view) / 2 : Math.min(size - view, Math.max(0, pos - view / 2)));
      const x = fit(target.x, VIEW_W, mapW);
      const y = arcade ? -Math.max(HUD_H, (VIEW_H - mapH) / 2) : fit(target.y, VIEW_H, mapH);
      if (!cameraReady || options.manual) {
        camera.x = x;
        camera.y = y;
        cameraReady = true;
      } else {
        const k = 1 - Math.exp(-10 * frameDt);
        camera.x += (x - camera.x) * k;
        camera.y += (y - camera.y) * k;
      }
    }

    function drawSprite(name, x, y, w, h, flip) {
      const sx = Math.round(x - camera.x);
      const sy = Math.round(y - camera.y);
      if (flip) {
        ctx.save();
        ctx.translate(sx + w, sy);
        ctx.scale(-1, 1);
        ctx.drawImage(SPRITES[name], 0, 0, Math.round(w), Math.round(h));
        ctx.restore();
      } else {
        ctx.drawImage(SPRITES[name], sx, sy, Math.round(w), Math.round(h));
      }
    }

    function drawTexture(canvasTile, tx, ty) {
      ctx.drawImage(canvasTile, Math.round(tx * T - camera.x), Math.round(ty * T - camera.y), T, T);
    }

    function drawBackground() {
      if (mode) return;
      const pal = level.palette;
      if (platformer || shooter) {
        const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        gradient.addColorStop(0, pal.sky[0]);
        gradient.addColorStop(1, pal.sky[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        if (level.theme === "overworld" || level.theme === "forest" || level.theme === "desert") {
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          for (let i = 0; i < 40; i++) {
            const cx = ((i * 260 + hash(i, 1, 5) * 120 - camera.x * 0.3) % (VIEW_W + 200)) - 100;
            const cy = 30 + hash(i, 2, 5) * 150;
            const u = 8;
            ctx.fillRect(cx, cy + u, u * 7, u * 2);
            ctx.fillRect(cx + u, cy, u * 5, u * 3);
          }
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          for (let i = 0; i < 70; i++) {
            const sx = ((hash(i, 3, 6) * (VIEW_W + 400) - camera.x * 0.2) % (VIEW_W + 40));
            ctx.fillRect(sx < 0 ? sx + VIEW_W : sx, hash(i, 4, 6) * VIEW_H * 0.8, 3, 3);
          }
        }
      } else {
        ctx.fillStyle = arcade ? shade(pal.wall, -0.85) : shade(pal.wall, -0.35);
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }

    // Tablero arcade: paredes como tubos de neon. Se dibuja una vez y luego solo se copia.
    function buildArcadeBoard() {
      const canvasBoard = document.createElement("canvas");
      canvasBoard.width = W * T;
      canvasBoard.height = H * T;
      const g = canvasBoard.getContext("2d");
      const isWall = (x, y) => y >= 0 && y < H && x >= 0 && x < W && grid[y][x] === "wall";
      const neon = shade(level.palette.wall, 0.45);

      const paint = (inset) => {
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (!isWall(x, y)) continue;
            const i = T * inset;
            g.fillRect(x * T + i, y * T + i, T - 2 * i, T - 2 * i);
            if (isWall(x + 1, y)) g.fillRect(x * T + T - i, y * T + i, 2 * i, T - 2 * i);
            if (isWall(x, y + 1)) g.fillRect(x * T + i, y * T + T - i, T - 2 * i, 2 * i);
            if (isWall(x + 1, y) && isWall(x, y + 1) && isWall(x + 1, y + 1)) g.fillRect(x * T + T - i, y * T + T - i, 2 * i, 2 * i);
          }
        }
      };

      g.shadowColor = neon;
      g.shadowBlur = T * 0.35;
      g.fillStyle = neon;
      paint(0.14);
      g.shadowBlur = 0;
      g.fillStyle = shade(level.palette.wall, -0.75);
      paint(0.24);
      return canvasBoard;
    }

    function drawArcadeBoard() {
      ctx.drawImage(board, Math.round(-camera.x), Math.round(-camera.y));
      const sx = (x) => Math.round(x * T - camera.x);
      const sy = (y) => Math.round(y * T - camera.y);

      for (const key of state.items) {
        const [x, y] = key.split(",").map(Number);
        if (itemSprite === "coin") {
          ctx.fillStyle = "#ffe9a8";
          ctx.beginPath();
          ctx.arc(sx(x) + T / 2, sy(y) + T / 2, Math.max(2, T * 0.11), 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.drawImage(SPRITES[itemSprite], sx(x) + T * 0.22, sy(y) + T * 0.22, T * 0.56, T * 0.56);
        }
      }

      const pulse = 0.26 + Math.sin(time * 6) * 0.05;
      for (const key of state.powers) {
        const [x, y] = key.split(",").map(Number);
        ctx.fillStyle = "#ff7ad9";
        ctx.shadowColor = "#ff7ad9";
        ctx.shadowBlur = T * 0.5;
        ctx.beginPath();
        ctx.arc(sx(x) + T / 2, sy(y) + T / 2, T * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function drawTiles() {
      if (mode) {
        mode.draw();
        return;
      }
      if (shooter) {
        drawShooter();
        return;
      }
      if (arcade) {
        drawArcadeBoard();
        return;
      }
      const x0 = Math.max(0, Math.floor(camera.x / T));
      const x1 = Math.min(W - 1, Math.floor((camera.x + VIEW_W) / T));
      const y0 = Math.max(0, Math.floor(camera.y / T));
      const y1 = Math.min(H - 1, Math.floor((camera.y + VIEW_H) / T));
      const locked = bossAlive();

      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const cell = grid[y][x];
          const variant = Math.floor(hash(x, y, 7) * 4);
          if (cell === "wall") {
            const exposed = platformer && !solid(x, y - 1);
            drawTexture(exposed ? textures.tops[variant] : textures.walls[variant], x, y);
            continue;
          }
          if (!platformer) drawTexture(textures.floors[variant], x, y);

          if (cell === "trap") drawSprite("spike", x * T, y * T, T, T);
          else if (cell === "exit") {
            if (platformer) drawSprite("flag", x * T, (y - 1) * T, T, T * 2);
            else drawSprite("door", x * T, y * T, T, T);
            if (locked) {
              ctx.fillStyle = "rgba(30,30,50,0.55)";
              ctx.fillRect(Math.round(x * T - camera.x), Math.round((platformer ? y - 1 : y) * T - camera.y), T, platformer ? T * 2 : T);
            }
          } else if (cell === "start" && !platformer) {
            ctx.strokeStyle = "rgba(34,197,94,0.8)";
            ctx.lineWidth = 3;
            ctx.strokeRect(Math.round(x * T - camera.x) + 6, Math.round(y * T - camera.y) + 6, T - 12, T - 12);
          }
        }
      }

      for (const key of state.items) {
        const [x, y] = key.split(",").map(Number);
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        const bob = Math.sin(time * 4 + x) * T * 0.06;
        drawSprite(itemSprite, x * T + T * 0.15, y * T + T * 0.15 + bob, T * 0.7, T * 0.7);
      }
    }

    function blink(invuln) {
      return invuln > 0 && Math.floor(time * 16) % 2 === 0;
    }

    function drawEntities() {
      if (shooter || mode) return;
      const p = state.player;
      if (platformer) {
        for (const e of state.enemies) if (e.alive) drawSprite(e.sprite, (e.x - 0.05) * T, (e.y - 0.1) * T, T * 0.9, T * 0.9, e.dir > 0);
        if (bossAlive()) {
          const b = state.boss;
          if (!blink(b.invuln)) drawSprite(bossSprite, (b.x - 0.05) * T, (b.y - 0.05) * T, T * 2, T * 2, b.dir > 0);
        }
        if (!blink(state.invuln)) drawSprite("player", (p.x - 0.1) * T, (p.y - 0.05) * T, T * 0.9, T * 0.95, p.facing < 0);
      } else if (arcade) {
        const chaserSprite = (e, normal) => {
          if (e.mode === "eaten") return "eyes";
          if (!frightened(e)) return normal;
          return state.fright > 0 && state.fright < 1.5 && Math.floor(time * 6) % 2 ? "scaredFlash" : "scared";
        };
        for (const e of state.enemies) drawSprite(chaserSprite(e, e.sprite), e.x * T, e.y * T, T, T, e.dir.x < 0);
        if (bossAlive()) {
          const b = state.boss;
          drawSprite(chaserSprite(b, bossSprite), b.x * T - T * 0.2, b.y * T - T * 0.2, T * 1.4, T * 1.4, b.dir.x < 0);
        }
        if (!blink(state.invuln)) drawSprite("player", p.x * T, p.y * T, T, T, p.facing < 0);
      } else {
        for (const t of p.trail) {
          ctx.globalAlpha = (t.life / 0.2) * 0.45;
          drawSprite("player", t.x * T, t.y * T, T, T, p.dir.x < 0);
        }
        ctx.globalAlpha = 1;
        for (const e of state.enemies) {
          if (e.alive && !(e.flash > 0 && Math.floor(time * 20) % 2)) drawSprite(e.sprite, e.x * T, e.y * T, T, T, e.target && e.target.x < e.x);
        }
        if (bossAlive() && !(state.boss.flash > 0 && Math.floor(time * 20) % 2)) {
          drawSprite(bossSprite, state.boss.x * T - T * 0.15, state.boss.y * T - T * 0.15, T * 1.3, T * 1.3);
        }
        const bob = p.moving ? Math.abs(Math.sin(time * 14)) * T * 0.07 : 0;
        if (!blink(state.invuln)) drawSprite("player", p.x * T, p.y * T - bob, T, T, p.dir.x < 0);
        if (p.swing > 0) {
          const cx = (p.x + 0.5) * T - camera.x;
          const cy = (p.y + 0.5) * T - camera.y;
          const angle = Math.atan2(p.dir.y, p.dir.x);
          ctx.strokeStyle = "rgba(255,255,255," + (0.4 + p.swing * 4) + ")";
          ctx.lineWidth = T * 0.16;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.arc(cx, cy, ATTACK_RANGE * T * 0.72, angle - 1, angle + 1);
          ctx.stroke();
          ctx.lineCap = "butt";
        }
      }
    }

    function drawHud() {
      ctx.font = "bold 22px monospace";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(8, 8, shooter ? 460 : mode || survival ? 520 : 300, 34);
      ctx.fillStyle = "#ff5252";
      if (!(mode && mode.noHearts)) ctx.fillText("♥".repeat(state.hp) + "♡".repeat(Math.max(0, maxHp - state.hp)), 16, 13);
      ctx.fillStyle = "#ffd700";
      if (mode) {
        ctx.fillText(mode.hud(), mode.noHearts ? 16 : 110, 13);
      } else if (survival) {
        ctx.fillText("Oleada " + Math.min(state.wave, state.waves) + "/" + state.waves + " · " + state.score + "pts", 130, 13);
      } else if (shooter) {
        ctx.fillText(state.collected + "/" + state.totalItems + " · " + state.ammo + " balas · " + state.score, 110, 13);
      } else if (state.totalItems > 0) {
        ctx.drawImage(SPRITES[itemSprite], 128, 13, 22, 22);
        ctx.fillText(state.collected + "/" + state.totalItems + "  " + state.score + "pts", 156, 13);
      } else {
        ctx.fillText(state.score + "pts", 130, 13);
      }

      if (bossAlive()) {
        const width = 260;
        const ratio = state.boss.hp / (state.boss.maxHp || (shooter ? SHOOT.bossHp : bossMaxHp));
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(VIEW_W - width - 24, 8, width + 16, 34);
        ctx.fillStyle = "#7e22ce";
        ctx.fillRect(VIEW_W - width - 16, 16, width * ratio, 18);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(VIEW_W - width - 16, 16, width, 18);
      }

      if (banner.ttl > 0) {
        ctx.textAlign = "center";
        ctx.font = "bold 24px monospace";
        const w = ctx.measureText(banner.text).width + 32;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(VIEW_W / 2 - w / 2, VIEW_H - 70, w, 44);
        ctx.fillStyle = state.status === "won" ? "#7CFC00" : state.status === "lost" ? "#ff6b6b" : "#ffffff";
        ctx.fillText(banner.text, VIEW_W / 2, VIEW_H - 59);
        ctx.textAlign = "left";
      }

      if (state.flash > 0) {
        ctx.fillStyle = "rgba(255,0,0," + state.flash + ")";
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }
    }

    function render() {
      updateCamera();
      drawBackground();
      drawTiles();
      drawEntities();
      drawHud();
    }

    // ------------------------------------------------------------------- input
    const DIRS = {
      ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
      ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
    };
    const HANDLED = new Set([...Object.keys(DIRS), "Space"]);
    const DIRS_LOOKUP = (dir) => Object.keys(DIRS).find((code) => DIRS[code] === dir);

    function handleDown(code) {
      keys.add(code);
      if (platformer) {
        if (["ArrowUp", "KeyW", "Space"].includes(code)) state.player.jumpBuf = 0.12;
      } else if (mode) {
        if (mode.onKey) mode.onKey(code);
      } else if (shooter) {
        if (code === "Space") shoot();
      } else if (arcade) {
        if (DIRS[code]) state.player.want = { x: DIRS[code][0], y: DIRS[code][1] };
      } else if (state.status === "playing") {
        if (code === "Space") attack();
        if (code === "ShiftLeft" || code === "ShiftRight") dash();
      }
    }

    function handleUp(code) {
      keys.delete(code);
      if (DIRS[code]) {
        const index = dirStack.indexOf(DIRS[code]);
        if (index !== -1) dirStack.splice(index, 1);
      }
    }

    function onKeyDown(event) {
      if (event.target && /INPUT|TEXTAREA/.test(event.target.tagName)) return;
      if (HANDLED.has(event.code)) event.preventDefault();
      if (event.code === "KeyR" || (event.code === "Enter" && state.status !== "playing")) {
        reset();
        return;
      }
      if (!event.repeat) handleDown(event.code);
    }

    function onKeyUp(event) {
      handleUp(event.code);
    }

    // El lienzo se muestra escalado: convierte el puntero a coordenadas internas.
    function pointerPoint(event) {
      const rect = canvas.getBoundingClientRect();
      return { x: ((event.clientX - rect.left) / rect.width) * VIEW_W, y: ((event.clientY - rect.top) / rect.height) * VIEW_H };
    }

    function onPointerMove(event) {
      const point = pointerPoint(event);
      if (mode) mode.onPointer(point.x, point.y, false);
      else state.aim = point;
    }

    function onPointerUp() {
      if (mode && mode.onPointerUp) mode.onPointerUp();
    }

    function onPointerDown(event) {
      event.preventDefault();
      canvas.focus();
      // Seguir el dedo aunque salga del lienzo mientras arrastra.
      if (canvas.setPointerCapture && event.pointerId !== undefined) {
        try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
      }
      const point = pointerPoint(event);
      if (mode) {
        mode.onPointer(point.x, point.y, true);
      } else {
        state.aim = point;
        shoot();
      }
    }

    function onBlur() {
      keys.clear();
      dirStack.length = 0;
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
      lastFrame = now;
      frameDt = dt;
      update(dt);
      render();
      rafId = requestAnimationFrame(frame);
    }

    reset();
    if (!options.manual) {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      window.addEventListener("blur", onBlur);
      if (shooter || (mode && mode.onPointer)) {
        canvas.addEventListener("pointermove", onPointerMove);
        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointercancel", onPointerUp);
        canvas.style.touchAction = "none";
        if (shooter) canvas.style.cursor = "none";
      }
      rafId = requestAnimationFrame(frame);
    } else {
      render();
    }

    return {
      restart: reset,
      destroy() {
        cancelAnimationFrame(rafId);
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
        window.removeEventListener("blur", onBlur);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.style.cursor = "";
        canvas.style.touchAction = "";
      },
      // API para pruebas automatizadas
      step(dt) {
        update(dt);
      },
      render,
      press(code) {
        if (!keys.has(code)) handleDown(code);
      },
      release: handleUp,
      snapshot() {
        return { state: structuredClone(state), keys: [...keys], dirs: dirStack.map((d) => DIRS_LOOKUP(d)) };
      },
      restore(snap) {
        state = structuredClone(snap.state);
        keys.clear();
        dirStack.length = 0;
        for (const code of snap.keys) keys.add(code);
        for (const code of snap.dirs) dirStack.push(DIRS[code]);
      },
      get state() {
        return state;
      },
      get tile() {
        return T;
      },
    };
  }

  window.LevelGame.create = createGame;
})();
