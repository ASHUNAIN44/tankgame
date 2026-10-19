// ==========================================
// CANVAS RENDERING ENGINE (6 THEMATIC BIOMES)
// ==========================================
function drawScene() {
  ctx.clearRect(0, 0, W, H);

  // 1. SKY GRADIENT
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.85);
  switch (activeTerrainTheme) {
    case "peaks":
      skyGrad.addColorStop(0, "#a5c4ec");
      skyGrad.addColorStop(0.6, "#c6dbf7");
      skyGrad.addColorStop(1, "#e0edfc");
      break;

    case "canyon":
      skyGrad.addColorStop(0, "#fbcfe8");
      skyGrad.addColorStop(0.45, "#fed7aa");
      skyGrad.addColorStop(1, "#fef3c7");
      break;

    case "cliffs":
      skyGrad.addColorStop(0, "#94a3b8");
      skyGrad.addColorStop(0.55, "#cbd5e1");
      skyGrad.addColorStop(1, "#e2e8f0");
      break;

    case "plains":
      skyGrad.addColorStop(0, "#93c5fd");
      skyGrad.addColorStop(0.5, "#bae6fd");
      skyGrad.addColorStop(1, "#e0f2fe");
      break;

    case "dunes":
      skyGrad.addColorStop(0, "#7dd3fc");
      skyGrad.addColorStop(0.55, "#fef08a");
      skyGrad.addColorStop(1, "#fde047");
      break;

    case "hills":
    default:
      skyGrad.addColorStop(0, "#c6dbf7");
      skyGrad.addColorStop(0.55, "#d3e4fa");
      skyGrad.addColorStop(1, "#e1eefc");
      break;
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. SUN
  const sunX = W * 0.835;
  const sunY = H * 0.14;
  const sunR = Math.min(W, H) * 0.095;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  if (activeTerrainTheme === "dunes") ctx.fillStyle = "#facc15";
  else if (activeTerrainTheme === "canyon") ctx.fillStyle = "#fdba74";
  else if (activeTerrainTheme === "peaks") ctx.fillStyle = "#fef9c3";
  else ctx.fillStyle = "#efe9a8";
  ctx.fill();
  ctx.restore();

  // 3. CLOUDS
  if (quality !== "low") {
    clouds.forEach(c => drawCloud(c.x, c.y, c.scale, c.alpha));
  }

  // 4. BACKGROUND MOUNTAINS
  backgroundMountains.forEach(m => drawClassicMountain(m));

  // 5. TREES
  if (quality !== "low" && activeTerrainTheme !== "dunes") {
    trees.forEach(t => {
      if (!t.alive) return;
      const ty = getTerrainY(t.x);
      drawPineTree(t.x, ty, t.scale);
    });
  }

  // 6. FOREGROUND DESTRUCTIBLE TERRAIN (Centered in bottom ~25% of viewport)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = 0; x <= W; x++) {
    ctx.lineTo(x, terrain[x]);
  }
  ctx.lineTo(W, H);
  ctx.closePath();

  const hillGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  switch (activeTerrainTheme) {
    case "peaks":
      hillGrad.addColorStop(0, "#64748b");
      hillGrad.addColorStop(0.4, "#475569");
      hillGrad.addColorStop(1, "#1e293b");
      ctx.strokeStyle = "#e2e8f0";
      break;

    case "hills":
      hillGrad.addColorStop(0, "#71a600");
      hillGrad.addColorStop(0.35, "#6a9d00");
      hillGrad.addColorStop(1, "#5c8a00");
      ctx.strokeStyle = "#7cb500";
      break;

    case "canyon":
      hillGrad.addColorStop(0, "#ea580c");
      hillGrad.addColorStop(0.4, "#c2410c");
      hillGrad.addColorStop(1, "#7c2d12");
      ctx.strokeStyle = "#fb923c";
      break;

    case "cliffs":
      hillGrad.addColorStop(0, "#52525b");
      hillGrad.addColorStop(0.35, "#3f3f46");
      hillGrad.addColorStop(1, "#18181b");
      ctx.strokeStyle = "#84cc16";
      break;

    case "plains":
      hillGrad.addColorStop(0, "#65a30d");
      hillGrad.addColorStop(0.4, "#4d7c0f");
      hillGrad.addColorStop(1, "#365314");
      ctx.strokeStyle = "#a3e635";
      break;

    case "dunes":
      hillGrad.addColorStop(0, "#f59e0b");
      hillGrad.addColorStop(0.4, "#d97706");
      hillGrad.addColorStop(1, "#92400e");
      ctx.strokeStyle = "#fde047";
      break;
  }

  ctx.fillStyle = hillGrad;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();

  // 7. ALIVE TANKS
  players.forEach((p, idx) => {
    if (!p.alive) return;
    drawTank(p, idx === currentPlayerIndex);
  });

  // 8. PROJECTILES & SMOKE TRAILS
  projectiles.forEach(proj => {
    if (quality === "high" && proj.trail.length > 1) {
      ctx.save();
      ctx.beginPath();
      proj.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = proj.weapon.color || "#111";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  });

  // 9. RADIAL SPHERE EXPLOSIONS
  explosions.forEach(ex => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ex.alpha);
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    if (ex.isDirt) {
      ctx.fillStyle = activeTerrainTheme === "dunes" ? "#f59e0b" : "#65a30d";
    } else {
      const radGrad = ctx.createRadialGradient(
        ex.x - ex.radius * 0.12,
        ex.y - ex.radius * 0.12,
        ex.radius * 0.08,
        ex.x,
        ex.y,
        ex.radius
      );
      radGrad.addColorStop(0, "#e6b800");
      radGrad.addColorStop(0.32, "#d95f02");
      radGrad.addColorStop(0.75, "#c41e00");
      radGrad.addColorStop(1, "#990000");
      ctx.fillStyle = radGrad;
    }
    ctx.fill();
    ctx.restore();
  });

  // 10. DEBRIS PARTICLES
  particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
    ctx.restore();
  });

  // 11. FLOATING DAMAGE NUMBERS
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = ft.color;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.textAlign = "center";
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });
}

function drawCloud(x, y, scale, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = `rgba(242, 248, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.arc(24, -6, 30, 0, Math.PI * 2);
  ctx.arc(52, 2, 24, 0, Math.PI * 2);
  ctx.arc(22, 10, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Background mountain extends down to canvas bottom (H) to prevent background gaps
function drawClassicMountain(m) {
  const { peakX, peakY, baseLeft, baseRight } = m;
  const baseY = H;
  const span = baseRight - baseLeft;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(baseLeft, baseY);
  ctx.quadraticCurveTo(peakX - span * 0.22, peakY + (baseY - peakY) * 0.22, peakX - 16, peakY + 4);
  ctx.quadraticCurveTo(peakX, peakY - 6, peakX + 16, peakY + 4);
  ctx.quadraticCurveTo(peakX + span * 0.22, peakY + (baseY - peakY) * 0.22, baseRight, baseY);
  ctx.closePath();

  let baseFill = "#627d00";
  let shadowFill = "#597300";
  let capFill = "#9bc400";

  if (activeTerrainTheme === "dunes") {
    baseFill = "#b45309"; shadowFill = "#92400e"; capFill = "#f59e0b";
  } else if (activeTerrainTheme === "canyon") {
    baseFill = "#9a3412"; shadowFill = "#7c2d12"; capFill = "#fb923c";
  } else if (activeTerrainTheme === "peaks") {
    baseFill = "#475569"; shadowFill = "#334155"; capFill = "#f1f5f9";
  } else if (activeTerrainTheme === "cliffs") {
    baseFill = "#3f3f46"; shadowFill = "#27272a"; capFill = "#a1a1aa";
  } else if (activeTerrainTheme === "plains") {
    baseFill = "#4d7c0f"; shadowFill = "#3f6212"; capFill = "#84cc16";
  }

  ctx.fillStyle = baseFill;
  ctx.fill();
  ctx.clip();

  ctx.beginPath();
  ctx.moveTo(peakX, peakY - 10);
  ctx.lineTo(baseRight + 20, baseY);
  ctx.lineTo(peakX - 18, baseY);
  ctx.closePath();
  ctx.fillStyle = shadowFill;
  ctx.fill();

  const capBottomY = peakY + (baseY - peakY) * 0.42;
  ctx.beginPath();
  ctx.moveTo(baseLeft, peakY - 20);
  ctx.lineTo(baseRight, peakY - 20);
  ctx.lineTo(baseRight, capBottomY);
  ctx.quadraticCurveTo(peakX + span * 0.16, capBottomY - 22, peakX + span * 0.07, capBottomY + 4);
  ctx.quadraticCurveTo(peakX, capBottomY + 18, peakX - span * 0.06, capBottomY - 4);
  ctx.quadraticCurveTo(peakX - span * 0.16, capBottomY - 24, baseLeft, capBottomY + 6);
  ctx.closePath();
  ctx.fillStyle = capFill;
  ctx.fill();

  ctx.restore();
}

function drawPineTree(x, y, scale) {
  ctx.save();
  ctx.translate(x, y + 2);
  ctx.scale(scale, scale);

  ctx.fillStyle = activeTerrainTheme === "peaks" ? "#334155" : (activeTerrainTheme === "canyon" ? "#9a3412" : "#7ca300");
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(-7, -13);
  ctx.lineTo(7, -13);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(-9, -6);
  ctx.lineTo(9, -6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(-11, 2);
  ctx.lineTo(11, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawTank(p, isActive) {
  ctx.save();

  if (p.falling && p.parachuteOpen) {
    ctx.save();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p.x - 12, p.y - 26);
    ctx.lineTo(p.x - 3, p.y - 8);
    ctx.moveTo(p.x + 12, p.y - 26);
    ctx.lineTo(p.x + 3, p.y - 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y - 26, 13, Math.PI, 0, false);
    ctx.fillStyle = "#f8fafc";
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.stroke();
    ctx.restore();
  }

  if (p.shieldActive) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y - 6, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 182, 212, 0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  const rad = (p.angle * Math.PI) / 180;
  const turretOriginX = p.x;
  const turretOriginY = p.y - 6;
  const barrelTipX = turretOriginX + Math.cos(rad) * 14;
  const barrelTipY = turretOriginY - Math.sin(rad) * 14;

  ctx.beginPath();
  ctx.moveTo(turretOriginX, turretOriginY);
  ctx.lineTo(barrelTipX, barrelTipY);
  ctx.strokeStyle = "#1f2937";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();

  const slope = getTerrainSlopeAngle(p.x) * 0.55;
  ctx.translate(p.x, p.y - 2);
  ctx.rotate(slope);

  ctx.beginPath();
  ctx.arc(0, -4, 5.5, Math.PI, 0, false);
  ctx.fillStyle = p.tankFill;
  ctx.fill();
  ctx.strokeStyle = p.tankStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-9.5, -4, 19, 6.5, 3);
  ctx.fillStyle = p.tankFill;
  ctx.fill();
  ctx.strokeStyle = p.tankStroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  for (let wx = -6; wx <= 6; wx += 4) {
    ctx.beginPath();
    ctx.arc(wx, -0.5, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (isActive && turnState === "AIMING" && !p.isAI) {
    const aimDist = 28 + (p.power / 100) * 28;
    const ax = p.x + Math.cos(rad) * aimDist;
    const ay = (p.y - 6) - Math.sin(rad) * aimDist;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax, ay, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(239, 68, 68, 0.75)";
    ctx.fill();
    ctx.restore();
  }
}