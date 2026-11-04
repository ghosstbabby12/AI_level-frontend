// Naves espaciales: la formacion baja de lado a lado y dispara. "wall" son escudos.
window.LevelGame.modes.invaders = {
  tile: (W, H, viewW, viewH) => Math.floor(Math.min(viewW / W, viewH / H)),
  create(kit) {
    const { ctx, level, grid, W, H, T, hash, say, hurt, win, held, sprites, itemSprite, bossSprite, kinds, enemySprite, mixedEnemy, VIEW_W, VIEW_H } = kit;
    const ox = Math.floor((VIEW_W - W * T) / 2);
    const oy = Math.floor((VIEW_H - H * T) / 2);
    const PLAYER_SPEED = 10;
    const FIRE_CD = 0.3;
    const RAPID_CD = 0.14;
    const SWARM_SPEED = { easy: 0.9, normal: 1.2, hard: 1.6 }[level.difficulty] || 1.2;
    const ENEMY_FIRE = { easy: 1.5, normal: 1.0, hard: 0.65 }[level.difficulty] || 1.0;
    const SHOT_SPEED = { easy: 5, normal: 6.5, hard: 8 }[level.difficulty] || 6.5;
    const BOSS_HP = { easy: 12, normal: 18, hard: 26 }[level.difficulty] || 18;
    const DROP_CHANCE = 0.12;
    const SHIELD_HP = 3;
    const playerY = H - 1.6;

    function cells(type) {
      const out = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === type) out.push({ x, y });
      return out;
    }

    const hasBoss = cells("boss").length > 0;

    function ship(x, y, flash) {
      const px = ox + x * T;
      const py = oy + y * T;
      ctx.fillStyle = flash ? "#fff" : "#22d3ee";
      ctx.beginPath();
      ctx.moveTo(px, py - T * 0.55);
      ctx.lineTo(px + T * 0.55, py + T * 0.45);
      ctx.lineTo(px, py + T * 0.2);
      ctx.lineTo(px - T * 0.55, py + T * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(px - T * 0.08, py - T * 0.25, T * 0.16, T * 0.28);
      ctx.fillStyle = "#fb923c";
      ctx.fillRect(px - T * 0.12, py + T * 0.28, T * 0.24, T * (0.14 + Math.sin(kit.time * 30) * 0.06));
    }

    return {
      reset() {
        const s = {
          status: "playing", hp: { easy: 5, normal: 4, hard: 3 }[level.difficulty] || 4, score: 0, invuln: 0, flash: 0, boss: null,
          x: W / 2, fireCd: 0, rapid: 0, firing: false,
          enemies: cells("enemy").map((c) => ({ x: c.x + 0.5, y: c.y + 0.5, alive: true, flash: 0, sprite: kinds.enemy === "mixed" ? mixedEnemy(c.x, c.y) : enemySprite })),
          shields: cells("wall").map((c) => ({ x: c.x, y: c.y, hp: SHIELD_HP })),
          dir: 1, shots: [], foes: [], drops: [], blasts: [], enemyCd: 1.5, bossSpawned: false,
        };
        s.total = s.enemies.length;
        const title = level.narrative && level.narrative.title;
        say((title ? title + " · " : "") + "Destruye a todos", 3.5);
        return s;
      },
      onPointer(x, _y, pressed) {
        const s = kit.state;
        s.x = Math.max(0.5, Math.min(W - 0.5, (x - ox) / T));
        s.firing = pressed || s.firing;
      },
      update(dt) {
        const s = kit.state;
        const dir = (held("ArrowRight", "KeyD") ? 1 : 0) - (held("ArrowLeft", "KeyA") ? 1 : 0);
        s.x = Math.max(0.5, Math.min(W - 0.5, s.x + dir * PLAYER_SPEED * dt));

        s.fireCd -= dt;
        s.rapid = Math.max(0, s.rapid - dt);
        if ((held("Space") || s.firing) && s.fireCd <= 0) {
          s.fireCd = s.rapid > 0 ? RAPID_CD : FIRE_CD;
          s.shots.push({ x: s.x, y: playerY - 0.5 });
          if (s.rapid > 0) s.shots.push({ x: s.x - 0.35, y: playerY - 0.3 }, { x: s.x + 0.35, y: playerY - 0.3 });
        }

        // La formacion acelera cuantos menos quedan; al tocar un borde baja una fila.
        const alive = s.enemies.filter((e) => e.alive);
        const speed = SWARM_SPEED * (1 + (1 - alive.length / Math.max(1, s.total)) * 2.2);
        const edge = alive.some((e) => (s.dir > 0 && e.x >= W - 0.7) || (s.dir < 0 && e.x <= 0.7));
        if (edge) {
          s.dir = -s.dir;
          for (const e of alive) e.y += 0.45;
        }
        for (const e of alive) {
          e.x += s.dir * speed * dt;
          e.flash = Math.max(0, e.flash - dt);
          if (e.y >= playerY - 0.6) {
            s.status = "lost";
            say("La invasión llegó hasta ti - Pulsa R para reintentar", 999);
            return;
          }
        }

        if (hasBoss && !alive.length && !s.bossSpawned) {
          s.bossSpawned = true;
          s.boss = { x: W / 2, y: 2.4, hp: BOSS_HP, maxHp: BOSS_HP, alive: true, t: 0, flash: 0, cd: 1 };
          say("¡Se acerca la nave nodriza!", 2.5);
        }

        const boss = s.boss && s.boss.alive ? s.boss : null;
        if (boss) {
          boss.t += dt;
          boss.flash = Math.max(0, boss.flash - dt);
          boss.x = W / 2 + Math.sin(boss.t * 0.9) * (W / 2 - 2.5);
          boss.cd -= dt;
          if (boss.cd <= 0) {
            boss.cd = ENEMY_FIRE;
            for (const spread of [-2, 0, 2]) s.foes.push({ x: boss.x, y: boss.y + 1, vx: spread, vy: SHOT_SPEED });
          }
        }

        s.enemyCd -= dt;
        if (s.enemyCd <= 0 && alive.length) {
          s.enemyCd = ENEMY_FIRE * (0.6 + Math.random() * 0.8);
          // Dispara uno de los mas bajos de su columna, preferentemente cerca del jugador.
          const lowest = alive.filter((e) => !alive.some((o) => Math.abs(o.x - e.x) < 0.6 && o.y > e.y));
          const shooter = lowest.sort((a, b) => Math.abs(a.x - s.x) - Math.abs(b.x - s.x))[Math.floor(Math.random() * Math.min(3, lowest.length))];
          if (shooter) s.foes.push({ x: shooter.x, y: shooter.y + 0.5, vx: 0, vy: SHOT_SPEED });
        }

        const hitShield = (shot) => {
          const shield = s.shields.find((c) => c.hp > 0 && shot.x >= c.x && shot.x < c.x + 1 && shot.y >= c.y && shot.y < c.y + 1);
          if (shield) shield.hp--;
          return !!shield;
        };

        for (const shot of s.shots) {
          shot.y -= 15 * dt;
          if (hitShield(shot)) shot.dead = true;
          const target = alive.find((e) => e.alive && Math.abs(e.x - shot.x) < 0.55 && Math.abs(e.y - shot.y) < 0.55);
          if (target && !shot.dead) {
            target.alive = false;
            shot.dead = true;
            s.score += 25;
            s.blasts.push({ x: target.x, y: target.y, life: 0.35 });
            if (hash(Math.round(target.x * 7), Math.round(target.y * 7), s.score) < DROP_CHANCE) s.drops.push({ x: target.x, y: target.y });
          }
          if (boss && !shot.dead && Math.abs(boss.x - shot.x) < 1.4 && Math.abs(boss.y - shot.y) < 1.1) {
            shot.dead = true;
            boss.hp--;
            boss.flash = 0.12;
            s.score += 15;
            if (boss.hp <= 0) {
              boss.alive = false;
              s.score += 300;
              s.blasts.push({ x: boss.x, y: boss.y, life: 0.7 });
            }
          }
        }
        s.shots = s.shots.filter((shot) => !shot.dead && shot.y > -1);

        for (const foe of s.foes) {
          foe.x += foe.vx * dt;
          foe.y += foe.vy * dt;
          if (hitShield(foe)) foe.dead = true;
          if (!foe.dead && Math.abs(foe.x - s.x) < 0.5 && Math.abs(foe.y - playerY) < 0.5) {
            foe.dead = true;
            if (hurt(1)) say("¡Impacto!", 0.7);
          }
        }
        s.foes = s.foes.filter((foe) => !foe.dead && foe.y < H + 1);

        for (const d of s.drops) {
          d.y += 3.5 * dt;
          if (Math.abs(d.x - s.x) < 0.8 && Math.abs(d.y - playerY) < 0.7) {
            d.taken = true;
            s.rapid = 7;
            s.score += 20;
            say("¡Disparo triple!", 1.2);
          }
        }
        s.drops = s.drops.filter((d) => !d.taken && d.y < H + 1);
        for (const fx of s.blasts) fx.life -= dt;
        s.blasts = s.blasts.filter((fx) => fx.life > 0);

        if (!alive.length && (!hasBoss || (s.bossSpawned && !(s.boss && s.boss.alive)))) win();
      },
      hud() {
        const s = kit.state;
        return "Invasores: " + s.enemies.filter((e) => e.alive).length + "/" + s.total + " · " + s.score + "pts";
      },
      draw() {
        const s = kit.state;
        ctx.fillStyle = "#050816";
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        // Estrellas que caen: dan sensacion de avance.
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        for (let i = 0; i < 80; i++) {
          const speed = 15 + hash(i, 2, 5) * 50;
          const size = hash(i, 3, 5) < 0.2 ? 3 : 2;
          ctx.fillRect(hash(i, 1, 5) * VIEW_W, (hash(i, 4, 5) * VIEW_H + kit.time * speed) % VIEW_H, size, size);
        }

        for (const c of s.shields) {
          if (c.hp <= 0) continue;
          ctx.fillStyle = ["", "#166534", "#16a34a", "#4ade80"][c.hp];
          ctx.fillRect(ox + c.x * T + 1, oy + c.y * T + 1, T - 2, T - 2);
        }

        for (const e of s.enemies) {
          if (!e.alive) continue;
          const wobble = Math.sin(kit.time * 5 + e.y) * T * 0.04;
          ctx.drawImage(sprites[e.sprite], ox + (e.x - 0.5) * T, oy + (e.y - 0.5) * T + wobble, T, T);
        }

        const boss = s.boss && s.boss.alive ? s.boss : null;
        if (boss && !(boss.flash > 0 && Math.floor(kit.time * 30) % 2)) {
          ctx.drawImage(sprites[bossSprite], ox + (boss.x - 1.5) * T, oy + (boss.y - 1.5) * T, T * 3, T * 3);
        }

        ctx.fillStyle = "#67e8f9";
        for (const shot of s.shots) ctx.fillRect(ox + shot.x * T - 2, oy + shot.y * T - T * 0.25, 4, T * 0.5);
        ctx.fillStyle = "#fb7185";
        for (const foe of s.foes) {
          ctx.beginPath();
          ctx.arc(ox + foe.x * T, oy + foe.y * T, T * 0.14, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const d of s.drops) ctx.drawImage(sprites[itemSprite], ox + (d.x - 0.35) * T, oy + (d.y - 0.35) * T, T * 0.7, T * 0.7);

        for (const fx of s.blasts) {
          ctx.globalAlpha = Math.min(1, fx.life * 3);
          ctx.fillStyle = "#fde047";
          ctx.beginPath();
          ctx.arc(ox + fx.x * T, oy + fx.y * T, (0.7 - fx.life) * T * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        if (!(s.invuln > 0 && Math.floor(kit.time * 12) % 2)) ship(s.x, playerY, false);
      },
    };
  },
};
