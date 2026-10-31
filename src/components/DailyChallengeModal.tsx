import React, { useMemo, useState } from 'react';
import { saveManager } from '../save/SaveManager';
import { buildDailyChallenge, buildWeeklyChallenge, formatSeedShare } from '../meta/Challenges';

interface DailyChallengeModalProps {
  onClose: () => void;
  onStart: (mode: 'daily' | 'weekly', seed: string) => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({ onClose, onStart }) => {
  saveManager.rolloverChallengesIfNeeded();
  // `tick` forces a re-read of save data after a claim so the Claim button
  // disables immediately — the previous version kept it clickable forever.
  const [tick, setTick] = useState(0);
  const data = saveManager.getData();
  const daily = useMemo(() => buildDailyChallenge(data.daily.seed), [data.daily.seed]);
  const weekly = useMemo(() => buildWeeklyChallenge(data.weekly.seed), [data.weekly.seed]);

  const [tab, setTab] = useState<'daily' | 'weekly'>('daily');
  const [copyStatus, setCopyStatus] = useState('');

  const copySeed = async (seed: string) => {
    try {
      await navigator.clipboard.writeText(formatSeedShare(seed));
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus(''), 1500);
    } catch {
      setCopyStatus('Press to copy');
    }
  };

  const claimDaily = () => {
    const r = saveManager.claimDailyReward();
    if (r > 0) alert(`Claimed ${r} coins!`);
    setTick((v) => v + 1);
  };
  const claimWeekly = () => {
    const r = saveManager.claimWeeklyReward();
    if (r.coins > 0 || r.shards > 0) {
      alert(`Claimed ${r.coins} coins and ${r.shards} starshards!`);
    }
    setTick((v) => v + 1);
  };
  // Reference `tick` so the hook keeps the render honest for its re-read.
  void tick;

  const current = tab === 'daily' ? daily : weekly;
  const bestLine =
    tab === 'daily'
      ? `Best today: ${data.daily.bestScore.toLocaleString()} · Attempts: ${data.daily.attemptsToday}`
      : `Best wave: ${data.weekly.bestWave} · ${data.weekly.stars}/3 ★`;

  return (
    <div className="modal-backdrop">
      <div className="modal-card" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>SEEDED TRIALS</h2>
          <button className="secondary-action-btn" onClick={onClose}>CLOSE ✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button
            className={tab === 'daily' ? 'primary-action-btn' : 'secondary-action-btn'}
            onClick={() => setTab('daily')}
            style={{ flex: 1 }}
          >
            📅 DAILY
          </button>
          <button
            className={tab === 'weekly' ? 'primary-action-btn' : 'secondary-action-btn'}
            onClick={() => setTab('weekly')}
            style={{ flex: 1 }}
          >
            🗓 WEEKLY
          </button>
        </div>

        <div
          style={{
            background: 'linear-gradient(180deg, #0f1b26, #091319)',
            border: '1px solid #2b4256',
            borderRadius: 10,
            padding: 16,
            marginTop: 14,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#8fd1ff', textTransform: 'uppercase' }}>
                {current.bannerTitle}
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{current.enemyName}</div>
            </div>
            <button
              onClick={() => copySeed(current.seed)}
              style={{
                background: '#111e2a',
                border: '1px solid #4ab8ff',
                color: '#8fd1ff',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'monospace',
              }}
            >
              {copyStatus || formatSeedShare(current.seed)}
            </button>
          </div>

          <ul style={{ marginTop: 12, fontSize: 13, opacity: 0.9, paddingLeft: 18 }}>
            {current.rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>{bestLine}</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
          {tab === 'daily' ? (
            <>
              <button
                className="secondary-action-btn"
                onClick={claimDaily}
                disabled={!data.daily.completed || data.daily.rewardClaimed}
                style={{ opacity: !data.daily.completed || data.daily.rewardClaimed ? 0.4 : 1 }}
              >
                {data.daily.rewardClaimed ? 'CLAIMED ✓' : 'CLAIM REWARD'}
              </button>
              <button className="primary-action-btn" onClick={() => onStart('daily', current.seed)}>
                PLAY DAILY ▶
              </button>
            </>
          ) : (
            <>
              <button
                className="secondary-action-btn"
                onClick={claimWeekly}
                disabled={data.weekly.bestWave === 0 || data.weekly.rewardClaimed}
                style={{
                  opacity: data.weekly.bestWave === 0 || data.weekly.rewardClaimed ? 0.4 : 1,
                }}
              >
                {data.weekly.rewardClaimed ? 'CLAIMED ✓' : 'CLAIM REWARD'}
              </button>
              <button className="primary-action-btn" onClick={() => onStart('weekly', current.seed)}>
                PLAY WEEKLY ▶
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
