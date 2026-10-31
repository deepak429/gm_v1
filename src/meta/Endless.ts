import { EnemyArchetype, StageConfig, ArrowType } from '../types';
import { seededRng } from './Rng';

const WAVE_POOL: EnemyArchetype[] = [
  'skeleton_scout',
  'fortress_guard',
  'frost_ranger',
  'shadow_assassin',
  'desert_marauder',
  'forest_wraith',
  'plague_revenant',
  'crimson_berserker',
  'jade_sentinel',
  'blood_shaman',
  'storm_warden',
  'phantom_duelist',
];

const BOSS_POOL: EnemyArchetype[] = [
  'fortress_champion',
  'frost_overlord',
  'infernal_warlord',
  'void_harbinger',
  'iron_golem',
];

const BASE_ARROWS: Record<ArrowType, number> = {
  normal: 10, fire: 3, ice: 3, poison: 2, arcane: 2,
  thunder: 2, shadow: 2, holy: 2, wind: 2, void: 1,
};

export interface EndlessWaveConfig extends StageConfig {
  wave: number;
  isBossWave: boolean;
}

export function buildEndlessWave(seed: string, wave: number): EndlessWaveConfig {
  const rng = seededRng(seed + ':' + wave);
  const isBossWave = wave > 0 && wave % 5 === 0;
  const pool = isBossWave ? BOSS_POOL : WAVE_POOL;
  const archetype = pool[Math.floor(rng() * pool.length)];

  const scale = 1 + wave * 0.14; // HP grows 14% per wave
  const hp = Math.round((isBossWave ? 500 : 120) * scale);
  const dmg = Math.round((isBossWave ? 42 : 18) * (1 + wave * 0.07));
  const accuracy = Math.min(0.95, 0.4 + wave * 0.02);
  const reaction = Math.max(260, 1500 - wave * 45);

  const arrowCounts: Record<ArrowType, number> = { ...BASE_ARROWS };
  (Object.keys(arrowCounts) as ArrowType[]).forEach((k) => {
    arrowCounts[k] = Math.min(99, arrowCounts[k] + Math.floor(wave / 3));
  });

  return {
    id: 1000 + wave,
    chapter: 99,
    stageNumber: wave,
    name: isBossWave ? `Wave ${wave} — Elite Vanguard` : `Wave ${wave}`,
    theme: isBossWave ? 'frost' : 'fortress',
    enemyType: archetype,
    enemyName: isBossWave ? 'Elite ' + archetype.replace(/_/g, ' ') : archetype.replace(/_/g, ' '),
    enemyHp: hp,
    enemyDmg: dmg,
    enemyAccuracy: accuracy,
    enemyReactionSpeed: reaction,
    canBlock: wave > 2 || isBossWave,
    canDodge: wave > 1,
    isBoss: isBossWave,
    windVariance: Math.min(0.9, 0.1 + wave * 0.04),
    arrowCounts,
    targetScore: 500 + wave * 400,
    wave,
    isBossWave,
  };
}

export function waveReward(wave: number, isBoss: boolean): { coins: number; xp: number } {
  const coins = Math.round((isBoss ? 220 : 80) * (1 + wave * 0.1));
  const xp = Math.round((isBoss ? 160 : 60) * (1 + wave * 0.08));
  return { coins, xp };
}
