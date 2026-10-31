import React from 'react';
import { soundManager } from '../audio/SoundManager';
import { saveManager } from '../save/SaveManager';

interface TopbarProps {
  score: number;
  coins: number;
  chapterTitle: string;
  stageName: string;
  stageNumber: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onOpenShop: () => void;
  onOpenCampaign: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  score,
  coins,
  chapterTitle,
  stageName,
  stageNumber,
  isPaused,
  onTogglePause,
  onOpenShop,
  onOpenCampaign,
  muted,
  onToggleMute,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        const screenAny = window.screen as unknown as {
          orientation?: { lock?: (o: string) => Promise<void> };
        };
        screenAny?.orientation?.lock?.('landscape').catch(() => {});
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Fullscreen not permitted or cancelled
    }
  };
  return (
    <header className="topbar">
      <div className="brand-group">
        <div className="brand-mark">🏹</div>
        <div>
          <div className="eyebrow">{chapterTitle.toUpperCase()}</div>
          <h1>
            SHADOW <span>ARCHER</span>
          </h1>
        </div>
      </div>

      <div className="top-center">
        <button className="stage-pill" onClick={onOpenCampaign} title="Open Campaign Map">
          <span className="stage-num">STAGE {String(stageNumber).padStart(2, '0')}</span>
          <span className="stage-title">{stageName}</span>
          <span className="map-badge">MAP 🗺</span>
        </button>
      </div>

      <div className="top-actions">
        <button className="action-btn shop-btn" onClick={onOpenShop} title="Armory & Upgrades">
          <span>⚔️</span>
          <b>ARMORY</b>
        </button>

        <button className="action-btn audio-btn" onClick={onToggleMute} title={muted ? 'Unmute' : 'Mute'}>
          <span>{muted ? '🔇' : '🔊'}</span>
        </button>

        <div className="wallet">
          <span title="Current Score">
            ★ <b>{score.toLocaleString()}</b>
          </span>
          <span className="coin" title="Available Coins">
            🪙 <b>{coins}</b>
          </span>
        </div>

        <button className="action-btn fs-btn" onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
          <span>{isFullscreen ? '⤢' : '⛶'}</span>
        </button>

        <button className="action-btn pause-btn" onClick={onTogglePause} title="Pause Game">
          {isPaused ? '▶' : 'Ⅱ'}
        </button>
      </div>
    </header>
  );
};
