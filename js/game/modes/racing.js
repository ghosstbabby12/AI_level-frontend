// Carreras en perspectiva: suelo tipo "Modo 7" visto desde atras del kart, con cajas de objetos,
// monedas, turbos y rivales que siguen la ruta. Todos los graficos son propios.
window.LevelGame.modes.racing = {
  tile: () => 30,
  create(kit) {
    const { ctx, level, grid, W, H, hash, shade, say, win, held, sprites, kinds, VIEW_W, VIEW_H } = kit;
    const LAPS = (level.params && level.params.laps) || 3;

    // Conduccion
    const MAX_SPEED = 13;
    const COIN_BONUS = 0.15;
    const MAX_COINS = 10;
    const BOOST_SPEED = 19;
    const OFFROAD_SPEED = 5.5;
    const ACCEL = 15;
    const BRAKE = 24;
    const TURN = 2.5;
    const GRIP = level.theme === "ice" ? 2.4 : level.theme === "desert" ? 5 : 8;
    const RIVAL_SPEED = ({ easy: 9.5, normal: 11.2, hard: 12.8 }[level.difficulty] || 11.2) * (level.theme === "ice" ? 0.82 : 1);
    const COUNTDOWN = 3;
    const PROGRESS_WINDOW = 20;
    const SPIN_TIME = 1.1;
    const BOX_RESPAWN = 6;

    // Camara y proyeccion
    const RENDER_W = 320;
    const SCALE = VIEW_W / RENDER_W;
    const HORIZON = 84; // en pixeles internos
    const FLOOR_H = Math.ceil(VIEW_H / SCALE) - HORIZON;
    const FOCAL = 150; // en pixeles internos
    const CAM_HEIGHT = 1.35;
    const CAM_BACK = 2.9;
    // Un kart mas cerca que esto taparia la pantalla: pasa por detras de la camara sin dibujarse.
    const KART_NEAR_LIMIT = 2;
    const TEX = 12; // pixeles de textura por casilla
    const ROAD_WIDTH = 6.2; // en casillas
    const MASK = 4; // pixeles de mascara por casilla

    const THEMES = {
      overworld: { ground: ["#4fbf4a", "#46b042"], road: "#7c7f8c", kerb: ["#e5e7eb", "#dc2626"], far: "#6fbf8f", near: "#2f9e57", scenery: "tree" },
      forest: { ground: ["#3a9a45", "#32893c"], road: "#6e6a62", kerb: ["#e5e7eb", "#b45309"], far: "#4f9f7a", near: "#1f7a43", scenery: "pine" },
      desert: { ground: ["#e7c27a", "#dcb46a"], road: "#a88a63", kerb: ["#f8fafc", "#c2410c"], far: "#e3a765", near: "#c98a4b", scenery: "cactus" },
      ice: { ground: ["#e6f4fb", "#d3e9f5"], road: "#8fb6d0", kerb: ["#ffffff", "#2563eb"], far: "#b9d7ea", near: "#8fbcd8", scenery: "snowpine" },
      lava: { ground: ["#3a1614", "#451a16"], road: "#4b4148", kerb: ["#fb923c", "#111827"], far: "#5c1f1a", near: "#3a100d", scenery: "rock" },
      dungeon: { ground: ["#4b4b57", "#42424d"], road: "#6e6e7c", kerb: ["#cbd5e1", "#7c2d12"], far: "#3f3f4b", near: "#2b2b35", scenery: "rock" },
      water: { ground: ["#2d8fb8", "#2884aa"], road: "#c9b48a", kerb: ["#fef3c7", "#0f766e"], far: "#3aa8c9", near: "#1f7f9e", scenery: "coral" },
      space: { ground: ["#1c1f3d", "#171a34"], road: "#3c4170", kerb: ["#22d3ee", "#a855f7"], far: "#2b2f63", near: "#1a1d45", scenery: "crystal" },
    };
    const look = THEMES[level.theme] || THEMES.overworld;

    function makeSprite(rows, colors) {
      const canvas = document.createElement("canvas");
      canvas.width = rows[0].length;
      canvas.height = rows.length;
      const g = canvas.getContext("2d");
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (colors[ch]) {
          g.fillStyle = colors[ch];
          g.fillRect(x, y, 1, 1);
        }
      }));
      return canvas;
    }

    // Kart de espaldas. "h" casco, "j" chaqueta y "b" carroceria cambian con cada piloto.
    const KART_ROWS = [
      "......hhhh......",
      ".....hhhhhh.....",
      ".....hwwwwh.....",
      ".....hhhhhh.....",
      "......jjjj......",
      ".....jjjjjj.....",
      "..bbbbjjjjbbbb..",
      ".bbbbbbbbbbbbbb.",
      "ttbbrbbbbbbrbbtt",
      "ttbbbbssssbbbbtt",
      "ttbbbbssssbbbbtt",
      "tt.bbbbbbbbbb.tt",
      "tt............tt",
    ];
    const lean = (dir) => KART_ROWS.map((row, y) => {
      if (y > 5) return row;
      return dir > 0 ? "." + row.slice(0, -1) : row.slice(1) + ".";
    });
    function kartFrames(body, helmet) {
      const colors = { h: helmet, w: "#f8fafc", j: shade(body, -0.35), b: body, t: "#111827", r: "#fde047", s: "#334155" };
      return { straight: makeSprite(KART_ROWS, colors), left: makeSprite(lean(-1), colors), right: makeSprite(lean(1), colors) };
    }
    const PILOTS = [
      { body: "#3b82f6", helmet: "#1e3a8a" },
      { body: "#eab308", helmet: "#854d0e" },
      { body: "#a855f7", helmet: "#581c87" },
      { body: "#10b981", helmet: "#065f46" },
      { body: "#f97316", helmet: "#9a3412" },
      { body: "#ec4899", helmet: "#9d174d" },
    ];
    const playerKart = kartFrames("#ef4444", "#7f1d1d");
    const rivalKarts = PILOTS.map((p) => kartFrames(p.body, p.helmet));

    const SCENERY = {
      tree: makeSprite(["...gggg...", ".gggGGggg.", "ggGGggggGg", "gggggGGggg", "gGGggggggg", ".gggggGgg.", "...gggg...", "....tt....", "....tt....", "...tttt..."], { g: "#22a34a", G: "#4ade80", t: "#7c4a1e" }),
      pine: makeSprite(["....gg....", "...gGGg...", "..gggggg..", "...gggg...", "..gGGggg..", ".gggggggg.", "..gggGgg..", ".gggggggg.", "gGggggggGg", "....tt....", "....tt...."], { g: "#14713c", G: "#22a34a", t: "#5b3a1e" }),
      snowpine: makeSprite(["....ww....", "...wwww...", "..wwgwww..", "...gggg...", "..wwgggg..", ".wwwggggg.", "..gggggg..", ".wwgggggg.", "ggggggggwg", "....tt....", "....tt...."], { g: "#2f7d67", w: "#f8fafc", t: "#5b3a1e" }),
      cactus: makeSprite(["....gg....", "....gg....", "g...gG...g", "gG..gG..gG", "gG..gG..gG", "gGgggGgggG", ".gggGGggg.", "....gG....", "....gG....", "....gG...."], { g: "#2f8f4f", G: "#4ade80" }),
      rock: makeSprite(["..........", "...rrrr...", "..rRRrrr..", ".rRrrrrrr.", ".rrrrrRrr.", "rrRrrrrrrr", "rrrrrrrRrr", "rrrrrrrrrr"], { r: shade(look.far, 0.05), R: shade(look.far, 0.35) }),
      coral: makeSprite(["p..p...p..", "pp.p..pp..", ".ppp.pp.p.", "..ppppp.pp", "...ppppp..", "....ppp...", "....pp....", "....pp...."], { p: "#fb7185" }),
      crystal: makeSprite(["....c.....", "...cCc....", "...cCc..c.", "..ccCcc.Cc", "..cCCcc.Cc", ".ccCCccccc", ".cCCCccCcc", "ccCCCCcccc"], { c: "#7c3aed", C: "#c4b5fd" }),
    };
    const BOX = makeSprite(["yyyyyyyy", "ywwwwwwy", "yw.pp.wy", "yw...pwy", "yw..p.wy", "yw....wy", "yw..p.wy", "yyyyyyyy"], { y: "#facc15", w: "rgba(255,255,255,0.75)", p: "#db2777", ".": "rgba(125,211,252,0.55)" });
    const ROCKET = makeSprite(["..rrrr..", ".rRRrrr.", "rRwrrrrr", "rrrrrrrr", "rrrrrrrr", "rrrrrrrr", ".rrrrrr.", "..dddd.."], { r: "#ef4444", R: "#fecaca", w: "#fff", d: "#7f1d1d" });
    const TURBO_ICON = makeSprite(["...oo...", "..oooo..", ".oooooo.", "oooooooo", "...oo...", "...oo...", "...oo...", "...oo..."], { o: "#fb923c" });
    const OIL_ICON = makeSprite(["..kkkk..", ".kkKkkk.", "kkKkkkkk", "kkkkkkkk", "kkkkkkkk", ".kkkkkk.", "..kkkk..", "........"], { k: "#111827", K: "#64748b" });
    const ITEM_ICON = { turbo: TURBO_ICON, rocket: ROCKET, oil: OIL_ICON };

    // Ruta suavizada: la pista se dibuja con curvas, no en escalones de casilla.
    const route = level.route;
    const N = route.length;
    const wrap = (i) => ((i % N) + N) % N;
    const smooth = route.map((_, i) => {
      let x = 0;
      let y = 0;
      for (let k = -4; k <= 4; k++) {
        x += route[wrap(i + k)].x + 0.5;
        y += route[wrap(i + k)].y + 0.5;
      }
      return { x: x / 9, y: y / 9 };
    });
    const headingAt = (i, ahead = 4) => {
      const a = smooth[wrap(i)];
      const b = smooth[wrap(i + ahead)];
      return Math.atan2(b.y - a.y, b.x - a.x);
    };
    const angleDiff = (a, b) => {
      let d = a - b;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    };
    const pointAcross = (i, offset) => {
      const n = headingAt(i) + Math.PI / 2;
      return { x: smooth[wrap(i)].x + Math.cos(n) * offset, y: smooth[wrap(i)].y + Math.sin(n) * offset };
    };

    // Elementos fijos de la pista, derivados de la semilla por el orden de la ruta.
    const padSpots = [];
    const coinSpots = [];
    for (let i = 20; i < N - 8; i += 26) {
      const lane = (hash(i, 1, 31) - 0.5) * 3.4;
      if (hash(i, 2, 31) < 0.45) padSpots.push(pointAcross(i, lane));
      else for (let k = 0; k < 4; k++) coinSpots.push(pointAcross(i + k * 2, lane));
    }
    const boxRows = [];
    const oilSpots = [];
    const rivalCells = [];
    grid.forEach((row, y) => row.forEach((cell, x) => {
      if (cell === "item") boxRows.push({ x, y });
      else if (cell === "trap") oilSpots.push({ x: x + 0.5, y: y + 0.5 });
      else if (cell === "enemy") rivalCells.push({ x, y });
    }));

    function nearestIndex(x, y) {
      let best = 0;
      let bestD = Infinity;
      smooth.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    // Textura del circuito: se dibuja una vez y el suelo la muestrea en cada fotograma.
    function tracePath(g, scale) {
      g.beginPath();
      smooth.forEach((p, i) => (i ? g.lineTo(p.x * scale, p.y * scale) : g.moveTo(p.x * scale, p.y * scale)));
      g.closePath();
    }

    function buildTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = W * TEX;
      canvas.height = H * TEX;
      const g = canvas.getContext("2d");
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          g.fillStyle = look.ground[(x + y) / 2 % 2];
          g.fillRect(x * TEX, y * TEX, TEX * 2, TEX * 2);
        }
      }
      g.lineJoin = "round";
      g.lineCap = "butt";
      tracePath(g, TEX);
      g.strokeStyle = look.kerb[0];
      g.lineWidth = (ROAD_WIDTH + 0.9) * TEX;
      g.stroke();
      tracePath(g, TEX);
      g.strokeStyle = look.kerb[1];
      g.setLineDash([TEX * 1.4, TEX * 1.4]);
      g.stroke();
      g.setLineDash([]);
      tracePath(g, TEX);
      g.strokeStyle = look.road;
      g.lineWidth = ROAD_WIDTH * TEX;
      g.stroke();
      tracePath(g, TEX);
      g.strokeStyle = "rgba(255,255,255,0.75)";
      g.lineWidth = TEX * 0.18;
      g.setLineDash([TEX * 1.2, TEX * 1.8]);
      g.stroke();
      g.setLineDash([]);

      // Linea de meta a cuadros
      const a = headingAt(0);
      g.save();
      g.translate(smooth[0].x * TEX, smooth[0].y * TEX);
      g.rotate(a);
      const cols = Math.ceil(ROAD_WIDTH * 2);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 3; j++) {
          g.fillStyle = (i + j) % 2 ? "#f8fafc" : "#111827";
          g.fillRect((j - 1.5) * TEX * 0.5, (i - cols / 2) * TEX * 0.5, TEX * 0.5, TEX * 0.5);
        }
      }
      g.restore();

      for (const pad of padSpots) {
        g.save();
        g.translate(pad.x * TEX, pad.y * TEX);
        g.rotate(headingAt(nearestIndex(pad.x, pad.y)));
        for (const off of [-TEX * 0.7, 0]) {
          g.fillStyle = off ? "#fdba74" : "#f97316";
          g.beginPath();
          g.moveTo(off, -TEX * 0.8);
          g.lineTo(off + TEX * 0.7, 0);
          g.lineTo(off, TEX * 0.8);
          g.lineTo(off + TEX * 0.25, 0);
          g.closePath();
          g.fill();
        }
        g.restore();
      }

      g.fillStyle = "rgba(2,6,23,0.9)";
      for (const spot of oilSpots) {
        g.beginPath();
        g.ellipse(spot.x * TEX, spot.y * TEX, TEX * 0.8, TEX * 0.6, hash(spot.x | 0, spot.y | 0, 3) * 3, 0, Math.PI * 2);
        g.fill();
      }
      return new Uint32Array(g.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    }

    function buildRoadMask() {
      const canvas = document.createElement("canvas");
      canvas.width = W * MASK;
      canvas.height = H * MASK;
      const g = canvas.getContext("2d");
      g.lineJoin = "round";
      tracePath(g, MASK);
      g.strokeStyle = "#fff";
      g.lineWidth = (ROAD_WIDTH + 0.9) * MASK;
      g.stroke();
      const data = g.getImageData(0, 0, canvas.width, canvas.height).data;
      const mask = new Uint8Array(canvas.width * canvas.height);
      for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 100 ? 1 : 0;
      return mask;
    }

    const texture = buildTexture();
    const roadMask = buildRoadMask();
    const onRoad = (x, y) => {
      const tx = Math.floor(x * MASK);
      const ty = Math.floor(y * MASK);
      return tx >= 0 && ty >= 0 && tx < W * MASK && ty < H * MASK && roadMask[ty * W * MASK + tx] === 1;
    };
    const groundFill = (() => {
      const c = document.createElement("canvas").getContext("2d");
      c.fillStyle = look.ground[0];
      c.fillRect(0, 0, 1, 1);
      return new Uint32Array(c.getImageData(0, 0, 1, 1).data.buffer)[0];
    })();

    // Decoracion: fuera de la pista, cerca para que se aprecie al pasar.
    const scenery = [];
    for (let y = 2; y < H - 2; y += 3) {
      for (let x = 2; x < W - 2; x += 3) {
        const px = x + hash(x, y, 41) * 2;
        const py = y + hash(x, y, 42) * 2;
        if (hash(x, y, 43) < 0.42 && !onRoad(px, py) && !onRoad(px + 1.2, py) && !onRoad(px - 1.2, py) && !onRoad(px, py + 1.2) && !onRoad(px, py - 1.2)) {
          scenery.push({ x: px, y: py, size: 1.5 + hash(x, y, 44) * 1.4 });
        }
      }
    }
    const scenerySprite = SCENERY[look.scenery];

    // Paisaje de fondo: dos capas de relieve que se desplazan al girar.
    function buildBackdrop(color, base, amp, roughness, seed, trees) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = HORIZON;
      const g = canvas.getContext("2d");
      g.fillStyle = color;
      for (let x = 0; x < 640; x += 2) {
        const t = (x / 640) * Math.PI * 2;
        const height = base + amp * (0.5 + 0.5 * Math.sin(t * 3 + seed)) + amp * 0.5 * (0.5 + 0.5 * Math.sin(t * roughness + seed * 2));
        const bump = trees ? (hash(Math.floor(x / 12), 1, seed) * 7) : 0;
        g.fillRect(x, HORIZON - height - bump, 2, height + bump);
      }
      return canvas;
    }
    const farLayer = buildBackdrop(look.far, 14, 26, 7, 3, false);
    const nearLayer = buildBackdrop(look.near, 6, 9, 13, 5, true);

    const floor = document.createElement("canvas");
    floor.width = RENDER_W;
    floor.height = FLOOR_H;
    const floorCtx = floor.getContext("2d");
    const floorImage = floorCtx.createImageData(RENDER_W, FLOOR_H);
    const floorPixels = new Uint32Array(floorImage.data.buffer);

    function drawFloor(cam) {
      const cos = Math.cos(cam.angle);
      const sin = Math.sin(cam.angle);
      const width = W * TEX;
      const height = H * TEX;
      let out = 0;
      for (let row = 0; row < FLOOR_H; row++) {
        const z = (CAM_HEIGHT * FOCAL) / (row + 1);
        const stepX = (-sin * z) / FOCAL;
        const stepY = (cos * z) / FOCAL;
        let wx = cam.x + cos * z - stepX * (RENDER_W / 2);
        let wy = cam.y + sin * z - stepY * (RENDER_W / 2);
        for (let col = 0; col < RENDER_W; col++) {
          const tx = (wx * TEX) | 0;
          const ty = (wy * TEX) | 0;
          floorPixels[out++] = tx >= 0 && ty >= 0 && tx < width && ty < height ? texture[ty * width + tx] : groundFill;
          wx += stepX;
          wy += stepY;
        }
      }
      floorCtx.putImageData(floorImage, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(floor, 0, HORIZON * SCALE, VIEW_W, FLOOR_H * SCALE);
    }

    function drawSky(cam) {
      const gradient = ctx.createLinearGradient(0, 0, 0, HORIZON * SCALE);
      gradient.addColorStop(0, level.palette.sky[0]);
      gradient.addColorStop(1, level.palette.sky[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, VIEW_W, HORIZON * SCALE);

      const night = level.theme === "space" || level.theme === "lava" || level.theme === "dungeon";
      if (night) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        for (let i = 0; i < 60; i++) {
          const x = ((hash(i, 1, 9) * VIEW_W * 2 - cam.angle * 240) % VIEW_W + VIEW_W) % VIEW_W;
          ctx.fillRect(x, hash(i, 2, 9) * HORIZON * SCALE * 0.8, 3, 3);
        }
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        for (let i = 0; i < 9; i++) {
          const x = ((hash(i, 1, 8) * VIEW_W * 2 - cam.angle * 200) % (VIEW_W + 240) + VIEW_W + 240) % (VIEW_W + 240) - 120;
          const y = 16 + hash(i, 2, 8) * 110;
          const u = 12;
          ctx.fillRect(x, y + u, u * 8, u * 2);
          ctx.fillRect(x + u * 2, y, u * 4, u * 3);
        }
      }

      const layer = (image, speed) => {
        const offset = ((cam.angle * speed) % 640 + 640) % 640;
        const scale = SCALE;
        ctx.drawImage(image, -offset * scale, 0, 640 * scale, HORIZON * scale);
        ctx.drawImage(image, (640 - offset) * scale, 0, 640 * scale, HORIZON * scale);
      };
      layer(farLayer, 70);
      layer(nearLayer, 150);
    }

    // Proyecta un punto del mundo a la pantalla; null si queda detras de la camara.
    function project(cam, x, y) {
      const dx = x - cam.x;
      const dy = y - cam.y;
      const cos = Math.cos(cam.angle);
      const sin = Math.sin(cam.angle);
      const z = dx * cos + dy * sin;
      if (z < 0.6) return null;
      const side = -dx * sin + dy * cos;
      const f = FOCAL * SCALE;
      return { sx: VIEW_W / 2 + (side / z) * f, sy: (HORIZON + (CAM_HEIGHT * FOCAL) / z) * SCALE, unit: f / z, z };
    }

    function drawKart(p, frames, turn, spin) {
      const w = p.unit * 0.8;
      const h = (w * 13) / 16;
      const frame = turn < 0 ? frames.left : turn > 0 ? frames.right : frames.straight;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(p.sx, p.sy, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(p.sx, p.sy - h / 2);
      // Al girar se inclina; al trompear da vueltas.
      ctx.rotate(spin ? spin * 12 : turn * 0.07);
      ctx.drawImage(frame, -w / 2, -h / 2, w, h);
      ctx.restore();
    }

    function drawThings(s, cam) {
      const things = [];
      const add = (x, y, fn) => {
        const p = project(cam, x, y);
        if (p && p.z < 42 && p.sx > -200 && p.sx < VIEW_W + 200) things.push({ p, fn });
      };
      for (const t of scenery) {
        add(t.x, t.y, (p) => {
          const size = p.unit * t.size;
          ctx.drawImage(scenerySprite, p.sx - size / 2, p.sy - size, size, size);
        });
      }
      for (const box of s.boxes) {
        if (box.wait > 0) continue;
        add(box.x, box.y, (p) => {
          const size = p.unit * 0.8;
          const bob = Math.sin(kit.time * 4 + box.x) * size * 0.08;
          ctx.drawImage(BOX, p.sx - size / 2, p.sy - size * 1.15 + bob, size, size);
        });
      }
      for (const coin of s.coins) {
        if (coin.taken) continue;
        add(coin.x, coin.y, (p) => {
          const size = p.unit * 0.45;
          const squash = Math.abs(Math.cos(kit.time * 5 + coin.x));
          ctx.drawImage(sprites.coin, p.sx - (size * squash) / 2, p.sy - size * 1.1, size * squash, size);
        });
      }
      for (const puddle of s.drops) {
        add(puddle.x, puddle.y, (p) => {
          ctx.fillStyle = "rgba(2,6,23,0.9)";
          ctx.beginPath();
          ctx.ellipse(p.sx, p.sy, p.unit * 0.6, p.unit * 0.15, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      for (const rocket of s.rockets) {
        add(rocket.x, rocket.y, (p) => {
          const size = p.unit * 0.5;
          ctx.drawImage(ROCKET, p.sx - size / 2, p.sy - size * 0.9, size, size);
        });
      }
      s.rivals.forEach((r) => {
        add(r.x, r.y, (p) => {
          if (p.z < KART_NEAR_LIMIT) return;
          const turn = Math.abs(r.turn) > 0.25 ? Math.sign(r.turn) : 0;
          drawKart(p, rivalKarts[r.pilot], turn, r.spin);
        });
      });
      const c = s.car;
      add(c.x, c.y, (p) => {
        drawKart(p, playerKart, c.steer, c.spin);
        if (c.boost > 0 || (Math.abs(c.steer) && Math.abs(c.speed) > 9)) {
          ctx.fillStyle = c.boost > 0 ? "#fb923c" : "rgba(226,232,240,0.7)";
          for (let i = 0; i < 4; i++) {
            const puff = hash(i, Math.floor(kit.time * 20), 5);
            ctx.fillRect(p.sx + (i % 2 ? 1 : -1) * p.unit * (0.3 + puff * 0.2) - 5, p.sy - 8 + puff * 14, 10, 10);
          }
        }
      });
      things.sort((a, b) => b.p.z - a.p.z);
      for (const t of things) t.fn(t.p);
    }

    const progress = (car) => car.laps * N + car.idx;

    // Avanza al punto mas cercano dentro de una ventana hacia delante: no cuenta ir marcha atras ni atajar.
    function advance(car) {
      const distance = (i) => {
        const p = smooth[wrap(i)];
        return Math.hypot(p.x - car.x, p.y - car.y);
      };
      let best = 0;
      let bestD = distance(car.idx);
      for (let look2 = 1; look2 <= PROGRESS_WINDOW; look2++) {
        const d = distance(car.idx + look2);
        if (d <= bestD) {
          bestD = d;
          best = look2;
        }
      }
      if (!best) return;
      const before = car.idx;
      car.idx = wrap(car.idx + best);
      if (car.idx < before) car.laps++;
    }

    function ranking(s) {
      return [s.car, ...s.rivals].slice().sort((a, b) => progress(b) - progress(a));
    }

    function placeOf(s) {
      return ranking(s).indexOf(s.car) + 1;
    }

    function spinOut(target) {
      target.spin = SPIN_TIME;
      target.speed *= 0.3;
    }

    function useItem(s) {
      const c = s.car;
      if (!s.item || s.countdown > 0 || s.status !== "playing") return;
      if (s.item === "turbo") {
        c.boost = 1.5;
        c.speed = Math.max(c.speed, BOOST_SPEED * 0.9);
      } else if (s.item === "rocket") {
        // Va por la ruta hasta alcanzar al rival mas cercano por delante.
        const ahead = s.rivals.filter((r) => progress(r) > progress(c)).sort((a, b) => progress(a) - progress(b))[0];
        s.rockets.push({ x: c.x, y: c.y, idx: c.idx, target: ahead || null, life: 6 });
      } else if (s.item === "oil") {
        s.drops.push({ x: c.x - Math.cos(c.angle) * 1.3, y: c.y - Math.sin(c.angle) * 1.3 });
      }
      s.item = null;
    }

    function pickItem(s) {
      // Quien va atras recibe objetos mejores, para mantener la carrera reñida.
      const place = placeOf(s);
      const roll = Math.random();
      if (place === 1) return roll < 0.6 ? "oil" : "turbo";
      return roll < 0.5 ? "rocket" : roll < 0.85 ? "turbo" : "oil";
    }

    return {
      noHearts: true,
      customHud: true,
      reset() {
        const a = headingAt(0);
        const rivals = rivalCells.map((cell, i) => {
          const idx = nearestIndex(cell.x + 0.5, cell.y + 0.5);
          return {
            x: cell.x + 0.5, y: cell.y + 0.5, angle: headingAt(idx), idx, laps: idx > N / 2 ? -1 : 0, speed: 0,
            lane: (i % 3 - 1) * 1.5, pilot: i % PILOTS.length, skill: 0.94 + hash(cell.x, cell.y, 13) * 0.12, finished: false, spin: 0, turn: 0, stuck: 0, reverse: 0,
          };
        });
        const boxes = [];
        for (const cell of boxRows) {
          const idx = nearestIndex(cell.x + 0.5, cell.y + 0.5);
          for (const off of [-1.6, 0, 1.6]) boxes.push({ ...pointAcross(idx, off), wait: 0 });
        }
        const s = {
          status: "playing", hp: 3, score: 0, invuln: 0, flash: 0, boss: null,
          car: { x: smooth[0].x - Math.cos(a) * 0.5, y: smooth[0].y - Math.sin(a) * 0.5, angle: a, vx: 0, vy: 0, speed: 0, idx: 0, laps: 0, boost: 0, slip: 0, spin: 0, steer: 0 },
          cam: { angle: a }, rivals, boxes, coins: coinSpots.map((p) => ({ ...p, taken: false })), drops: [], rockets: [],
          pads: padSpots, oil: oilSpots.map((p) => ({ ...p })), item: null, coinsHeld: 0, countdown: COUNTDOWN, finished: 0, time: 0, wrongWay: 0,
        };
        const title = level.narrative && level.narrative.title;
        say((title ? title + " · " : "") + LAPS + " vueltas", 2.8);
        return s;
      },
      onKey(code) {
        if (code === "Space" || code === "ShiftLeft") useItem(kit.state);
      },
      update(dt) {
        const s = kit.state;
        if (s.countdown > 0) {
          s.countdown -= dt;
          return;
        }
        s.time += dt;
        const c = s.car;

        c.steer = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
        const gas = held("ArrowUp", "KeyW") && c.spin <= 0;
        const brake = held("ArrowDown", "KeyS");
        c.boost = Math.max(0, c.boost - dt);
        c.slip = Math.max(0, c.slip - dt);
        c.spin = Math.max(0, c.spin - dt);

        const road = onRoad(c.x, c.y);
        const baseTop = MAX_SPEED + s.coinsHeld * COIN_BONUS;
        const top = c.boost > 0 ? BOOST_SPEED : road ? baseTop : OFFROAD_SPEED;
        if (gas) c.speed = Math.min(Math.max(top, c.speed), c.speed + ACCEL * dt);
        else if (brake) c.speed = Math.max(-4, c.speed - BRAKE * dt);
        else c.speed *= Math.exp(-1.1 * dt);
        // Fuera de la pista se pierde velocidad enseguida.
        if (c.speed > top) c.speed = Math.max(top, c.speed - (road ? ACCEL : 30) * dt);

        const turnPower = Math.min(1, Math.abs(c.speed) / 4) * Math.sign(c.speed || 1);
        if (c.spin <= 0) c.angle += c.steer * TURN * turnPower * dt;

        // La velocidad real tiende a la direccion del coche: la diferencia es el derrape.
        const grip = 1 - Math.exp(-(c.slip > 0 ? 1 : GRIP) * dt);
        c.vx += (Math.cos(c.angle) * c.speed - c.vx) * grip;
        c.vy += (Math.sin(c.angle) * c.speed - c.vy) * grip;
        c.x = Math.max(1, Math.min(W - 1, c.x + c.vx * dt));
        c.y = Math.max(1, Math.min(H - 1, c.y + c.vy * dt));

        // La camara sigue el giro con un poco de retraso: se nota la curva.
        s.cam.angle += angleDiff(c.angle, s.cam.angle) * (1 - Math.exp(-7 * dt));

        for (const pad of s.pads) {
          if (Math.hypot(pad.x - c.x, pad.y - c.y) < 1) {
            c.boost = 1.2;
            c.speed = Math.max(c.speed, BOOST_SPEED * 0.9);
          }
        }
        for (const spot of s.oil) {
          if (Math.hypot(spot.x - c.x, spot.y - c.y) < 0.8 && c.slip <= 0) {
            c.slip = 1;
            c.speed *= 0.6;
            say("¡Aceite!", 0.7);
          }
        }
        for (const coin of s.coins) {
          if (!coin.taken && Math.hypot(coin.x - c.x, coin.y - c.y) < 0.85) {
            coin.taken = true;
            s.coinsHeld = Math.min(MAX_COINS, s.coinsHeld + 1);
            s.score += 10;
          }
        }
        for (const box of s.boxes) {
          box.wait = Math.max(0, box.wait - dt);
          if (box.wait <= 0 && Math.hypot(box.x - c.x, box.y - c.y) < 0.95) {
            box.wait = BOX_RESPAWN;
            if (!s.item) s.item = pickItem(s);
          }
        }
        s.drops = s.drops.filter((d) => {
          const victim = [c, ...s.rivals].find((k) => Math.hypot(d.x - k.x, d.y - k.y) < 0.8);
          if (!victim) return true;
          spinOut(victim);
          if (victim === c) say("¡Patinaste!", 0.8);
          return false;
        });

        for (const rocket of s.rockets) {
          rocket.life -= dt;
          const aim = rocket.target && rocket.target.spin <= 0 ? rocket.target : null;
          const goal = aim && Math.hypot(aim.x - rocket.x, aim.y - rocket.y) < 6 ? aim : smooth[wrap(rocket.idx + 5)];
          const dx = goal.x - rocket.x;
          const dy = goal.y - rocket.y;
          const d = Math.hypot(dx, dy) || 1;
          rocket.x += (dx / d) * 24 * dt;
          rocket.y += (dy / d) * 24 * dt;
          advance(rocket);
          const hit = s.rivals.find((r) => Math.hypot(r.x - rocket.x, r.y - rocket.y) < 0.9);
          if (hit) {
            spinOut(hit);
            rocket.life = 0;
            s.score += 50;
            say("¡Impacto!", 0.8);
          }
        }
        s.rockets = s.rockets.filter((r) => r.life > 0);

        const lapBefore = c.laps;
        const idxBefore = c.idx;
        advance(c);
        if (c.laps > lapBefore && c.laps < LAPS) say(c.laps === LAPS - 1 ? "¡Última vuelta!" : "Vuelta " + (c.laps + 1) + " de " + LAPS, 1.5);
        // Aviso si se va en sentido contrario durante un rato.
        const facing = Math.abs(angleDiff(c.angle, headingAt(c.idx)));
        s.wrongWay = facing > 2.2 && Math.abs(c.speed) > 2 && idxBefore === c.idx ? s.wrongWay + dt : 0;

        for (const r of s.rivals) {
          r.spin = Math.max(0, r.spin - dt);
          if (r.spin > 0) {
            r.speed *= Math.exp(-3 * dt);
            r.x += Math.cos(r.angle) * r.speed * dt;
            r.y += Math.sin(r.angle) * r.speed * dt;
            continue;
          }
          // Ligera ayuda a quien se queda atras para que la carrera siga disputada.
          const gap = progress(r) - progress(c);
          const rubber = gap > 40 ? 0.9 : gap < -40 ? 1.1 : 1;
          const target = pointAcross(r.idx + 7, r.lane);
          const diff = angleDiff(Math.atan2(target.y - r.y, target.x - r.x), r.angle);
          r.turn = diff;
          r.angle += Math.max(-1, Math.min(1, diff * 3)) * 3.2 * dt;
          const curve = Math.min(1, Math.abs(diff) * 1.5);
          const wanted = RIVAL_SPEED * r.skill * rubber * (1 - curve * 0.3);
          if (r.reverse > 0) {
            r.reverse -= dt;
            r.speed = r.reverse > 0 ? -4 : 0;
          } else {
            r.speed += Math.max(-20 * dt, Math.min(ACCEL * 0.7 * dt, wanted - r.speed));
          }
          r.x = Math.max(1, Math.min(W - 1, r.x + Math.cos(r.angle) * r.speed * dt));
          r.y = Math.max(1, Math.min(H - 1, r.y + Math.sin(r.angle) * r.speed * dt));
          // Fuera de la pista va mas lento y vuelve al centro.
          if (!onRoad(r.x, r.y)) {
            r.speed = Math.min(r.speed, OFFROAD_SPEED + 1);
            r.lane *= 0.98;
          }
          advance(r);
          if (!r.finished && r.laps >= LAPS) {
            r.finished = true;
            s.finished++;
          }

          for (const o of s.rivals) {
            if (o === r) continue;
            const ox = r.x - o.x;
            const oy = r.y - o.y;
            const od = Math.hypot(ox, oy);
            if (od > 0 && od < 0.85) {
              r.x += (ox / od) * (0.85 - od) * 0.5;
              r.y += (oy / od) * (0.85 - od) * 0.5;
            }
          }

          // Los karts se empujan al chocar.
          const dx = c.x - r.x;
          const dy = c.y - r.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 0.85) {
            c.vx += (dx / d) * 18 * dt;
            c.vy += (dy / d) * 18 * dt;
            c.x += (dx / d) * (0.85 - d) * 0.5;
            c.y += (dy / d) * (0.85 - d) * 0.5;
          }
        }

        if (c.laps >= LAPS) {
          const place = s.finished + 1;
          s.score += Math.max(0, Math.round(1000 - s.time * 5)) + (place === 1 ? 500 : 0);
          if (place === 1) win();
          else {
            s.status = "lost";
            say("Llegaste en posición " + place + " - Pulsa R para reintentar", 999);
          }
        }
      },
      hud: () => "",
      draw() {
        const s = kit.state;
        const c = s.car;
        const cam = { angle: s.cam.angle, x: c.x - Math.cos(s.cam.angle) * CAM_BACK, y: c.y - Math.sin(s.cam.angle) * CAM_BACK };
        drawSky(cam);
        drawFloor(cam);
        drawThings(s, cam);
        drawRaceHud(s);
      },
    };

    function outlined(text, x, y, size, fill, align) {
      ctx.font = "bold " + size + "px monospace";
      ctx.textAlign = align || "left";
      ctx.textBaseline = "top";
      ctx.lineWidth = Math.max(3, size / 7);
      ctx.strokeStyle = "#111827";
      ctx.strokeText(text, x, y);
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
      ctx.textAlign = "left";
    }

    function drawMinimap(s) {
      const size = 170;
      const scale = Math.min((size - 16) / W, (size - 16) / H);
      const x0 = VIEW_W - 14 - W * scale - 8;
      const y0 = VIEW_H - 14 - H * scale - 8;
      ctx.lineJoin = "round";
      ctx.beginPath();
      smooth.forEach((p, i) => (i ? ctx.lineTo(x0 + p.x * scale, y0 + p.y * scale) : ctx.moveTo(x0 + p.x * scale, y0 + p.y * scale)));
      ctx.closePath();
      ctx.strokeStyle = "rgba(15,23,42,0.6)";
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 6;
      ctx.stroke();
      s.rivals.forEach((r) => {
        ctx.fillStyle = PILOTS[r.pilot].body;
        ctx.beginPath();
        ctx.arc(x0 + r.x * scale, y0 + r.y * scale, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#ef4444";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x0 + s.car.x * scale, y0 + s.car.y * scale, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    function drawRaceHud(s) {
      const c = s.car;
      const lap = Math.max(1, Math.min(LAPS, c.laps + 1));
      const minutes = Math.floor(s.time / 60);
      const seconds = Math.floor(s.time % 60);
      const hundredths = Math.floor((s.time * 100) % 100);
      const pad = (n) => String(n).padStart(2, "0");

      outlined("VUELTA " + lap + "/" + LAPS, 18, 14, 30, "#fde047");
      outlined("TIEMPO " + minutes + "'" + pad(seconds) + '"' + pad(hundredths), VIEW_W - 16, 14, 26, "#fde047", "right");
      ctx.drawImage(sprites.coin, 18, 52, 24, 24);
      outlined("x" + s.coinsHeld, 46, 52, 24, "#f8fafc");

      // Casilla del objeto
      const box = 74;
      const bx = VIEW_W / 2 - box / 2;
      ctx.fillStyle = "rgba(148,163,184,0.75)";
      ctx.fillRect(bx, 12, box, box);
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, 12, box, box);
      if (s.item) ctx.drawImage(ITEM_ICON[s.item], bx + 13, 25, box - 26, box - 26);

      // Clasificacion: un color por piloto, de primero a ultimo
      ranking(s).forEach((k, i) => {
        const y = 92 + i * 34;
        const color = k === c ? "#ef4444" : PILOTS[k.pilot].body;
        ctx.fillStyle = "#111827";
        ctx.fillRect(14, y, 30, 30);
        ctx.fillStyle = color;
        ctx.fillRect(17, y + 3, 24, 24);
        if (k === c) {
          ctx.strokeStyle = "#fde047";
          ctx.lineWidth = 3;
          ctx.strokeRect(14, y, 30, 30);
        }
      });

      outlined(placeOf(s) + "º", 20, VIEW_H - 92, 76, "#fde047");
      drawMinimap(s);

      // Flecha de la proxima curva cerrada
      const turn = angleDiff(headingAt(c.idx + 14, 8), headingAt(c.idx + 2, 8));
      if (Math.abs(turn) > 0.75 && s.countdown <= 0) {
        const ax = VIEW_W / 2;
        const ay = 128;
        const dir = Math.sign(turn);
        ctx.fillStyle = "#f59e0b";
        ctx.fillRect(ax - 36, ay - 28, 72, 56);
        ctx.strokeStyle = "#111827";
        ctx.lineWidth = 4;
        ctx.strokeRect(ax - 36, ay - 28, 72, 56);
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.moveTo(ax + dir * 28, ay);
        ctx.lineTo(ax + dir * 4, ay - 20);
        ctx.lineTo(ax + dir * 4, ay - 8);
        ctx.lineTo(ax - dir * 26, ay - 8);
        ctx.lineTo(ax - dir * 26, ay + 8);
        ctx.lineTo(ax + dir * 4, ay + 8);
        ctx.lineTo(ax + dir * 4, ay + 20);
        ctx.closePath();
        ctx.fill();
      }

      if (s.wrongWay > 1) outlined("¡SENTIDO CONTRARIO!", VIEW_W / 2, 190, 34, "#ef4444", "center");

      if (s.countdown > 0) outlined(String(Math.ceil(s.countdown)), VIEW_W / 2, 150, 110, "#fde047", "center");
      else if (s.time < 1) outlined("¡YA!", VIEW_W / 2, 150, 90, "#4ade80", "center");
    }
  },
};
