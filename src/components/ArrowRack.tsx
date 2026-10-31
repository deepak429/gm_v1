import React from 'react';
import { ArrowType } from '../types';

interface ArrowRackProps {
  selectedArrow: ArrowType;
  arrowCounts: Record<ArrowType, number>;
  onSelectArrow: (type: ArrowType) => void;
}

interface ArrowMeta {
  type: ArrowType;
  name: string;
  icon: string;
  hotkey: string;
  effect: string;
}

const ARROW_METAS: ArrowMeta[] = [
  { type: 'normal',  name: 'Steel',   icon: '➶', hotkey: '1', effect: 'Precision & 2.5× Headshot' },
  { type: 'fire',    name: 'Flame',   icon: '🔥', hotkey: '2', effect: 'Ignites & Burn DoT' },
  { type: 'ice',     name: 'Frost',   icon: '❄',  hotkey: '3', effect: 'Freezes Enemy Actions' },
  { type: 'poison',  name: 'Venom',   icon: '☣',  hotkey: '4', effect: 'Stacking Acid Damage' },
  { type: 'arcane',  name: 'Arcane',  icon: '✧',  hotkey: '5', effect: 'Pierces Shields' },
  { type: 'thunder', name: 'Thunder', icon: '⚡',  hotkey: '6', effect: 'Stuns + Chain Lightning' },
  { type: 'shadow',  name: 'Shadow',  icon: '🌑',  hotkey: '7', effect: 'Blinds & Mist Cloud' },
  { type: 'holy',    name: 'Holy',    icon: '✨',  hotkey: '8', effect: 'Heals Player + Holy Smite' },
  { type: 'wind',    name: 'Wind',    icon: '💨',  hotkey: '9', effect: 'Knocks Back & Disarms' },
  { type: 'void',    name: 'Void',    icon: '✦',  hotkey: '0', effect: '2× Damage + Singularity' },
];

export const ArrowRack: React.FC<ArrowRackProps> = ({ selectedArrow, arrowCounts, onSelectArrow }) => {
  return (
    <aside className="arrow-rack">
      {ARROW_METAS.map((meta) => {
        const count = arrowCounts[meta.type] || 0;
        const isSelected = selectedArrow === meta.type;
        const isEmpty = count <= 0;

        return (
          <button
            key={meta.type}
            className={`arrow-choice ${meta.type} ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''}`}
            onClick={() => onSelectArrow(meta.type)}
            title={`${meta.name} Arrow (${meta.effect}) - Press ${meta.hotkey}`}
          >
            <span className="arrow-icon">{meta.icon}</span>
            <div className="arrow-details">
              <span className="arrow-name">{meta.name}</span>
              <small className="arrow-effect">{meta.effect}</small>
            </div>
            <b className="arrow-count">×{count}</b>
            <kbd className="arrow-kbd">{meta.hotkey}</kbd>
          </button>
        );
      })}
    </aside>
  );
};
