import { EnemyArchetype } from '../types';

export interface CodexDef {
  archetype: EnemyArchetype;
  name: string;
  icon: string;
  color: string;
  lore: string[];
  weakness: string;
}

export const CODEX_ENTRIES: CodexDef[] = [
  {
    archetype: 'skeleton_scout',
    name: 'Skeleton Scout',
    icon: '💀',
    color: '#dadcc5',
    lore: [
      'Rattles across the Lost Fortress at dusk, still clinging to its rusted bow.',
      'Trained to flee and skirmish — never to hold ground.',
    ],
    weakness: 'Holy arrows shatter bone instantly.',
  },
  {
    archetype: 'fortress_guard',
    name: 'Fortress Guard',
    icon: '🛡',
    color: '#5f8096',
    lore: ['Veterans of the siege wars, their kite shields still bear the Citadel sigil.'],
    weakness: 'Thunder arrows ignore shield plating.',
  },
  {
    archetype: 'frost_ranger',
    name: 'Frost Ranger',
    icon: '❄',
    color: '#7be2ff',
    lore: ['Hunters of Frostfang Peak. They inhale glacier mist to steady every draw.'],
    weakness: 'Fire arrows thaw their frozen sinews.',
  },
  {
    archetype: 'shadow_assassin',
    name: 'Shadow Assassin',
    icon: '🥷',
    color: '#a875ff',
    lore: ['Exiled from the Dawn Temple. Moves between heartbeats.'],
    weakness: 'Holy arrows anchor them to the light.',
  },
  {
    archetype: 'fortress_champion',
    name: 'Fortress Champion',
    icon: '🏰',
    color: '#ffc444',
    lore: ['The Citadel sent its best when the Scout went missing. He never came back.'],
    weakness: 'Pierce the gorget seam at the throat.',
  },
  {
    archetype: 'frost_overlord',
    name: 'Frost Overlord',
    icon: '🧊',
    color: '#5cd5ff',
    lore: ['Jarl of the glaciers. Breathes a hoarfrost that halves draw-time.'],
    weakness: 'Fire arrows + headshot cracks the skull-helm.',
  },
  {
    archetype: 'infernal_warlord',
    name: 'Infernal Warlord',
    icon: '🔥',
    color: '#ff5329',
    lore: ['Rose from the Caldera when the seals broke. Molten blood boils through armor seams.'],
    weakness: 'Ice arrows crust the armor and open joints.',
  },
  {
    archetype: 'desert_marauder',
    name: 'Desert Marauder',
    icon: '🏜',
    color: '#ffd060',
    lore: ['Dune-born raider. Sand devils ride the arrows he looses.'],
    weakness: 'Wind arrows disrupt his sand-step.',
  },
  {
    archetype: 'forest_wraith',
    name: 'Forest Wraith',
    icon: '🌲',
    color: '#55ff33',
    lore: ['A grief-knot in the Cursed Grove, twisted into something that shoots back.'],
    weakness: 'Holy arrows banish the knot briefly — strike then.',
  },
  {
    archetype: 'storm_warden',
    name: 'Storm Warden',
    icon: '⚡',
    color: '#ffea38',
    lore: ['Lightning-chained monk, bound to the thundering spires.'],
    weakness: 'Water-logged terrain amplifies thunder — bait him there.',
  },
  {
    archetype: 'void_harbinger',
    name: 'Void Harbinger',
    icon: '✦',
    color: '#ff00ff',
    lore: ['The Rift leaked, and he was the first thing it answered.'],
    weakness: 'Holy + Void chain-reacts.',
  },
  {
    archetype: 'plague_revenant',
    name: 'Plague Revenant',
    icon: '☣',
    color: '#76ea48',
    lore: ['Alchemist who cured himself of death. His arrows carry the receipt.'],
    weakness: 'Fire arrows cauterize the rot.',
  },
  {
    archetype: 'crimson_berserker',
    name: 'Crimson Berserker',
    icon: '🩸',
    color: '#d82b22',
    lore: ['No shield. No fear. Just scars and a shortening temper.'],
    weakness: 'Freeze arrows stop a rush cold.',
  },
  {
    archetype: 'jade_sentinel',
    name: 'Jade Sentinel',
    icon: '🀄',
    color: '#1dd3b0',
    lore: ['Carved from a single jade pillar. Attacks on tempo — never improvising.'],
    weakness: 'Break the tempo — stagger with crits.',
  },
  {
    archetype: 'blood_shaman',
    name: 'Blood Shaman',
    icon: '🩻',
    color: '#9c0f0f',
    lore: ['Trades his own ribs for enchanted ones. His quiver whispers.'],
    weakness: 'Arcane dispels the ritual.',
  },
  {
    archetype: 'iron_golem',
    name: 'Iron Golem',
    icon: '🤖',
    color: '#8da1b0',
    lore: ['Older than the Citadel. The core still hums with the Builder\'s voice.'],
    weakness: 'Thunder stuns the core — then multishot the chest.',
  },
  {
    archetype: 'phantom_duelist',
    name: 'Phantom Duelist',
    icon: '👻',
    color: '#c986ff',
    lore: ['A duel he never finished. He will finish it with you.'],
    weakness: 'Does not stay still — predict, do not react.',
  },
];

export function getCodexDef(archetype: EnemyArchetype): CodexDef | undefined {
  return CODEX_ENTRIES.find((e) => e.archetype === archetype);
}
