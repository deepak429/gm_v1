import React, { useState } from 'react';
import { saveManager } from '../save/SaveManager';

interface PrestigeModalProps {
  onClose: () => void;
  onCoinsChange: (c: number) => void;
}

const UPGRADES: Array<{ key: 'damage' | 'coins' | 'xp' | 'crit'; icon: string; name: string; desc: string; perTier: number; cost: number }> = [
  { key: 'damage', icon: '⚔', name: 'Celestial Edge', desc: '+2% permanent damage per tier.', perTier: 0.02, cost: 3 },
  { key: 'coins', icon: '🪙', name: 'Golden Patron', desc: '+5% permanent coin yield per tier.', perTier: 0.05, cost: 2 },
  { key: 'xp', icon: '✨', name: 'Scholar\'s Boon', desc: '+10% permanent XP per tier.', perTier: 0.10, cost: 2 },
  { key: 'crit', icon: '🎯', name: 'Starbound Eye', desc: '+1% permanent crit per tier.', perTier: 0.01, cost: 4 },
];

export const PrestigeModal: React.FC<PrestigeModalProps> = ({ onClose, onCoinsChange }) => {
  const [, forceRender] = useState(0);
  const data = saveManager.getData();

  const canPrestige = data.unlockedStage > 10 || data.prestigeCount > 0;

  const doPrestige = () => {
    if (!canPrestige) return;
    if (!confirm('Ascend? Campaign progress resets. You keep heroes, bows, shields, codex, mastery, achievements and all permanent bonuses — plus earn starshards.')) {
      return;
    }
    const r = saveManager.prestige();
    onCoinsChange(saveManager.getData().coins);
    alert(`You ascended! Gained ${r.shardsEarned} starshards.`);
    forceRender((v) => v + 1);
  };

  const buy = (u: typeof UPGRADES[number]) => {
    if (!saveManager.spendStarshards(u.cost, u.key, u.perTier)) return;
    forceRender((v) => v + 1);
  };

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{ maxWidth: 680, border: '1px solid #ffbf47', boxShadow: '0 0 42px rgba(255,191,71,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>ASCENSION · STAR FORGE</h2>
          <button className="secondary-action-btn" onClick={onClose}>CLOSE ✕</button>
        </div>
        <p style={{ opacity: 0.85, marginTop: 4 }}>
          Reset your campaign to climb beyond. Keep every unlock, every memory, every scar — spend starshards on permanent bonuses.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
            marginBottom: 14,
          }}
        >
          <div style={{ flex: 1, background: '#0f1b26', border: '1px solid #ffbf47', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#ffd880' }}>STARSHARDS</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>✦ {data.starshards}</div>
          </div>
          <div style={{ flex: 1, background: '#0f1b26', border: '1px solid #4ab8ff', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: '#8fd1ff' }}>PRESTIGE LEVEL</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{data.prestigeCount}</div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {UPGRADES.map((u) => {
            const current = data.globalBonus[u.key];
            const affordable = data.starshards >= u.cost;
            return (
              <div
                key={u.key}
                style={{
                  background: 'linear-gradient(180deg, #0f1b26, #091319)',
                  border: '1px solid #2b4256',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 24 }}>{u.icon}</div>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                </div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>{u.desc}</div>
                <div style={{ fontSize: 12, marginTop: 6, color: '#ffd880' }}>
                  Current: +{Math.round(current * 100)}%
                </div>
                <button
                  onClick={() => buy(u)}
                  disabled={!affordable}
                  className="primary-action-btn"
                  style={{ marginTop: 8, width: '100%', opacity: affordable ? 1 : 0.5 }}
                >
                  BUY · ✦ {u.cost}
                </button>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 10 }}>
          <button
            className="primary-action-btn"
            onClick={doPrestige}
            disabled={!canPrestige}
            style={{ opacity: canPrestige ? 1 : 0.4 }}
          >
            ASCEND & RESET ↑
          </button>
        </div>
        {!canPrestige && (
          <p style={{ fontSize: 11, opacity: 0.7, marginTop: 8 }}>
            Reach stage 11 to unlock Ascension.
          </p>
        )}
      </div>
    </div>
  );
};
