import React from 'react';
import { saveManager } from '../save/SaveManager';

interface EndlessStartModalProps {
  onClose: () => void;
  onStart: () => void;
}

export const EndlessStartModal: React.FC<EndlessStartModalProps> = ({ onClose, onStart }) => {
  const data = saveManager.getData();
  return (
    <div className="modal-backdrop">
      <div
        className="modal-card"
        style={{ maxWidth: 560, border: '1px solid #c47bff', boxShadow: '0 0 42px rgba(196,123,255,0.3)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>ENDLESS GAUNTLET</h2>
          <button className="secondary-action-btn" onClick={onClose}>CLOSE ✕</button>
        </div>
        <p style={{ opacity: 0.85 }}>
          Waves never stop. Enemies climb +14% HP per wave. Every 5th wave is an elite. One life — die and the run ends.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginTop: 10,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: '#0f1b26',
              border: '1px solid #c47bff',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#d2a3ff', textTransform: 'uppercase' }}>
              Best Wave
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{data.bestEndlessWave}</div>
          </div>
          <div
            style={{
              background: '#0f1b26',
              border: '1px solid #ffbf47',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#ffd880', textTransform: 'uppercase' }}>
              Best Score
            </div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{data.bestEndlessScore.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="secondary-action-btn" onClick={onClose}>CANCEL</button>
          <button className="primary-action-btn" onClick={onStart}>
            ENTER THE GAUNTLET ▶
          </button>
        </div>
      </div>
    </div>
  );
};
