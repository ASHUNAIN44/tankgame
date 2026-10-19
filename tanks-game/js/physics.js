// ==========================================
// EXPLOSIONS, AI & PHYSICS LOOP
// ==========================================
function triggerExplosion(cx, cy, weapon) {
  const radius = weapon.radius || 38;
  const maxDamage = weapon.damage !== undefined ? weapon.damage : 40;
  const isDirt = !!weapon.isDirt;

  playSound(weapon.id === "nuke" ? "nuke" : "explosion");
  carveCrater(cx, cy, radius, isDirt);

  explosions.push({
    x: cx,
    y: cy,
    radius: radius * 0.25,
    maxRadius: radius,
    alpha: 1.0,
    holdFrames: 10,
    isDirt: isDirt
  });

  const pCount = quality === "high" ? 26 : (quality === "medium" ? 12 : 4);
  for (let i = 0; i < pCount; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 1.2 + Math.random() * 5.2;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2.2,
      size: 2 + Math.random() * 3.5,
      color: isDirt
        ? "#65a30d"
        : (Math.random() < 0.45 ? "#ffdd00" : (Math.random() < 0.75 ? "#ff5500" : "#5a7d00")),
      life: 1.0
    });
  }

  if (weapon.id === "volcano" && !weapon.isSub) {
    for (let i = 0; i < 6; i++) {
      const spreadAngle = (Math.PI * 0.25) + (i / 5) * (Math.PI * 0.5);
      const spd = 4.8 + Math.random() * 2.8;
      projectiles.push({
        x: cx,
        y: cy - 6,
        vx: Math.cos(spreadAngle) * spd * (Math.random() < 0.5 ? 1 : -1),
        vy: -Math.abs(Math.sin(spreadAngle) * spd) - 2.5,
        weapon: {
          id: "volcano_sub",
          name: "Lava Bomb",
          radius: 24,
          damage: 22,
          color: "#ff4500",
          isSub: true
        },
        ownerId: currentPlayerIndex,
        trail: []
      });
    }
  }

  if (weapon.id === "cluster" && !weapon.isSub) {
    for (let i = -2; i <= 2; i++) {
      projectiles.push({
        x: cx,
        y: cy - 5,
        vx: i * 2.1 + (Math.random() - 0.5),
        vy: -4.2 - Math.random() * 2.0,
        weapon: {
          id: "cluster_sub",
          name: "Cluster",
          radius: 22,
          damage: 20,
          color: "#eab308",
          isSub: true
        },
        ownerId: currentPlayerIndex,
        trail: []
      });
    }
  }

  const shooter = players[currentPlayerIndex];
  players.forEach(p => {
    if (!p.alive) return;
    const dist = Math.hypot(p.x - cx, (p.y - 6) - cy);
    if (!isDirt && maxDamage > 0 && dist <= radius * 1.25) {
      const falloff = Math.max(0.15, 1 - dist / (radius * 1.25));
      let dmg = Math.round(maxDamage * falloff);
      if (p.shieldActive) {
        dmg = Math.round(dmg * 0.5);
      }
      if (dmg > 0) {
        p.health = Math.max(0, p.health - dmg);
        floatingTexts.push({
          x: p.x,
          y: p.y - 26,
          text: `-${dmg}`,
          color: "#dc2626",
          life: 1.0
        });

        if (shooter && shooter.id !== p.id) {
          const cashReward = dmg * 25;
          shooter.money += cashReward;
        }

        if (p.health <= 0) {
          p.alive = false;
          if (shooter && shooter.id !== p.id) {
            shooter.score += 1;
            shooter.money += 1500;
            floatingTexts.push({
              x: p.x,
              y: p.y - 44,
              text: `DESTROYED! +1 SCORE`,
              color: "#facc15",
              life: 1.4
            });
          }
          explosions.push({
            x: p.x,
            y: p.y - 5,
            radius: 10,
            maxRadius: 36,
            alpha: 1.0,
            holdFrames: 8,
            isDirt: false
          });
        }
      }
    }

    const groundY = getTerrainY(p.x);
    if (groundY > p.y + 2) {
      p.falling = true;
      p.vy = 0;
      if (p.parachutes > 0) {
        p.parachuteOpen = true;
        p.parachutes -= 1;
      }
    } else if (groundY < p.y) {
      p.y = groundY;
    }
  });

  updateHUD();
  renderScoreboard();
}

function moveActiveTank(dir) {
  if (turnState !== "AIMING") return;
  const p = players[currentPlayerIndex];
  if (!p || !p.alive || p.isAI) return;
  if (p.fuel <= 0) return;

  const nextX = Math.max(18, Math.min(W - 18, p.x + dir * 2.2));
  const nextY = getTerrainY(nextX);
  if (p.y - nextY > 14) return;

  p.x = nextX;
  p.y = nextY;
  p.fuel = Math.max(0, p.fuel - 1);
  playSound("move");
  updateHUD();
}

function fireCurrentWeapon() {
  if (turnState !== "AIMING") return;
  const p = players[currentPlayerIndex];
  if (!p || !p.alive) return;

  teleportMode = false;
  document.getElementById("teleportBanner").classList.add("hidden");

  let weapon = WEAPONS[p.weaponIndex] || WEAPONS[1];
  if (!weapon.infinite && (p.ammo[weapon.id] || 0) <= 0) {
    p.weaponIndex = 1;
    weapon = WEAPONS[1];
  } else if (!weapon.infinite) {
    p.ammo[weapon.id] = Math.max(0, p.ammo[weapon.id] - 1);
  }

  turnState = "FIRING";
  playSound("fire");

  const rad = (p.angle * Math.PI) / 180;
  const speed = 2.8 + (p.power / 100) * 12.2;
  const barrelLen = 16;
  const startX = p.x + Math.cos(rad) * barrelLen;
  const startY = (p.y - 8) - Math.sin(rad) * barrelLen;

  projectiles.push({
    x: startX,
    y: startY,
    vx: Math.cos(rad) * speed,
    vy: -Math.sin(rad) * speed,
    weapon: weapon,
    ownerId: p.id,
    hasSplitShower: false,
    trail: []
  });

  updateHUD();
}

function advanceTurn() {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }

  const alivePlayers = players.filter(p => p.alive);
  if (alivePlayers.length <= 1) {
    turnState = "ROUND_OVER";
    const winner = alivePlayers[0];
    const titleEl = document.getElementById("roundWinnerTitle");
    const subEl = document.getElementById("roundWinnerSub");
    if (winner) {
      winner.money += 5000;
      winner.score += 1;
      titleEl.textContent = `${winner.scoreLabel} WINS THE ROUND!`;
      titleEl.style.color = winner.scoreColor === "#ffcc00" ? "#b45309" : winner.scoreColor;
      // Indian Rupee (₹) in victory message
      subEl.textContent = `${winner.name} earned +₹5,000 Victory Bonus & +1 Round Point!`;
    } else {
      titleEl.textContent = "ROUND DRAW!";
      titleEl.style.color = "#ffffff";
      subEl.textContent = "All tanks were destroyed simultaneously!";
    }
    renderScoreboard();
    updateHUD();
    document.getElementById("roundOverModal").classList.remove("hidden");
    return;
  }

  let loops = 0;
  do {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    loops++;
  } while (!players[currentPlayerIndex].alive && loops <= players.length);

  const active = players[currentPlayerIndex];
  wind = Math.max(-95, Math.min(95, wind + Math.floor(Math.random() * 31) - 15));
  if (wind === 0) wind = 12;

  teleportMode = false;
  document.getElementById("teleportBanner").classList.add("hidden");

  updateHUD();
  showToast(`${active.name}'s Turn${active.isAI ? ` (CPU - ${active.aiDifficulty.replace("_", " ").toUpperCase()})` : ""}`);

  if (active.isAI) {
    turnState = "AI_THINKING";
    aiTimer = setTimeout(() => executeAITurn(active), 650);
  } else {
    turnState = "AIMING";
  }
}

function executeAITurn(ai) {
  if (!ai || !ai.alive || turnState !== "AI_THINKING") return;

  const targets = players.filter(p => p.alive && p.id !== ai.id);
  if (targets.length === 0) {
    advanceTurn();
    return;
  }
  const target = targets[Math.floor(Math.random() * targets.length)];
  const diffCfg = AI_DIFFICULTY_SETTINGS[ai.aiDifficulty] || AI_DIFFICULTY_SETTINGS.normal;

  const offensiveIdx = [0, 2, 3, 4, 5].filter(idx => {
    const w = WEAPONS[idx];
    return (ai.ammo[w.id] || 0) > 0;
  });
  if (offensiveIdx.length > 0 && Math.random() < 0.65) {
    ai.weaponIndex = offensiveIdx[Math.floor(Math.random() * offensiveIdx.length)];
  } else {
    ai.weaponIndex = 1;
  }

  const dx = target.x - ai.x;
  const dy = target.y - ai.y;
  const aimingRight = dx >= 0;
  const jitter = (Math.random() * 2 - 1) * diffCfg.angleJitter;
  const baseAngle = aimingRight
    ? Math.round(52 + jitter)
    : Math.round(128 + jitter);

  ai.angle = Math.max(15, Math.min(165, baseAngle));

  const gravity = 0.18;
  const rad = (ai.angle * Math.PI) / 180;
  const absDx = Math.abs(dx);
  const sin2 = Math.max(0.25, Math.sin(2 * rad));
  let estSpeed = Math.sqrt((absDx * gravity) / sin2);

  const windFactor = wind * 0.032 * (aimingRight ? -1 : 1);
  const errorSpread = (Math.random() * 2 - 1) * diffCfg.spread;
  estSpeed += windFactor + (dy * -0.008) + errorSpread;

  const computedPower = Math.round(((estSpeed - 2.8) / 12.2) * 100);
  ai.power = Math.max(18, Math.min(98, computedPower));

  updateHUD();
  turnState = "AIMING";
  fireCurrentWeapon();
}

function updatePhysics() {
  if (turnState === "MENU") return;

  if (turnState === "AIMING") {
    if (keysHeld["ArrowLeft"] || keysHeld["KeyA"]) moveActiveTank(-1);
    if (keysHeld["ArrowRight"] || keysHeld["KeyD"]) moveActiveTank(1);
  }

  clouds.forEach(c => {
    c.x += wind * 0.004;
    if (c.x > W + 120) c.x = -120;
    if (c.x < -120) c.x = W + 120;
  });

  const gravity = 0.18;
  const windAccel = wind * 0.0011;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.trail.push({ x: proj.x, y: proj.y });
    if (proj.trail.length > (quality === "high" ? 18 : 8)) {
      proj.trail.shift();
    }

    proj.vx += windAccel;
    proj.vy += gravity;
    proj.x += proj.vx;
    proj.y += proj.vy;

    if (proj.weapon.id === "shower" && !proj.hasSplitShower && proj.vy > -0.2) {
      proj.hasSplitShower = true;
      for (let k = -2; k <= 2; k++) {
        if (k === 0) continue;
        projectiles.push({
          x: proj.x,
          y: proj.y,
          vx: proj.vx + k * 1.15,
          vy: proj.vy - 0.5,
          weapon: {
            id: "shower_sub",
            name: "Hot Shower",
            radius: 26,
            damage: 30,
            color: "#f97316",
            isSub: true
          },
          ownerId: proj.ownerId,
          trail: []
        });
      }
    }

    if (proj.x < -40 || proj.x > W + 40 || proj.y > H + 40) {
      projectiles.splice(i, 1);
      continue;
    }

    let hitTank = false;
    for (let t = 0; t < players.length; t++) {
      const p = players[t];
      if (!p.alive) continue;
      if (Math.hypot(proj.x - p.x, proj.y - (p.y - 6)) < 11) {
        triggerExplosion(proj.x, proj.y, proj.weapon);
        projectiles.splice(i, 1);
        hitTank = true;
        break;
      }
    }
    if (hitTank) continue;

    if (proj.x >= 0 && proj.x <= W) {
      const groundY = getTerrainY(proj.x);
      if (proj.y >= groundY) {
        triggerExplosion(proj.x, groundY, proj.weapon);
        projectiles.splice(i, 1);
      }
    }
  }

  let anyFalling = false;
  players.forEach(p => {
    if (!p.alive) return;
    const groundY = getTerrainY(p.x);
    if (p.y < groundY - 0.5) {
      p.falling = true;
      anyFalling = true;
      if (p.parachuteOpen) {
        p.vy = Math.min(1.3, p.vy + 0.08);
      } else {
        p.vy = Math.min(7.5, p.vy + 0.25);
      }
      p.y += p.vy;
      if (p.y >= groundY) {
        p.y = groundY;
        if (!p.parachuteOpen && p.vy > 3.2) {
          const fallDmg = Math.round((p.vy - 2.8) * 6);
          p.health = Math.max(0, p.health - fallDmg);
          floatingTexts.push({
            x: p.x,
            y: p.y - 22,
            text: `-${fallDmg} FALL`,
            color: "#dc2626",
            life: 1.0
          });
          if (p.health <= 0) {
            p.alive = false;
            renderScoreboard();
          }
        }
        p.falling = false;
        p.vy = 0;
        p.parachuteOpen = false;
      }
    } else {
      p.y = groundY;
      p.falling = false;
      p.parachuteOpen = false;
    }
  });

  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    if (ex.radius < ex.maxRadius) {
      ex.radius = Math.min(ex.maxRadius, ex.radius + (ex.maxRadius - ex.radius) * 0.28 + 1.8);
    } else if (ex.holdFrames > 0) {
      ex.holdFrames--;
    } else {
      ex.alpha -= 0.065;
      if (ex.alpha <= 0) {
        explosions.splice(i, 1);
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.14;
    pt.life -= 0.024;
    if (pt.life <= 0) particles.splice(i, 1);
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 0.65;
    ft.life -= 0.02;
    if (ft.life <= 0) floatingTexts.splice(i, 1);
  }

  if (turnState === "FIRING" && projectiles.length === 0 && explosions.length === 0 && !anyFalling) {
    turnState = "SETTLING";
    setTimeout(() => {
      if (turnState === "SETTLING") {
        advanceTurn();
      }
    }, 260);
  }
}