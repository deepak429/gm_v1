export type ArrowType =
  | 'normal'
  | 'fire'
  | 'ice'
  | 'poison'
  | 'arcane'
  | 'thunder'
  | 'shadow'
  | 'holy'
  | 'wind'
  | 'void';

export type BodyPartHit = 'head' | 'torso' | 'legs' | 'shield';

export type EnemyArchetype =
  | 'skeleton_scout'
  | 'fortress_guard'
  | 'frost_ranger'
  | 'shadow_assassin'
  | 'fortress_champion'
  | 'frost_overlord'
  | 'infernal_warlord'
  | 'desert_marauder'
  | 'forest_wraith'
  | 'storm_warden'
  | 'void_harbinger'
  | 'plague_revenant'      // undead alchemist, poison/rot themed
  | 'crimson_berserker'    // heavily scarred melee warrior, no shield, pure aggression
  | 'jade_sentinel'        // jade-armored eastern guardian with ornate helmet
  | 'blood_shaman'         // tribal shaman with bone fetishes, cursed arrows
  | 'iron_golem'           // mechanical/stone construct, slow but massive HP
  | 'phantom_duelist';     // ghostly transparent fencer, high dodge, teleports

export type EnvironmentTheme = 'fortress' | 'frost' | 'caldera' | 'desert' | 'forest';

export interface ShieldSkin {
  id: string;
  name: string;
  desc: string;
  cost: number;
  theme: string;
  icon: string;
  // Gameplay bonuses
  blockCharges: number;   // extra blocks per activation
  cooldownMult: number;   // cooldown multiplier (0.7 = 30% faster)
  reflectDmg: number;     // flat dmg reflected on successful block
}

export interface ArrowPack {
  id: string;
  type: ArrowType;
  name: string;
  icon: string;
  amount: number;
  cost: number;   // coins per pack
  theme: string;  // hint color
}

export interface HeroCharacter {
  id: string;
  name: string;
  title: string;
  desc: string;
  cost: number;
  icon: string;
  cowlColor: number;
  armorColor: number;
  trimColor: number;
  hairColor: number;
  eyeColor: number;
  capeColor: number;
  perks: {
    hpBonus?: number;
    staminaBonus?: number;
    speedBonus?: number;
    critBonus?: number;
    fireBonus?: number;
    freezeBonus?: number;
    holyBonus?: number;
  };
}

export interface BowSkin {
  id: string;
  name: string;
  desc: string;
  cost: number;
  color: number;
  trimColor: number;
  bonusSpeed: number;
  bonusDmg: number;
}

export interface StageConfig {
  id: number;
  chapter: number;
  stageNumber: number;
  name: string;
  theme: EnvironmentTheme;
  enemyType: EnemyArchetype;
  enemyName: string;
  enemyHp: number;
  enemyDmg: number;
  enemyAccuracy: number; // 0 (wild) to 1 (sniping)
  enemyReactionSpeed: number; // ms to react / block
  canBlock: boolean;
  canDodge: boolean;
  isBoss: boolean;
  windVariance: number;
  arrowCounts: Record<ArrowType, number>;
  targetScore: number;
}

export interface PlayerUpgrades {
  bowPower: number; // 0 to 5: increases speed & base dmg
  quiverCapacity: number; // 0 to 5: bonus arrows
  maxHealth: number; // 0 to 5: +20 HP per rank
  shieldEfficiency: number; // 0 to 3: faster cooldown + extra block
  elementalMastery: number; // 0 to 4: +25% elemental effects
}

export interface MasteryEntry {
  xp: number;
  level: number;
  kills: number;
}

export interface DailyChallengeState {
  dateKey: string;        // YYYY-MM-DD
  seed: string;           // seed string shared with friends
  bestScore: number;
  attemptsToday: number;
  completed: boolean;
  rewardClaimed: boolean;
}

export interface WeeklyChallengeState {
  weekKey: string;        // YYYY-W##
  seed: string;
  bestWave: number;
  stars: number;
  rewardClaimed: boolean;
}

export interface RunPerks {
  // Perks picked during the current run. Reset when run ends.
  pierce: number;        // +arrows pass through N targets
  chain: number;         // chain-lightning hops
  crit: number;          // +crit chance in [0,1]
  bleed: number;         // DoT stacks on hit
  slowdraw: number;      // slow-mo while drawing (seconds)
  lifesteal: number;     // hp restored per crit
  multishot: number;     // extra parallel arrows per shot
  ricochet: number;      // bounces off terrain
}

export interface RunMutator {
  id: string;
  name: string;
  desc: string;
  icon: string;
  // Effect flags consumed by scene / save (bonus loot, extra wind, etc.)
  bonusCoins?: number;
  bonusXp?: number;
  windMultiplier?: number;
  gravityMultiplier?: number;
  darkness?: boolean;    // reduced visibility
  movingTarget?: boolean;
  bossMode?: boolean;    // double enemy hp but 3× loot
  oneShot?: boolean;     // player dies in one hit, 5× loot
  slowtime?: boolean;    // 25% slower aim time
  risky: boolean;        // visually marked red if downside > upside
}

export interface CodexEntry {
  archetype: EnemyArchetype;
  kills: number;
  critKills: number;
  seenAt: number;         // timestamp first encountered
}

export interface AchievementEntry {
  id: string;
  unlockedAt: number;     // 0 = locked
  progress: number;       // for tiered counts
}

export type GameMode = 'campaign' | 'endless' | 'daily' | 'weekly';

export interface SaveData {
  version: number;
  coins: number;
  starshards: number;      // prestige currency
  score: number;
  highScore: number;
  unlockedStage: number;
  stageStars: Record<number, number>; // stageId -> stars (1-3)
  equippedBow: string;
  unlockedBows: string[];
  equippedShield: string;
  unlockedShields: string[];
  equippedHero: string;
  unlockedHeroes: string[];
  bonusArrows: Record<ArrowType, number>; // persistent bought arrows carried into next stage
  upgrades: PlayerUpgrades;
  settings: {
    sfxVolume: number;
    musicVolume: number;
    muted: boolean;
    aimAssist: boolean;
  };

  // ── Meta progression ───────────────────────────────────────────────────
  mastery: Record<string, MasteryEntry>;        // heroId -> mastery
  codex: Record<string, CodexEntry>;            // archetype -> stats
  achievements: Record<string, AchievementEntry>; // id -> state
  prestigeCount: number;                        // # of ascensions
  globalBonus: {                                // permanent % bonuses from prestige
    damage: number;
    coins: number;
    xp: number;
    crit: number;
  };

  // Daily / Weekly challenges
  daily: DailyChallengeState;
  weekly: WeeklyChallengeState;

  // Endless mode
  bestEndlessWave: number;
  bestEndlessScore: number;

  // Insurance / inventory items that persist outside a run
  insuranceArrows: number;      // free-miss tokens

  // Current run state (perks picked, active mutator, kill streak)
  runPerks: RunPerks;
  activeMutator: string | null;
  killStreak: number;
  bestKillStreak: number;

  // Rival (named recurring enemy)
  rival: {
    name: string;
    level: number;      // climbs each defeat
    defeats: number;    // how many times player has killed the rival
    lastSeenStage: number;
  };
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  isCrit: boolean;
}

export interface LevelIntroState {
  stageNumber: number;
  stageName: string;
  isBoss: boolean;
  bossTitle?: string;
  show: boolean;
}

export interface HudCombatState {
  playerHp: number;
  playerMaxHp: number;
  stamina: number;
  maxStamina: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyName: string;
  enemyArchetype: EnemyArchetype;
  isBoss: boolean;
  arrowCounts: Record<ArrowType, number>;
  selectedArrow: ArrowType;
  message: string;
  wind: number;
  combo: number;
  score: number;
  coins: number;
  shieldActive: boolean;
  shieldCooldown: number; // 0 to 1 ratio
  dashCooldown: number;
  slowCooldown: number;
  slowActive: boolean;
  enemyAimingProgress: number; // 0 to 1 when enemy is drawing bow
  enemyStatus: {
    frozen: boolean;
    freezeTimeRemaining: number;
    poisonStacks: number;
    burning: boolean;
  };
  levelIntro: LevelIntroState;
  gameOver: boolean;
  victory: boolean;
  starsEarned: number;
  headshots: number;
  accuracy: number;
}
