// ==========================================
// STARTING MENU SCREENS, HUD & SHOP MODALS
// ==========================================
function showToast(msg) {
  const toast = document.getElementById("statusToast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.opacity = "1";
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1600);
}

function openStartMenuScreen1() {
  turnState = "MENU";
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  document.getElementById("startMenuContainer").classList.remove("hidden");
  document.getElementById("menuScreen1").classList.remove("hidden");
  document.getElementById("menuScreen2").classList.add("hidden");
  document.getElementById("btnGoToPlayerSetup").classList.remove("hidden");
  renderMenuScreen1();
}

function renderMenuScreen1() {
  document.querySelectorAll("#terrainRadioGroup .menu-radio-row").forEach(row => {
    const t = row.getAttribute("data-terrain");
    const circle = row.querySelector(".classic-radio-circle");
    if (t === selectedTerrainType) {
      circle.classList.add("active");
      circle.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-[#15803d] inline-block"></span>`;
    } else {
      circle.classList.remove("active");
      circle.innerHTML = "";
    }
  });

  document.getElementById("menuTotalPlayersBadge").textContent = totalPlayersCount;
}

function openPlayerSetupStep(playerIdx) {
  currentSetupPlayerIdx = playerIdx;
  document.getElementById("menuScreen1").classList.add("hidden");
  document.getElementById("menuScreen2").classList.remove("hidden");
  document.getElementById("btnGoToPlayerSetup").classList.add("hidden");

  const def = PLAYER_DEFS[playerIdx];
  document.getElementById("setupPlayerHeading").textContent = `PLAYER ${playerIdx + 1}`;

  const nameInput = document.getElementById("setupPlayerNameInput");
  nameInput.value = def.name || `Player ${playerIdx + 1}`;
  setTimeout(() => nameInput.focus(), 40);

  renderPlayerSetupControls();
}

function renderPlayerSetupControls() {
  const def = PLAYER_DEFS[currentSetupPlayerIdx];

  const swatchContainer = document.getElementById("setupColorSwatches");
  swatchContainer.innerHTML = PLAYER_COLOR_PALETTE.map((swatch, idx) => {
    const isSelected = def.colorIdx === idx;
    const innerDot = isSelected
      ? `<span class="w-2.5 h-2.5 rounded-full bg-[#14532d] border border-white/80 inline-block"></span>`
      : "";
    return `<button type="button" data-color-idx="${idx}"
      class="w-[22px] h-[22px] rounded-full border-[1.8px] border-[#1e293b] inline-flex items-center justify-center cursor-pointer hover:scale-110 transition"
      style="background-color: ${swatch.swatchBg};">${innerDot}</button>`;
  }).join("");

  const checkSvg = document.getElementById("setupCpuCheckmark");
  const aiPanel = document.getElementById("aiDifficultyPanel");
  if (def.isAI) {
    checkSvg.classList.remove("hidden");
    aiPanel.classList.remove("hidden");
  } else {
    checkSvg.classList.add("hidden");
    aiPanel.classList.add("hidden");
  }

  document.querySelectorAll("#aiDifficultyGroup .ai-diff-row").forEach(row => {
    const diff = row.getAttribute("data-diff");
    const circle = row.querySelector(".ai-diff-circle");
    if (diff === (def.aiDifficulty || "normal")) {
      circle.classList.add("active");
      circle.innerHTML = `<span class="w-2 h-2 rounded-full bg-[#365314] inline-block"></span>`;
    } else {
      circle.classList.remove("active");
      circle.innerHTML = "";
    }
  });

  const isLastPlayer = currentSetupPlayerIdx >= totalPlayersCount - 1;
  document.getElementById("setupNextBtnLabel").textContent = isLastPlayer ? "START !" : "NEXT PLAYER";
}

function saveCurrentPlayerSetupFromInputs() {
  const def = PLAYER_DEFS[currentSetupPlayerIdx];
  const val = document.getElementById("setupPlayerNameInput").value.trim();
  def.name = val || `Player ${currentSetupPlayerIdx + 1}`;
}

function updateHUD() {
  const p = players[currentPlayerIndex];
  if (!p) return;

  document.getElementById("hudPlayerName").textContent = p.name;
  document.getElementById("hudPlayerColorDot").style.backgroundColor = p.color;
  document.getElementById("hudFuel").textContent = Math.round(p.fuel);
  document.getElementById("hudHealth").textContent = Math.round(p.health);
  document.getElementById("hudParachutes").textContent = p.parachutes;
  document.getElementById("hudTeleports").textContent = p.teleports;
  document.getElementById("hudRepairs").textContent = p.repairs;
  document.getElementById("hudShieldCount").textContent = p.shieldsOwned;

  const shieldDot = document.getElementById("shieldActiveDot");
  shieldDot.style.opacity = p.shieldActive ? "1" : "0";

  document.getElementById("hudPower").textContent = Math.round(p.power);
  const lineY = 40 - (p.power / 100) * 38;
  const halfWidth = 1 + (1 - lineY / 41) * 12;
  const powerLine = document.getElementById("powerIndicatorLine");
  powerLine.setAttribute("y1", lineY.toFixed(1));
  powerLine.setAttribute("y2", lineY.toFixed(1));
  powerLine.setAttribute("x1", (14 - halfWidth - 2).toFixed(1));
  powerLine.setAttribute("x2", (14 + halfWidth + 2).toFixed(1));

  document.getElementById("hudAngle").textContent = Math.round(p.angle);
  const anglePct = Math.max(2, Math.min(98, (p.angle / 180) * 100));
  document.getElementById("angleIndicatorTick").style.left = `${anglePct}%`;

  const rad = (p.angle * Math.PI) / 180;
  const bx = 12 + Math.cos(rad) * 8;
  const by = 8 - Math.sin(rad) * 7;
  const miniBarrel = document.getElementById("miniTankBarrel");
  miniBarrel.setAttribute("x2", bx.toFixed(1));
  miniBarrel.setAttribute("y2", by.toFixed(1));

  const w = WEAPONS[p.weaponIndex] || WEAPONS[0];
  document.getElementById("hudWeaponName").textContent = w.name;
  document.getElementById("hudWeaponAmmo").textContent = w.infinite ? "∞" : (p.ammo[w.id] || 0);
  document.getElementById("hudWeaponIcon").innerHTML =
    `<span class="w-3.5 h-3.5 rounded-full bg-gradient-to-br ${w.iconBg} border border-black/40 inline-block"></span>`;

  document.getElementById("hudMoney").textContent = p.money;
  document.getElementById("hudWind").textContent = Math.abs(wind);
  document.getElementById("windArrowContainer").innerHTML = wind < 0 ? "&larr;" : "&rarr;";

  const teleBtn = document.getElementById("btnTeleport");
  if (teleportMode) {
    teleBtn.classList.add("active-item");
  } else {
    teleBtn.classList.remove("active-item");
  }
}

function renderScoreboard() {
  const container = document.getElementById("scoreboardOverlay");
  if (!container) return;
  container.innerHTML = players
    .map(p => {
      const strike = p.alive ? "" : "opacity-45 line-through";
      return `<div class="retro-score flex items-center justify-between gap-8 sm:gap-11 ${strike}" style="color: ${p.scoreColor};">
        <span>${p.scoreLabel}</span>
        <span class="tabular-nums">${p.score}</span>
      </div>`;
    })
    .join("");
}

function openShopModal() {
  const p = players[currentPlayerIndex];
  if (!p) return;
  document.getElementById("shopPlayerBadge").textContent = p.name;
  document.getElementById("shopPlayerBadge").style.backgroundColor = p.color;
  document.getElementById("shopCashDisplay").textContent = p.money;

  // Weapons in Indian Rupees (₹)
  const wList = document.getElementById("shopWeaponsList");
  wList.innerHTML = WEAPONS.filter(w => !w.infinite)
    .map(w => {
      const owned = p.ammo[w.id] || 0;
      const canBuy = p.money >= w.price;
      return `<div class="bg-white border border-slate-300 rounded p-2 flex items-center justify-between gap-2 shadow-2xs">
        <div class="min-w-0">
          <div class="font-bold text-slate-800 flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-gradient-to-br ${w.iconBg} inline-block shrink-0"></span>
            <span class="truncate">${w.name}</span>
            <span class="text-[10px] text-slate-500">(+${w.packSize})</span>
          </div>
          <div class="text-[10px] text-slate-500 truncate">${w.desc}</div>
          <div class="text-[10px] font-semibold text-sky-700 mt-0.5">Owned: ${owned}</div>
        </div>
        <button type="button" data-buy-weapon="${w.id}" class="shrink-0 px-2.5 py-1 rounded font-bold text-[11px] ${
          canBuy
            ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }">
          ₹${w.price}
        </button>
      </div>`;
    })
    .join("");

  // Items in Indian Rupees (₹)
  const iList = document.getElementById("shopItemsList");
  iList.innerHTML = SHOP_ITEMS.map(item => {
    const canBuy = p.money >= item.price;
    let ownedLabel = "";
    if (item.id === "shield") ownedLabel = `Owned: ${p.shieldsOwned}`;
    if (item.id === "parachute") ownedLabel = `Owned: ${p.parachutes}`;
    if (item.id === "teleport") ownedLabel = `Owned: ${p.teleports}`;
    if (item.id === "repair") ownedLabel = `Owned: ${p.repairs}`;
    if (item.id === "fuel") ownedLabel = `Fuel: ${Math.round(p.fuel)}`;

    return `<div class="bg-white border border-slate-300 rounded p-2 flex items-center justify-between gap-2 shadow-2xs">
      <div class="min-w-0">
        <div class="font-bold text-slate-800">${item.name}</div>
        <div class="text-[10px] text-slate-500 truncate">${item.desc}</div>
        <div class="text-[10px] font-semibold text-emerald-700 mt-0.5">${ownedLabel}</div>
      </div>
      <button type="button" data-buy-item="${item.id}" class="shrink-0 px-2.5 py-1 rounded font-bold text-[11px] ${
        canBuy
          ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
          : "bg-slate-200 text-slate-400 cursor-not-allowed"
      }">
        ₹${item.price}
      </button>
    </div>`;
  }).join("");

  document.getElementById("shopModal").classList.remove("hidden");
}

function handleShopClick(e) {
  const p = players[currentPlayerIndex];
  if (!p) return;

  const wBtn = e.target.closest("[data-buy-weapon]");
  if (wBtn) {
    const wId = wBtn.getAttribute("data-buy-weapon");
    const w = WEAPONS.find(item => item.id === wId);
    if (w && p.money >= w.price) {
      p.money -= w.price;
      p.ammo[w.id] = (p.ammo[w.id] || 0) + w.packSize;
      p.weaponIndex = WEAPONS.indexOf(w);
      playSound("click");
      openShopModal();
      updateHUD();
    }
    return;
  }

  const iBtn = e.target.closest("[data-buy-item]");
  if (iBtn) {
    const iId = iBtn.getAttribute("data-buy-item");
    const item = SHOP_ITEMS.find(it => it.id === iId);
    if (item && p.money >= item.price) {
      p.money -= item.price;
      if (iId === "shield") p.shieldsOwned += 1;
      if (iId === "parachute") p.parachutes += 1;
      if (iId === "teleport") p.teleports += 1;
      if (iId === "repair") p.repairs += 1;
      if (iId === "fuel") p.fuel += 150;
      playSound("click");
      openShopModal();
      updateHUD();
    }
  }
}