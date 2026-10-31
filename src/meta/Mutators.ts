import { RunMutator } from '../types';
import { seededRng } from './Rng';

export const MUTATOR_CATALOG: RunMutator[] = [
  {
    id: 'storm_front',
    name: 'Storm Front',
    icon: '🌪',
    desc: '3× wind, but +40% coins.',
    windMultiplier: 3,
    bonusCoins: 0.4,
    risky: false,
  },
  {
    id: 'heavy_gravity',
    name: 'Iron Rain',
    icon: '🪨',
    desc: 'Gravity ×1.6. Arrows arc harder. +60% coins.',
    gravityMultiplier: 1.6,
    bonusCoins: 0.6,
    risky: false,
  },
  {
    id: 'blackout',
    name: 'Blackout',
    icon: '🌑',
    desc: 'Reduced visibility. +80% coins, +50% XP.',
    darkness: true,
    bonusCoins: 0.8,
    bonusXp: 0.5,
    risky: true,
  },
  {
    id: 'moving_target',
    name: 'Dancing Target',
    icon: '💃',
    desc: 'Enemy sidesteps constantly. +100% coins.',
    movingTarget: true,
    bonusCoins: 1.0,
    risky: false,
  },
  {
    id: 'boss_mode',
    name: 'Boss Mode',
    icon: '👑',
    desc: 'Enemy HP ×2. Loot ×3.',
    bossMode: true,
    bonusCoins: 2.0,
    bonusXp: 1.0,
    risky: true,
  },
  {
    id: 'one_shot',
    name: 'Glass Cannon',
    icon: '💎',
    desc: 'You die in one hit. Loot ×5.',
    oneShot: true,
    bonusCoins: 4.0,
    bonusXp: 2.0,
    risky: true,
  },
  {
    id: 'slow_time',
    name: 'Twilight Pact',
    icon: '🌙',
    desc: 'Your aim time is 25% slower. +50% coins.',
    slowtime: true,
    bonusCoins: 0.5,
    risky: false,
  },
  {
    id: 'calm_wind',
    name: 'Still Air',
    icon: '🍃',
    desc: 'No wind — gain a free Modifier re-roll instead. +20% XP.',
    windMultiplier: 0,
    bonusXp: 0.2,
    risky: false,
  },
];

export function rollMutators(seed: string | number, count = 3): RunMutator[] {
  const rng = seededRng(seed);
  const pool = MUTATOR_CATALOG.slice();
  const out: RunMutator[] = [];
  while (out.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function findMutator(id: string | null | undefined): RunMutator | null {
  if (!id) return null;
  return MUTATOR_CATALOG.find((m) => m.id === id) || null;
}
