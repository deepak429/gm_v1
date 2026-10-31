import React from 'react';
import { HudCombatState } from '../types';

interface ResultModalProps {
  hud: HudCombatState;
  onNextStage: () => void;
  onRetry: () => void;
  onOpenCampaign: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ hud, onNextStage, onRetry, onOpenCampaign }) => {
  const isVictory = hud.victory;

  return (
    <div className="modal-backdrop">
      <div className={`modal-card result-modal ${isVictory ? 'victory-card' : 'defeat-card'}`}>
        <div className="result-crest">{isVictory ? '🏆' : '☠'}</div>

        <h2 className="result-heading">{isVictory ? 'VICTORY' : 'DEFEATED'}</h2>
        <p className="result-sub">
          {isVictory
            ? `${hud.enemyName} has fallen before your arrows!`
            : 'The fortress guards overwhelmed you. Regroup and strike back.'}
        </p>

        {/* Stars Display for Victory */}
        {isVictory && (
          <div className="result-stars">
            {[1, 2, 3].map((star) => (
              <span key={star} className={`star-big ${star <= hud.starsEarned ? 'earned' : 'unearned'}`}>
                ★
              </span>
            ))}
          </div>
        )}

        {isVictory && (
          <div className="result-reward-badge">
            <span>🪙</span>
            <b>+{60 + (hud.starsEarned || 1) * 30} COINS EARNED</b>
          </div>
        )}

        {/* Combat Stats Grid */}
        <div className="result-stats-grid">
          <div className="stat-box">
            <span>ACCURACY</span>
            <b>{hud.accuracy}%</b>
          </div>
          <div className="stat-box">
            <span>HEADSHOTS</span>
            <b>{hud.headshots}</b>
          </div>
          <div className="stat-box">
            <span>BEST COMBO</span>
            <b>×{hud.combo}</b>
          </div>
          <div className="stat-box">
            <span>TOTAL SCORE</span>
            <b>{hud.score.toLocaleString()}</b>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          {isVictory ? (
            <>
              <button className="primary-action-btn" onClick={onNextStage}>
                NEXT STAGE →
              </button>
              <button className="secondary-action-btn" onClick={onRetry}>
                ↻ REPLAY
              </button>
            </>
          ) : (
            <button className="primary-action-btn" onClick={onRetry}>
              ↻ TRY AGAIN
            </button>
          )}

          <button className="map-action-btn" onClick={onOpenCampaign}>
            WAR MAP 🗺
          </button>
        </div>
      </div>
    </div>
  );
};
