import React from 'react';
import { saveManager } from '../save/SaveManager';

interface MetaMenuBarProps {
  onOpenDaily: () => void;
  onOpenEndless: () => void;
  onOpenCodex: () => void;
  onOpenAchievements: () => void;
  onOpenPrestige: () => void;
}

export const MetaMenuBar: React.FC<MetaMenuBarProps> = ({
  onOpenDaily,
  onOpenEndless,
  onOpenCodex,
  onOpenAchievements,
  onOpenPrestige,
}) => {
  const data = saveManager.getData();
  const hero = data.equippedHero;
  const mastery = data.mastery[hero] || { xp: 0, level: 1, kills: 0 };
  const nextXp = Math.round(Math.pow(mastery.level, 1.4) * 50);
  const progress = Math.min(1, mastery.xp / nextXp);
  const streak = data.killStreak;

  const pill = (bg: string, color: string, label: string, value: string | number, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        background: bg,
        border: `1px solid ${color}`,
        color: '#fff',
        padding: '6px 10px',
        borderRadius: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 36,
      }}
    >
      <span style={{ fontSize: 10, letterSpacing: 1.5, color, textTransform: 'uppercase' }}>
        {label}
      </span>
      <b style={{ fontSize: 13 }}>{value}</b>
    </button>
  );

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '6px 10px',
        background: 'linear-gradient(90deg, #060e18, #0f1b26, #060e18)',
        borderTop: '1px solid #1a2b3a',
        borderBottom: '1px solid #1a2b3a',
        flexWrap: 'wrap',
      }}
    >
      {pill('#1f1407', '#ffbf47', 'Daily', data.daily.completed ? '✓' : 'play', onOpenDaily)}
      {pill('#1a0a24', '#c47bff', 'Endless', `W${data.bestEndlessWave}`, onOpenEndless)}
      {pill('#07141a', '#4ab8ff', 'Codex', `${Object.keys(data.codex).length}`, onOpenCodex)}
      {pill('#0f1810', '#9bff6a', 'Awards', `${Object.values(data.achievements).filter((a) => a.unlockedAt > 0).length}`, onOpenAchievements)}
      {pill('#1f1407', '#ffbf47', 'Ascend', `✦${data.starshards}`, onOpenPrestige)}

      {/* Mastery bar */}
      <div
        style={{
          flex: 1,
          minWidth: 180,
          background: '#0a141c',
          border: '1px solid #2b4256',
          borderRadius: 8,
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: '#8fd1ff', textTransform: 'uppercase' }}>
          Mastery L{mastery.level}
        </div>
        <div style={{ flex: 1, height: 6, background: '#1a2b3a', borderRadius: 3, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #4ab8ff, #c47bff)',
            }}
          />
        </div>
        <div style={{ fontSize: 11, opacity: 0.7, minWidth: 60, textAlign: 'right' }}>
          {mastery.xp}/{nextXp}
        </div>
      </div>

      {/* Kill streak */}
      {streak > 0 && (
        <div
          style={{
            background: '#1b0804',
            border: '1px solid #ff5329',
            borderRadius: 8,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            animation: streak >= 10 ? 'pulse 1s infinite' : undefined,
          }}
        >
          <span style={{ fontSize: 10, letterSpacing: 1.5, color: '#ff8c6b', textTransform: 'uppercase' }}>
            Streak
          </span>
          <b style={{ fontSize: 14, color: '#ffbf47' }}>×{streak}</b>
        </div>
      )}
    </div>
  );
};
