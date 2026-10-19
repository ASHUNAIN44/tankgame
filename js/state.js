// ==========================================
// GAME STATE & 6 DISTINCT TERRAIN ENGINES
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let W = 900;
let H = 560;
let quality = "high";

// Terrain Selection State (6 versions + random)
// 'peaks' | 'hills' | 'canyon' | 'cliffs' | 'plains' | 'dunes' | 'random'
let selectedTerrainType = "random";
let activeTerrainTheme = "hills";
let totalPlayersCount = 2;
let currentSetupPlayerIdx = 0;

let terrain = [];
let trees = [];
let clouds = [];
let backgroundMountains = [];

let players = [];
let currentPlayerIndex = 0;
let wind = -48;
let projectiles = [];
let explosions = [];
let particles = [];
let floatingTexts = [];

let turnState = "MENU";
let teleportMode = false;
let aiTimer = null;
let keysHeld = {};
let startingCashConfig = 20200;

function createPlayers(preserveScores) {
  const oldScores = players.map(p => p.score || 0);
  const oldCash = players.map(p => p.money);

  players = PLAYER_DEFS.slice(0, totalPlayersCount).map((def, idx) => {
    const palette = PLAYER_COLOR_PALETTE[def.colorIdx] || PLAYER_COLOR_PALETTE[0];
    const cleanName = (def.name || `Player ${idx + 1}`).trim();
    const ammoMap = {
      volcano: 10,
      basic: 99,
      bigbomb: 5,
      cluster: 5,
      shower: 3,
      nuke: 2,
      dirt: 5
    };
    return {
      id: idx,
      name: cleanName,
      scoreLabel: cleanName.toUpperCase(),
      color: palette.color,
      scoreColor: palette.scoreColor,
      tankFill: palette.tankFill,
      tankStroke: palette.tankStroke,
      isAI: def.isAI,
      aiDifficulty: def.aiDifficulty || "normal",
      score: preserveScores && oldScores[idx] !== undefined ? oldScores[idx] : 0,
      money: preserveScores && oldCash[idx] !== undefined ? oldCash[idx] : startingCashConfig,
      health: 100,
      alive: true,
      fuel: 250,
      angle: idx % 2 === 0 ? 54 : 126,
      power: 60,
      weaponIndex: 0,
      ammo: ammoMap,
      shieldActive: false,
      shieldsOwned: 1,
      parachutes: 1,
      teleports: 1,
      repairs: 1,
      x: 100,
      y: 200,
      vy: 0,
      falling: false,
      parachuteOpen: false
    };
  });
}

// Procedural Heightmap with Lower Ground Baseline (70-75% Sky Area)
function generateBattlefield() {
  terrain = new Float32Array(W + 1);

  const allThemes = ["peaks", "hills", "canyon", "cliffs", "plains", "dunes"];
  activeTerrainTheme = selectedTerrainType === "random"
    ? allThemes[Math.floor(Math.random() * allThemes.length)]
    : selectedTerrainType;

  // Background mountains positioned nicely behind lowered terrain
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

  const seed = Math.random() * Math.PI * 2;

  // Generate 1D Surface Heightmap
  for (let x = 0; x <= W; x++) {
    const nx = x / W;
    let y = H * 0.80;

    switch (activeTerrainTheme) {
      // 1. HIGH PEAKS: Steep jagged summits with lower base
      case "peaks": {
        const base = H * 0.78;
        const peak1 = Math.abs(Math.sin(nx * Math.PI * 2.2 + seed)) * (H * 0.16);
        const peak2 = Math.cos(nx * Math.PI * 4.4 - seed * 0.7) * (H * 0.05);
        const ridge = Math.abs(Math.sin(nx * Math.PI * 7.5 + seed)) * (H * 0.025);
        y = base - peak1 - peak2 - ridge;
        break;
      }

      // 2. ROLLING HILLS: Gentle natural curves occupying bottom ~20%
      case "hills": {
        const base = H * 0.80;
        const h1 = Math.sin(nx * Math.PI * 2.5 + seed) * (H * 0.07);
        const h2 = Math.cos(nx * Math.PI * 4.2 - seed * 0.6) * (H * 0.03);
        y = base - h1 - h2;
        break;
      }

      // 3. DEEP CANYON: High side mesas with sunken gorge in center
      case "canyon": {
        const distFromCenter = Math.abs(nx - 0.5);
        const gorgeDip = Math.exp(-Math.pow(distFromCenter / 0.18, 2)) * (H * 0.13);
        const plateauBumps = Math.sin(nx * Math.PI * 6.0 + seed) * (H * 0.02);
        y = (H * 0.73) + gorgeDip - plateauBumps;
        break;
      }

      // 4. JAGGED CLIFFS: Rugged stepped ledges and crags
      case "cliffs": {
        const base = H * 0.78;
        const harmonic1 = Math.sin(nx * Math.PI * 3.2 + seed) * (H * 0.08);
        const harmonic2 = Math.sin(nx * Math.PI * 7.8 - seed * 1.2) * (H * 0.04);
        const harmonic3 = Math.cos(nx * Math.PI * 14.5 + seed) * (H * 0.015);
        const stepped = Math.floor(harmonic1 / 14) * 14;
        y = base - stepped - harmonic2 - harmonic3;
        break;
      }

      // 5. FLAT PLAINS: Open battlefield with minimal bumps
      case "plains": {
        const base = H * 0.84;
        const bump1 = Math.sin(nx * Math.PI * 1.8 + seed) * (H * 0.02);
        const bump2 = Math.cos(nx * Math.PI * 3.6 - seed) * (H * 0.01);
        y = base - bump1 - bump2;
        break;
      }

      // 6. DESERT DUNES: Sweeping asymmetric sand ridges
      case "dunes": {
        const base = H * 0.81;
        const wave1 = Math.sin(nx * Math.PI * 2.8 + seed);
        const shaped1 = (wave1 > 0 ? Math.pow(wave1, 1.4) : -Math.pow(-wave1, 0.7)) * (H * 0.065);
        const wave2 = Math.cos(nx * Math.PI * 5.2 - seed) * (H * 0.02);
        y = base - shaped1 - wave2;
        break;
      }

      default:
        y = H * 0.80;
        break;
    }

    // Keep ground clamped within lower 48% to 94% height range
    terrain[x] = Math.max(H * 0.48, Math.min(H * 0.94, y));
  }

  // Generate Trees along the new lower ridge
  trees = [];
  if (activeTerrainTheme !== "dunes") {
    let treeSpacing = 28;
    if (activeTerrainTheme === "hills") treeSpacing = 20;
    else if (activeTerrainTheme === "plains") treeSpacing = 42;
    else if (activeTerrainTheme === "canyon") treeSpacing = 50;
    else if (activeTerrainTheme === "peaks") treeSpacing = 32;

    for (let x = 24; x < W - 24; x += treeSpacing + Math.floor(Math.random() * 16)) {
      trees.push({
        x: x,
        scale: 0.65 + Math.random() * 0.4,
        alive: true
      });
    }
  }

  // Clouds drifting in wide open sky
  clouds = [
    { x: W * 0.06, y: H * 0.12, scale: 1.15, alpha: 0.62 },
    { x: W * 0.24, y: H * 0.32, scale: 0.85, alpha: 0.72 },
    { x: W * 0.64, y: H * 0.16, scale: 0.95, alpha: 0.48 }
  ];

  // Distribute tanks across lower hills
  const count = players.length;
  players.forEach((p, idx) => {
    p.alive = true;
    p.health = 100;
    p.fuel = 250;
    p.falling = false;
    p.vy = 0;
    p.parachuteOpen = false;
    const margin = W * 0.12;
    const usableW = W - margin * 2;
    p.x = Math.floor(margin + (count === 1 ? usableW * 0.5 : (idx / (count - 1)) * usableW));
    p.y = getTerrainY(p.x);
  });

  wind = Math.floor(Math.random() * 161) - 80;
  if (wind === 0) wind = -48;
}

function getTerrainY(x) {
  const ix = Math.max(0, Math.min(W, Math.round(x)));
  return terrain[ix] || H * 0.80;
}

function getTerrainSlopeAngle(x) {
  const x1 = Math.max(0, Math.min(W, Math.round(x - 6)));
  const x2 = Math.max(0, Math.min(W, Math.round(x + 6)));
  const dy = terrain[x2] - terrain[x1];
  const dx = Math.max(1, x2 - x1);
  return Math.atan2(dy, dx);
}

function carveCrater(cx, cy, radius, isDirt) {
  const startX = Math.max(0, Math.floor(cx - radius));
  const endX = Math.min(W, Math.ceil(cx + radius));

  for (let x = startX; x <= endX; x++) {
    const dx = x - cx;
    const chord = Math.sqrt(Math.max(0, radius * radius - dx * dx));
    if (isDirt) {
      const moundTop = cy - chord;
      if (terrain[x] > moundTop) {
        terrain[x] = Math.max(H * 0.35, terrain[x] - chord * 0.85);
      }
    } else {
      const craterBottom = cy + chord;
      if (terrain[x] < craterBottom) {
        terrain[x] = Math.min(H - 8, Math.max(terrain[x], craterBottom));
      }
    }
  }

  for (let x = Math.max(2, startX - 2); x <= Math.min(W - 2, endX + 2); x++) {
    terrain[x] = (terrain[x - 1] + terrain[x] * 2 + terrain[x + 1]) * 0.25;
  }

  trees.forEach(t => {
    if (t.alive && Math.hypot(t.x - cx, getTerrainY(t.x) - cy) < radius * 1.05) {
      t.alive = false;
    }
  });
}