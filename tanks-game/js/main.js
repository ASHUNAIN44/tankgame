// ==========================================
// EVENTS, MINECRAFT TOUCH CONTROLS & GAME LOOP
// ==========================================
function setupEvents() {
  function handleResize() {
    const container = document.getElementById("canvasContainer");
    const rect = container.getBoundingClientRect();
    const newW = Math.max(480, Math.floor(rect.width));
    const newH = Math.max(260, Math.floor(rect.height));

    if (terrain.length > 0 && (newW !== W || newH !== H)) {
      const oldTerrain = terrain;
      const oldW = W;
      const oldH = H;
      W = newW;
      H = newH;
      canvas.width = W;
      canvas.height = H;

      const nextTerrain = new Float32Array(W + 1);
      for (let x = 0; x <= W; x++) {
        const srcX = Math.min(oldW, Math.round((x / W) * oldW));
        nextTerrain[x] = (oldTerrain[srcX] / oldH) * H;
      }
      terrain = nextTerrain;

      if (activeTerrainTheme === "peaks" || activeTerrainTheme === "cliffs") {
        backgroundMountains = [
          { peakX: W * 0.12, peakY: H * 0.35, baseLeft: -W * 0.08, baseRight: W * 0.38 },
          { peakX: W * 0.44, peakY: H * 0.30, baseLeft: W * 0.22, baseRight: W * 0.74 },
          { peakX: W * 0.84, peakY: H * 0.36, baseLeft: W * 0.60, baseRight: W * 1.08 }
        ];
      } else if (activeTerrainTheme === "plains" || activeTerrainTheme === "dunes") {
        backgroundMountains = [
          { peakX: W * 0.18, peakY: H * 0.58, baseLeft: -W * 0.05, baseRight: W * 0.42 },
          { peakX: W * 0.52, peakY: H * 0.54, baseLeft: W * 0.30, baseRight: W * 0.78 },
          { peakX: W * 0.88, peakY: H * 0.58, baseLeft: W * 0.68, baseRight: W * 1.08 }
        ];
      } else {
        backgroundMountains = [
          { peakX: W * 0.145, peakY: H * 0.46, baseLeft: -W * 0.04, baseRight: W * 0.36 },
          { peakX: W * 0.495, peakY: H * 0.48, baseLeft: W * 0.28, baseRight: W * 0.72 },
          { peakX: W * 0.875, peakY: H * 0.48, baseLeft: W * 0.66, baseRight: W * 1.06 }
        ];
      }

      players.forEach(p => {
        p.x = (p.x / oldW) * W;
        p.y = getTerrainY(p.x);
      });
      trees.forEach(t => {
        t.x = (t.x / oldW) * W;
      });
    } else {
      W = newW;
      H = newH;
      canvas.width = W;
      canvas.height = H;
    }
    drawScene();
  }

  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  function requestGameFullscreen() {
    ensureAudio();
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock("landscape").catch(() => {});
    }
  }

  const btnForceFull = document.getElementById("btnForceFullscreen");
  if (btnForceFull) {
    btnForceFull.addEventListener("click", requestGameFullscreen);
  }

  // SCREEN 1 LISTENERS (6 TERRAINS & TOTAL PLAYERS)
  document.getElementById("terrainRadioGroup").addEventListener("click", (e) => {
    const row = e.target.closest(".menu-radio-row");
    if (!row) return;
    selectedTerrainType = row.getAttribute("data-terrain") || "random";
    playSound("click");
    renderMenuScreen1();
  });

  document.getElementById("btnMenuPlayersDec").addEventListener("click", () => {
    if (totalPlayersCount > 2) {
      totalPlayersCount -= 1;
      playSound("click");
      renderMenuScreen1();
    }
  });

  document.getElementById("btnMenuPlayersInc").addEventListener("click", () => {
    if (totalPlayersCount < 5) {
      totalPlayersCount += 1;
      playSound("click");
      renderMenuScreen1();
    }
  });

  document.getElementById("btnGoToPlayerSetup").addEventListener("click", () => {
    ensureAudio();
    playSound("click");
    openPlayerSetupStep(0);
  });

  // SCREEN 2 & 3 LISTENERS
  document.getElementById("setupColorSwatches").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-color-idx]");
    if (!btn) return;
    const idx = parseInt(btn.getAttribute("data-color-idx"), 10);
    PLAYER_DEFS[currentSetupPlayerIdx].colorIdx = idx;
    playSound("click");
    renderPlayerSetupControls();
  });

  document.getElementById("setupCpuCheckbox").addEventListener("click", () => {
    const def = PLAYER_DEFS[currentSetupPlayerIdx];
    def.isAI = !def.isAI;
    playSound("click");
    renderPlayerSetupControls();
  });

  document.getElementById("aiDifficultyGroup").addEventListener("click", (e) => {
    const row = e.target.closest(".ai-diff-row");
    if (!row) return;
    const diff = row.getAttribute("data-diff");
    PLAYER_DEFS[currentSetupPlayerIdx].aiDifficulty = diff;
    playSound("click");
    renderPlayerSetupControls();
  });

  document.getElementById("btnSetupNextPlayer").addEventListener("click", () => {
    saveCurrentPlayerSetupFromInputs();
    playSound("click");

    if (currentSetupPlayerIdx < totalPlayersCount - 1) {
      openPlayerSetupStep(currentSetupPlayerIdx + 1);
    } else {
      document.getElementById("startMenuContainer").classList.add("hidden");
      requestGameFullscreen();
      startNewMatch(false);
    }
  });

  // HUD BUTTON ACTIONS
  const btnLeft = document.getElementById("btnMoveLeft");
  const btnRight = document.getElementById("btnMoveRight");
  let moveInterval = null;

  function startMoveBtn(dir) {
    moveActiveTank(dir);
    clearInterval(moveInterval);
    moveInterval = setInterval(() => moveActiveTank(dir), 40);
  }
  function stopMoveBtn() {
    clearInterval(moveInterval);
  }

  btnLeft.addEventListener("mousedown", () => startMoveBtn(-1));
  btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); startMoveBtn(-1); });
  btnRight.addEventListener("mousedown", () => startMoveBtn(1));
  btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); startMoveBtn(1); });
  window.addEventListener("mouseup", stopMoveBtn);
  window.addEventListener("touchend", stopMoveBtn);

  document.getElementById("btnShield").addEventListener("click", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    if (!p.shieldActive && p.shieldsOwned > 0) {
      p.shieldsOwned -= 1;
      p.shieldActive = true;
      playSound("click");
      showToast("Energy Shield Activated!");
      updateHUD();
    } else if (p.shieldActive) {
      showToast("Shield is already active!");
    } else {
      showToast("No shields left! Buy more in SHOP.");
    }
  });

  document.getElementById("btnParachute").addEventListener("click", () => {
    const p = players[currentPlayerIndex];
    if (!p) return;
    showToast(`Parachutes (${p.parachutes}) deploy automatically when falling!`);
  });

  document.getElementById("btnTeleport").addEventListener("click", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    if (p.teleports <= 0) {
      showToast("No Teleports left! Buy more in SHOP.");
      return;
    }
    teleportMode = !teleportMode;
    document.getElementById("teleportBanner").classList.toggle("hidden", !teleportMode);
    playSound("click");
    updateHUD();
  });

  document.getElementById("btnCancelTeleport").addEventListener("click", () => {
    teleportMode = false;
    document.getElementById("teleportBanner").classList.add("hidden");
    updateHUD();
  });

  document.getElementById("btnRepair").addEventListener("click", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    if (p.repairs <= 0) {
      showToast("No Repair Kits left! Buy more in SHOP.");
      return;
    }
    if (p.health >= 100) {
      showToast("Tank health is already 100!");
      return;
    }
    p.repairs -= 1;
    p.health = Math.min(100, p.health + 35);
    playSound("click");
    floatingTexts.push({ x: p.x, y: p.y - 24, text: "+35 HP", color: "#16a34a", life: 1.0 });
    updateHUD();
  });

  // Power Drag
  const powerArea = document.getElementById("powerSliderArea");
  let draggingPower = false;
  function updatePowerFromEvent(e) {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    const rect = powerArea.getBoundingClientRect();
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    p.power = Math.round((1 - relY / rect.height) * 100);
    updateHUD();
  }
  powerArea.addEventListener("mousedown", (e) => { draggingPower = true; updatePowerFromEvent(e); });
  powerArea.addEventListener("touchstart", (e) => { e.preventDefault(); draggingPower = true; updatePowerFromEvent(e); });

  // Angle Drag
  const angleArea = document.getElementById("angleSliderArea");
  let draggingAngle = false;
  function updateAngleFromEvent(e) {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    const rect = angleArea.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    p.angle = Math.round((relX / rect.width) * 180);
    updateHUD();
  }
  angleArea.addEventListener("mousedown", (e) => { draggingAngle = true; updateAngleFromEvent(e); });
  angleArea.addEventListener("touchstart", (e) => { e.preventDefault(); draggingAngle = true; updateAngleFromEvent(e); });

  window.addEventListener("mousemove", (e) => {
    if (draggingPower) updatePowerFromEvent(e);
    if (draggingAngle) updateAngleFromEvent(e);
  });
  window.addEventListener("touchmove", (e) => {
    if (draggingPower) updatePowerFromEvent(e);
    if (draggingAngle) updateAngleFromEvent(e);
  });
  window.addEventListener("mouseup", () => { draggingPower = false; draggingAngle = false; });
  window.addEventListener("touchend", () => { draggingPower = false; draggingAngle = false; });

  document.getElementById("btnFire").addEventListener("click", () => {
    const p = players[currentPlayerIndex];
    if (p && !p.isAI && turnState === "AIMING") {
      fireCurrentWeapon();
    }
  });

  function cycleWeapon(dir) {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    p.weaponIndex = (p.weaponIndex + dir + WEAPONS.length) % WEAPONS.length;
    playSound("click");
    updateHUD();
  }
  document.getElementById("btnPrevWeapon").addEventListener("click", () => cycleWeapon(-1));
  document.getElementById("btnNextWeapon").addEventListener("click", () => cycleWeapon(1));
  document.getElementById("weaponSelectorBox").addEventListener("click", () => cycleWeapon(1));

  document.querySelectorAll('input[name="quality"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      quality = e.target.value;
      playSound("click");
      showToast(`Graphics Quality: ${quality.toUpperCase()}`);
    });
  });

  const btnSound = document.getElementById("btnSoundToggle");
  btnSound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    btnSound.textContent = soundEnabled ? "SFX: ON" : "SFX: OFF";
    if (soundEnabled) playSound("click");
  });

  document.getElementById("btnOpenShop").addEventListener("click", openShopModal);
  document.getElementById("btnCloseShop").addEventListener("click", () => {
    document.getElementById("shopModal").classList.add("hidden");
  });
  document.getElementById("btnDoneShop").addEventListener("click", () => {
    document.getElementById("shopModal").classList.add("hidden");
  });
  document.getElementById("shopModal").addEventListener("click", handleShopClick);

  document.getElementById("btnNewGame").addEventListener("click", () => {
    playSound("click");
    openStartMenuScreen1();
  });

  document.getElementById("btnRoundShop").addEventListener("click", () => {
    document.getElementById("roundOverModal").classList.add("hidden");
    currentPlayerIndex = 0;
    openShopModal();
  });
  document.getElementById("btnNextRound").addEventListener("click", () => {
    document.getElementById("roundOverModal").classList.add("hidden");
    startNewMatch(true);
  });

  // ========================================================
  // MINECRAFT-STYLE BEVELED TOUCH CONTROLS EVENT BINDINGS
  // ========================================================
  let touchHoldTimer = null;

  function bindContinuousAction(elemId, actionFn) {
    const el = document.getElementById(elemId);
    if (!el) return;

    function startAction(e) {
      if (e) e.preventDefault();
      ensureAudio();
      actionFn();
      clearInterval(touchHoldTimer);
      touchHoldTimer = setInterval(actionFn, 45);
    }
    function endAction(e) {
      if (e) e.preventDefault();
      clearInterval(touchHoldTimer);
    }

    el.addEventListener("mousedown", startAction);
    el.addEventListener("touchstart", startAction, { passive: false });
    el.addEventListener("mouseup", endAction);
    el.addEventListener("mouseleave", endAction);
    el.addEventListener("touchend", endAction, { passive: false });
  }

  // Left D-Pad Controls: Move (Left/Right) & Cannon Angle (Up/Down)
  bindContinuousAction("mcBtnLeft", () => moveActiveTank(-1));
  bindContinuousAction("mcBtnRight", () => moveActiveTank(1));
  bindContinuousAction("mcBtnAngleUp", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    p.angle = Math.min(180, p.angle + 1);
    updateHUD();
  });
  bindContinuousAction("mcBtnAngleDown", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    p.angle = Math.max(0, p.angle - 1);
    updateHUD();
  });

  // Center D-Pad Button: Shield Toggle
  const btnMcCenter = document.getElementById("mcBtnCenter");
  if (btnMcCenter) {
    btnMcCenter.addEventListener("click", () => {
      document.getElementById("btnShield").click();
    });
    btnMcCenter.addEventListener("touchstart", (e) => {
      e.preventDefault();
      document.getElementById("btnShield").click();
    }, { passive: false });
  }

  // Right Action Controls: Power (+ / -)
  bindContinuousAction("mcBtnPowerUp", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    p.power = Math.min(100, p.power + 1);
    updateHUD();
  });
  bindContinuousAction("mcBtnPowerDown", () => {
    const p = players[currentPlayerIndex];
    if (!p || turnState !== "AIMING" || p.isAI) return;
    p.power = Math.max(5, p.power - 1);
    updateHUD();
  });

  // Weapon Switch
  const btnMcWeapon = document.getElementById("mcBtnWeapon");
  if (btnMcWeapon) {
    btnMcWeapon.addEventListener("click", () => cycleWeapon(1));
    btnMcWeapon.addEventListener("touchstart", (e) => { e.preventDefault(); cycleWeapon(1); }, { passive: false });
  }

  // Big Square FIRE Button
  const btnMcFire = document.getElementById("mcBtnFire");
  if (btnMcFire) {
    btnMcFire.addEventListener("click", () => {
      const p = players[currentPlayerIndex];
      if (p && !p.isAI && turnState === "AIMING") fireCurrentWeapon();
    });
    btnMcFire.addEventListener("touchstart", (e) => {
      e.preventDefault();
      const p = players[currentPlayerIndex];
      if (p && !p.isAI && turnState === "AIMING") fireCurrentWeapon();
    }, { passive: false });
  }

  // Canvas Tap (Aim / Teleport)
  canvas.addEventListener("pointerdown", (e) => {
    ensureAudio();
    const p = players[currentPlayerIndex];
    if (!p || !p.alive || p.isAI || turnState !== "AIMING") return;

    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * W;
    const cy = ((e.clientY - rect.top) / rect.height) * H;

    if (teleportMode && p.teleports > 0) {
      p.teleports -= 1;
      p.x = Math.max(20, Math.min(W - 20, cx));
      p.y = getTerrainY(p.x);
      teleportMode = false;
      document.getElementById("teleportBanner").classList.add("hidden");
      playSound("teleport");
      for (let i = 0; i < 16; i++) {
        const ang = Math.random() * Math.PI * 2;
        particles.push({
          x: p.x,
          y: p.y - 6,
          vx: Math.cos(ang) * 3,
          vy: Math.sin(ang) * 3,
          size: 3,
          color: "#38bdf8",
          life: 0.9
        });
      }
      updateHUD();
      return;
    }

    const dx = cx - p.x;
    const dy = (p.y - 8) - cy;
    let deg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
    if (deg < 0) deg = dx < 0 ? 180 : 0;
    p.angle = Math.max(0, Math.min(180, deg));
    updateHUD();
  });

  // Keyboard Shortcuts (Desktop / Laptop)
  window.addEventListener("keydown", (e) => {
    if (turnState === "MENU") {
      if (e.code === "Enter" && !document.getElementById("menuScreen2").classList.contains("hidden")) {
        document.getElementById("btnSetupNextPlayer").click();
      }
      return;
    }

    const shopOpen = !document.getElementById("shopModal").classList.contains("hidden");
    if (shopOpen) return;

    keysHeld[e.code] = true;
    const p = players[currentPlayerIndex];
    if (!p || !p.alive || p.isAI || turnState !== "AIMING") return;

    if (e.code === "ArrowUp") {
      e.preventDefault();
      p.angle = Math.min(180, p.angle + 2);
      updateHUD();
    } else if (e.code === "ArrowDown") {
      e.preventDefault();
      p.angle = Math.max(0, p.angle - 2);
      updateHUD();
    } else if (e.code === "PageUp") {
      e.preventDefault();
      p.power = Math.min(100, p.power + 2);
      updateHUD();
    } else if (e.code === "PageDown") {
      e.preventDefault();
      p.power = Math.max(5, p.power - 2);
      updateHUD();
    } else if (e.code === "KeyQ" || e.code === "KeyZ") {
      p.weaponIndex = (p.weaponIndex - 1 + WEAPONS.length) % WEAPONS.length;
      playSound("click");
      updateHUD();
    } else if (e.code === "KeyW" || e.code === "KeyX") {
      p.weaponIndex = (p.weaponIndex + 1) % WEAPONS.length;
      playSound("click");
      updateHUD();
    } else if (e.code === "KeyB") {
      openShopModal();
    } else if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      fireCurrentWeapon();
    }
  });

  window.addEventListener("keyup", (e) => {
    keysHeld[e.code] = false;
  });

  handleResize();
}

function startNewMatch(preserveScores) {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  projectiles = [];
  explosions = [];
  particles = [];
  floatingTexts = [];
  teleportMode = false;
  document.getElementById("teleportBanner").classList.add("hidden");

  createPlayers(preserveScores);
  currentPlayerIndex = 0;

  generateBattlefield();
  updateHUD();
  renderScoreboard();

  const firstPlayer = players[0];
  showToast(`${firstPlayer.name}'s Turn${firstPlayer.isAI ? " (CPU)" : ""}`);

  if (firstPlayer.isAI) {
    turnState = "AI_THINKING";
    aiTimer = setTimeout(() => executeAITurn(firstPlayer), 650);
  } else {
    turnState = "AIMING";
  }
}

let animFrameId = null;
function gameLoop() {
  updatePhysics();
  drawScene();
  animFrameId = requestAnimationFrame(gameLoop);
}

window.onload = function () {
  setupEvents();
  createPlayers(false);
  generateBattlefield();
  openStartMenuScreen1();
  if (animFrameId) cancelAnimationFrame(animFrameId);
  animFrameId = requestAnimationFrame(gameLoop);
};