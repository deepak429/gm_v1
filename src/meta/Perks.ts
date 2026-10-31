import { RunPerks } from '../types';
import { pickN, seededRng } from './Rng';

export interface PerkDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  apply: (perks: RunPerks) => void;
}

export const PERK_CATALOG: PerkDef[] = [
  {
    id: 'eagle_eye',
    name: 'Eagle Eye',
    icon: '👁',
    desc: '+15% critical strike chance.',
    rarity: 'common',
    apply: (p) => { p.crit += 0.15; },
  },
  {
    id: 'piercing_shot',
    name: 'Piercing Shot',
    icon: '➴',
    desc: 'Arrows pass through 1 additional target.',
    rarity: 'rare',
    apply: (p) => { p.pierce += 1; },
  },
  {
    id: 'twin_fang',
    name: 'Twin Fang',
    icon: '✸',
    desc: 'Fire 1 extra parallel arrow per shot.',
    rarity: 'epic',
    apply: (p) => { p.multishot += 1; },
  },
  {
    id: 'bleed',
    name: 'Hemorrhage',
    icon: '🩸',
    desc: 'Hits apply a stacking bleed DoT.',
    rarity: 'rare',
    apply: (p) => { p.bleed += 1; },
  },
  {
    id: 'chain_shock',
    name: 'Chain Shock',
    icon: '⚡',
    desc: 'Arrows chain-lightning to 1 nearby target.',
    rarity: 'epic',
    apply: (p) => { p.chain += 1; },
  },
  {
    id: 'slow_draw',
    name: 'Focused Draw',
    icon: '🕒',
    desc: 'Time slows briefly while you draw the bow.',
    rarity: 'common',
    apply: (p) => { p.slowdraw += 0.6; },
  },
  {
    id: 'vampiric',
    name: 'Vampiric Draw',
    icon: '🧛',
    desc: 'Critical hits restore 4 HP.',
    rarity: 'epic',
    apply: (p) => { p.lifesteal += 4; },
  },
  {
    id: 'ricochet',
    name: 'Ricochet',
    icon: '↺',
    desc: 'Arrows bounce off terrain once.',
    rarity: 'rare',
    apply: (p) => { p.ricochet += 1; },
  },
  {
    id: 'deadeye',
    name: 'Deadeye',
    icon: '🎯',
    desc: '+30% critical strike chance.',
    rarity: 'legendary',
    apply: (p) => { p.crit += 0.3; },
  },
  {
    id: 'storm_quiver',
    name: 'Storm Quiver',
    icon: '🌩',
    desc: 'All perks: +1 pierce, +1 chain, +0.1 crit.',
    rarity: 'legendary',
    apply: (p) => { p.pierce += 1; p.chain += 1; p.crit += 0.1; },
  },
];

const RARITY_WEIGHT: Record<PerkDef['rarity'], number> = {
  common: 50,
  rare: 28,
  epic: 15,
  legendary: 7,
};

export function rollPerkChoices(seed: string | number, count = 3): PerkDef[] {
  const rng = seededRng(seed);
  // Weighted expansion then sample without replacement.
  const expanded: PerkDef[] = [];
  PERK_CATALOG.forEach((p) => {
    const w = RARITY_WEIGHT[p.rarity];
    for (let i = 0; i < w; i++) expanded.push(p);
  });
  const picked = new Set<string>();
  const out: PerkDef[] = [];
  let safety = 0;
  while (out.length < count && safety++ < 500) {
    const idx = Math.floor(rng() * expanded.length);
    const p = expanded[idx];
    if (picked.has(p.id)) continue;
    picked.add(p.id);
    out.push(p);
  }
  // Fallback — pad with uniques from the catalog in case of weird rolls.
  if (out.length < count) {
    const remaining = PERK_CATALOG.filter((p) => !picked.has(p.id));
    pickN(remaining, count - out.length, rng).forEach((p) => out.push(p));
  }
  return out;
}

export function rarityColor(rarity: PerkDef['rarity']): string {
  switch (rarity) {
    case 'common': return '#8fa7bb';
    case 'rare': return '#4ab8ff';
    case 'epic': return '#c47bff';
    case 'legendary': return '#ffbc3d';
  }
}
