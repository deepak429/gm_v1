import {
  SaveData,
  PlayerUpgrades,
  BowSkin,
  ShieldSkin,
  ArrowPack,
  ArrowType,
  HeroCharacter,
  RunPerks,
  DailyChallengeState,
  WeeklyChallengeState,
} from '../types';

const STORAGE_KEY = 'shadow_archer_save_v6';

// ── BOW SKINS ──────────────────────────────────────────────────────────────
export const BOW_SKINS: BowSkin[] = [
  {
    id: 'hunter_recurve',
    name: 'Hunter Recurve',
    desc: 'Reliable ash-wood bow with leather grip. Standard balanced projectile trajectory.',
    cost: 0,
    color: 0x96633b,
    trimColor: 0xe0d4b8,
    bonusSpeed: 0,
    bonusDmg: 0,
  },
  {
    id: 'windrunner',
    name: 'Elven Windrunner',
    desc: 'Carved from living elderwood. Arrows slice through air with +16% velocity.',
    cost: 250,
    color: 0x2e7d4d,
    trimColor: 0x7cf29c,
    bonusSpeed: 0.16,
    bonusDmg: 4,
  },
  {
    id: 'shadow_reap',
    name: 'Shadow Assassin Bow',
    desc: 'Forged in obsidian twilight. Delivers devastating critical headshots.',
    cost: 600,
    color: 0x2c1f3d,
    trimColor: 0xa875ff,
    bonusSpeed: 0.1,
    bonusDmg: 8,
  },
  {
    id: 'dragonbone',
    name: 'Dragonbone Warbow',
    desc: 'Crafted from ancient wyrm bone. Massive draw weight delivers +30% raw impact damage.',
    cost: 1100,
    color: 0x8a4524,
    trimColor: 0xffaa47,
    bonusSpeed: 0.08,
    bonusDmg: 14,
  },
  {
    id: 'celestial',
    name: 'Celestial Starbow',
    desc: 'Infused with fallen star crystal. Cosmic velocity +20% and +18 arcane impact.',
    cost: 1800,
    color: 0x1f568a,
    trimColor: 0x62e6ff,
    bonusSpeed: 0.22,
    bonusDmg: 18,
  },
  {
    id: 'void_splitter',
    name: 'Void Splitter Longbow',
    desc: 'Torn from the edge of the Void Rift. Void arrows deal +50% extra damage.',
    cost: 3000,
    color: 0x1a001a,
    trimColor: 0xff00ff,
    bonusSpeed: 0.18,
    bonusDmg: 22,
  },
];

// ── SHIELD SKINS ───────────────────────────────────────────────────────────
export const SHIELD_SKINS: ShieldSkin[] = [
  {
    id: 'wooden_buckler',
    name: 'Wooden Buckler',
    desc: 'A basic round wooden shield. 1 block charge. No frills.',
    cost: 0,
    theme: 'fortress',
    icon: '🛡️',
    blockCharges: 1,
    cooldownMult: 1.0,
    reflectDmg: 0,
  },
  {
    id: 'iron_kite',
    name: 'Iron Kite Shield',
    desc: 'Fortress-forged iron kite. 2 block charges. Absorbs heavy hits.',
    cost: 200,
    theme: 'fortress',
    icon: '⬡',
    blockCharges: 2,
    cooldownMult: 0.85,
    reflectDmg: 0,
  },
  {
    id: 'frost_barrier',
    name: 'Glacial Frost Barrier',
    desc: 'Frostfang ice-crystal shield. Freezes any arrow that hits it for 1.5s.',
    cost: 500,
    theme: 'frost',
    icon: '❄',
    blockCharges: 2,
    cooldownMult: 0.8,
    reflectDmg: 0,
  },
  {
    id: 'caldera_bulwark',
    name: 'Caldera Bulwark',
    desc: 'Volcanic obsidian plate. 3 block charges. Reflects 12 fire damage on block.',
    cost: 900,
    theme: 'caldera',
    icon: '🔥',
    blockCharges: 3,
    cooldownMult: 0.75,
    reflectDmg: 12,
  },
  {
    id: 'desert_scarab',
    name: 'Scarab Shell Aegis',
    desc: 'Enchanted desert scarab carapace. Reflects 20 dmg on block. Fast cooldown.',
    cost: 1400,
    theme: 'desert',
    icon: '🐞',
    blockCharges: 2,
    cooldownMult: 0.65,
    reflectDmg: 20,
  },
  {
    id: 'void_ward',
    name: 'Void Ward',
    desc: 'Forged in the Void Rift. 4 block charges, 35 reflect dmg. Blocks void arrows.',
    cost: 2500,
    theme: 'forest',
    icon: '✦',
    blockCharges: 4,
    cooldownMult: 0.55,
    reflectDmg: 35,
  },
];

// ── ARROW PACKS ────────────────────────────────────────────────────────────
export const ARROW_PACKS: ArrowPack[] = [
  { id: 'pack_normal',  type: 'normal',  name: 'Steel Bundle',      icon: '➶', amount: 10, cost: 30,  theme: '#aaa' },
  { id: 'pack_fire',    type: 'fire',    name: 'Flame Quiver',      icon: '🔥', amount: 5,  cost: 60,  theme: '#ff6622' },
  { id: 'pack_ice',     type: 'ice',     name: 'Frost Quiver',      icon: '❄',  amount: 5,  cost: 60,  theme: '#69ddff' },
  { id: 'pack_poison',  type: 'poison',  name: 'Venom Quiver',      icon: '☣',  amount: 5,  cost: 60,  theme: '#76ea48' },
  { id: 'pack_arcane',  type: 'arcane',  name: 'Arcane Cache',      icon: '✧',  amount: 4,  cost: 90,  theme: '#c986ff' },
  { id: 'pack_thunder', type: 'thunder', name: 'Storm Quiver',      icon: '⚡',  amount: 4,  cost: 100, theme: '#ffe533' },
  { id: 'pack_shadow',  type: 'shadow',  name: 'Shadow Quiver',     icon: '🌑',  amount: 4,  cost: 100, theme: '#9c61ff' },
  { id: 'pack_holy',    type: 'holy',    name: 'Holy Quiver',       icon: '✨',  amount: 4,  cost: 100, theme: '#fff5a0' },
  { id: 'pack_wind',    type: 'wind',    name: 'Gale Quiver',       icon: '💨',  amount: 4,  cost: 100, theme: '#7fffd4' },
  { id: 'pack_void',    type: 'void',    name: 'Void Cache',        icon: '✦',  amount: 3,  cost: 180, theme: '#ff4dff' },
];

// ── PLAYABLE HERO CHARACTERS ───────────────────────────────────────────────
export const PLAYABLE_HEROES: HeroCharacter[] = [
  {
    id: 'kaelen',
    name: 'Kaelen Shadow-Scout',
    title: 'The Exiled Ranger',
    desc: 'The legendary marksman of the Lost Citadel. Balanced and steadfast under pressure.',
    cost: 0,
    icon: '🏹',
    cowlColor: 0x18344e,
    armorColor: 0x223d54,
    trimColor: 0xd4a34b,
    hairColor: 0x2c2621,
    eyeColor: 0x5cd5ff,
    capeColor: 0x142738,
    perks: {},
  },
  {
    id: 'lyra',
    name: 'Lyra Windstrider',
    title: 'Gale Huntress',
    desc: 'Swift elven hunter of the Whispering Woods. Draws bows with lightning speed.',
    cost: 400,
    icon: '🍃',
    cowlColor: 0x164228,
    armorColor: 0x28633e,
    trimColor: 0x72e89d,
    hairColor: 0xe8c76b,
    eyeColor: 0x48ff98,
    capeColor: 0x0f2e1c,
    perks: { speedBonus: 0.15, staminaBonus: 20 },
  },
  {
    id: 'thorin',
    name: 'Thorin Ironclast',
    title: 'Citadel Vanguard',
    desc: 'Heavily armored dwarven defender. Endures massive damage and fortifies his shield.',
    cost: 850,
    icon: '🛡️',
    cowlColor: 0x2e363d,
    armorColor: 0x425363,
    trimColor: 0xd9a84e,
    hairColor: 0x8a3c1c,
    eyeColor: 0xffb84d,
    capeColor: 0x20272e,
    perks: { hpBonus: 40 },
  },
  {
    id: 'ignis',
    name: 'Ignis Pyrewalker',
    title: 'Flame Archer',
    desc: 'Born from volcanic ash in the Molten Caldera. Fire arrows burn +30% hotter.',
    cost: 1400,
    icon: '🔥',
    cowlColor: 0x3d1414,
    armorColor: 0x6e221a,
    trimColor: 0xff6622,
    hairColor: 0xd9381e,
    eyeColor: 0xff9900,
    capeColor: 0x290a0a,
    perks: { fireBonus: 0.3, hpBonus: 15 },
  },
  {
    id: 'elysia',
    name: 'Elysia Frostveil',
    title: 'Winter Sovereign',
    desc: 'Mistress of the Frostfang glaciers. Arrows freeze enemies longer with deadly headshots.',
    cost: 2000,
    icon: '❄️',
    cowlColor: 0x143447,
    armorColor: 0x225575,
    trimColor: 0x73d7ff,
    hairColor: 0xe6f7ff,
    eyeColor: 0x00e5ff,
    capeColor: 0x0d222e,
    perks: { freezeBonus: 0.35, critBonus: 0.15 },
  },
  {
    id: 'malakor',
    name: 'Malakor Voidstalker',
    title: 'Shadow Assassin',
    desc: 'An outcast who stepped into the Void Rift. Deals devastating critical headshot damage.',
    cost: 2800,
    icon: '🌑',
    cowlColor: 0x190826,
    armorColor: 0x33144d,
    trimColor: 0xc85aff,
    hairColor: 0x2d004d,
    eyeColor: 0xff00ff,
    capeColor: 0x11031c,
    perks: { critBonus: 0.25, speedBonus: 0.1 },
  },
  {
    id: 'aurelius',
    name: 'Aurelius Sun-Champion',
    title: 'Solar Paladin',
    desc: 'Radiant knight of the Dawn Temple. Holy arrows heal +50% and strikes hit with supreme force.',
    cost: 3800,
    icon: '✨',
    cowlColor: 0x3d3010,
    armorColor: 0x785a1a,
    trimColor: 0xffde59,
    hairColor: 0xffea85,
    eyeColor: 0xffffff,
    capeColor: 0x291f08,
    perks: { holyBonus: 0.5, hpBonus: 30, critBonus: 0.1 },
  },
];

// ── UPGRADE DEFINITIONS ────────────────────────────────────────────────────
const DEFAULT_UPGRADES: PlayerUpgrades = {
  bowPower: 0,
  quiverCapacity: 0,
  maxHealth: 0,
  shieldEfficiency: 0,
  elementalMastery: 0,
};

const DEFAULT_BONUS_ARROWS: Record<ArrowType, number> = {
  normal: 0, fire: 0, ice: 0, poison: 0, arcane: 0,
  thunder: 0, shadow: 0, holy: 0, wind: 0, void: 0,
};

export const EMPTY_RUN_PERKS: RunPerks = {
  pierce: 0,
  chain: 0,
  crit: 0,
  bleed: 0,
  slowdraw: 0,
  lifesteal: 0,
  multishot: 0,
  ricochet: 0,
};

function todayKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function weekKey(d = new Date()): string {
  // ISO week number
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86400000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function hashSeed(input: string): string {
  // Short deterministic seed from any string. Shareable, 6 chars.
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h.toString(36).toUpperCase().padStart(6, '0').slice(-6);
}

export function makeDailyState(d = new Date()): DailyChallengeState {
  const key = todayKey(d);
  return {
    dateKey: key,
    seed: hashSeed('daily-' + key),
    bestScore: 0,
    attemptsToday: 0,
    completed: false,
    rewardClaimed: false,
  };
}

export function makeWeeklyState(d = new Date()): WeeklyChallengeState {
  const key = weekKey(d);
  return {
    weekKey: key,
    seed: hashSeed('weekly-' + key),
    bestWave: 0,
    stars: 0,
    rewardClaimed: false,
  };
}

const DEFAULT_SAVE: SaveData = {
  version: 6,
  coins: 800,
  starshards: 0,
  score: 0,
  highScore: 0,
  unlockedStage: 1,
  stageStars: { 1: 0 },
  equippedBow: 'hunter_recurve',
  unlockedBows: ['hunter_recurve'],
  equippedShield: 'wooden_buckler',
  unlockedShields: ['wooden_buckler'],
  equippedHero: 'kaelen',
  unlockedHeroes: ['kaelen'],
  bonusArrows: { ...DEFAULT_BONUS_ARROWS },
  upgrades: { ...DEFAULT_UPGRADES },
  settings: {
    sfxVolume: 0.8,
    musicVolume: 0.45,
    muted: false,
    aimAssist: true,
  },
  mastery: {},
  codex: {},
  achievements: {},
  prestigeCount: 0,
  globalBonus: { damage: 0, coins: 0, xp: 0, crit: 0 },
  daily: makeDailyState(),
  weekly: makeWeeklyState(),
  bestEndlessWave: 0,
  bestEndlessScore: 0,
  insuranceArrows: 0,
  runPerks: { ...EMPTY_RUN_PERKS },
  activeMutator: null,
  killStreak: 0,
  bestKillStreak: 0,
  rival: {
    name: 'Varrik the Grim',
    level: 1,
    defeats: 0,
    lastSeenStage: 0,
  },
};

export const UPGRADE_COSTS: Record<keyof PlayerUpgrades, number[]> = {
  bowPower:        [100, 250, 500, 900, 1500],
  quiverCapacity:  [80,  180, 350, 600, 1000],
  maxHealth:       [100, 220, 450, 800, 1300],
  shieldEfficiency:[150, 400, 900],
  elementalMastery:[120, 300, 650, 1200],
};

export const UPGRADE_DESCRIPTIONS: Record<keyof PlayerUpgrades, { name: string; desc: string }> = {
  bowPower:        { name: 'Longbow Mastery',   desc: '+12% arrow velocity and +15% base impact damage per tier.' },
  quiverCapacity:  { name: 'Expanded Quiver',   desc: '+2 extra arrows of every type per tier.' },
  maxHealth:       { name: 'Fortified Armor',   desc: '+25 maximum player health per tier.' },
  shieldEfficiency:{ name: 'Runic Barrier',     desc: '-20% shield cooldown and grants an additional blocked hit.' },
  elementalMastery:{ name: 'Arcane Alchemy',    desc: '+30% burn, freeze, poison, and all elemental effects per tier.' },
};

// ── SAVE MANAGER ───────────────────────────────────────────────────────────
class SaveManager {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  public getData(): SaveData {
    return this.data;
  }

  public load(): SaveData {
    try {
      // Try new key first, then older v5 key for migration.
      const raw =
        localStorage.getItem(STORAGE_KEY) || localStorage.getItem('shadow_archer_save_v5');
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged: SaveData = {
          ...DEFAULT_SAVE,
          ...parsed,
          coins:            typeof parsed.coins === 'number' ? Math.max(parsed.coins, 600) : 800,
          starshards:       typeof parsed.starshards === 'number' ? parsed.starshards : 0,
          equippedBow:      parsed.equippedBow      || 'hunter_recurve',
          unlockedBows:     parsed.unlockedBows     || ['hunter_recurve'],
          equippedShield:   parsed.equippedShield   || 'wooden_buckler',
          unlockedShields:  parsed.unlockedShields  || ['wooden_buckler'],
          equippedHero:     parsed.equippedHero     || 'kaelen',
          unlockedHeroes:   parsed.unlockedHeroes   || ['kaelen'],
          bonusArrows: {
            ...DEFAULT_BONUS_ARROWS,
            ...(parsed.bonusArrows || {}),
          },
          upgrades: {
            ...DEFAULT_UPGRADES,
            ...(parsed.upgrades || {}),
          },
          settings: {
            ...DEFAULT_SAVE.settings,
            ...(parsed.settings || {}),
          },
          stageStars: {
            ...DEFAULT_SAVE.stageStars,
            ...(parsed.stageStars || {}),
          },
          mastery:          parsed.mastery          || {},
          codex:            parsed.codex            || {},
          achievements:     parsed.achievements     || {},
          prestigeCount:    typeof parsed.prestigeCount === 'number' ? parsed.prestigeCount : 0,
          globalBonus: {
            ...DEFAULT_SAVE.globalBonus,
            ...(parsed.globalBonus || {}),
          },
          daily:            parsed.daily && parsed.daily.dateKey ? parsed.daily : makeDailyState(),
          weekly:           parsed.weekly && parsed.weekly.weekKey ? parsed.weekly : makeWeeklyState(),
          bestEndlessWave:  typeof parsed.bestEndlessWave === 'number' ? parsed.bestEndlessWave : 0,
          bestEndlessScore: typeof parsed.bestEndlessScore === 'number' ? parsed.bestEndlessScore : 0,
          insuranceArrows:  typeof parsed.insuranceArrows === 'number' ? parsed.insuranceArrows : 0,
          runPerks:         { ...EMPTY_RUN_PERKS, ...(parsed.runPerks || {}) },
          activeMutator:    parsed.activeMutator || null,
          killStreak:       typeof parsed.killStreak === 'number' ? parsed.killStreak : 0,
          bestKillStreak:   typeof parsed.bestKillStreak === 'number' ? parsed.bestKillStreak : 0,
          rival:            { ...DEFAULT_SAVE.rival, ...(parsed.rival || {}) },
        };

        // Daily/weekly rollover: regenerate if the stored period has expired.
        const dKey = todayKey();
        const wKey = weekKey();
        if (merged.daily.dateKey !== dKey) merged.daily = makeDailyState();
        if (merged.weekly.weekKey !== wKey) merged.weekly = makeWeeklyState();

        return merged;
      }
    } catch (e) {
      console.warn('Failed to load save data, using defaults', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SAVE));
  }

  public save(data?: Partial<SaveData>) {
    if (data) {
      this.data = { ...this.data, ...data };
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  public addCoins(amount: number) {
    this.data.coins += amount;
    this.save();
  }

  public recordScore(score: number) {
    this.data.score = score;
    if (score > this.data.highScore) {
      this.data.highScore = score;
    }
    this.save();
  }

  public completeStage(stageId: number, stars: number, bonusCoins: number) {
    this.data.coins += bonusCoins;
    const currentStars = this.data.stageStars[stageId] || 0;
    if (stars > currentStars) {
      this.data.stageStars[stageId] = stars;
    }
    if (stageId >= this.data.unlockedStage) {
      this.data.unlockedStage = stageId + 1;
    }
    this.save();
  }

  public buyUpgrade(key: keyof PlayerUpgrades): boolean {
    const currentLevel = this.data.upgrades[key];
    const costArray = UPGRADE_COSTS[key];
    if (currentLevel >= costArray.length) return false;
    const cost = costArray[currentLevel];
    if (this.data.coins >= cost) {
      this.data.coins -= cost;
      this.data.upgrades[key] += 1;
      this.save();
      return true;
    }
    return false;
  }

  // ── BOW ──────────────────────────────────────────────────────────────────
  public buyBow(bowId: string): boolean {
    const skin = BOW_SKINS.find((b) => b.id === bowId);
    if (!skin || this.data.unlockedBows.includes(bowId)) return false;
    if (this.data.coins >= skin.cost) {
      this.data.coins -= skin.cost;
      this.data.unlockedBows.push(bowId);
      this.data.equippedBow = bowId;
      this.save();
      return true;
    }
    return false;
  }

  public equipBow(bowId: string): boolean {
    if (this.data.unlockedBows.includes(bowId)) {
      this.data.equippedBow = bowId;
      this.save();
      return true;
    }
    return false;
  }

  public getEquippedBow(): BowSkin {
    return BOW_SKINS.find((b) => b.id === this.data.equippedBow) || BOW_SKINS[0];
  }

  // ── SHIELD ────────────────────────────────────────────────────────────────
  public buyShield(shieldId: string): boolean {
    const skin = SHIELD_SKINS.find((s) => s.id === shieldId);
    if (!skin || this.data.unlockedShields.includes(shieldId)) return false;
    if (this.data.coins >= skin.cost) {
      this.data.coins -= skin.cost;
      this.data.unlockedShields.push(shieldId);
      this.data.equippedShield = shieldId;
      this.save();
      return true;
    }
    return false;
  }

  public equipShield(shieldId: string): boolean {
    if (this.data.unlockedShields.includes(shieldId)) {
      this.data.equippedShield = shieldId;
      this.save();
      return true;
    }
    return false;
  }

  public getEquippedShield(): ShieldSkin {
    return SHIELD_SKINS.find((s) => s.id === this.data.equippedShield) || SHIELD_SKINS[0];
  }

  // ── HERO CHARACTERS ──────────────────────────────────────────────────────
  public buyHero(heroId: string): boolean {
    const hero = PLAYABLE_HEROES.find((h) => h.id === heroId);
    if (!hero || this.data.unlockedHeroes.includes(heroId)) return false;
    if (this.data.coins >= hero.cost) {
      this.data.coins -= hero.cost;
      this.data.unlockedHeroes.push(heroId);
      this.data.equippedHero = heroId;
      this.save();
      return true;
    }
    return false;
  }

  public equipHero(heroId: string): boolean {
    if (this.data.unlockedHeroes.includes(heroId)) {
      this.data.equippedHero = heroId;
      this.save();
      return true;
    }
    return false;
  }

  public getEquippedHero(): HeroCharacter {
    return PLAYABLE_HEROES.find((h) => h.id === this.data.equippedHero) || PLAYABLE_HEROES[0];
  }

  // ── ARROW PACKS ───────────────────────────────────────────────────────────
  public buyArrowPack(packId: string): boolean {
    const pack = ARROW_PACKS.find((p) => p.id === packId);
    if (!pack) return false;
    if (this.data.coins >= pack.cost) {
      this.data.coins -= pack.cost;
      this.data.bonusArrows[pack.type] = (this.data.bonusArrows[pack.type] || 0) + pack.amount;
      this.save();
      return true;
    }
    return false;
  }

  /** Consume bonus arrows at stage start and return the remaining unused */
  public consumeBonusArrows(): Record<ArrowType, number> {
    const snapshot = { ...this.data.bonusArrows };
    this.data.bonusArrows = { ...DEFAULT_BONUS_ARROWS };
    this.save();
    return snapshot;
  }

  public resetAll() {
    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    this.save();
  }

  /**
   * Soft reset: wipes CAMPAIGN & meta progress (stage stars, coins, score,
   * mastery, codex, achievements, challenges, endless, run perks, mutator)
   * but KEEPS every hero / bow / shield the player has already purchased,
   * their equipped loadout, and permanent prestige bonuses.
   * This is what "RESET LEVEL" / "RESET PROGRESS" should feel like — you
   * shouldn't lose a hero you paid for.
   */
  public resetProgressKeepUnlocks() {
    const keepHeroes = this.data.unlockedHeroes;
    const keepBows = this.data.unlockedBows;
    const keepShields = this.data.unlockedShields;
    const keepEquippedHero = this.data.equippedHero;
    const keepEquippedBow = this.data.equippedBow;
    const keepEquippedShield = this.data.equippedShield;
    const keepSettings = this.data.settings;
    const keepPrestige = this.data.prestigeCount;
    const keepGlobalBonus = this.data.globalBonus;
    const keepStarshards = this.data.starshards;

    this.data = JSON.parse(JSON.stringify(DEFAULT_SAVE));
    this.data.unlockedHeroes = keepHeroes;
    this.data.unlockedBows = keepBows;
    this.data.unlockedShields = keepShields;
    this.data.equippedHero = keepEquippedHero;
    this.data.equippedBow = keepEquippedBow;
    this.data.equippedShield = keepEquippedShield;
    this.data.settings = keepSettings;
    this.data.prestigeCount = keepPrestige;
    this.data.globalBonus = keepGlobalBonus;
    this.data.starshards = keepStarshards;
    this.save();
  }

  // ── MASTERY ──────────────────────────────────────────────────────────────
  public getMastery(heroId: string) {
    const existing = this.data.mastery[heroId];
    if (!existing) {
      const fresh = { xp: 0, level: 1, kills: 0 };
      this.data.mastery[heroId] = fresh;
      return fresh;
    }
    return existing;
  }

  public addHeroXp(heroId: string, xp: number) {
    const m = this.getMastery(heroId);
    const multiplier = 1 + this.data.globalBonus.xp;
    m.xp += Math.round(xp * multiplier);
    // Soft-cap: each level needs (lvl^1.4) * 50 xp, diminishing returns.
    while (m.xp >= Math.round(Math.pow(m.level, 1.4) * 50)) {
      m.xp -= Math.round(Math.pow(m.level, 1.4) * 50);
      m.level += 1;
    }
    this.save();
  }

  public addMasteryKill(heroId: string) {
    const m = this.getMastery(heroId);
    m.kills += 1;
    this.save();
  }

  // ── CODEX ────────────────────────────────────────────────────────────────
  public recordKill(archetype: string, isCrit: boolean) {
    const entry = this.data.codex[archetype] || {
      archetype: archetype as any,
      kills: 0,
      critKills: 0,
      seenAt: Date.now(),
    };
    entry.kills += 1;
    if (isCrit) entry.critKills += 1;
    this.data.codex[archetype] = entry;
    this.data.killStreak += 1;
    if (this.data.killStreak > this.data.bestKillStreak) {
      this.data.bestKillStreak = this.data.killStreak;
    }
    this.save();
  }

  public breakKillStreak() {
    this.data.killStreak = 0;
    this.save();
  }

  // ── ACHIEVEMENTS ─────────────────────────────────────────────────────────
  public unlockAchievement(id: string): boolean {
    const existing = this.data.achievements[id];
    if (existing && existing.unlockedAt > 0) return false;
    this.data.achievements[id] = { id, unlockedAt: Date.now(), progress: 1 };
    this.save();
    return true;
  }

  public setAchievementProgress(id: string, progress: number): boolean {
    const existing = this.data.achievements[id] || { id, unlockedAt: 0, progress: 0 };
    existing.progress = Math.max(existing.progress, progress);
    this.data.achievements[id] = existing;
    this.save();
    return false;
  }

  public isAchievementUnlocked(id: string): boolean {
    const e = this.data.achievements[id];
    return !!(e && e.unlockedAt > 0);
  }

  // ── PRESTIGE / STARSHARDS ────────────────────────────────────────────────
  public prestige(): { shardsEarned: number } {
    // Convert campaign progress into starshards. 1 per completed stage + 5 per boss star.
    const stageCount = Object.keys(this.data.stageStars).length;
    const totalStars = Object.values(this.data.stageStars).reduce((a, b) => a + b, 0);
    const shards = stageCount * 2 + totalStars * 3;
    this.data.starshards += shards;
    this.data.prestigeCount += 1;
    this.data.unlockedStage = 1;
    this.data.stageStars = { 1: 0 };
    this.data.coins = Math.max(this.data.coins, 1200);
    this.data.runPerks = { ...EMPTY_RUN_PERKS };
    this.data.activeMutator = null;
    this.save();
    return { shardsEarned: shards };
  }

  public spendStarshards(amount: number, bonusKey: keyof SaveData['globalBonus'], perTier: number) {
    if (this.data.starshards < amount) return false;
    this.data.starshards -= amount;
    this.data.globalBonus[bonusKey] += perTier;
    this.save();
    return true;
  }

  // ── RUN PERKS ────────────────────────────────────────────────────────────
  public applyRunPerk(key: keyof RunPerks, amount: number) {
    this.data.runPerks[key] = (this.data.runPerks[key] || 0) + amount;
    this.save();
  }

  public clearRunPerks() {
    this.data.runPerks = { ...EMPTY_RUN_PERKS };
    this.save();
  }

  public setActiveMutator(id: string | null) {
    this.data.activeMutator = id;
    this.save();
  }

  // ── DAILY / WEEKLY ───────────────────────────────────────────────────────
  public rolloverChallengesIfNeeded() {
    const dKey = todayKey();
    const wKey = weekKey();
    let dirty = false;
    if (this.data.daily.dateKey !== dKey) {
      this.data.daily = makeDailyState();
      dirty = true;
    }
    if (this.data.weekly.weekKey !== wKey) {
      this.data.weekly = makeWeeklyState();
      dirty = true;
    }
    if (dirty) this.save();
  }

  public recordDailyAttempt(score: number) {
    this.rolloverChallengesIfNeeded();
    this.data.daily.attemptsToday += 1;
    if (score > this.data.daily.bestScore) {
      this.data.daily.bestScore = score;
      this.data.daily.completed = score > 0;
    }
    this.save();
  }

  public claimDailyReward(): number {
    this.rolloverChallengesIfNeeded();
    if (this.data.daily.rewardClaimed || !this.data.daily.completed) return 0;
    const reward = 150 + Math.floor(this.data.daily.bestScore / 100);
    this.data.coins += reward;
    this.data.daily.rewardClaimed = true;
    this.save();
    return reward;
  }

  public recordWeeklyWave(wave: number) {
    this.rolloverChallengesIfNeeded();
    if (wave > this.data.weekly.bestWave) {
      this.data.weekly.bestWave = wave;
      this.data.weekly.stars = Math.min(3, Math.floor(wave / 5));
    }
    this.save();
  }

  public claimWeeklyReward(): { coins: number; shards: number } {
    this.rolloverChallengesIfNeeded();
    if (this.data.weekly.rewardClaimed || this.data.weekly.bestWave === 0) {
      return { coins: 0, shards: 0 };
    }
    const coins = 300 + this.data.weekly.bestWave * 15;
    const shards = this.data.weekly.stars * 2;
    this.data.coins += coins;
    this.data.starshards += shards;
    this.data.weekly.rewardClaimed = true;
    this.save();
    return { coins, shards };
  }

  // ── ENDLESS ──────────────────────────────────────────────────────────────
  public recordEndlessRun(wave: number, score: number) {
    if (wave > this.data.bestEndlessWave) this.data.bestEndlessWave = wave;
    if (score > this.data.bestEndlessScore) this.data.bestEndlessScore = score;
    this.save();
  }

  // ── INSURANCE / RIVAL ────────────────────────────────────────────────────
  public addInsuranceArrows(n: number) {
    this.data.insuranceArrows = Math.max(0, this.data.insuranceArrows + n);
    this.save();
  }

  public consumeInsuranceArrow(): boolean {
    if (this.data.insuranceArrows <= 0) return false;
    this.data.insuranceArrows -= 1;
    this.save();
    return true;
  }

  public recordRivalDefeat() {
    this.data.rival.defeats += 1;
    this.data.rival.level = Math.min(99, this.data.rival.level + 1);
    this.save();
  }
}

export const saveManager = new SaveManager();
