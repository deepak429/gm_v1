import React, { useMemo } from 'react';
import { ACHIEVEMENTS, sweepAchievements, tierColor } from '../meta/Achievements';
import { saveManager } from '../save/SaveManager';

interface AchievementsModalProps {
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ onClose }) => {
  // Sweep progress on open so counters stay fresh.
  useMemo(() => sweepAchievements(), []);

  const unlocked = ACHIEVEMENTS.filter((a) => saveManager.isAchievementUnlocked(a.id)).length;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 820, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>ACHIEVEMENTS · {unlocked} / {ACHIEVEMENTS.length}</h2>
          <button className="secondary-action-btn" onClick={onClose}>CLOSE ✕</button>
        </div>
        <p style={{ opacity: 0.8, marginTop: 4 }}>
          Each unlock grants a cosmetic — fletching tints, cowl trims, cape patches. No power boosts.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {ACHIEVEMENTS.map((a) => {
            const unlockedState = saveManager.isAchievementUnlocked(a.id);
            const prog = Math.min(1, a.check());
            const tint = tierColor(a.tier);
            return (
              <div
                key={a.id}
                style={{
                  background: 'linear-gradient(180deg, #0f1b26, #091319)',
                  border: `1px solid ${unlockedState ? tint : '#223240'}`,
                  borderRadius: 10,
                  padding: 12,
                  opacity: unlockedState ? 1 : 0.75,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      fontSize: 26,
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: `${tint}22`,
                      border: `1px solid ${tint}99`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      filter: unlockedState ? 'none' : 'grayscale(0.7) brightness(0.6)',
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: tint, textTransform: 'uppercase', letterSpacing: 1 }}>
                      {a.tier}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, marginTop: 8, opacity: 0.9 }}>{a.desc}</div>
                <div
                  style={{
                    marginTop: 10,
                    background: '#0a141c',
                    height: 6,
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${prog * 100}%`,
                      height: '100%',
                      background: unlockedState ? tint : '#4a7190',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div style={{ fontSize: 10, marginTop: 6, opacity: 0.75 }}>
                  Reward: <b>{a.cosmeticReward}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
