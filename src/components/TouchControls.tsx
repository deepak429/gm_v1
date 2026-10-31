import React from 'react';

interface TouchControlsProps {
  onQuickFire: () => void;
  onActivateShield: () => void;
  onActivateDash: () => void;
  onActivateSlow: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onQuickFire,
  onActivateShield,
  onActivateDash,
  onActivateSlow,
}) => {
  return (
    <div className="mobile-touch-bar">
      <div className="touch-tip">
        <span>👆</span>
        <small>Drag screen to aim</small>
      </div>

      <div className="touch-quick-actions">
        <button className="touch-btn shield-btn" onClick={onActivateShield} title="Shield (30 Stamina)">
          <span className="btn-icon">⬡</span>
          <span className="btn-label">SHIELD</span>
        </button>
        <button className="touch-btn dash-btn" onClick={onActivateDash} title="Quick Dash (35 Stamina)">
          <span className="btn-icon">➤</span>
          <span className="btn-label">DASH</span>
        </button>
        <button className="touch-btn slow-btn" onClick={onActivateSlow} title="Bullet Time Slow-Mo (45 Stamina)">
          <span className="btn-icon">◷</span>
          <span className="btn-label">SLOW</span>
        </button>
        <button className="touch-btn fire-btn" onClick={onQuickFire} title="Release Arrow / Shoot">
          <span className="btn-icon">🏹</span>
          <span className="btn-label">SHOOT</span>
        </button>
      </div>
    </div>
  );
};
