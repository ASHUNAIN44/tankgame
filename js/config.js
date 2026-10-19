// ==========================================
// WEAPONS, COLORS & AI DIFFICULTY CATALOG
// ==========================================
const WEAPONS = [
  {
    id: "volcano",
    name: "Volcano bomb",
    price: 600,
    packSize: 5,
    radius: 46,
    damage: 55,
    color: "#ff3300",
    iconBg: "from-yellow-300 via-orange-500 to-red-700",
    desc: "Erupts on impact, launching 6 molten lava bombs across the hills!"
  },
  {
    id: "basic",
    name: "Small missile",
    price: 0,
    packSize: 99,
    infinite: true,
    radius: 26,
    damage: 32,
    color: "#334155",
    iconBg: "from-slate-300 via-slate-500 to-slate-800",
    desc: "Standard unlimited artillery shell."
  },
  {
    id: "bigbomb",
    name: "Big bomb",
    price: 400,
    packSize: 5,
    radius: 56,
    damage: 65,
    color: "#dc2626",
    iconBg: "from-orange-400 via-red-600 to-red-900",
    desc: "Heavy high-explosive shell that carves a massive crater."
  },
  {
    id: "cluster",
    name: "Cluster bomb",
    price: 550,
    packSize: 5,
    radius: 34,
    damage: 40,
    color: "#eab308",
    iconBg: "from-yellow-200 via-amber-500 to-orange-700",
    desc: "Splits at apex or impact into 5 explosive sub-munitions."
  },
  {
    id: "shower",
    name: "Hot shower",
    price: 850,
    packSize: 3,
    radius: 32,
    damage: 38,
    color: "#f97316",
    iconBg: "from-amber-300 via-orange-600 to-red-800",
    desc: "Releases 5 warheads high in the sky to rain fire over a wide area."
  },
  {
    id: "nuke",
    name: "Atom bomb",
    price: 1500,
    packSize: 2,
    radius: 92,
    damage: 95,
    color: "#ef4444",
    iconBg: "from-yellow-200 via-red-500 to-purple-900",
    desc: "Thermonuclear blast with a colossal fireball and shockwave!"
  },
  {
    id: "dirt",
    name: "Dirt ball",
    price: 300,
    packSize: 5,
    radius: 50,
    damage: 0,
    isDirt: true,
    color: "#65a30d",
    iconBg: "from-lime-300 via-lime-600 to-green-900",
    desc: "Adds a mound of green earth on impact to bury foes or build cover."
  }
];

const SHOP_ITEMS = [
  { id: "shield", name: "Energy Shield", price: 500, desc: "Absorbs 50% damage for the round." },
  { id: "parachute", name: "Parachute", price: 250, desc: "Prevents fall damage when terrain collapses." },
  { id: "teleport", name: "Teleport", price: 600, desc: "Instantly warp your tank anywhere on the hill." },
  { id: "repair", name: "Repair Kit (+35 HP)", price: 350, desc: "Restores 35 health immediately." },
  { id: "fuel", name: "Extra Fuel (+150)", price: 200, desc: "Adds +150 movement fuel immediately." }
];

const PLAYER_COLOR_PALETTE = [
  { id: "red", swatchBg: "#ffb3b3", color: "#ef4444", scoreColor: "#ff0000", tankFill: "#dc2626", tankStroke: "#7f1d1d" },
  { id: "green", swatchBg: "#b3ffb3", color: "#10b981", scoreColor: "#00cc00", tankFill: "#00cc55", tankStroke: "#065f46" },
  { id: "blue", swatchBg: "#b3c6ff", color: "#3b82f6", scoreColor: "#0033ff", tankFill: "#2563eb", tankStroke: "#1e3a8a" },
  { id: "black", swatchBg: "#8c8c8c", color: "#111111", scoreColor: "#000000", tankFill: "#141414", tankStroke: "#4b5563" },
  { id: "yellow", swatchBg: "#ffff99", color: "#eab308", scoreColor: "#ffcc00", tankFill: "#d9b600", tankStroke: "#713f12" },
  { id: "orange", swatchBg: "#ffd9b3", color: "#f97316", scoreColor: "#ff6600", tankFill: "#ea580c", tankStroke: "#7c2d12" }
];

const AI_DIFFICULTY_SETTINGS = {
  very_easy: { spread: 3.2, angleJitter: 18 },
  easy: { spread: 2.1, angleJitter: 12 },
  normal: { spread: 1.2, angleJitter: 7 },
  hard: { spread: 0.55, angleJitter: 3 },
  very_hard: { spread: 0.15, angleJitter: 1 }
};

const PLAYER_DEFS = [
  { id: 0, name: "Player 1", colorIdx: 3, isAI: false, aiDifficulty: "normal" },
  { id: 1, name: "Player 2", colorIdx: 0, isAI: true, aiDifficulty: "normal" },
  { id: 2, name: "Player 3", colorIdx: 1, isAI: true, aiDifficulty: "normal" },
  { id: 3, name: "Player 4", colorIdx: 2, isAI: true, aiDifficulty: "normal" },
  { id: 4, name: "Player 5", colorIdx: 4, isAI: true, aiDifficulty: "normal" }
];