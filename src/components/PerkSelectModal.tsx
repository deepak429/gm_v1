import React, { useMemo } from 'react';
import { PerkDef, rollPerkChoices, rarityColor } from '../meta/Perks';
import { saveManager } from '../save/SaveManager';
import { RunPerks } from '../types';

interface PerkSelectModalProps {
  seed: string | number;
  level: number;
  onPick: (perk: PerkDef) => void;
  onClose?: () => void;
}

export const PerkSelectModal: React.FC<PerkSelectModalProps> = ({ seed, level, onPick, onClose }) => {
  const choices = useMemo(() => rollPerkChoices(seed), [seed]);

  const handlePick = (perk: PerkDef) => {
    const perks: RunPerks = { ...saveManager.getData().runPerks };
    perk.apply(perks);
    saveManager.save({ runPerks: perks });
    onPick(perk);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{ maxWidth: 760, border: '1px solid #ffbf47', boxShadow: '0 0 42px rgba(255,191,71,0.35)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>LEVEL {level} — CHOOSE YOUR GIFT</h2>
          {onClose && (
            <button className="secondary-action-btn" onClick={onClose} style={{ padding: '4px 12px' }}>
              SKIP
            </button>
          )}
        </div>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Pick one. These perks stack for the rest of this run only.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginTop: 16,
          }}
        >
          {choices.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePick(p)}
              style={{
                background: 'linear-gradient(180deg, #0f1b26, #091319)',
                border: `2px solid ${rarityColor(p.rarity)}`,
                borderRadius: 10,
                padding: '18px 14px',
                color: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <div style={{ fontSize: 36, lineHeight: 1 }}>{p.icon}</div>
              <div
                style={{
                  color: rarityColor(p.rarity),
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  fontSize: 12,
                  marginTop: 6,
                }}
              >
                {p.rarity}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{p.name}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 6 }}>{p.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
