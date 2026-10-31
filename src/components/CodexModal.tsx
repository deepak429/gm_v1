import React from 'react';
import { CODEX_ENTRIES } from '../meta/Codex';
import { saveManager } from '../save/SaveManager';

interface CodexModalProps {
  onClose: () => void;
}

export const CodexModal: React.FC<CodexModalProps> = ({ onClose }) => {
  const codex = saveManager.getData().codex;
  const discovered = Object.keys(codex).length;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 820, maxHeight: '85vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>BESTIARY · {discovered} / {CODEX_ENTRIES.length}</h2>
          <button className="secondary-action-btn" onClick={onClose}>CLOSE ✕</button>
        </div>
        <p style={{ opacity: 0.8, marginTop: 4 }}>Lore unlocks as you encounter and defeat each archetype.</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {CODEX_ENTRIES.map((entry) => {
            const stat = codex[entry.archetype];
            const seen = !!stat;
            return (
              <div
                key={entry.archetype}
                style={{
                  background: 'linear-gradient(180deg, #0f1b26, #091319)',
                  border: `1px solid ${seen ? entry.color : '#1e2a35'}`,
                  borderRadius: 10,
                  padding: 12,
                  opacity: seen ? 1 : 0.5,
                  filter: seen ? 'none' : 'grayscale(0.9)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      fontSize: 28,
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${entry.color}22`,
                      border: `1px solid ${entry.color}66`,
                    }}
                  >
                    {entry.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {seen ? entry.name : '???'}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {seen
                        ? `${stat.kills} slain · ${stat.critKills} crits`
                        : 'Not yet encountered'}
                    </div>
                  </div>
                </div>
                {seen && (
                  <>
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.9 }}>
                      {entry.lore.map((line, i) => (
                        <p key={i} style={{ margin: '4px 0' }}>{line}</p>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        padding: '6px 8px',
                        background: '#141f29',
                        borderLeft: `3px solid ${entry.color}`,
                      }}
                    >
                      <b>Weakness:</b> {entry.weakness}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
