import React, { useState, useEffect } from 'react';

export const RotatePrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState<boolean>(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;

      // Only prompt on mobile/touch devices or narrow aspect ratios where height > width
      const portrait = window.innerHeight > window.innerWidth;
      const isMobileSize = window.innerWidth <= 1024 || isTouch;

      setIsPortrait(portrait && isMobileSize);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleFullscreenAndRotate = async () => {
    try {
      const el = document.documentElement as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      };

      if (!document.fullscreenElement) {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        }
      }

      // Try screen orientation lock if supported (Android Chrome, etc.)
      const screenAny = window.screen as unknown as {
        orientation?: {
          lock?: (orientation: string) => Promise<void>;
        };
      };
      if (screenAny?.orientation?.lock) {
        await screenAny.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore if user denied fullscreen
    }
  };

  if (!isPortrait) return null;

  return (
    <div className="rotate-device-overlay">
      <div className="rotate-card">
        <div className="phone-animation">
          <div className="phone-icon">
            <span className="phone-screen">🏹</span>
          </div>
          <div className="rotate-arrow">⤹</div>
        </div>

        <h2>ROTATE TO LANDSCAPE</h2>
        <p>Shadow Archer requires Landscape Mode for widescreen archery combat.</p>

        <button className="rotate-action-btn" onClick={handleFullscreenAndRotate}>
          <span>⛶</span> PLAY FULLSCREEN
        </button>

        <small className="rotate-hint">Please turn your phone sideways to continue</small>
      </div>
    </div>
  );
};
