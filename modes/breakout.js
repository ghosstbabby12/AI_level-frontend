// Rompe-bloques. El nivel define los bloques; la pelota rebota con fisica continua.
window.LevelGame.modes.breakout = {
  tile: (W, H, viewW, viewH) => Math.floor(Math.min(viewW / W, viewH / H)),
  create(kit) {
    const { ctx, level, grid, W, H, T, shade, say, hurt, win, sprites, bossSprite, itemSprite, held, VIEW_W, VIEW_H } = kit;
    const BW = W * T;
    const BH = H * T;
    const ox = Math.floor((VIEW_W - BW) / 2);
    const oy = Math.floor((VIEW_H - BH) / 2);
    const BALL_SPEED = ({ easy: 7.5, normal: 9, hard: 10.5 }[level.difficulty] || 9) * T;
    const BALL_R = T * 0.2;
    const PADDLE_W = { easy: 4, normal: 3.2, hard: 2.6 }[level.difficulty] || 3.2;
    const BOSS_HP = { easy: 4, normal: 6, hard: 9 }[level.difficulty] || 6;
    const paddleY = (H - 1.2) * T;

    function rowColor(y) {
      const hues = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#6366f1", "#a855f7"];
      return hues[y % hues.length];
    }

    function buildBricks() {
      const bricks = new Map();
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const cell = grid[y][x];
          if (cell === "item") bricks.set(x + "," + y, { x, y, hp: 1, kind: "normal" });
          else if (cell === "enemy") bricks.set(x + "," + y, { x, y, hp: 2, kind: "tough" });
          else if (cell === "trap") bricks.set(x + "," + y, { x, y, hp: 1, kind: "bomb" });
          else if (cell === "power") bricks.set(x + "," + y, { x, y, hp: 1, kind: "power" });
          else if (cell === "wall") bricks.set(x + "," + y, { x, y, hp: Infinity, kind: "solid" });
          else if (cell === "boss") bricks.set(x + "," + y, { x, y, hp: BOSS_HP, maxHp: BOSS_HP, kind: "boss" });
        }
      }
      return bricks;
    }

    function newBall(s) {
      s.balls = [{ x: s.paddle.x, y: paddleY - BALL_R - 1, vx: 0, vy: 0, stuck: true }];
    }

    const remaining = (s) => [...s.bricks.values()].filter((b) => b.kind !== "solid").length;

    function launch(s) {
      for (const b of s.balls) {
        if (!b.stuck) continue;
        b.stuck = false;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.9;
        b.vx = Math.cos(angle) * BALL_SPEED;
        b.vy = Math.sin(angle) * BALL_SPEED;
      }
    }

    function breakBrick(s, brick) {
      s.bricks.delete(brick.x + "," + brick.y);
      s.score += brick.kind === "boss" ? 200 : brick.kind === "tough" ? 30 : 10;
      s.sparks.push({ x: (brick.x + 0.5) * T, y: (brick.y + 0.5) * T, life: 0.35, color: rowColor(brick.y) });

      if (brick.kind === "bomb") {
        // Arrasa alrededor; los irrompibles aguantan.
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const other = s.bricks.get(brick.x + dx + "," + (brick.y + dy));
            if (other && other.kind !== "solid" && other.kind !== "boss") breakBrick(s, other);
          }
        }
        say("¡Explosión!", 0.7);
      } else if (brick.kind === "power") {
        s.drops.push({ x: (brick.x + 0.5) * T, y: (brick.y + 0.5) * T, type: s.nextDrop });
        s.nextDrop = s.nextDrop === "wide" ? "multi" : "wide";
      }
    }

    function hit(s, brick) {
      if (brick.kind === "solid") return;
      s.sinceHit = 0;
      brick.hp--;
      if (brick.hp <= 0) breakBrick(s, brick);
    }

    function moveBall(s, ball, dt) {
      // Subpasos: a alta velocidad no debe atravesar un bloque.
      const steps = Math.max(1, Math.ceil((Math.hypot(ball.vx, ball.vy) * dt) / (T * 0.3)));
      for (let i = 0; i < steps; i++) {
        const step = dt / steps;
        ball.x += ball.vx * step;
        const hx = s.bricks.get(Math.floor((ball.x + Math.sign(ball.vx) * BALL_R) / T) + "," + Math.floor(ball.y / T));
        if (hx) {
          ball.x -= ball.vx * step;
          ball.vx = -ball.vx;
          hit(s, hx);
        }
        ball.y += ball.vy * step;
        const hy = s.bricks.get(Math.floor(ball.x / T) + "," + Math.floor((ball.y + Math.sign(ball.vy) * BALL_R) / T));
        if (hy) {
          ball.y -= ball.vy * step;
          ball.vy = -ball.vy;
          hit(s, hy);
        }

        if (ball.x < BALL_R || ball.x > BW - BALL_R) {
          ball.vx = -ball.vx;
          ball.x = Math.max(BALL_R, Math.min(BW - BALL_R, ball.x));
        }
        if (ball.y < BALL_R) {
          ball.vy = Math.abs(ball.vy);
          ball.y = BALL_R;
        }

        // La paleta dirige: el rebote depende de donde golpea.
        const half = (s.paddle.width * T) / 2;
        if (ball.vy > 0 && ball.y + BALL_R >= paddleY && ball.y - BALL_R <= paddleY + T * 0.4 && Math.abs(ball.x - s.paddle.x) <= half + BALL_R) {
          const offset = Math.max(-1, Math.min(1, (ball.x - s.paddle.x) / half));
          const angle = -Math.PI / 2 + offset * 1.05;
          ball.vx = Math.cos(angle) * BALL_SPEED;
          ball.vy = Math.sin(angle) * BALL_SPEED;
          ball.y = paddleY - BALL_R;
        }
      }
    }

    return {
      reset() {
        const s = {
          status: "playing", hp: { easy: 5, normal: 4, hard: 3 }[level.difficulty] || 4, score: 0, invuln: 0, flash: 0, boss: null,
          sinceHit: 0, bricks: buildBricks(), paddle: { x: BW / 2, width: PADDLE_W, wideT: 0 }, balls: [], drops: [], sparks: [], nextDrop: "wide",
        };
        newBall(s);
        const title = level.narrative && level.narrative.title;
        say((title ? title + " · " : "") + "Haz clic o pulsa Espacio para lanzar", 3.5);
        return s;
      },
      onKey(code) {
        if (code === "Space") launch(kit.state);
      },
      onPointer(x, _y, pressed) {
        const s = kit.state;
        if (s.status !== "playing") return;
        s.paddle.x = Math.max(0, Math.min(BW, x - ox));
        if (pressed) launch(s);
      },
      update(dt) {
        const s = kit.state;
        const dir = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
        const half = (s.paddle.width * T) / 2;
        s.paddle.x = Math.max(half, Math.min(BW - half, s.paddle.x + dir * T * 15 * dt));

        if (s.paddle.wideT > 0) {
          s.paddle.wideT -= dt;
          if (s.paddle.wideT <= 0) s.paddle.width = PADDLE_W;
        }

        // Si la pelota entra en un ciclo sin romper nada, se le da un pequeno desvio.
        s.sinceHit += dt;
        if (s.sinceHit > 8) {
          s.sinceHit = 0;
          for (const b of s.balls) {
            if (b.stuck) continue;
            const angle = Math.atan2(b.vy, b.vx) + (Math.random() < 0.5 ? -0.3 : 0.3);
            b.vx = Math.cos(angle) * BALL_SPEED;
            b.vy = Math.sin(angle) * BALL_SPEED;
          }
        }

        for (const b of s.balls) {
          if (b.stuck) b.x = s.paddle.x;
          else moveBall(s, b, dt);
        }
        s.balls = s.balls.filter((b) => b.y < BH + BALL_R);

        for (const d of s.drops) {
          d.y += T * 4 * dt;
          if (d.y >= paddleY && d.y <= paddleY + T && Math.abs(d.x - s.paddle.x) <= (s.paddle.width * T) / 2 + T * 0.3) {
            d.taken = true;
            if (d.type === "wide") {
              s.paddle.width = PADDLE_W * 1.6;
              s.paddle.wideT = 12;
              say("¡Paleta ancha!", 1);
            } else {
              const extra = s.balls.filter((b) => !b.stuck).slice(0, 2).map((b) => ({ ...b, vx: -b.vx }));
              s.balls.push(...extra);
              say("¡Más pelotas!", 1);
            }
          }
        }
        s.drops = s.drops.filter((d) => !d.taken && d.y < BH);
        for (const fx of s.sparks) fx.life -= dt;
        s.sparks = s.sparks.filter((fx) => fx.life > 0);

        if (!remaining(s)) {
          win();
          return;
        }
        if (!s.balls.length) {
          hurt(1, true);
          if (s.status === "playing") {
            say("Pelota perdida", 1);
            newBall(s);
          }
        }
      },
      hud() {
        const s = kit.state;
        return "Bloques: " + remaining(s) + " · " + s.score + "pts";
      },
      draw() {
        const s = kit.state;
        const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_H);
        gradient.addColorStop(0, level.palette.sky[0]);
        gradient.addColorStop(1, shade(level.palette.sky[1], -0.45));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        ctx.save();
        ctx.translate(ox, oy);
        for (const b of s.bricks.values()) {
          const x = b.x * T + 1;
          const y = b.y * T + 1;
          const size = T - 2;
          if (b.kind === "boss") {
            ctx.fillStyle = "rgba(0,0,0,0.35)";
            ctx.fillRect(x - T, y - T * 0.5, T * 3, T * 2);
            ctx.drawImage(sprites[bossSprite], x - T * 0.25, y - T * 0.5, T * 1.5, T * 1.5);
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(x - T, y + T * 1.25, T * 3 * (b.hp / b.maxHp), T * 0.2);
            continue;
          }
          const color = b.kind === "solid" ? "#64748b" : b.kind === "bomb" ? "#f97316" : b.kind === "power" ? "#fbbf24" : rowColor(b.y);
          ctx.fillStyle = b.kind === "tough" && b.hp === 1 ? shade(color, 0.45) : color;
          ctx.fillRect(x, y, size, size);
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.fillRect(x, y, size, size * 0.2);
          ctx.fillStyle = "rgba(0,0,0,0.25)";
          ctx.fillRect(x, y + size * 0.8, size, size * 0.2);
          if (b.kind === "tough" && b.hp > 1) {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 3, y + 3, size - 6, size - 6);
          } else if (b.kind === "bomb") {
            ctx.drawImage(sprites.bomb, x + size * 0.15, y + size * 0.15, size * 0.7, size * 0.7);
          } else if (b.kind === "power") {
            ctx.drawImage(sprites[itemSprite], x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.6);
          }
        }

        for (const fx of s.sparks) {
          ctx.globalAlpha = fx.life / 0.35;
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, (0.35 - fx.life) * T * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        for (const d of s.drops) {
          ctx.fillStyle = d.type === "wide" ? "#22d3ee" : "#f472b6";
          ctx.beginPath();
          ctx.arc(d.x, d.y, T * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }

        const width = s.paddle.width * T;
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.roundRect(s.paddle.x - width / 2, paddleY, width, T * 0.35, T * 0.17);
        ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(s.paddle.x - width / 2 + T * 0.2, paddleY + T * 0.08, width - T * 0.4, T * 0.1);

        ctx.fillStyle = "#fff";
        for (const b of s.balls) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      },
    };
  },
};
