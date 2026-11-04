// Carreras vistas desde arriba: conduccion con derrape, rivales que siguen la ruta y vueltas.
window.LevelGame.modes.racing = {
  tile: () => 30,
  create(kit) {
    const { ctx, level, grid, W, H, T, hash, shade, textures, say, win, held, camera, VIEW_W, VIEW_H } = kit;
    const route = level.route;
    const N = route.length;
    const LAPS = (level.params && level.params.laps) || 3;
    const MAX_SPEED = 13;
    const BOOST_SPEED = 18;
    const ACCEL = 16;
    const BRAKE = 24;
    const TURN = 2.9;
    // En hielo el coche patina mucho mas.
    const GRIP = level.theme === "ice" ? 2.2 : level.theme === "desert" ? 5 : 8;
    // Sobre hielo tambien ellos van con mas cuidado.
    const RIVAL_SPEED = ({ easy: 9.5, normal: 11.2, hard: 12.8 }[level.difficulty] || 11.2) * (level.theme === "ice" ? 0.82 : 1);
    const COLORS = ["#3b82f6", "#eab308", "#a855f7", "#10b981", "#f97316", "#ec4899"];
    const COUNTDOWN = 3;
    const PROGRESS_WINDOW = 20;

    const heading = (from, to) => Math.atan2(to.y - from.y, to.x - from.x);
    const wrap = (i) => ((i % N) + N) % N;

    function nearestIndex(x, y) {
      let best = 0;
      let bestD = Infinity;
      route.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      return best;
    }

    const solidAt = (x, y) => {
      const tx = Math.floor(x);
      const ty = Math.floor(y);
      return ty < 0 || ty >= H || tx < 0 || tx >= W || grid[ty][tx] === "wall";
    };

    // Avanza al punto mas cercano dentro de una ventana hacia delante: funciona aunque se vaya
    // por el borde de una curva ancha, y no cuenta ir marcha atras.
    function advance(car) {
      const distance = (i) => {
        const p = route[wrap(i)];
        return Math.hypot(p.x + 0.5 - car.x, p.y + 0.5 - car.y);
      };
      let best = 0;
      let bestD = distance(car.idx);
      for (let look = 1; look <= PROGRESS_WINDOW; look++) {
        const d = distance(car.idx + look);
        if (d <= bestD) {
          bestD = d;
          best = look;
        }
      }
      if (!best) return;
      const before = car.idx;
      car.idx = wrap(car.idx + best);
      if (car.idx < before) car.laps++;
    }

    const progress = (car) => car.laps * N + car.idx;

    function drawCar(car, color) {
      ctx.save();
      ctx.translate(car.x * T - camera.x, car.y * T - camera.y);
      ctx.rotate(car.angle);
      const L = T * 0.95;
      const B = T * 0.56;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-L / 2 + 2, -B / 2 + 3, L, B);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-L * 0.36, -B * 0.62, L * 0.2, B * 1.24);
      ctx.fillRect(L * 0.16, -B * 0.62, L * 0.2, B * 1.24);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-L / 2, -B / 2, L, B, 4);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(-L * 0.46, -B * 0.09, L * 0.92, B * 0.18);
      ctx.fillStyle = "#0ea5e9";
      ctx.fillRect(L * 0.02, -B * 0.32, L * 0.2, B * 0.64);
      ctx.restore();
    }

    return {
      noHearts: true,
      reset() {
        const start = route[0];
        const firstAngle = heading(route[0], route[6]);
        const rivals = [];
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (grid[y][x] !== "enemy") continue;
            const idx = nearestIndex(x, y);
            rivals.push({ x: x + 0.5, y: y + 0.5, angle: heading(route[idx], route[wrap(idx + 6)]), idx, laps: idx > N / 2 ? -1 : 0, speed: 0, lane: (rivals.length % 3 - 1) * 1.1, color: COLORS[rivals.length % COLORS.length], skill: 0.94 + hash(x, y, 13) * 0.12, finished: false });
          }
        }
        const items = new Map();
        const oil = new Map();
        grid.forEach((row, y) => row.forEach((cell, x) => {
          if (cell === "item") items.set(x + "," + y, { x, y, angle: heading(route[nearestIndex(x, y)], route[wrap(nearestIndex(x, y) + 3)]) });
          if (cell === "trap") oil.set(x + "," + y, { x, y });
        }));

        const s = {
          status: "playing", hp: 3, score: 0, invuln: 0, flash: 0, boss: null,
          car: { x: start.x + 0.5, y: start.y + 0.5, angle: firstAngle, vx: 0, vy: 0, speed: 0, idx: 0, laps: 0, boost: 0, slip: 0 },
          rivals, items, oil, countdown: COUNTDOWN, finished: 0, time: 0,
        };
        const title = level.narrative && level.narrative.title;
        say((title ? title + " · " : "") + LAPS + " vueltas · Llega el primero", 3);
        return s;
      },
      focus() {
        const c = kit.state.car;
        return { x: c.x * T, y: c.y * T };
      },
      update(dt) {
        const s = kit.state;
        if (s.countdown > 0) {
          s.countdown -= dt;
          return;
        }
        s.time += dt;
        const c = s.car;

        const steer = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
        const gas = held("ArrowUp", "KeyW");
        const brake = held("ArrowDown", "KeyS");
        c.boost = Math.max(0, c.boost - dt);
        c.slip = Math.max(0, c.slip - dt);
        const top = c.boost > 0 ? BOOST_SPEED : MAX_SPEED;
        if (gas) c.speed = Math.min(top, c.speed + ACCEL * dt);
        else if (brake) c.speed = Math.max(-4, c.speed - BRAKE * dt);
        else c.speed *= Math.exp(-1.1 * dt);
        if (c.speed > top) c.speed = Math.max(top, c.speed - ACCEL * dt);

        // Se gira mejor a velocidad media; parado no gira.
        const turnPower = Math.min(1, Math.abs(c.speed) / 4) * Math.sign(c.speed || 1);
        c.angle += steer * TURN * turnPower * dt;

        // La velocidad real tiende a la direccion del coche: la diferencia es el derrape.
        const grip = 1 - Math.exp(-(c.slip > 0 ? 1 : GRIP) * dt);
        c.vx += (Math.cos(c.angle) * c.speed - c.vx) * grip;
        c.vy += (Math.sin(c.angle) * c.speed - c.vy) * grip;

        const steps = Math.max(1, Math.ceil((Math.hypot(c.vx, c.vy) * dt) / 0.25));
        for (let i = 0; i < steps; i++) {
          const nx = c.x + (c.vx * dt) / steps;
          if (solidAt(nx + Math.sign(c.vx) * 0.32, c.y)) {
            c.vx *= -0.3;
            c.speed -= (c.speed * 3 * dt) / steps;
          } else c.x = nx;
          const ny = c.y + (c.vy * dt) / steps;
          if (solidAt(c.x, ny + Math.sign(c.vy) * 0.32)) {
            c.vy *= -0.3;
            c.speed -= (c.speed * 3 * dt) / steps;
          } else c.y = ny;
        }

        const tile = Math.floor(c.x) + "," + Math.floor(c.y);
        if (s.items.has(tile) && c.boost <= 0) {
          c.boost = 1.5;
          c.speed = Math.max(c.speed, BOOST_SPEED * 0.9);
          say("¡Turbo!", 0.7);
        }
        if (s.oil.has(tile) && c.slip <= 0) {
          c.slip = 1;
          c.speed *= 0.6;
          say("¡Aceite!", 0.7);
        }

        const lapBefore = c.laps;
        advance(c);
        if (c.laps > lapBefore && c.laps < LAPS) say("Vuelta " + (c.laps + 1) + " de " + LAPS, 1.5);

        for (const r of s.rivals) {
          // Ligera ayuda a quien se queda atras para que la carrera siga disputada.
          const gap = progress(r) - progress(c);
          const rubber = gap > 40 ? 0.9 : gap < -40 ? 1.1 : 1;
          const target = route[wrap(r.idx + 7)];
          const normal = heading(route[r.idx], target) + Math.PI / 2;
          const tx = target.x + 0.5 + Math.cos(normal) * r.lane;
          const ty = target.y + 0.5 + Math.sin(normal) * r.lane;
          let diff = Math.atan2(ty - r.y, tx - r.x) - r.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          r.angle += Math.max(-1, Math.min(1, diff * 3)) * 3.2 * dt;
          // Frena antes de las curvas cerradas.
          const curve = Math.min(1, Math.abs(diff) * 1.5);
          const wanted = RIVAL_SPEED * r.skill * rubber * (1 - curve * 0.3);
          if (r.reverse > 0) {
            r.reverse -= dt;
            r.speed = r.reverse > 0 ? -4 : 0;
          } else {
            r.speed += Math.max(-20 * dt, Math.min(ACCEL * 0.7 * dt, wanted - r.speed));
          }

          // Se desliza por la barrera; si se atasca de frente, retrocede y vuelve al centro de la pista.
          const beforeX = r.x;
          const beforeY = r.y;
          const nx = r.x + Math.cos(r.angle) * r.speed * dt;
          const ny = r.y + Math.sin(r.angle) * r.speed * dt;
          if (!solidAt(nx + Math.sign(nx - r.x) * 0.3, r.y)) r.x = nx;
          if (!solidAt(r.x, ny + Math.sign(ny - r.y) * 0.3)) r.y = ny;
          const moved = Math.hypot(r.x - beforeX, r.y - beforeY);
          r.stuck = moved < 2 * dt ? (r.stuck || 0) + dt : Math.min(0, r.stuck || 0) + dt;
          if (r.stuck > 0 && moved >= 2 * dt) r.stuck = 0;
          if (r.stuck > 0.6 && !(r.reverse > 0)) {
            r.reverse = 0.6;
            // Margen para volver a acelerar sin que cuente como otro atasco.
            r.stuck = -1;
            r.lane = 0;
          }
          advance(r);
          if (!r.finished && r.laps >= LAPS) {
            r.finished = true;
            s.finished++;
          }

          // Los rivales no se apilan unos sobre otros.
          for (const o of s.rivals) {
            if (o === r) continue;
            const ox = r.x - o.x;
            const oy = r.y - o.y;
            const od = Math.hypot(ox, oy);
            if (od > 0 && od < 0.85) {
              const push = (0.85 - od) * 0.5;
              if (!solidAt(r.x + (ox / od) * push, r.y)) r.x += (ox / od) * push;
              if (!solidAt(r.x, r.y + (oy / od) * push)) r.y += (oy / od) * push;
            }
          }

          // Los coches se empujan al chocar.
          const dx = c.x - r.x;
          const dy = c.y - r.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < 0.85) {
            c.vx += (dx / d) * 18 * dt;
            c.vy += (dy / d) * 18 * dt;
            c.x += (dx / d) * (0.85 - d) * 0.5;
            c.y += (dy / d) * (0.85 - d) * 0.5;
            if (solidAt(c.x, c.y)) {
              c.x -= (dx / d) * (0.85 - d) * 0.5;
              c.y -= (dy / d) * (0.85 - d) * 0.5;
            }
          }
        }

        if (c.laps >= LAPS) {
          const place = s.finished + 1;
          s.score = Math.max(0, Math.round(1000 - s.time * 5)) + (place === 1 ? 500 : 0);
          if (place === 1) win();
          else {
            s.status = "lost";
            say("Llegaste en posición " + place + " - Pulsa R para reintentar", 999);
          }
        }
      },
      hud() {
        const s = kit.state;
        const lap = Math.max(1, Math.min(LAPS, s.car.laps + 1));
        const all = [s.car, ...s.rivals];
        const place = all.filter((r) => progress(r) > progress(s.car)).length + 1;
        return "Vuelta " + lap + "/" + LAPS + " · Posición " + place + "/" + all.length + " · " + Math.round(Math.abs(s.car.speed) * 12) + " km/h";
      },
      draw() {
        const s = kit.state;
        ctx.fillStyle = shade(level.palette.wall, -0.2);
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        const x0 = Math.max(0, Math.floor(camera.x / T));
        const x1 = Math.min(W - 1, Math.floor((camera.x + VIEW_W) / T));
        const y0 = Math.max(0, Math.floor(camera.y / T));
        const y1 = Math.min(H - 1, Math.floor((camera.y + VIEW_H) / T));
        const asphalt = shade(level.palette.floor, -0.72);
        const asphaltAlt = shade(level.palette.floor, -0.67);

        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const variant = Math.floor(hash(x, y, 7) * 4);
            if (grid[y][x] === "wall") {
              kit.drawTexture(textures.walls[variant], x, y);
            } else {
              ctx.fillStyle = (x + y) % 2 ? asphalt : asphaltAlt;
              ctx.fillRect(Math.round(x * T - camera.x), Math.round(y * T - camera.y), T + 1, T + 1);
            }
          }
        }

        // Linea de meta a cuadros, perpendicular a la pista.
        const start = route[0];
        const dir = heading(route[0], route[4]);
        ctx.save();
        ctx.translate((start.x + 0.5) * T - camera.x, (start.y + 0.5) * T - camera.y);
        ctx.rotate(dir);
        for (let i = -3; i < 3; i++) {
          for (let j = 0; j < 2; j++) {
            ctx.fillStyle = (i + j) % 2 ? "#fff" : "#111";
            ctx.fillRect(j * T * 0.4 - T * 0.4, i * T * 0.5, T * 0.4, T * 0.5);
          }
        }
        ctx.restore();

        for (const pad of s.items.values()) {
          ctx.save();
          ctx.translate((pad.x + 0.5) * T - camera.x, (pad.y + 0.5) * T - camera.y);
          ctx.rotate(pad.angle);
          ctx.fillStyle = Math.floor(kit.time * 8) % 2 ? "#fb923c" : "#fdba74";
          for (const off of [-T * 0.3, T * 0.05]) {
            ctx.beginPath();
            ctx.moveTo(off, -T * 0.45);
            ctx.lineTo(off + T * 0.35, 0);
            ctx.lineTo(off, T * 0.45);
            ctx.lineTo(off + T * 0.14, 0);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
        for (const spot of s.oil.values()) {
          ctx.fillStyle = "rgba(2,6,23,0.85)";
          ctx.beginPath();
          ctx.ellipse((spot.x + 0.5) * T - camera.x, (spot.y + 0.5) * T - camera.y, T * 0.55, T * 0.4, hash(spot.x, spot.y, 3) * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        for (const r of s.rivals) drawCar(r, r.color);
        drawCar(s.car, "#ef4444");

        if (s.countdown > 0) {
          ctx.textAlign = "center";
          ctx.font = "bold 96px monospace";
          ctx.fillStyle = "#fde047";
          ctx.strokeStyle = "#000";
          ctx.lineWidth = 6;
          const text = String(Math.ceil(s.countdown));
          ctx.strokeText(text, VIEW_W / 2, VIEW_H / 2 - 110);
          ctx.fillText(text, VIEW_W / 2, VIEW_H / 2 - 110);
          ctx.textAlign = "left";
        }
      },
    };
  },
};
