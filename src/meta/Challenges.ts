import { seededRng } from './Rng';
import { EnemyArchetype } from '../types';

export interface ChallengeConfig {
  seed: string;
  // Rules for the day's board
  enemyType: EnemyArchetype;
  enemyName: string;
  enemyHp: number;
  wind: number;
  darkness: boolean;
  shieldLocked: boolean;
  arrowBudget: number;
  rules: string[];        // rendered as bullet points
  bannerTitle: string;
  targetScore: number;
}

const ENEMY_POOL: Array<[EnemyArchetype, string, number]> = [
  ['skeleton_scout', 'Boneyard Captain', 180],
  ['fortress_guard', 'Rampart Veteran', 240],
  ['frost_ranger', 'Hoarfrost Marksman', 300],
  ['shadow_assassin', 'Nightfang', 340],
  ['desert_marauder', 'Dune Reaver', 300],
  ['forest_wraith', 'Hollow-eyed Wraith', 360],
  ['plague_revenant', 'Pox Carrier', 400],
  ['crimson_berserker', 'Scarbreaker', 420],
  ['jade_sentinel', 'Lotus Guardian', 440],
  ['blood_shaman', 'Rite Caller', 480],
  ['phantom_duelist', 'Ash Duelist', 540],
];

export function buildDailyChallenge(seed: string): ChallengeConfig {
  const rng = seededRng(seed);
  const pick = ENEMY_POOL[Math.floor(rng() * ENEMY_POOL.length)];
  const wind = Number((rng() * 1.4 - 0.7).toFixed(2));
  const darkness = rng() < 0.2;
  const shieldLocked = rng() < 0.35;
  const arrowBudget = 8 + Math.floor(rng() * 8); // 8..15
  const rules: string[] = [
    `Enemy: ${pick[1]} (${pick[2]} HP)`,
    `Wind: ${wind >= 0 ? 'EAST ↗' : 'WEST ↙'} ${Math.abs(wind).toFixed(2)}`,
    `Arrows: ${arrowBudget} total — spend wisely`,
  ];
  if (darkness) rules.push('Darkness: visibility reduced');
  if (shieldLocked) rules.push('Shield locked: no block ability');

  return {
    seed,
    enemyType: pick[0],
    enemyName: pick[1],
    enemyHp: pick[2],
    wind,
    darkness,
    shieldLocked,
    arrowBudget,
    rules,
    bannerTitle: 'Daily Trial',
    targetScore: 1200 + Math.floor(rng() * 1800),
  };
}

export function buildWeeklyChallenge(seed: string): ChallengeConfig {
  const rng = seededRng(seed);
  const pick = ENEMY_POOL[Math.min(ENEMY_POOL.length - 1, Math.floor(rng() * ENEMY_POOL.length) + 3)];
  const wind = Number((rng() * 2 - 1).toFixed(2));
  const rules: string[] = [
    'Endless waves — reach as far as you can',
    `Lead enemy: ${pick[1]}`,
    `Wind: ${wind >= 0 ? 'EAST ↗' : 'WEST ↙'} ${Math.abs(wind).toFixed(2)}`,
    'Modifier mutators between waves',
    '3-star threshold at wave 15',
  ];
  return {
    seed,
    enemyType: pick[0],
    enemyName: pick[1],
    enemyHp: pick[2] + 150,
    wind,
    darkness: false,
    shieldLocked: false,
    arrowBudget: 999,
    rules,
    bannerTitle: 'Weekly Gauntlet',
    targetScore: 10000,
  };
}

export function formatSeedShare(seed: string): string {
  return `SA-${seed}`;
}
