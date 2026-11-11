// Serpiente. "item" marca los bocados, que aparecen de uno en uno.
window.LevelGame.modes.snake = {
  tile: (W, H, viewW, viewH) => Math.floor(Math.min(viewW / W, (viewH - 48) / H)),
  create(kit) {
    const { ctx, level, grid, W, H, T, hash, shade, textures, say, hurt, win, sprites, itemSprite, camera } = kit;
    const STEP = { easy: 0.15, normal: 0.115, hard: 0.085 }[level.difficulty] || 0.115;
    const DIRS = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] };
    const START_LENGTH = 4;
    const offsetX = () => Math.floor((kit.VIEW_W - W * T) / 2);
    const offsetY = () => Math.max(kit.HUD_H, Math.floor((kit.VIEW_H - H * T) / 2));

    function cells(type) {
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === type) out.push({ x, y });
      return out;
    }

    const food = cells("item").sort((a, b) => hash(a.x, a.y, 11) - hash(b.x, b.y, 11));
    const start = cells("start")[0];

    function placeSnake(s) {
      s.body = [];
      for (let i = 0; i < Math.max(START_LENGTH, s.length || 0); i++) s.body.push({ x: start.x, y: start.y });
      s.dir = { x: 0, y: 0 };
      s.queue = [];
      s.moving = false;
      s.clock = 0;
    }

    const blocked = (x, y) => grid[y][x] === "wall" || grid[y][x] === "trap";

    return {
      reset() {
        const s = { target: food[0], status: "playing", hp: { easy: 5, normal: 4, hard: 3 }[level.difficulty] || 4, score: 0, invuln: 0, flash: 0, boss: null, eaten: 0, length: START_LENGTH };
        placeSnake(s);
        const title = level.narrative && level.narrative.title;
        say((title ? title + " · " : "") + "Pulsa una flecha para empezar", 3.5);
        return s;
      },
      onKey(code) {
        const d = DIRS[code];
        if (!d) return;
        const s = kit.state;
        const last = s.queue[s.queue.length - 1] || s.dir;
        // No se puede dar media vuelta sobre uno mismo.
        if (d[0] === -last.x && d[1] === -last.y && (last.x || last.y)) return;
        if (s.queue.length < 2) s.queue.push({ x: d[0], y: d[1] });
        s.moving = true;
      },
      update(dt) {
        const s = kit.state;
        if (!s.moving) return;
        s.clock += dt;
        while (s.clock >= STEP && s.status === "playing") {
          s.clock -= STEP;
          if (s.queue.length) s.dir = s.queue.shift();
          if (!s.dir.x && !s.dir.y) return;
          const head = s.body[0];
          const next = { x: head.x + s.dir.x, y: head.y + s.dir.y };
          // La cola se aparta en este mismo paso, asi que no cuenta como choque.
          const hitsSelf = s.body.slice(0, -1).some((c, i) => i > 0 && c.x === next.x && c.y === next.y);
          if (blocked(next.x, next.y) || hitsSelf) {
            hurt(1, true);
            if (s.status === "playing") {
              say("¡Choque! Te quedan " + s.hp + " vidas", 1.2);
              placeSnake(s);
            }
            return;
          }
          s.body.unshift(next);
          const bite = food[s.eaten];
          if (bite && bite.x === next.x && bite.y === next.y) {
            s.eaten++;
            s.length++;
            s.score += 10 + s.eaten;
            if (s.eaten >= food.length) {
              win();
              return;
            }
            // Si el siguiente bocado cae sobre la serpiente, se adelanta otro de la lista.
            const later = food.findIndex((f, i) => i >= s.eaten && !s.body.some((c) => c.x === f.x && c.y === f.y));
            if (later > s.eaten) [food[s.eaten], food[later]] = [food[later], food[s.eaten]];
            s.target = food[s.eaten];
          } else {
            s.body.pop();
          }
        }
      },
      hud() {
        const s = kit.state;
        return s.eaten + "/" + food.length + " · " + s.score + "pts";
      },
      draw() {
        const s = kit.state;
        const ox = offsetX();
        const oy = offsetY();
        ctx.fillStyle = shade(level.palette.wall, -0.55);
        ctx.fillRect(0, 0, kit.VIEW_W, kit.VIEW_H);
        camera.x = -ox;
        camera.y = -oy;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            const variant = Math.floor(hash(x, y, 7) * 4);
            kit.drawTexture(grid[y][x] === "wall" ? textures.walls[variant] : textures.floors[variant], x, y);
            if (grid[y][x] === "trap") kit.drawSprite("spike", x * T, y * T, T, T);
          }
        }

        const bite = food[s.eaten];
        if (bite) {
          const grow = T * (0.9 + Math.sin(kit.time * 7) * 0.08);
          ctx.drawImage(sprites[itemSprite], ox + bite.x * T + (T - grow) / 2, oy + bite.y * T + (T - grow) / 2, grow, grow);
        }

        // Interpola entre casillas para que el movimiento sea continuo.
        const t = s.moving ? Math.min(1, s.clock / STEP) : 0;
        const body = s.body;
        const color = shade(level.palette.wall, 0.15);
        const head = "#22c55e";
        for (let i = body.length - 1; i >= 0; i--) {
          const c = body[i];
          const ahead = i === 0 ? { x: c.x + s.dir.x, y: c.y + s.dir.y } : body[i - 1];
          const free = i === 0 && !blocked(ahead.x, ahead.y);
          const x = c.x + (i === 0 ? (free ? (ahead.x - c.x) * t : 0) : (ahead.x - c.x) * t);
          const y = c.y + (i === 0 ? (free ? (ahead.y - c.y) * t : 0) : (ahead.y - c.y) * t);
          const inset = T * (i === 0 ? 0.04 : 0.12);
          ctx.fillStyle = i === 0 ? head : i % 2 ? "#16a34a" : color === head ? "#15803d" : "#15803d";
          ctx.beginPath();
          ctx.roundRect(ox + x * T + inset, oy + y * T + inset, T - inset * 2, T - inset * 2, T * 0.25);
          ctx.fill();
          if (i === 0) {
            ctx.fillStyle = "#fff";
            const fx = ox + x * T + T / 2 + s.dir.x * T * 0.18;
            const fy = oy + y * T + T / 2 + s.dir.y * T * 0.18;
            for (const side of [-1, 1]) {
              ctx.beginPath();
              ctx.arc(fx + (s.dir.y || (s.dir.x ? 0 : 1)) * side * T * 0.18, fy + s.dir.x * side * T * 0.18, T * 0.1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      },
    };
  },
};
