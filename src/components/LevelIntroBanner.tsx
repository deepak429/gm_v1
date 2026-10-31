import React from 'react';
import { LevelIntroState } from '../types';

interface LevelIntroBannerProps {
  intro: LevelIntroState;
}

export const LevelIntroBanner: React.FC<LevelIntroBannerProps> = ({ intro }) => {
  if (!intro.show) return null;

  return (
    <div className={`level-intro-banner ${intro.isBoss ? 'boss-intro-banner' : ''}`}>
      <div className="banner-content">
        {intro.isBoss ? (
          <>
            <div className="intro-tag boss-alert">⚠️ DANGER · BOSS ENCOUNTER</div>
            <h2 className="intro-title boss-title">{intro.bossTitle || intro.stageName}</h2>
            <p className="intro-subtitle">STAGE {String(intro.stageNumber).padStart(2, '0')} · THE KEEP GUARDIAN</p>
          </>
        ) : (
          <>
            <div className="intro-tag">STAGE {String(intro.stageNumber).padStart(2, '0')}</div>
            <h2 className="intro-title">{intro.stageName.toUpperCase()}</h2>
            <p className="intro-subtitle">ELIMINATE THE FORTRESS FORCES</p>
          </>
        )}
      </div>
    </div>
  );
};
