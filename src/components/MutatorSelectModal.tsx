import React, { useMemo, useState } from 'react';
import { rollMutators } from '../meta/Mutators';
import { saveManager } from '../save/SaveManager';
import { RunMutator } from '../types';

interface MutatorSelectModalProps {
  seed: string | number;
  stageName: string;
  onConfirm: (mutator: RunMutator | null) => void;
}

export const MutatorSelectModal: React.FC<MutatorSelectModalProps> = ({
  seed,
  stageName,
  onConfirm,
}) => {
  const choices = useMemo(() => rollMutators(seed), [seed]);
  const [selected, setSelected] = useState<string | null>(null);

  const chosen = choices.find((c) => c.id === selected) || null;

  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{ maxWidth: 780, border: '1px solid #4ab8ff', boxShadow: '0 0 42px rgba(74,184,255,0.3)' }}
      >
        <h2 style={{ marginBottom: 4 }}>MODIFIER — {stageName.toUpperCase()}</h2>
        <p style={{ opacity: 0.8, marginTop: 0 }}>
          Pick one modifier for this stage, or skip for a clean run.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
            marginTop: 16,
          }}
        >
          {choices.map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelected(active ? null : m.id)}
                style={{
                  background: active
                    ? 'linear-gradient(180deg, #11384c, #0b1f2a)'
                    : 'linear-gradient(180deg, #0f1b26, #091319)',
                  border: `2px solid ${m.risky ? '#ff5329' : '#4ab8ff'}`,
                  borderRadius: 10,
                  padding: '16px 14px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: active ? '3px solid #ffbf47' : 'none',
                  outlineOffset: 2,
                }}
              >
                <div style={{ fontSize: 30, lineHeight: 1 }}>{m.icon}</div>
                <div
                  style={{
                    color: m.risky ? '#ff8c6b' : '#8fd1ff',
                    textTransform: 'uppercase',
                    fontSize: 11,
                    letterSpacing: 1,
                    marginTop: 4,
                  }}
                >
                  {m.risky ? 'RISK + REWARD' : 'BOON'}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>{m.name}</div>
                <div style={{ fontSize: 12, opacity: 0.9, marginTop: 6 }}>{m.desc}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {m.bonusCoins ? (
                    <span style={{ background: '#2d2309', color: '#ffbf47', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      +{Math.round(m.bonusCoins * 100)}% 🪙
                    </span>
                  ) : null}
                  {m.bonusXp ? (
                    <span style={{ background: '#232d09', color: '#9bff6a', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      +{Math.round(m.bonusXp * 100)}% XP
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            className="secondary-action-btn"
            onClick={() => {
              saveManager.setActiveMutator(null);
              onConfirm(null);
            }}
          >
            SKIP
          </button>
          <button
            className="primary-action-btn"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              saveManager.setActiveMutator(chosen.id);
              onConfirm(chosen);
            }}
            style={{ opacity: chosen ? 1 : 0.4 }}
          >
            CONFIRM ▶
          </button>
        </div>
      </div>
    </div>
  );
};
