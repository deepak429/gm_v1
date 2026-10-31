import React, { useState } from 'react';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_STAGES } from '../campaign/CampaignData';
import { saveManager } from '../save/SaveManager';

interface CampaignModalProps {
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onClose: () => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({ currentStageId, onSelectStage, onClose }) => {
  const [activeChapter, setActiveChapter] = useState(1);
  const saveData = saveManager.getData();
  const unlockedStage = saveData.unlockedStage;
  const stageStars = saveData.stageStars;

  const currentChapterStages = CAMPAIGN_STAGES.filter((s) => s.chapter === activeChapter);
  const chapterInfo = CAMPAIGN_CHAPTERS.find((c) => c.chapter === activeChapter)!;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card campaign-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">CAMPAIGN PROGRESSION</div>
            <h2>WAR MAP OF THE REALM</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Chapter Tabs */}
        <div className="chapter-tabs">
          {CAMPAIGN_CHAPTERS.map((ch) => (
            <button
              key={ch.chapter}
              className={`chapter-tab ${activeChapter === ch.chapter ? 'active' : ''}`}
              onClick={() => setActiveChapter(ch.chapter)}
            >
              <span className="ch-num">ACT {ch.chapter}</span>
              <span className="ch-title">{ch.title}</span>
            </button>
          ))}
        </div>

        <p className="chapter-desc">{chapterInfo.description}</p>

        {/* Stage Nodes */}
        <div className="stages-grid">
          {currentChapterStages.map((stage) => {
            const isUnlocked = stage.id <= unlockedStage;
            const isCurrent = stage.id === currentStageId;
            const stars = stageStars[stage.id] || 0;

            return (
              <div
                key={stage.id}
                className={`stage-card ${isUnlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''} ${
                  stage.isBoss ? 'boss-stage' : ''
                }`}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectStage(stage.id);
                    onClose();
                  }
                }}
              >
                <div className="stage-top">
                  <span className="stage-index">#{stage.stageNumber}</span>
                  {stage.isBoss && <span className="boss-tag">BOSS 👑</span>}
                </div>

                <h3 className="stage-name">{stage.name}</h3>
                <small className="enemy-label">{stage.enemyName}</small>

                <div className="stars-row">
                  {[1, 2, 3].map((star) => (
                    <span key={star} className={`star-icon ${star <= stars ? 'filled' : 'empty'}`}>
                      ★
                    </span>
                  ))}
                </div>

                {!isUnlocked ? (
                  <div className="lock-overlay">🔒 LOCKED</div>
                ) : (
                  <button className="play-stage-btn">{isCurrent ? 'RESTART' : 'BATTLE →'}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
