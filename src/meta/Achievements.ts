import { saveManager } from '../save/SaveManager';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  cosmeticReward: string;         // free text — unlocks a cape/eye-color/badge
  check: () => number;            // returns progress in [0,1]
}

const data = () => saveManager.getData();

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    desc: 'Land your first kill.',
    icon: '🩸',
    tier: 'bronze',
    cosmeticReward: 'Blood-Red Fletching',
    check: () => (Object.values(data().codex).reduce((a, b) => a + b.kills, 0) > 0 ? 1 : 0),
  },
  {
    id: 'headshot_novice',
    name: 'Deadeye Novice',
    desc: 'Score 25 critical kills across all enemies.',
    icon: '🎯',
    tier: 'silver',
    cosmeticReward: 'Hawk-Eye Iris Tint',
    check: () => Math.min(1, Object.values(data().codex).reduce((a, b) => a + b.critKills, 0) / 25),
  },
  {
    id: 'bestiary_half',
    name: 'Field Naturalist',
    desc: 'Encounter 10 unique enemies.',
    icon: '📘',
    tier: 'silver',
    cosmeticReward: 'Ranger\'s Journal Cape Patch',
    check: () => Math.min(1, Object.keys(data().codex).length / 10),
  },
  {
    id: 'bestiary_full',
    name: 'Master Bestiarist',
    desc: 'Encounter every enemy archetype.',
    icon: '📚',
    tier: 'gold',
    cosmeticReward: 'Codex Cowl Trim',
    check: () => Math.min(1, Object.keys(data().codex).length / 17),
  },
  {
    id: 'streak_10',
    name: 'On a Roll',
    desc: 'Build a 10-kill streak.',
    icon: '🔥',
    tier: 'silver',
    cosmeticReward: 'Ember Cape Lining',
    check: () => Math.min(1, data().bestKillStreak / 10),
  },
  {
    id: 'streak_25',
    name: 'Unstoppable',
    desc: 'Build a 25-kill streak.',
    icon: '🌋',
    tier: 'gold',
    cosmeticReward: 'Molten Quiver Band',
    check: () => Math.min(1, data().bestKillStreak / 25),
  },
  {
    id: 'endless_10',
    name: 'Horizon Walker',
    desc: 'Reach wave 10 in Endless mode.',
    icon: '🌅',
    tier: 'silver',
    cosmeticReward: 'Dawn Trim',
    check: () => Math.min(1, data().bestEndlessWave / 10),
  },
  {
    id: 'endless_25',
    name: 'Starward',
    desc: 'Reach wave 25 in Endless mode.',
    icon: '✨',
    tier: 'gold',
    cosmeticReward: 'Starweave Cape',
    check: () => Math.min(1, data().bestEndlessWave / 25),
  },
  {
    id: 'prestige_1',
    name: 'Ascended',
    desc: 'Complete one prestige / ascension.',
    icon: '👑',
    tier: 'gold',
    cosmeticReward: 'Starshard Pauldron',
    check: () => (data().prestigeCount >= 1 ? 1 : 0),
  },
  {
    id: 'prestige_5',
    name: 'Myth-Bearer',
    desc: 'Reach prestige level 5.',
    icon: '🌠',
    tier: 'platinum',
    cosmeticReward: 'Cosmic Eye Shader',
    check: () => Math.min(1, data().prestigeCount / 5),
  },
  {
    id: 'daily_week',
    name: 'Daily Diligence',
    desc: 'Complete 7 daily challenges.',
    icon: '📅',
    tier: 'silver',
    cosmeticReward: 'Scholar\'s Side Pouch',
    check: () => {
      const dc = (data().achievements['daily_week']?.progress) || 0;
      return Math.min(1, dc / 7);
    },
  },
  {
    id: 'rival_slayer',
    name: 'Grudge Settler',
    desc: 'Defeat your Rival 3 times.',
    icon: '⚔',
    tier: 'gold',
    cosmeticReward: 'Rival\'s Trophy Scar',
    check: () => Math.min(1, data().rival.defeats / 3),
  },
];

export function tierColor(tier: AchievementDef['tier']): string {
  switch (tier) {
    case 'bronze': return '#b08050';
    case 'silver': return '#c0c7d0';
    case 'gold': return '#ffbf47';
    case 'platinum': return '#9fdfff';
  }
}

export function sweepAchievements(): string[] {
  const unlockedNow: string[] = [];
  ACHIEVEMENTS.forEach((def) => {
    const progress = def.check();
    if (progress >= 1 && !saveManager.isAchievementUnlocked(def.id)) {
      if (saveManager.unlockAchievement(def.id)) {
        unlockedNow.push(def.id);
      }
    } else if (progress < 1) {
      saveManager.setAchievementProgress(def.id, progress);
    }
  });
  return unlockedNow;
}
