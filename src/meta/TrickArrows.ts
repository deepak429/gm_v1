// Trick / utility arrows that live alongside the elemental arrow types.
// Each describes behavior that would wire into the arena projectile code.

export interface TrickArrowDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number;        // coins per shot
  effect: 'rope' | 'cluster' | 'boomerang' | 'bomb' | 'net' | 'bola' | 'pulse';
  cooldown: number;    // seconds between uses
}

export const TRICK_ARROWS: TrickArrowDef[] = [
  {
    id: 'rope',
    name: 'Rope Arrow',
    icon: '🪢',
    desc: 'Pulls the enemy toward you on hit — breaks shields.',
    cost: 25,
    effect: 'rope',
    cooldown: 6,
  },
  {
    id: 'cluster',
    name: 'Cluster Arrow',
    icon: '💥',
    desc: 'Splits into 5 bomblets at the apex of its arc.',
    cost: 60,
    effect: 'cluster',
    cooldown: 10,
  },
  {
    id: 'boomerang',
    name: 'Boomerang Arrow',
    icon: '↩',
    desc: 'Returns to you — hits on the way out and back.',
    cost: 45,
    effect: 'boomerang',
    cooldown: 8,
  },
  {
    id: 'bomb',
    name: 'Bomb Arrow',
    icon: '🧨',
    desc: 'Short fuse, big radius. Ignores shields.',
    cost: 80,
    effect: 'bomb',
    cooldown: 12,
  },
  {
    id: 'net',
    name: 'Net Arrow',
    icon: '🕸',
    desc: 'Pins the enemy in place for 2.5s.',
    cost: 50,
    effect: 'net',
    cooldown: 9,
  },
  {
    id: 'bola',
    name: 'Bola Arrow',
    icon: '⚭',
    desc: 'Tangles legs — enemy cannot dodge for 4s.',
    cost: 40,
    effect: 'bola',
    cooldown: 7,
  },
  {
    id: 'pulse',
    name: 'Pulse Arrow',
    icon: '◎',
    desc: 'Detonates a slow-time bubble on impact.',
    cost: 90,
    effect: 'pulse',
    cooldown: 14,
  },
];
